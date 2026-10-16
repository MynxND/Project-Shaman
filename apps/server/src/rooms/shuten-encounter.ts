import { BossEncounterState, BossHazardState, MonsterState } from '@shaman/schema';
import { SHUTEN_ID, SHUTEN_SKILLS, OE_ALTARS, OE_DRUMS, OE_SEAL, OE_COLLAPSE, bossShapeHit, inOeCourt, oeClamp, shutenWalkMap, createMonster, facingFromVector, isBlocked, MONSTERS, stepMovement, type MonsterMotion, type Position, type ShutenSkill } from '@shaman/shared';
import type { CombatHost } from './combat-system.js';
interface Hooks {
    reset(id:string):void;
    sync(m: MonsterMotion): void;
    hit(id: string, m: MonsterMotion, damage: number): void;
    walkMap(): CombatHost['map'];
}
interface Hazard {
    state: BossHazardState;
    damage: number;
    repeat: number;
    knock: number;
    ultimate: boolean;
    hits: Map<string, number>;
    last: number;
    collapse: number;
}
const distance = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
/** One server coordinator, two actors, persistent schema warnings. No client success/damage decisions. */
export class ShutenEncounter {
    readonly state = new BossEncounterState();
    private tasks: {
        at: number;
        run: () => void;
    }[] = [];
    private areas = new Map<string, Hazard>();
    private seq = 0;
    private deck = 0;
    private cooldowns = new Map<string, number>();
    private nextHead = 0;
    private headMove: {
        from: Position;
        to: Position;
        at: number;
        until: number;
    } | null = null;
    private lastPositions = new Map<string, {
        x: number;
        y: number;
        at: number;
    }>();
    private velocity = new Map<string, Position>();
    private drumNext = new Map<string, number>();
    private emptyAt = 0;
    private poise = 0;
    private sealHp = 0;
    private manual = false;
    private reviewOwner = "";
    private lastNow = 0;
    constructor(private host: CombatHost, private monsters: Map<string, MonsterMotion>, private hooks: Hooks) { this.state.id = SHUTEN_ID; host.state.bosses.set(SHUTEN_ID, this.state); this.reset(); }
    get body() { return [...this.monsters.values()].find(m => m.kind === 'shuten-doji'); }
    controlled(m: MonsterMotion) { return ['shuten-doji', 'shuten-head', 'shuten-altar', 'shuten-drum'].includes(m.kind); }
    object(m: MonsterMotion) { return m.kind === 'shuten-altar' || m.kind === 'shuten-drum'; }
    damageTarget(m: MonsterMotion) { return m.kind === 'shuten-head' ? this.body ?? m : m; }
    filterDamage(m: MonsterMotion, amount: number) { if (m.kind !== 'shuten-doji')
        return amount; if (['transition', 'dormant', 'dead'].includes(this.state.mode))
        return this.state.mode === 'dormant' ? Math.min(amount, Math.max(0, m.hp - 9800)) : 0; const floor = this.state.phase === 1 ? 9800 : this.state.phase === 2 ? 4900 : 0; return Math.min(Math.max(0, m.hp - floor), Math.round(amount * (this.state.mode === 'stagger' ? 1.25 : 1))); }
    damaged(m: MonsterMotion, amount: number) { if (m.kind === 'shuten-doji')
        this.poise += Math.max(0, amount); }
    objectDied(m: MonsterMotion) { this.drumNext.delete(m.id); this.poise += 200; this.state.altarRemaining = this.altars(); }
    private later(ms: number, run: () => void) { this.tasks.push({ at: this.host.now() + ms, run }); }
    private spawn(kind: string, id: string, at: Position) { const region = this.host.map.spawnRegions![0]!, m = createMonster(id, kind, region, at, this.host.now()); m.summoned = true; m.aggressive = true; this.monsters.set(id, m); const s = new MonsterState(); s.kind = kind; this.host.state.monsters.set(id, s); this.hooks.sync(m); return m; }
    private altars() { return [...this.monsters.values()].filter(m => m.kind === 'shuten-altar' && m.hp > 0 && m.state !== 'dead').length; }
    private clear() { this.tasks = []; this.areas.clear(); this.state.hazards.clear(); this.headMove = null; this.state.headSkill = ''; this.state.sealOwner = ''; this.state.sealProgress = 0; }
    private reset() { this.clear(); for (const [id, m] of this.monsters)
        if (m.kind.startsWith('shuten-') && m.kind !== 'shuten-doji' || m.kind === 'oe-elite-oni') {
            this.monsters.delete(id);
            this.host.state.monsters.delete(id);
        } const b = this.body; if (b) {
        Object.assign(b, { x: 24, y: 20, hp: 14000, facing: 'south', state: 'idle', targetId: null });
        this.hooks.sync(b);
        this.hooks.reset(b.id);
    } Object.assign(this.state, { phase: 1, mode: 'dormant', skill: '', hp: 14000, hpMax: 14000, ultimateStage: 0, altarRemaining: 3, sealed: false, armorBroken: false, damageMask: 0, headId: '', stagger: 0, rejoinedUntil: 0 }); this.cooldowns.clear(); this.drumNext.clear(); this.poise = 0; this.deck = 0; this.emptyAt = 0; this.nextHead = 0; OE_ALTARS.forEach((p, i) => this.spawn('shuten-altar', 'oe-altar-' + i, p)); }
    private target() { return [...this.host.state.players.entries()].filter(([, p]) => !p.dead && inOeCourt(p)).sort((a, b) => distance(a[1], this.body ?? a[1]) - distance(b[1], this.body ?? b[1]))[0]; }
    private face(m: MonsterMotion, to: Position) { m.facing = facingFromVector(to.x - m.x, to.y - m.y) ?? m.facing; }
    private phase(phase: number) {
        const b = this.body;
        if (!b)
            return;
        this.clear();
        this.state.phase = phase;
        this.state.mode = 'transition';
        this.state.skill = phase === 2 ? 'armor-break' : 'severed-king';
        this.state.actionAt = this.host.now();
        this.state.endsAt = this.host.now() + 3200;
        this.poise = 0;
        this.state.stagger = 0;
        b.state = 'attack';
        if (phase === 2) {
            this.state.armorBroken = true;
            this.state.damageMask |= 1;
        }
        if (phase === 3) {
            this.state.headId = 'oe-cursed-head';
            this.spawn('shuten-head', this.state.headId, { x: b.x + 4, y: b.y - 2 });
            this.nextHead = this.host.now() + 5000;
            this.cooldowns.set('wrath-severed-king', this.host.now() + 8500);
        }
        this.cooldowns.clear();
        if (phase === 3)
            this.cooldowns.set('wrath-severed-king', this.host.now() + 8500);
        this.later(3200, () => { this.state.mode = 'recovery'; this.state.endsAt = this.host.now() + 800; });
    }
    private hazard(skill: string, shape: string, at: Position, radius: number, start: number, duration: number, damage: number, extra: Partial<{
        effect: string;
        actor: string;
        angle: number;
        arc: number;
        width: number;
        toX: number;
        toY: number;
        repeat: number;
        knock: number;
        ultimate: boolean;
        collapse: number;
    }> = {}) {
        if (this.areas.size >= 64)
            return;
        const s = new BossHazardState(), id = 'oe-fx-' + ++this.seq, now = this.host.now();
        Object.assign(s, { id, skill, actor: extra.actor ?? 'body', effect: extra.effect ?? 'impact', shape, x: at.x, y: at.y, toX: extra.toX ?? at.x, toY: extra.toY ?? at.y, radius, angle: extra.angle ?? 0, arc: extra.arc ?? Math.PI * 2, width: extra.width ?? .65, warnAt: now, startsAt: now + start, endsAt: now + start + duration });
        this.state.hazards.set(id, s);
        this.areas.set(id, { state: s, damage, repeat: extra.repeat ?? 0, knock: extra.knock ?? 0, ultimate: extra.ultimate ?? false, hits: new Map(), last: now, collapse: extra.collapse ?? 0 });
    }
    private rings(skill: string, at: Position, start: number, count: number, radius: number, damage: number, ultimate = false) { for (let i = 0; i < count; i++)
        this.hazard(skill, 'ring', at, radius, start + i * 450, 1500, damage, { effect: 'shock', ultimate }); }
    start(skill: ShutenSkill, playerId: string) {
        const b = this.body, p = this.host.state.players.get(playerId);
        if (!b || !p || b.state === 'dead')
            return;
        const rule = SHUTEN_SKILLS[skill], now = this.host.now(), aim = { x: p.x, y: p.y }, from = { x: b.x, y: b.y }, angle = Math.atan2(aim.y - b.y, aim.x - b.x);
        this.state.mode = 'windup';
        this.state.skill = skill;
        this.state.actionAt = now;
        this.state.ultimateStage = 0;
        this.cooldowns.set(skill, now + rule.cooldown);
        this.face(b, aim);
        b.state = 'attack';
        b.targetId = playerId;
        let last = rule.tell as number;
        const cone = (delay: number, r: number, arc: number, damage: number, effect = 'sweep') => this.hazard(skill, 'cone', from, r, delay, 260, damage, { angle, arc, effect });
        if (skill === 'oni-crusher') {
            [900, 1250, 1600].forEach((at, i) => cone(at, i === 2 ? 6 : 3.4, i === 2 ? Math.PI * .42 : Math.PI * .65, i === 2 ? 100 : 60, i === 2 ? 'impact' : 'sweep'));
            last = 1600;
        }
        if (skill === 'demon-sake') {
            for (const [dx, dy] of [[0, 0], [-2.5, 1.5], [2.5, -1.5]]) {
                const a = oeClamp({ x: aim.x + dx!, y: aim.y + dy! });
                this.hazard(skill, 'circle', a, 2.1, 1200, 1100, 0, { effect: 'sake' });
                this.hazard(skill, 'circle', a, 2.1, 2300, 2500, 42, { effect: 'violet', repeat: 500 });
            }
            last = 4800;
        }
        if (skill === 'mountain-stomp') {
            this.rings(skill, from, 1100, 2, 8, 80);
            last = 3050;
        }
        if (skill === 'oni-war-cry') {
            this.hazard(skill, 'cone', from, 8, 1000, 350, 45, { angle, arc: Math.PI / 2, effect: 'roar', knock: 2.4 });
            last = 1350;
        }
        if (skill === 'hellfire-sweep') {
            cone(1000, 6, Math.PI * 1.5, 85);
            cone(1700, 7.4, Math.PI * 1.5, 95, 'violet');
            last = 1960;
        }
        if (skill === 'demon-legion') {
            for (let i = 0; i < OE_DRUMS.length; i++) {
                const pos = OE_DRUMS[i]!;
                this.hazard(skill, 'circle', pos, 2.1, 1200, 900, 0, { effect: 'portal' });
            }
            this.later(1200, () => { OE_DRUMS.forEach((pos, i) => { const id = 'oe-drum-' + i, m = this.monsters.get(id); if (!m || m.state === 'dead') {
                this.spawn('shuten-drum', id, pos);
                this.drumNext.set(id, this.host.now());
            } }); });
            last = 2100;
        }
        if (skill === 'blood-moon-leap') {
            const v = this.velocity.get(playerId) ?? { x: 0, y: 0 }, to = oeClamp({ x: aim.x + v.x * .6, y: aim.y + v.y * .6 });
            this.hazard(skill, 'circle', to, 3, 1400, 260, 100, { effect: 'impact' });
            this.rings(skill, to, 1450, 3, 7.5, 65);
            this.later(1400, () => { if (!isBlocked(this.hooks.walkMap(), to.x, to.y)) {
                b.x = to.x;
                b.y = to.y;
                this.hooks.sync(b);
            } });
            last = 3850;
        }
        if (skill === 'cursed-head') {
            this.chargeHead(aim);
            last = 1600;
        }
        if (skill === 'headless-rampage') {
            [900, 1300, 1700, 2100, 2500].forEach((at, i) => cone(at, i === 4 ? 6 : 4, Math.PI * .7, i === 4 ? 110 : 55));
            last = 2760;
        }
        if (skill === 'mount-oe-cataclysm') {
            for (let i = 0; i < 4; i++) {
                const offset = [[-3, -2], [3, 2], [-3, 2], [3, -2]][i]!, at = oeClamp({ x: aim.x + offset[0]!, y: aim.y + offset[1]! });
                this.hazard(skill, 'circle', at, 2.7, 1100 + i * 650, 350, 120, { effect: 'fist' });
                const r = OE_COLLAPSE[i]!;
                this.hazard(skill, 'circle', { x: r.x + r.w / 2, y: r.y + r.h / 2 }, 3, 1100 + i * 650, 350, 100, { effect: 'fist', collapse: 1 << i });
            }
            last = 3400;
        }
        if (skill === 'wrath-severed-king') {
            last = 8200;
            this.state.ultimateStage = 1;
            const head = this.monsters.get(this.state.headId);
            if (head) {
                head.x = 24;
                head.y = 14;
                this.face(head, aim);
            }
            this.headMove = null;
            this.state.headSkill = 'ultimate';
            this.later(900, () => { this.state.ultimateStage = 2; for (const a of [{ x: 12, y: 15 }, { x: 36, y: 15 }, { x: 12, y: 32 }, { x: 36, y: 32 }])
                this.hazard(skill, 'circle', a, 2.4, 0, 1500, 0, { effect: 'faces', ultimate: true }); });
            this.later(950, () => { for (const [dx, dy] of [[0, 0], [-4, 0], [4, 0], [0, -4], [-3, 4], [3, 4]])
                this.hazard(skill, 'circle', oeClamp({ x: aim.x + dx!, y: aim.y + dy! }), 1.9, 1150, 650, 120, { effect: 'violet', ultimate: true }); });
            this.later(2100, () => { this.state.ultimateStage = 3; });
            this.later(2600, () => { const h = this.monsters.get(this.state.headId) ?? b, t = this.target()?.[1] ?? aim, a = Math.atan2(t.y - h.y, t.x - h.x); this.face(h, t); this.hazard(skill, 'cone', h, 15, 1100, 800, 190, { angle: a, arc: Math.PI * .34, effect: 'breath', actor: 'head', ultimate: true }); });
            this.later(3700, () => { this.state.ultimateStage = 4; });
            this.later(5100, () => { this.state.ultimateStage = 5; this.rings(skill, { x: b.x, y: b.y }, 0, 3, 12, 110, true); });
            this.later(8200, () => { this.state.headSkill = ''; if (!this.state.sealed && head) {
                this.state.rejoinedUntil = this.host.now() + 5000;
                b.hp = Math.min(4899, b.hp + 1120);
                this.state.headSkill = 'rejoin';
            } this.nextHead = this.host.now() + 5000; });
        }
        this.state.endsAt = now + last + rule.recovery;
        this.later(rule.tell, () => { if (this.state.skill === skill)
            this.state.mode = 'active'; });
        this.later(last, () => { if (this.state.skill === skill) {
            this.state.mode = 'recovery';
            b.state = 'idle';
        } });
    }
    private chargeHead(aim: Position) { const h = this.monsters.get(this.state.headId); if (!h || this.state.rejoinedUntil > this.host.now())
        return; const from = { x: h.x, y: h.y }, to = oeClamp(aim), now = this.host.now(); this.face(h, to); this.state.headSkill = 'cursed-head'; this.state.headAt = now; this.state.headUntil = now + 1600; this.headMove = { from, to, at: now + 900, until: now + 1600 }; this.hazard('cursed-head', 'line', from, 0, 900, 700, 70, { effect: 'bite', actor: 'head', toX: to.x, toY: to.y, width: 1.0 }); }
    seal(playerId: string) { const p = this.host.state.players.get(playerId); if (!p || p.dead || this.state.phase !== 3 || this.state.mode === 'dead' || this.state.sealed || this.altars() > 0 || distance(p, OE_SEAL) > 2 || this.state.sealOwner)
        return false; this.state.sealOwner = playerId; this.state.sealProgress = 0; this.sealHp = p.hp; return true; }
    private sealStep(dt: number) { if (!this.state.sealOwner)
        return; const p = this.host.state.players.get(this.state.sealOwner); if (!p || p.dead || distance(p, OE_SEAL) > 2 || p.moving || p.hp < this.sealHp) {
        this.state.sealOwner = '';
        this.state.sealProgress = 0;
        return;
    } this.state.sealProgress = Math.min(1, this.state.sealProgress + dt / 2000); if (this.state.sealProgress >= 1) {
        this.state.sealed = true;
        this.state.sealOwner = '';
        this.state.rejoinedUntil = 0;
        this.nextHead = this.host.now() + 3500;
        this.headMove = null;
        for (const [id, a] of this.areas)
            if (a.state.skill === 'cursed-head') {
                this.areas.delete(id);
                this.state.hazards.delete(id);
            }
        this.state.headSkill = 'sealed';
    } }
    private knock(id: string, origin: Position, units: number) { const p = this.host.state.players.get(id); if (!p)
        return; const d = distance(p, origin) || 1, v = { x: (p.x - origin.x) / d, y: (p.y - origin.y) / d, sequence: 0 }; for (let i = 0; i < 12; i++) {
        const n = stepMovement(p, v, units / 4 / 12, this.hooks.walkMap()).position;
        p.x = n.x;
        p.y = n.y;
    } }
    private stepAreas(now: number) {
        const b = this.body;
        if (!b)
            return;
        for (const [id, a] of this.areas) {
            const h = a.state;
            if (now >= h.startsAt && now <= h.endsAt) {
                const t = Math.max(0, Math.min(1, (now - h.startsAt) / (h.endsAt - h.startsAt))), prev = Math.max(0, Math.min(1, (a.last - h.startsAt) / (h.endsAt - h.startsAt))), r = h.shape === 'ring' ? h.radius * t : h.radius, pr = h.shape === 'ring' ? h.radius * prev : r;
                let shape = { shape: h.shape, x: h.x, y: h.y, toX: h.toX, toY: h.toY, radius: r, angle: h.angle, arc: h.arc, width: h.width };
                if (h.skill === 'cursed-head') {
                    shape = { ...shape, x: h.x + (h.toX - h.x) * prev, y: h.y + (h.toY - h.y) * prev, toX: h.x + (h.toX - h.x) * t, toY: h.y + (h.toY - h.y) * t };
                }
                for (const [pid, p] of this.host.state.players) {
                    if (p.dead || !inOeCourt(p) || !a.damage)
                        continue;
                    const hit = a.hits.get(pid);
                    if (hit !== undefined && (!a.repeat || now - hit < a.repeat))
                        continue;
                    if (bossShapeHit(shape, p, r, pr)) {
                        a.hits.set(pid, now);
                        const mul = a.ultimate ? .35 + .65 * this.altars() / 3 : 1;
                        this.hooks.hit(pid, b, Math.round(a.damage * mul));
                        if (a.knock)
                            this.knock(pid, h, a.knock);
                    }
                }
                if (a.collapse) {
                    this.state.damageMask |= a.collapse;
                    a.collapse = 0;
                    for (const p of this.host.state.players.values())
                        if (isBlocked(shutenWalkMap(this.host.map, this.state.damageMask), p.x, p.y)) {
                            const safe = oeClamp(p);
                            p.x = safe.x;
                            p.y = safe.y;
                        }
                }
            }
            a.last = now;
            if (now > h.endsAt + 350) {
                this.areas.delete(id);
                this.state.hazards.delete(id);
            }
        }
    }
    private legion(now: number) { const alive = [...this.monsters.values()].filter(m => m.kind === 'oe-elite-oni' && m.state !== 'dead').length; let count = alive; for (const [id, at] of this.drumNext) {
        const d = this.monsters.get(id);
        if (!d || d.state === 'dead') {
            this.drumNext.delete(id);
            continue;
        }
        if (now < at || count >= 6)
            continue;
        this.drumNext.set(id, now + 5500);
        const pos = oeClamp({ x: d.x + (d.x < 24 ? 2 : -2), y: d.y + 1 }), m = this.spawn('oe-elite-oni', id + '-add-' + ++this.seq, pos);
        m.state = 'chase';
        m.targetId = this.target()?.[0] ?? null;
        count++;
    } }
    step(dt: number) {
        const now = this.host.now(), b = this.body;
        if (!b)
            return;
        if(this.manual&&(!this.host.state.players.has(this.reviewOwner)||this.host.state.players.size>1))this.manual=false;
        this.state.now = now;
        this.state.hp = Math.max(0, b.hp);
        this.state.hpMax = 14000;
        this.state.altarRemaining = this.altars();
        if (b.state === 'dead') {
            if (this.state.mode !== 'dead') {
                this.clear();
                this.state.mode = 'dead';
                this.state.skill = '';
                for (const m of this.monsters.values())
                    if (m.kind === 'shuten-head' || m.kind === 'oe-elite-oni' || this.object(m)) {
                        m.hp = 0;
                        m.state = 'dead';
                        this.hooks.sync(m);
                    }
            }
            return;
        }
        if (this.state.mode === 'dead') {
            this.reset();
            return;
        }
        for (const [pid, p] of this.host.state.players) {
            const old = this.lastPositions.get(pid);
            if (old && now > old.at) {
                const d = Math.max(1, now - old.at);
                this.velocity.set(pid, { x: Math.max(-4, Math.min(4, (p.x - old.x) * 1000 / d)), y: Math.max(-4, Math.min(4, (p.y - old.y) * 1000 / d)) });
            }
            this.lastPositions.set(pid, { x: p.x, y: p.y, at: now });
        }
        for (const id of this.lastPositions.keys())
            if (!this.host.state.players.has(id)) {
                this.lastPositions.delete(id);
                this.velocity.delete(id);
            }
        const target = this.target();
        if (!target) {
            if (this.state.mode !== 'dormant') {
                this.emptyAt ||= now;
                if (now - this.emptyAt > 5000)
                    this.reset();
            }
            return;
        }
        this.emptyAt = 0;
        if (this.state.mode === 'dormant') {
            this.state.mode = 'recovery';
            this.state.endsAt = now + 1200;
            b.targetId = target[0];
        }
        if (this.state.phase === 1 && b.hp <= 9800) {
            this.phase(2);
            return;
        }
        if (this.state.phase === 2 && b.hp <= 4900) {
            this.phase(3);
            return;
        }
        const due = this.tasks.filter(t => t.at <= now);
        this.tasks = this.tasks.filter(t => t.at > now);
        for (const t of due)
            t.run();
        this.stepAreas(now);
        this.sealStep(dt);
        this.legion(now);
        if (this.state.phase === 3) {
            const h = this.monsters.get(this.state.headId);
            if (h) {
                h.hp = b.hp;
                h.state = 'attack';
                if (this.state.rejoinedUntil > now) {
                    h.x = b.x;
                    h.y = b.y;
                }
                else if (this.headMove) {
                    const t = Math.max(0, Math.min(1, (now - this.headMove.at) / (this.headMove.until - this.headMove.at)));
                    h.x = this.headMove.from.x + (this.headMove.to.x - this.headMove.from.x) * t;
                    h.y = this.headMove.from.y + (this.headMove.to.y - this.headMove.from.y) * t;
                    if (t === 1)
                        this.headMove = null;
                }
                this.hooks.sync(h);
            }
            if (!this.manual && this.state.mode !== 'transition' && this.state.skill !== 'wrath-severed-king' && now >= this.nextHead) {
                this.chargeHead(target[1]);
                this.nextHead = now + SHUTEN_SKILLS['cursed-head'].cooldown + (this.state.sealed ? 1500 : 0);
            }
        }
        this.state.stagger = Math.min(1, this.poise / 1800);
        if (this.poise >= 1800 && !['transition', 'stagger'].includes(this.state.mode) && this.state.skill !== 'wrath-severed-king') {
            this.clear();
            this.poise = 0;
            this.state.mode = 'stagger';
            this.state.skill = '';
            this.state.endsAt = now + 1800;
            b.state = 'idle';
        }
        if (now >= this.state.endsAt && this.state.mode !== 'transition') {
            this.state.mode = 'recovery';
            this.state.skill = '';
            this.state.ultimateStage = 0;
            if (!this.manual) {
                const deck: ShutenSkill[] = this.state.phase === 1 ? ['oni-crusher', 'demon-sake', 'mountain-stomp', 'oni-war-cry'] : this.state.phase === 2 ? ['hellfire-sweep', 'demon-legion', 'blood-moon-leap', 'oni-crusher'] : ['headless-rampage', 'mount-oe-cataclysm', 'oni-war-cry'];
                let skill: ShutenSkill | undefined;
                if (this.state.phase === 3 && now >= (this.cooldowns.get('wrath-severed-king') ?? 0))
                    skill = 'wrath-severed-king';
                else
                    for (let i = 0; i < deck.length; i++) {
                        const k = deck[this.deck++ % deck.length]!;
                        if (now >= (this.cooldowns.get(k) ?? 0)) {
                            skill = k;
                            break;
                        }
                    }
                if (skill)
                    this.start(skill, target[0]);
                else
                    this.state.endsAt = now + 300;
            }
        }
        if (this.state.mode === 'recovery' && !this.manual) {
            const t = target[1], d = distance(b, t);
            if (d > 3.5) {
                const n = stepMovement(b, { x: (t.x - b.x) / d, y: (t.y - b.y) / d, sequence: 0 }, dt / 1000 * .42, this.hooks.walkMap()).position;
                b.x = n.x;
                b.y = n.y;
                this.face(b, t);
                b.state = 'chase';
            }
        }
        this.hooks.sync(b);
        this.lastNow = now;
    }
    /** Guarded by GameRoom: development, unsaved guest, sole occupant. Only scheduler/test arrangement changes. */
    review(playerId: string, cmd: {
        action?: unknown;
        skill?: unknown;
        phase?: unknown;
    }) { const p = this.host.state.players.get(playerId), b = this.body; if (!p || !b)
        return false; this.reviewOwner=playerId; if (cmd.action === 'reset') {
        this.reset();
        return true;
    } if (cmd.action === 'prepare') {
        const profile = this.host.profile(playerId);
        if (profile) {
            const q = structuredClone(profile);
            q.hpMax = 4000;
            q.hp = 4000;
            this.host.setProfile(playerId, q);
            this.host.vitals(playerId);
            p.dead = false;
        }
        p.x = 24;
        p.y = 24;
        this.manual = true;
        this.state.mode = 'recovery';
        this.state.endsAt = this.host.now() + 1000;
        return true;
    } if (cmd.action === 'phase' && [1, 2, 3].includes(Number(cmd.phase))) {
        this.manual = true;
        b.hp = Number(cmd.phase) === 1 ? 14000 : Number(cmd.phase) === 2 ? 9800 : 4900;
        if (Number(cmd.phase) === 1)
            this.reset();
        else
            this.phase(Number(cmd.phase));
        return true;
    } if (cmd.action === 'skill' && typeof cmd.skill === 'string' && cmd.skill in SHUTEN_SKILLS && this.state.phase >= SHUTEN_SKILLS[cmd.skill as ShutenSkill].phase && this.state.mode !== 'transition') {
        this.clear();
        this.manual = true;
        this.start(cmd.skill as ShutenSkill, playerId);
        return true;
    } if (cmd.action === 'ai') {
        this.manual = false;
        return true;
    } return false; }
}
