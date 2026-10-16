import { BossHazardState, DreamPlayerState, MaiyarapEncounterState, MonsterState } from '@shaman/schema';
import { MAIYARAP_HP, MAIYARAP_SKILLS, DREAM_SYMBOLS, DREAM_SOURCE, dreamClamp, dreamHit, inDreamCourt, createMonster, facingFromVector, type DreamRealm, type MaiyarapSkill, type MonsterMotion, type Position } from '@shaman/shared';
import type { CombatHost } from './combat-system.js';

interface Hooks { sync(m: MonsterMotion): void; hit(id: string, m: MonsterMotion, damage: number): boolean; reset(id: string): void }
interface Area { state: BossHazardState; damage: number; sleep: boolean; hit: Set<string>; previous: number }
const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

/** Boss13 only. All realm, damage and source decisions stay on the room clock. */
export class MaiyarapEncounter {
  readonly state = new MaiyarapEncounterState();
  private tasks: { at: number; run(): void }[] = [];
  private areas = new Map<string, Area>();
  private ready = new Map<string, number>();
  private sequence = 0;
  private deck = 0;
  private emptySince = 0;
  private reviewManual = false;
  private poise = 0;
  constructor(private host: CombatHost, private monsters: Map<string, MonsterMotion>, private hooks: Hooks) {
    host.state.maiyarap.set('maiyarap', this.state); this.reset();
  }
  get body() { return [...this.monsters.values()].find(m => m.kind === 'maiyarap'); }
  get source() { return this.monsters.get('maiyarap-spell-source'); }
  controlled(m: MonsterMotion) { return m.kind === 'maiyarap' || m.kind === 'maiyarap-source'; }
  object(m: MonsterMotion) { return m.kind === 'maiyarap-source'; }
  private later(ms: number, run: () => void) { this.tasks.push({ at: this.host.now() + ms, run }); }
  private clear() { this.tasks = []; this.areas.clear(); this.state.hazards.clear(); }
  private players() { return [...this.host.state.players.entries()].filter(([, p]) => !p.dead && inDreamCourt(p)); }
  private wake(id: string, hint = 'ตื่นจากนิทรา') {
    const d = this.state.dreamers.get(id); if (d) Object.assign(d, { realm: 'awake', until: 0, progress: 0, hint });
  }
  private sourceReset() {
    let m = this.source;
    if (!m) {
      m = createMonster('maiyarap-spell-source', 'maiyarap-source', this.host.map.spawnRegions![0]!, DREAM_SOURCE, this.host.now());
      m.summoned = true; this.monsters.set(m.id, m);
      const s = new MonsterState(); s.kind = m.kind; this.host.state.monsters.set(m.id, s);
    }
    Object.assign(m, { hp: 160, state: 'idle', targetId: null, x: DREAM_SOURCE.x, y: DREAM_SOURCE.y });
    this.state.sourceExposed = false; this.hooks.reset(m.id); this.hooks.sync(m);
  }
  reset() {
    this.clear(); this.ready.clear(); this.state.dreamers.clear(); this.poise = 0; this.deck = 0; this.emptySince = 0;
    const b = this.body;
    if (b) { Object.assign(b, { hp: MAIYARAP_HP, state: 'idle', targetId: null, x: 24, y: 22, facing: 'south' }); this.hooks.reset(b.id); this.hooks.sync(b); }
    Object.assign(this.state, { phase: 1, mode: 'dormant', skill: '', hp: MAIYARAP_HP, hpMax: MAIYARAP_HP, ultimateStage: 0, countered: false, actionAt: this.host.now(), endsAt: 0 });
    this.sourceReset();
  }
  filterDamage(m: MonsterMotion, amount: number, playerId: string) {
    const player = this.host.state.players.get(playerId);
    if (this.controlled(m) && (!player || player.dead || !inDreamCourt(player))) return 0;
    if (m.kind === 'maiyarap-source') return this.state.sourceExposed ? amount : 0;
    if (m.kind !== 'maiyarap') return amount;
    if (['transition', 'dormant', 'defeated'].includes(this.state.mode)) return 0;
    const dreamer = this.state.dreamers.get(playerId);
    const lucid = this.state.phase === 3 && dreamer?.realm === 'dream' && dreamer.progress === 3;
    if (dreamer?.realm === 'dream' && !lucid) return 0;
    const floor = this.state.phase === 1 ? MAIYARAP_HP * .7 : this.state.phase === 2 ? MAIYARAP_HP * .35 : 0;
    const n = Math.min(Math.max(0, m.hp - floor), Math.round(amount * (this.state.mode === 'stagger' ? 1.5 : lucid ? 1.35 : 1)));
    this.poise += n; return n;
  }
  objectDied() {
    this.state.sourceExposed = false;
    for (const id of this.state.dreamers.keys()) this.wake(id, 'ทำลายต้นกำเนิดมนตร์สำเร็จ');
    if (this.state.mode === 'ultimate') {
      this.clear(); this.state.countered = true; this.state.ultimateStage = 5;
      this.state.skill = 'eternal-slumber'; this.state.mode = 'stagger'; this.state.actionAt = this.host.now(); this.state.endsAt = this.host.now() + 4500;
    } else if (this.body && this.body.hp > 0) {
      this.clear(); this.state.mode = 'stagger'; this.state.endsAt = this.host.now() + 3000;
    }
    if (this.body) { this.body.state = 'idle'; this.hooks.sync(this.body); }
  }
  /** Position, order, realm and rate are validated; no client-supplied success flag. */
  interact(playerId: string, symbol: unknown) {
    const p = this.host.state.players.get(playerId);
    if (p && !p.dead && this.state.phase === 3 && this.state.mode !== 'transition' && this.state.mode !== 'defeated' && symbol === 'lotus' && this.state.dreamers.get(playerId)?.realm !== 'dream' && dist(p, DREAM_SYMBOLS[0]) <= 2) this.sleep(playerId);
    const d = this.state.dreamers.get(playerId);
    if (!p || p.dead || !d || d.realm !== 'dream' || !inDreamCourt(p) || this.host.now() - d.interactedAt < 350) return false;
    const node = DREAM_SYMBOLS.find(s => s.id === symbol);
    if (!node || dist(p, node) > 2) return false;
    d.interactedAt = this.host.now();
    if (node !== DREAM_SYMBOLS[d.progress]) { d.hint = 'เลือกตามลำดับ บัว → ปม → เปลว'; return false; }
    d.progress++;
    d.hint = d.progress === 3 ? this.state.phase === 3 ? 'โจมตีไมยราพในฝันแรงขึ้น หรือทำลายต้นกำเนิดเพื่อปลุก' : 'ต้นกำเนิดมนตร์เผยตัวแล้ว โจมตีที่กลางลาน' : `ตามสัญลักษณ์ถัดไป: ${DREAM_SYMBOLS[d.progress]!.name}`;
    if (d.progress === 3) this.state.sourceExposed = true;
    return true;
  }
  private sleep(id: string, duration = 24000) {
    let d = this.state.dreamers.get(id);
    if (!d) { d = new DreamPlayerState(); this.state.dreamers.set(id, d); }
    // Repeat sleep does not reset progress or extend imprisonment indefinitely.
    if (d.realm === 'dream') return;
    if (!this.source || this.source.state === 'dead') this.sourceReset();
    Object.assign(d, { realm: 'dream', progress: 0, until: this.host.now() + duration, hint: 'เดินตาม บัว → ปม → เปลว แล้วทำลายต้นกำเนิดมนตร์', interactedAt: -1000 });
  }
  private phase(phase: number) {
    this.clear(); this.state.phase = phase; this.state.mode = 'transition'; this.state.ultimateStage = 0; this.state.countered = false; this.state.skill = phase === 2 ? 'dream-palace' : 'lucid-sovereign';
    this.state.actionAt = this.host.now(); this.state.endsAt = this.host.now() + 2600; this.poise = 0;
    for (const id of this.state.dreamers.keys()) this.wake(id, 'ม่านฝันเปลี่ยนชั้น');
    this.sourceReset();
    if (phase === 3) this.ready.set('eternal-slumber', this.host.now() + 6500);
    this.later(2600, () => { this.state.mode = 'recovery'; this.state.endsAt = this.host.now() + 1000; });
  }
  private hazard(skill: MaiyarapSkill, shape: string, at: Position, radius: number, delay: number, duration: number, extra: Partial<{ toX: number; toY: number; width: number; angle: number; arc: number; realm: DreamRealm; sleep: boolean; damage: number }> = {}) {
    // Choreography has a bounded maximum below24; overflow is an error, never silently hidden danger.
    if (this.areas.size >= 24) throw new Error('Maiyarap hazard budget exceeded');
    const h = new BossHazardState(), now = this.host.now(), id = `maiyarap-hazard-${++this.sequence}`;
    Object.assign(h, { id, skill, effect: skill, actor: extra.realm ?? 'both', shape, x: at.x, y: at.y, toX: extra.toX ?? at.x, toY: extra.toY ?? at.y, radius, width: extra.width ?? .65, angle: extra.angle ?? 0, arc: extra.arc ?? Math.PI / 2, warnAt: now, startsAt: now + delay, endsAt: now + delay + duration });
    this.state.hazards.set(id, h); this.areas.set(id, { state: h, damage: extra.damage ?? MAIYARAP_SKILLS[skill].damage, sleep: extra.sleep ?? false, hit: new Set(), previous: now });
  }
  private lane(skill: MaiyarapSkill, from: Position, to: Position, delay: number, width = .65, charge = false, sleep = false, realm: DreamRealm = 'both') {
    this.hazard(skill, charge ? 'charge' : 'capsule', from, 0, delay, MAIYARAP_SKILLS[skill].active, { toX: to.x, toY: to.y, width, sleep, realm });
  }
  start(skill: MaiyarapSkill, playerId: string, review = false) {
    const spec = MAIYARAP_SKILLS[skill], b = this.body, p = this.host.state.players.get(playerId), now = this.host.now();
    if (!spec || !b || !p || p.dead || b.hp <= 0 || !inDreamCourt(p)) return false;
    if (!review && (spec.phase > this.state.phase || (this.ready.get(skill) ?? 0) > now || !['idle', 'recovery', 'reposition'].includes(this.state.mode) || now < this.state.endsAt)) return false;
    this.state.skill = skill; this.state.ultimateStage = 0; this.state.mode = skill === 'eternal-slumber' ? 'ultimate' : 'windup'; this.state.actionAt = now;
    this.ready.set(skill, now + spec.cooldown); this.state.countered = false;
    const aim = dreamClamp(p), from = { x: b.x, y: b.y }, tell = spec.tell;
    b.facing = facingFromVector(aim.x - b.x, aim.y - b.y) ?? b.facing; b.state = 'attack'; this.hooks.sync(b);
    let tail = tell + spec.active;
    switch (skill) {
      case 'sleep-enchantment': this.hazard(skill, 'disk', aim, 2.2, tell, spec.active, { sleep: true }); break;
      case 'underworld-chains': {
        const far = this.players().sort((a, c) => dist(c[1], b) - dist(a[1], b))[0]?.[1] ?? aim;
        this.lane(skill, { x: far.x - 5, y: far.y - 3 }, { x: far.x + 5, y: far.y + 3 }, tell);
        this.lane(skill, { x: far.x + 5, y: far.y - 3 }, { x: far.x - 5, y: far.y + 3 }, tell); break;
      }
      case 'phantom-doppelganger':
        for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; this.lane(skill, { x: aim.x + Math.cos(a) * 6, y: aim.y + Math.sin(a) * 6 }, aim, tell + i * 550); }
        tail += 1100; break;
      case 'patal-gate':
        for (const x of [14, 34]) this.hazard(skill, 'ring', { x, y: 23 }, 7, tell, spec.active, { width: .5 }); break;
      case 'dream-theft': this.lane(skill, from, aim, tell, .9, false, true); break;
      case 'false-awakening':
        for (const x of [12, 24, 36]) this.hazard(skill, 'disk', { x, y: 20 }, 2.6, tell, spec.active, { realm: 'dream' });
        this.hazard(skill, 'disk', aim, 1.8, tell, spec.active, { realm: 'awake', sleep: true }); break;
      case 'nightmare-passage':
        for (const x of [12, 18, 30, 36]) this.lane(skill, { x, y: 14 }, { x, y: 35 }, tell + (x > 24 ? 500 : 0), 1.1);
        tail += 500; break;
      case 'lucid-seal':
        for (let i = 0; i < 3; i++) this.hazard(skill, 'ring', { x: aim.x + (i - 1) * 4, y: aim.y }, 3.2, tell + i * 500, spec.active, { width: .45 });
        tail += 1000; break;
      case 'underworld-court':
        for (let i = 0; i < 4; i++) this.hazard(skill, 'sector', { x: 24, y: 24 }, 16, tell + i * 700, spec.active, { angle: i * Math.PI / 2, arc: Math.PI / 2 });
        tail += 2100; break;
      case 'sleepwalker-hunt':
        for (let i = 0; i < 3; i++) this.later(i * 2100, () => {
          const target = this.host.state.players.get(playerId); if (!target || target.dead || !this.body) return;
          const a = { x: this.body.x, y: this.body.y }, z = dreamClamp(target);
          this.body.facing = facingFromVector(z.x-a.x,z.y-a.y) ?? this.body.facing; this.body.state = 'attack'; this.hooks.sync(this.body);
          this.lane(skill, a, z, tell, .85, true);
        });
        tail += 4200; break;
      case 'eternal-slumber': this.ultimate(); return true;
    }
    this.state.endsAt = now + tail + spec.recovery;
    this.later(tell, () => { this.state.mode = 'active'; });
    this.later(tail, () => { this.state.mode = 'recovery'; if (this.body) { this.body.state = 'idle'; this.hooks.sync(this.body); } });
    return true;
  }
  private ultimate() {
    this.state.ultimateStage = 1; this.sourceReset();
    const skill = 'eternal-slumber' as const; this.state.endsAt = this.host.now() + 25000;
    this.later(1600, () => { this.state.ultimateStage = 2; for (const [id] of this.players()) { this.wake(id); this.sleep(id, 26000); } });
    this.later(2800, () => {
      this.state.ultimateStage = 3;
      // Never cross the symbol route y29–33 or the central approach to source.
      for (const x of [10, 38]) this.lane(skill, { x, y: 13 }, { x, y: 36 }, 1600, 1.1, false, false, 'dream');
      for (const y of [16, 20]) this.lane(skill, { x: 12, y }, { x: 36, y }, 2200, .8, false, false, 'dream');
    });
    this.later(5000, () => { this.state.ultimateStage = 4; });
    this.later(22000, () => {
      this.state.ultimateStage = 5;
      this.hazard(skill, 'finale', { x: 24, y: 24 }, 24, 1600, 800);
    });
    this.later(24400, () => {
      for (const id of this.state.dreamers.keys()) this.wake(id, 'คลื่นนิทราสลาย');
      this.state.mode = 'recovery'; this.state.endsAt = this.host.now() + 2000; this.state.sourceExposed = false;
      if (this.body) { this.body.state = 'idle'; this.hooks.sync(this.body); }
    });
  }
  /** Invoked only behind GameRoom's development, unsaved-guest and single-client gate. */
  review(id: string, message: Record<string, unknown>) {
    const p = this.host.state.players.get(id), profile = this.host.profile(id); if (!p || !profile) return;
    if (message.action === 'prepare') {
      this.reset(); this.reviewManual = true;
      const copy = structuredClone(profile); copy.hpMax = 4000; copy.hp = 4000;
      this.host.setProfile(id, copy); this.host.vitals(id); p.dead = false; p.x = 24; p.y = 30;
      this.state.mode = 'idle'; this.state.endsAt = this.host.now(); return;
    }
    if (message.action === 'auto') { this.reviewManual = false; this.state.mode = 'idle'; this.state.endsAt = this.host.now(); return; }
    if (message.action === 'arrange' && typeof message.x === 'number' && typeof message.y === 'number' && Number.isFinite(message.x) && Number.isFinite(message.y) && inDreamCourt({ x: message.x, y: message.y })) {
      if (!['idle', 'dormant', 'recovery'].includes(this.state.mode) || this.state.hazards.size) return;
      p.x = message.x; p.y = message.y; return;
    }
    if (message.action === 'phase' && [1, 2, 3].includes(Number(message.phase))) {
      const phase = Number(message.phase); if (this.body) this.body.hp = phase === 1 ? 18000 : phase === 2 ? 12600 : 6300;
      this.phase(phase); return;
    }
    if (message.action === 'skill' && typeof message.skill === 'string' && message.skill in MAIYARAP_SKILLS) {
      this.clear(); this.state.mode = 'idle'; this.state.endsAt = this.host.now();
      this.start(message.skill as MaiyarapSkill, id, true);
    }
  }
  step(dtMs: number) {
    const now = this.host.now(), b = this.body; this.state.now = now; if (!b) return;
    if (this.state.mode === 'defeated' && b.hp > 0) { this.reset(); return; }
    this.state.hp = b.hp;
    for (const [id, d] of this.state.dreamers) {
      const p = this.host.state.players.get(id);
      if (!p) { this.state.dreamers.delete(id); continue; }
      if (p.dead || !inDreamCourt(p) || d.realm === 'dream' && now >= d.until) this.wake(id, 'ม่านฝันคลายตัว');
    }
    if (b.hp <= 0) {
      if (this.state.mode !== 'defeated') {
        this.clear(); this.state.mode = 'defeated'; this.state.actionAt = now; this.state.ultimateStage = 0; this.state.sourceExposed = false;
        for (const id of this.state.dreamers.keys()) this.wake(id);
        const source = this.source; if (source) { source.hp = 0; source.state = 'dead'; this.hooks.sync(source); this.hooks.reset(source.id); }
      }
      return;
    }
    if (!this.players().length) {
      if (!this.emptySince) this.emptySince = now;
      if (now - this.emptySince > 5000 && this.state.mode !== 'dormant') this.reset();
      return;
    }
    this.emptySince = 0;
    if (this.state.phase === 1 && b.hp <= MAIYARAP_HP * .7) this.phase(2);
    else if (this.state.phase === 2 && b.hp <= MAIYARAP_HP * .35) this.phase(3);
    const due = this.tasks.filter(t => t.at <= now); this.tasks = this.tasks.filter(t => t.at > now);
    for (const task of due) task.run();
    for (const [id, area] of this.areas) {
      const h = area.state;
      // Swept time interval prevents a late server tick skipping the contact window.
      const contact = Math.min(now, h.endsAt), previous = Math.max(h.startsAt, area.previous);
      if (now >= h.startsAt && area.previous < h.endsAt) {
        for (const [pid, p] of this.players()) {
          const realm = this.state.dreamers.get(pid)?.realm ?? 'awake';
          if (h.actor !== 'both' && h.actor !== realm || area.hit.has(pid)) continue;
          if (dreamHit(h, p, contact, previous)) { area.hit.add(pid); const landed = this.hooks.hit(pid, b, area.damage); if (landed && area.sleep && !p.dead) this.sleep(pid); }
        }
        if (h.shape === 'charge') {
          const q = Math.max(0, Math.min(1, (contact - h.startsAt) / (h.endsAt - h.startsAt)));
          b.x = h.x + (h.toX - h.x) * q; b.y = h.y + (h.toY - h.y) * q; this.hooks.sync(b);
        }
      }
      area.previous = now;
      if (now > h.endsAt + 600) { this.areas.delete(id); this.state.hazards.delete(id); }
    }
    if (this.state.mode === 'dormant') { this.state.mode = 'idle'; this.state.endsAt = now + 1200; }
    if (this.state.mode === 'transition' || this.state.mode === 'ultimate' || now < this.state.endsAt) return;
    if (this.poise >= 1800) { this.poise = 0; this.clear(); this.state.mode = 'stagger'; this.state.endsAt = now + 2200; return; }
    this.state.mode = 'idle';
    if (this.reviewManual) return;
    const target = this.players().sort((a, c) => dist(a[1], b) - dist(c[1], b))[0]; if (!target) return;
    if (dist(b, target[1]) > 8) {
      this.state.mode = 'reposition';
      const d = dist(b, target[1]), step = Math.min(1.4 * dtMs / 1000, d - 7.5);
      const dx = (target[1].x - b.x) / d, dy = (target[1].y - b.y) / d;
      b.x += dx * step; b.y += dy * step;
      b.facing = facingFromVector(dx, dy) ?? b.facing; b.state = 'chase'; this.hooks.sync(b);
      this.state.endsAt = now; return;
    }
    const available = (Object.keys(MAIYARAP_SKILLS) as MaiyarapSkill[]).filter(k => MAIYARAP_SKILLS[k].phase <= this.state.phase && (this.ready.get(k) ?? 0) <= now);
    if (this.state.phase === 3 && available.includes('eternal-slumber')) this.start('eternal-slumber', target[0]);
    else if (available.length) this.start(available[this.deck++ % available.length]!, target[0]);
  }
}
