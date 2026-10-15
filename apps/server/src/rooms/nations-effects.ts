import { SummonState, ZoneState, type GameState } from '@shaman/schema';
import {
  isBehindMonster, ACHAN, combatStats, FLAT_ATK_SCALE, HUNTER, isBlocked, JUGGERNAUT, KERIS, magicDamage, MONSTERS, MOR_PHHEE, physicalDamage, provokeMonster, SANTET, TAIGA,
  type MapDefinition, type MonsterMotion, type MonsterStatus, type PlayerProfile, type Position,
} from '@shaman/shared';

// Russia (Juggernaut Guard, Taiga blood hunt), Indonesia (Santet needles, Keris pamor stages) and Thailand (Achan
// Saiyasat sacred thread + Hun Phayon, Mor Phhee jumping prai) on the server — game integration slice 4,
// docs/design/combat/SLICE4_COMBAT.md. Numbers come from shared nations-combat.ts (catalogue formulas; open inputs
// provisional). Also: monster stun/fear/taunt/poison/heal-block, player stealth, lethal-blow saves, puppets and clones.

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const DEBUFF_STATUSES: readonly MonsterStatus[] = ['def-down', 'poison', 'bleed', 'cursed', 'heal-block', 'slow', 'blind', 'stun', 'fear', 'root', 'burn'];

export interface NationsContext {
  map: MapDefinition;
  state: GameState;
  monsters: Map<string, MonsterMotion>;
  now(): number;
  rng(): number;
  profile(id: string): PlayerProfile | undefined;
  setProfile(id: string, p: PlayerProfile): void;
  schedule(delayMs: number, run: () => void): void;
  damage(m: MonsterMotion, amount: number, playerId: string, skill?: string): void;
  status(m: MonsterMotion, status: MonsterStatus, ms: number, source: string): void;
  fx(event: { caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string }): void;
  heal(playerId: string, amount: number): void;
  isDown(playerId: string): boolean;
  walkMap(): MapDefinition;
  reduceCooldown(playerId: string, skillId: string, ms: number): void;
  /** Remove up to `count` player debuffs (no blessing: that is Miko's signature). */
  cleanse(playerId: string, count: number): number;
}

interface Dot { m: MonsterMotion; owner: string; perTick: number; until: number; next: number; skill: string }
interface Prai { owner: string; jumps: number; level: number; until: number; next: number }
interface Zone { id: string; kind: string; owner: string; x: number; y: number; radius: number; until: number; level: number; nextTick: number }
interface Summon { id: string; kind: string; owner: string; level: number; until: number; nextAct: number }
interface Job { guard: number; kills: number; stage: number; ultimateBoost: boolean; nextCrit: number; scentAt: number; undyingAt: number; soulDefenseAt: number; firstHit: boolean }

export class NationsEffects {
  private buffs = new Map<string, Map<string, { until: number; power: number }>>();
  private jobs = new Map<string, Job>();
  private dots: Dot[] = [];
  private needles = new Map<string, { owner: string; count: number }>();
  private links: { a: MonsterMotion; b: MonsterMotion; owner: string; until: number; share: number }[] = [];
  private prai = new Map<string, Prai>();
  private marks = new Map<string, number>();
  private zones = new Map<string, Zone>();
  private summons = new Map<string, Summon>();
  private seq = 0;
  private nextSecond = 0;
  private nextMalice = 0;

  constructor(private readonly ctx: NationsContext) {}

  // ---- helpers ----
  private lv(p: PlayerProfile | undefined, id: string) { return p?.skills[id] ?? 0; }
  private has(m: MonsterMotion, s: MonsterStatus) { return (m.statuses[s] ?? 0) > this.ctx.now(); }
  private alive(id: string | null | undefined) { const m = id ? this.ctx.monsters.get(id) : undefined; return m && m.state !== 'dead' ? m : undefined; }
  private job(id: string): Job { let j = this.jobs.get(id); if (!j) { j = { guard: 0, kills: 0, stage: 0, ultimateBoost: false, nextCrit: 0, scentAt: 0, undyingAt: -1e12, soulDefenseAt: -1e12, firstHit: false }; this.jobs.set(id, j); } return j; }
  private buffMap(id: string) { let b = this.buffs.get(id); if (!b) { b = new Map(); this.buffs.set(id, b); } return b; }
  private active(id: string, b: string) { const x = this.buffs.get(id)?.get(b); return x && x.until > this.ctx.now() ? x : undefined; }
  private addBuff(id: string, b: string, ms: number, power = 1) { this.buffMap(id).set(b, { until: this.ctx.now() + ms, power }); }
  private setStatus(m: MonsterMotion, s: MonsterStatus, ms: number, source: string) { m.statuses[s] = Math.max(m.statuses[s] ?? 0, this.ctx.now() + ms); this.ctx.status(m, s, ms, source); }
  private near(at: Position, radius: number) { return [...this.ctx.monsters.values()].filter((m) => m.state !== 'dead' && dist(m, at) <= radius); }
  private allies(at: Position, radius: number) { return [...this.ctx.state.players.entries()].filter(([pid, p]) => !this.ctx.isDown(pid) && dist(p, at) <= radius).map(([pid]) => pid); }
  private bleeding(m: MonsterMotion) { return this.has(m, 'bleed'); }
  private behind(player: Position, m: MonsterMotion) { return isBehindMonster(player,m); }
  private slow(m: MonsterMotion, factor: number, ms: number) { const now = this.ctx.now(); m.slowFactor = Math.min(m.slowUntil > now ? m.slowFactor : 1, factor); m.slowUntil = Math.max(m.slowUntil, now + ms); m.statuses.slow = m.slowUntil; }
  private move(m: MonsterMotion, to: Position, units: number) {
    const d = dist(m, to) || 1, ux = (to.x - m.x) / d, uy = (to.y - m.y) / d;
    for (let s = 0.25; s <= Math.min(units, d); s += 0.25) { const n = { x: m.x + ux * 0.25, y: m.y + uy * 0.25 }; if (isBlocked(this.ctx.walkMap(), n.x, n.y)) break; m.x = n.x; m.y = n.y; }
  }
  /** Dash the player toward a point, stopping `stopShort` units before it (walls stop the dash). */
  private dash(id: string, to: Position, maxUnits: number, stopShort = 1) {
    const p = this.ctx.state.players.get(id);
    if (!p) return;
    const d = dist(p, to), go = Math.max(0, Math.min(maxUnits, d - stopShort)), ux = (to.x - p.x) / (d || 1), uy = (to.y - p.y) / (d || 1);
    let x = p.x, y = p.y;
    for (let s = 0.25; s <= go; s += 0.25) { const n = { x: p.x + ux * s, y: p.y + uy * s }; if (isBlocked(this.ctx.walkMap(), n.x, n.y)) break; x = n.x; y = n.y; }
    p.x = x; p.y = y; p.moving = false;
  }
  private phys(m: MonsterMotion, owner: string, raw: number, pen = 0, critBonus = 0) {
    const def = MONSTERS[m.kind]!, p = this.ctx.profile(owner)!;
    const crit = this.ctx.rng() < HUNTER.critChance(combatStats(p).luk, critBonus);
    const defense = def.def * (1 - Math.min(1, pen)) * (this.has(m, 'def-down') ? SANTET.agony(5) : 1);
    return Math.round(physicalDamage(raw, defense, this.ctx.rng()) * (crit ? HUNTER.critMultiplier : 1));
  }
  private magic(m: MonsterMotion, owner: string, raw: number) {
    const def = MONSTERS[m.kind]!, p = this.ctx.profile(owner);
    const aura = this.lv(p, 'dark-aura') && this.ctx.state.players.get(owner) && dist(m, this.ctx.state.players.get(owner)!) <= SANTET.darkAuraRadius ? SANTET.darkAura(this.lv(p, 'dark-aura')) : 1;
    return magicDamage(raw, def.mdef * aura * (this.has(m, 'def-down') ? SANTET.agony(5) : 1), this.ctx.rng());
  }
  private hit(m: MonsterMotion, owner: string, amount: number, skill: string) { if (m.state !== 'dead') { this.ctx.damage(m, Math.max(1, amount), owner, skill); provokeMonster(m, owner); } }
  private addDot(m: MonsterMotion, owner: string, perTick: number, ms: number, skill: string, status: MonsterStatus) {
    this.dots = this.dots.filter((d) => !(d.m === m && d.owner === owner && d.skill === skill));
    this.dots.push({ m, owner, perTick, until: this.ctx.now() + ms, next: this.ctx.now() + 1000, skill });
    this.setStatus(m, status, ms, owner);
  }
  private poison(m: MonsterMotion, owner: string, ms = KERIS.poisonMs) {
    const p = this.ctx.profile(owner);
    if (!p) return;
    this.addDot(m, owner, Math.round(KERIS.poisonTick(combatStats(p).atk) * KERIS.venom(this.lv(p, 'venom-mastery'))), ms, 'poison', 'poison');
  }
  private bleed(m: MonsterMotion, owner: string, lv: number) {
    const p = this.ctx.profile(owner);
    if (p) this.addDot(m, owner, TAIGA.bleedTick(combatStats(p).atk, lv), TAIGA.bleedMs, 'bleed', 'bleed');
  }
  private addNeedles(m: MonsterMotion, owner: string, n: number) {
    const cur = this.needles.get(m.id);
    this.needles.set(m.id, { owner, count: Math.min(SANTET.needleMax, (cur?.owner === owner ? cur.count : 0) + n) });
  }
  private addZone(z: Omit<Zone, 'id'>) {
    const id = `nzone-${++this.seq}`;
    this.zones.set(id, { ...z, id });
    const s = new ZoneState(); s.kind = z.kind; s.owner = z.owner; s.x = z.x; s.y = z.y; s.radius = z.radius;
    this.ctx.state.zones.set(id, s);
  }
  private removeZone(id: string) { this.zones.delete(id); this.ctx.state.zones.delete(id); }
  private inZone(kind: string, at: Position) { return [...this.zones.values()].some((z) => z.kind === kind && (kind === 'sacred-thread' ? Math.abs(at.x - z.x) <= z.radius && Math.abs(at.y - z.y) <= z.radius : dist(at, z) <= z.radius)); }
  private summon(owner: string, kind: string, level: number, ms: number, hp: number) {
    for (const s of [...this.summons.values()]) if (s.owner === owner && s.kind === kind) this.removeSummon(s.id);
    const player = this.ctx.state.players.get(owner)!;
    const id = `nsum-${++this.seq}`;
    this.summons.set(id, { id, kind, owner, level, until: this.ctx.now() + ms, nextAct: this.ctx.now() + 1000 });
    const s = new SummonState(); s.kind = kind; s.owner = owner; s.x = player.x - 1; s.y = player.y; s.hp = s.hpMax = Math.round(hp);
    this.ctx.state.summons.set(id, s);
  }
  private removeSummon(id: string) { this.summons.delete(id); this.ctx.state.summons.delete(id); }
  private phayon(owner: string) { return [...this.summons.values()].find((s) => s.owner === owner && (s.kind === 'hun-phayon' || s.kind === 'phayon-colossus')); }
  private phayonAtk(owner: string, level: number) { const p = this.ctx.profile(owner)!; return ACHAN.phayonAtk(combatStats(p).int, Math.max(1, level)); }
  private hpCost(id: string, pct: number) { const p = this.ctx.profile(id); if (!p) return; const q = structuredClone(p); q.hp = Math.max(1, Math.round(q.hp - q.hpMax * pct)); this.ctx.setProfile(id, q); }
  private prey(owner: string, m: MonsterMotion, level: number, jumps = 0) {
    this.prai.set(m.id, { owner, jumps, level, until: this.ctx.now() + MOR_PHHEE.curseMs, next: this.ctx.now() + 1000 });
    this.setStatus(m, 'cursed', MOR_PHHEE.curseMs, owner);
  }

  // ---- player hooks read by the combat system ----
  /** Damage this player deals to `m` (multiplies every source). Breaks stealth. */
  dealtMul(id: string, m: MonsterMotion): number {
    const p = this.ctx.profile(id);
    if (!p) return 1;
    let mul = 1;
    const b = this.active(id, 'berserker'); if (b) mul *= 1 + b.power;
    if (this.active(id, 'blood-moon')) mul *= 1 + TAIGA.bloodMoon;
    const player = this.ctx.state.players.get(id);
    if (player && this.lv(p, 'wolf-blood-mastery')) mul *= TAIGA.wolfBlood(this.lv(p, 'wolf-blood-mastery'), this.near(player, 5).filter((x) => this.bleeding(x)).length);
    if (this.lv(p, 'rend') && this.bleeding(m)) mul *= TAIGA.rend(this.lv(p, 'rend'));
    if (this.lv(p, 'overlords-curse') && DEBUFF_STATUSES.filter((s) => this.has(m, s)).length >= 2) mul *= SANTET.overlord(this.lv(p, 'overlords-curse'));
    if (p.branch === 'mor-phhee' && this.lv(p, 'dark-affinity')) mul *= MOR_PHHEE.darkAffinity(this.lv(p, 'dark-affinity'));
    const avatar = this.active(id, 'ghost-avatar'); if (avatar && this.ctx.rng() < avatar.power) mul *= 1.5;
    if (this.active(id, 'stealth')) {
      mul *= KERIS.stealthBonus * KERIS.shadowMaster(this.lv(p, 'shadow-master'));
      this.buffMap(id).delete('stealth');
    }
    if (player && p.branch === 'keris' && this.behind(player, m)) mul *= KERIS.backstab(this.lv(p, 'backstab-expert'));
    return mul;
  }
  /** Damage a player takes after armour, forts, Guard, threads, puppets. `ranged` = projectile/magic blow. */
  taken(id: string, amount: number, ranged: boolean): number {
    if (this.active(id, 'fortress')) return 0;
    const p = this.ctx.profile(id), player = this.ctx.state.players.get(id);
    let a = amount;
    const armor = this.active(id, 'wolf-armor'); if (armor) a *= 1 - armor.power / 2;
    const fort = this.active(id, 'snow-fort'); if (fort && ranged) a *= fort.power;
    if (p && p.hp < p.hpMax * 0.3 && this.lv(p, 'taiga-survivor')) a *= JUGGERNAUT.survivor(this.lv(p, 'taiga-survivor'));
    if (player && this.inZone('ice-ground', player)) a *= JUGGERNAUT.iceGroundTaken;
    if (p && this.lv(p, 'colossus-blood') && this.job(id).guard >= JUGGERNAUT.guardMax) a *= JUGGERNAUT.colossusFullTaken;
    if (p && ranged && this.lv(p, 'shadow-ward')) a *= SANTET.shadowWard(this.lv(p, 'shadow-ward'));
    if (player && this.inZone('thread-fortress', player)) { const z = [...this.zones.values()].find((x) => x.kind === 'thread-fortress'); if (z) a *= ACHAN.fortress(z.level); }
    // Iron Shield Incantation: any Achan on screen hardens everyone near them.
    for (const [aid, ap] of this.ctx.state.players) { const q = this.ctx.profile(aid); if (q && this.lv(q, 'iron-shield-incantation') && player && dist(ap, player) <= 7.5) { a *= ACHAN.ironShield(this.lv(q, 'iron-shield-incantation')); break; } }
    // Guardian Link: part of the hit goes to the caster's puppet.
    const pup = this.phayon(id);
    if (p && pup && this.lv(p, 'guardian-link')) {
      const share = Math.round(a * ACHAN.guardianLink(this.lv(p, 'guardian-link'))); a -= share;
      const st = this.ctx.state.summons.get(pup.id); if (st) { st.hp = Math.max(0, st.hp - share); if (st.hp <= 0) this.removeSummon(pup.id); }
    }
    return Math.max(0, Math.round(a));
  }
  dodges(id: string): boolean { const p = this.ctx.profile(id), pos = this.active(id, 'possession'); return !!pos && this.ctx.rng() < MOR_PHHEE.possessionDodge(this.lv(p, 'agile-spirit')); }
  aspdMul(id: string): number {
    const p = this.ctx.profile(id), player = this.ctx.state.players.get(id);
    let mul = 1;
    if (this.active(id, 'berserker')) mul *= TAIGA.berserkAspd;
    if (this.active(id, 'wolf-frenzy')) mul *= TAIGA.wolfFrenzyAspd;
    if (p && player && this.lv(p, 'frenzy-aspd')) mul *= TAIGA.frenzyAspd(this.lv(p, 'frenzy-aspd'), this.near(player, TAIGA.frenzyRadius).filter((m) => this.bleeding(m)).length);
    if (p && p.branch === 'keris' && this.lv(p, 'keris-mastery')) mul *= KERIS.mastery(this.lv(p, 'keris-mastery'));
    if (p && p.branch === 'keris' && this.job(id).stage >= 1) mul *= KERIS.stageAspd;
    const pos = this.active(id, 'possession'); if (pos) mul *= MOR_PHHEE.possessionAspd(pos.power);
    return mul;
  }
  hidden(id: string) { return !!this.active(id, 'stealth'); }
  /** A monster blow landed on the player: Guard, reflects, Toxic Blood. */
  onPlayerHit(id: string, m: MonsterMotion, amount: number, ranged: boolean) {
    const p = this.ctx.profile(id);
    if (!p) return;
    if (p.branch === 'juggernaut') this.job(id).guard = Math.min(JUGGERNAUT.guardMax, this.job(id).guard + JUGGERNAUT.guardPerHit);
    if (!ranged) {
      const w = this.active(id, 'warlord'); if (w && amount > 0) this.hit(m, id, Math.round(amount * w.power), 'warlords-command');
      if (this.lv(p, 'colossus-resonance') && amount > 0) this.hit(m, id, Math.round(amount * ACHAN.resonance(this.lv(p, 'colossus-resonance'))), 'colossus-resonance');
      if (this.lv(p, 'toxic-blood') && this.ctx.rng() < KERIS.toxicChance(this.lv(p, 'toxic-blood'))) this.poison(m, id);
    }
  }
  /** A blow would down the player: Undying Rage (Taiga) or Absolute Soul Defense (Mor Phhee) may save them. */
  onLethal(id: string): boolean {
    const p = this.ctx.profile(id), player = this.ctx.state.players.get(id), now = this.ctx.now(), j = this.job(id);
    if (!p || !player) return false;
    if (this.lv(p, 'undying-rage') && now - j.undyingAt >= TAIGA.undyingCdMs) {
      const prey = this.near(player, TAIGA.undyingRange).filter((m) => this.bleeding(m)).sort((a, b) => dist(a, player) - dist(b, player))[0];
      if (prey) { j.undyingAt = now; this.dash(id, prey, TAIGA.undyingRange); this.saveAt(id, p, TAIGA.undyingHeal); this.ctx.fx({ caster: id, skillId: 'undying-rage', targetId: prey.id }); return true; }
    }
    if (this.lv(p, 'absolute-soul-defense') && now - j.soulDefenseAt >= MOR_PHHEE.soulDefenseCdMs) {
      const mine = [...this.prai.entries()].find(([, x]) => x.owner === id);
      if (mine) { this.prai.delete(mine[0]); j.soulDefenseAt = now; this.saveAt(id, p, MOR_PHHEE.soulDefense(this.lv(p, 'absolute-soul-defense'))); this.ctx.fx({ caster: id, skillId: 'absolute-soul-defense' }); return true; }
    }
    return false;
  }
  private saveAt(id: string, p: PlayerProfile, pct: number) { const q = structuredClone(p); q.hp = Math.max(1, Math.round(q.hpMax * pct)); this.ctx.setProfile(id, q); }
  /** A basic blow landed: poison blade, possession prai, blood oil mark, wolf frenzy lifesteal. */
  onBasicHit(id: string, m: MonsterMotion, amount: number) {
    const p = this.ctx.profile(id);
    if (!p || m.state === 'dead') return;
    const blade = this.active(id, 'poison-blade'); if (blade && this.ctx.rng() < KERIS.deadlyChance(blade.power)) this.poison(m, id);
    const pos = this.active(id, 'possession'); if (pos && !this.prai.has(m.id)) this.prey(id, m, Math.max(1, this.lv(p, 'prai-whispering-curse')));
    if (this.lv(p, 'blood-oil-coating') && this.ctx.rng() < MOR_PHHEE.oilChance(this.lv(p, 'blood-oil-coating'))) this.marks.set(m.id, this.ctx.now() + MOR_PHHEE.oilMs);
    const wf = this.active(id, 'wolf-frenzy'); if (wf) this.ctx.heal(id, Math.round(amount * wf.power));
  }
  /** Extra basic-attack damage (Poison Blade ATK). */
  basicBonus(id: string): number { const b = this.active(id, 'poison-blade'); return b ? Math.round(KERIS.bladeAtk(b.power) * FLAT_ATK_SCALE) : 0; }
  /** Damage just landed on `m` (Voodoo Link shares it with the linked monster). */
  onDamage(m: MonsterMotion, amount: number, owner: string, skill?: string) {
    if (skill === 'voodoo-link' || amount <= 0) return;
    for (const l of this.links) {
      if (l.owner !== owner || l.until <= this.ctx.now()) continue;
      const other = l.a === m ? l.b : l.b === m ? l.a : null;
      if (other && other.state !== 'dead') this.ctx.schedule(0, () => this.hit(other, owner, Math.round(amount * l.share), 'voodoo-link'));
    }
  }
  /** A monster died by this player's hand. */
  onKill(id: string, m: MonsterMotion) {
    const p = this.ctx.profile(id), now = this.ctx.now(), j = this.job(id);
    if (!p) return;
    const player = this.ctx.state.players.get(id);
    // Keris pamor: poison or backstab kills wake the blade (every 3 kills = 1 stage, max 3).
    if (p.branch === 'keris' && (this.has(m, 'poison') || (player && this.behind(player, m)))) { j.kills++; if (j.kills >= KERIS.killsPerStage && j.stage < 3) { j.kills = 0; j.stage++; if (j.stage === 3) j.ultimateBoost = true; } }
    // Blood Scent kill resets its cooldown; Shadow Flash Strike kill resets Shadow Stealth.
    if (now - j.scentAt < 3000) this.ctx.reduceCooldown(id, 'blood-scent', 1e9);
    const cursedByMe = this.prai.get(m.id)?.owner === id || this.has(m, 'cursed');
    if (cursedByMe && this.lv(p, 'soul-harvest')) { const h = this.active(id, 'soul-harvest'); this.addBuff(id, 'soul-harvest', MOR_PHHEE.harvestMs, Math.min(this.lv(p, 'soul-harvest'), (h?.power ?? 0) + 1)); }
    if (cursedByMe && this.ctx.rng() < MOR_PHHEE.harvester(this.lv(p, 'soul-harvester'))) { this.ctx.reduceCooldown(id, 'prai-curse-explosion', 1e9); this.ctx.reduceCooldown(id, 'soul-drain', 1e9); }
    // The prai jumps on to the next host.
    const pr = this.prai.get(m.id);
    if (pr) { this.prai.delete(m.id); this.jump(pr, m); }
    this.needles.delete(m.id); this.marks.delete(m.id);
  }
  private jump(pr: Prai, from: Position) {
    const p = this.ctx.profile(pr.owner);
    if (!p || pr.jumps >= MOR_PHHEE.jumps(pr.level)) return;
    const next = this.near(from, MOR_PHHEE.jumpRange).filter((m) => !this.prai.has(m.id))
      .sort((a, b) => ((this.marks.get(b.id) ?? 0) > this.ctx.now() ? 1 : 0) - ((this.marks.get(a.id) ?? 0) > this.ctx.now() ? 1 : 0) || dist(a, from) - dist(b, from))[0];
    if (!next) return;
    this.prey(pr.owner, next, pr.level, pr.jumps + 1);
    this.ctx.fx({ caster: pr.owner, skillId: 'prai-whispering-curse', targetId: next.id, variant: String(pr.jumps + 1) });
  }
  statusesOf(id: string): string[] { const now = this.ctx.now(); return [...(this.buffs.get(id) ?? new Map()).entries()].filter(([, v]) => v.until > now).map(([k]) => k); }

  /** A slice-4 skill released. Returns false when it is not one. */
  release(id: string, skillId: string, targetId: string | null, aim: Position): boolean {
    const p = this.ctx.profile(id), player = this.ctx.state.players.get(id);
    if (!p || !player) return false;
    const lv = Math.max(1, this.lv(p, skillId)), now = this.ctx.now();
    const { atk, matk } = combatStats(p);
    const target = this.alive(targetId);
    const j = this.job(id);
    // Casting anything but stealth reveals a hidden Keris.
    if (skillId !== 'shadow-stealth') this.buffMap(id).delete('stealth');
    const ult = (raw: number) => { if (j.ultimateBoost) { j.ultimateBoost = false; j.stage = 0; return raw * KERIS.stageUltimate(this.lv(p, 'venomous-overdrive')); } return raw; };
    switch (skillId) {
      // ---- Juggernaut ----
      case 'wolf-spirit-armor': this.addBuff(id, 'wolf-armor', JUGGERNAUT.wolfArmorMs, JUGGERNAUT.wolfArmor(lv)); return true;
      case 'taunting-howl':
        for (const m of this.near(player, JUGGERNAUT.tauntRadius)) { m.targetId = id; m.state = 'chase'; this.setStatus(m, 'taunt', JUGGERNAUT.tauntMs(lv), id); }
        j.guard = Math.min(JUGGERNAUT.guardMax, j.guard + JUGGERNAUT.tauntGuard); return true;
      case 'siberian-frost-step':
        for (const m of this.near(player, JUGGERNAUT.frostRadius)) { this.hit(m, id, this.phys(m, id, JUGGERNAUT.frostStep(atk, lv)), skillId); this.slow(m, 0.7, JUGGERNAUT.frostSlowMs); }
        this.addZone({ kind: 'ice-ground', owner: id, x: player.x, y: player.y, radius: JUGGERNAUT.frostRadius, until: now + JUGGERNAUT.iceGroundMs, level: lv, nextTick: 0 }); return true;
      case 'shield-bash': if (target) { this.hit(target, id, this.phys(target, id, JUGGERNAUT.shieldBash(atk, lv)), skillId); if (target.state !== 'dead') this.setStatus(target, 'stun', JUGGERNAUT.bashStunMs, id); j.guard = Math.min(JUGGERNAUT.guardMax, j.guard + JUGGERNAUT.bashGuard); } return true;
      case 'snow-fort': this.addBuff(id, 'snow-fort', JUGGERNAUT.snowFortMs, JUGGERNAUT.snowFort(lv)); return true;
      case 'taigas-absolute-fortress': this.addBuff(id, 'fortress', JUGGERNAUT.fortressMs(lv)); return true;
      case 'titan-stomp': {
        const guard = j.guard; j.guard = 0;
        for (const m of this.near(player, JUGGERNAUT.titanRadius)) { this.hit(m, id, this.phys(m, id, JUGGERNAUT.titanStomp(atk, lv, p.hpMax, guard)), skillId); if (m.state !== 'dead') this.setStatus(m, 'stun', JUGGERNAUT.titanStunMs, id); }
        return true;
      }
      case 'warlords-command': for (const a of this.allies(player, JUGGERNAUT.warlordRadius)) this.addBuff(a, 'warlord', JUGGERNAUT.warlordMs, JUGGERNAUT.warlordReflect(lv)); return true;
      // ---- Taiga ----
      case 'slavic-axe-strike': if (target) { this.hit(target, id, this.phys(target, id, TAIGA.axeStrike(atk, lv), 0, j.nextCrit), skillId); j.nextCrit = 0; if (target.state !== 'dead' && this.ctx.rng() < TAIGA.bleedChance(lv)) this.bleed(target, id, lv); } return true;
      case 'berserker-blood': this.hpCost(id, TAIGA.berserkCost); this.addBuff(id, 'berserker', TAIGA.berserkMs, TAIGA.berserkAtk(lv)); return true;
      case 'wolf-pack-call': {
        if (!target) return true;
        const d = dist(player, target) || 1, ux = (target.x - player.x) / d, uy = (target.y - player.y) / d;
        const line = this.near(player, TAIGA.wolfPackLength + 1).filter((m) => { const t = (m.x - player.x) * ux + (m.y - player.y) * uy, off = Math.abs((m.x - player.x) * uy - (m.y - player.y) * ux); return t > 0 && t <= TAIGA.wolfPackLength && off <= 1; });
        for (let h = 0; h < TAIGA.wolfPackHits; h++) this.ctx.schedule(150 + h * 180, () => { for (const m of line) this.hit(m, id, this.phys(m, id, TAIGA.wolfPack(atk, lv)), skillId); });
        return true;
      }
      case 'leap-strike': if (target) { this.dash(id, target, TAIGA.leapRange); for (const m of this.near(target, TAIGA.leapRadius)) this.hit(m, id, this.phys(m, id, TAIGA.leap(atk, lv)), skillId); } return true;
      case 'blood-scent': if (target && this.bleeding(target)) { this.dash(id, target, TAIGA.scentRange); j.nextCrit = TAIGA.scentCrit(lv); j.scentAt = now; } return true;
      case 'bloodthirsty-wolf-frenzy': this.addBuff(id, 'wolf-frenzy', TAIGA.wolfFrenzyMs, TAIGA.lifesteal(lv)); return true;
      case 'decapitate': {
        if (!target) return true;
        const def = MONSTERS[target.kind]!;
        if (def.size !== 'boss' && target.hp < def.hp * TAIGA.executeBelow && this.ctx.rng() < TAIGA.executeChance(lv)) { this.hit(target, id, target.hp, skillId); return true; }
        this.hit(target, id, this.phys(target, id, TAIGA.decapitate(atk, lv), 0, j.nextCrit), skillId); j.nextCrit = 0; return true;
      }
      case 'blood-moon': for (const a of this.allies(player, TAIGA.bloodMoonRadius)) this.addBuff(a, 'blood-moon', TAIGA.bloodMoonMs); return true;
      // ---- Santet ----
      case 'black-magic-dart': if (target) this.ctx.schedule(SANTET.dartDelayMs, () => { if (target.state === 'dead') return; this.hit(target, id, this.magic(target, id, SANTET.dart(matk, lv)), skillId); this.addNeedles(target, id, 1); }); return true;
      case 'curse-of-agony': if (target) { this.setStatus(target, 'def-down', SANTET.agonyMs, id); this.setStatus(target, 'cursed', SANTET.agonyMs, id); } return true;
      case 'soul-pluck': if (target) this.ctx.schedule(SANTET.pluckDelayMs, () => { if (target.state === 'dead') return; this.hit(target, id, this.magic(target, id, SANTET.pluck(matk, lv)), skillId); this.addNeedles(target, id, 2); this.setStatus(target, 'heal-block', SANTET.healBlockMs(lv), id); }); return true;
      case 'poison-cloud': this.addZone({ kind: 'poison-cloud', owner: id, x: aim.x, y: aim.y, radius: SANTET.cloudRadius, until: now + SANTET.cloudMs, level: lv, nextTick: now + 300 }); return true;
      case 'voodoo-link': {
        if (!target) return true;
        const other = this.near(target, SANTET.linkRange).filter((m) => m !== target).sort((a, b) => dist(a, target) - dist(b, target))[0];
        if (!other) return true;
        this.links.push({ a: target, b: other, owner: id, until: now + SANTET.linkMs, share: SANTET.linkShare(lv) });
        const n = this.needles.get(target.id); if (n) this.addNeedles(other, id, Math.round(n.count * SANTET.linkShare(lv)));
        this.ctx.fx({ caster: id, skillId, targetId: other.id }); return true;
      }
      case 'curse-of-the-archipelago': this.addZone({ kind: 'archipelago', owner: id, x: player.x, y: player.y, radius: SANTET.archipelagoRadius, until: now + SANTET.archipelagoMs, level: lv, nextTick: now + 500 }); return true;
      case 'mass-decay': for (const m of this.near(aim, SANTET.decayRadius)) { this.setStatus(m, 'heal-block', SANTET.decayMs, id); this.setStatus(m, 'cursed', SANTET.decayMs, id); } return true;
      case 'heart-stop': if (target) { this.hit(target, id, this.magic(target, id, SANTET.heartStop(matk, lv)), skillId); if (target.state !== 'dead') { target.swingAt = 0; this.setStatus(target, 'stun', SANTET.heartStunMs, id); } } return true;
      case 'endless-agony': {
        const n = target ? this.needles.get(target.id) : undefined;
        if (!target || !n || n.owner !== id) return true;
        this.needles.delete(target.id);
        const per = SANTET.agonyPerNeedle(matk, lv) * SANTET.hex(this.lv(p, 'hex-amplify'));
        this.hit(target, id, this.magic(target, id, per * n.count), skillId); return true;
      }
      // ---- Keris ----
      case 'poison-blade': this.addBuff(id, 'poison-blade', KERIS.bladeMs, lv); return true;
      case 'keris-thrust': if (target) { const back = this.behind(player, target); this.hit(target, id, this.phys(target, id, KERIS.thrust(atk, lv), j.stage >= 2 ? KERIS.thrustPen : 0, back ? 100 : 0), skillId); } return true;
      case 'shadow-stealth': this.addBuff(id, 'stealth', KERIS.stealthMs(lv)); for (const m of this.ctx.monsters.values()) if (m.targetId === id) { m.targetId = null; m.state = 'return'; } return true;
      case 'venom-spit': if (target) this.ctx.schedule(200, () => { if (target.state === 'dead') return; this.hit(target, id, this.phys(target, id, KERIS.spit(atk)), skillId); if ((target.state as string) !== 'dead') { this.setStatus(target, 'blind', KERIS.spitMs(lv), id); this.poison(target, id, KERIS.spitMs(lv)); } }); return true;
      case 'assassinate': if (target) { this.dash(id, target, KERIS.assassinateRange); target.swingAt = 0; this.hit(target, id, this.phys(target, id, KERIS.assassinate(atk, lv)), skillId); } return true;
      case 'shadow-flash-strike': if (target) { this.hit(target, id, this.phys(target, id, ult(KERIS.flash(atk, lv))), skillId); if (target.state === 'dead') this.ctx.reduceCooldown(id, 'shadow-stealth', 1e9); } return true;
      case 'fatal-assassination': if (target) this.hit(target, id, this.phys(target, id, ult(KERIS.fatal(atk, lv)), this.has(target, 'poison') ? 1 : 0), skillId); return true;
      case 'shadow-clone': this.summon(id, 'shadow-clone', lv, KERIS.cloneMs, p.hpMax * 0.2); return true;
      // ---- Achan Saiyasat ----
      case 'summon-hun-phayon': this.summon(id, 'hun-phayon', lv, ACHAN.phayonMs, ACHAN.phayonHp(p.hpMax, lv)); return true;
      case 'giant-phayon-colossus': for (const s of [...this.summons.values()]) if (s.owner === id && s.kind === 'hun-phayon') this.removeSummon(s.id); this.summon(id, 'phayon-colossus', lv, 30000, ACHAN.colossusHp(p.hpMax)); return true;
      case 'sacred-thread-barrier': this.addZone({ kind: 'sacred-thread', owner: id, x: aim.x, y: aim.y, radius: ACHAN.barrierHalf(this.lv(p, 'ward-mastery')), until: now + ACHAN.barrierMs(lv), level: lv, nextTick: 0 }); return true;
      case 'curse-breaking': for (const a of this.allies(player, 4)) if (this.ctx.rng() < ACHAN.breakChance(lv, combatStats(p).int)) this.ctx.cleanse(a, 1); return true;
      case 'phayon-repair': { const pup = this.phayon(id), st = pup ? this.ctx.state.summons.get(pup.id) : undefined; if (st) st.hp = Math.min(st.hpMax, Math.round(st.hp + st.hpMax * ACHAN.repair(lv))); return true; }
      case 'achans-command': {
        const pup = this.phayon(id);
        if (!target || !pup) return true;
        const st = this.ctx.state.summons.get(pup.id); if (st) { st.x = target.x - 0.8; st.y = target.y; st.acts++; }
        this.hit(target, id, this.phys(target, id, ACHAN.command(this.phayonAtk(id, pup.level), lv)), skillId);
        if (target.state !== 'dead') this.setStatus(target, 'stun', ACHAN.commandStunMs, id); return true;
      }
      case 'fortress-of-sacred-thread': this.addZone({ kind: 'thread-fortress', owner: id, x: player.x, y: player.y, radius: ACHAN.fortressRadius, until: now + ACHAN.fortressMs, level: lv, nextTick: 0 }); return true;
      case 'underworld-soul-pull':
        for (const m of this.near(aim, ACHAN.pullRadius)) { this.move(m, aim, ACHAN.pullRadius); this.hit(m, id, this.magic(m, id, ACHAN.soulPull(matk, lv)), skillId); if (m.state !== 'dead') this.setStatus(m, 'root', ACHAN.pullRootMs, id); }
        return true;
      // ---- Mor Phhee ----
      case 'ghost-possession': this.addBuff(id, 'possession', MOR_PHHEE.possessionMs, lv); return true;
      case 'prai-whispering-curse': if (target) this.prey(id, target, lv); return true;
      case 'soul-drain': if (target) { const jumps = this.prai.get(target.id)?.jumps ?? 0; const dmg = this.magic(target, id, MOR_PHHEE.drain(matk, lv, jumps)); this.hit(target, id, dmg, skillId); this.ctx.heal(id, Math.round(dmg * MOR_PHHEE.drainHeal)); } return true;
      case 'terrorize-howl': for (const m of this.near(player, MOR_PHHEE.howlRadius)) if (this.ctx.rng() < MOR_PHHEE.fearChance(lv)) { m.targetId = id; this.setStatus(m, 'fear', MOR_PHHEE.fearMs, id); } return true;
      case 'shadow-snare': if (target) this.setStatus(target, 'root', MOR_PHHEE.snareMs(lv), id); return true;
      case 'prai-curse-explosion':
        for (const [mid, pr] of [...this.prai.entries()]) {
          const m = this.alive(mid);
          if (pr.owner !== id || !m) continue;
          this.prai.delete(mid);
          this.hit(m, id, this.magic(m, id, MOR_PHHEE.explosion(matk, pr.jumps)), skillId);
        }
        return true;
      case 'shadow-ghost-avatar': this.hpCost(id, MOR_PHHEE.avatarCost); this.addBuff(id, 'ghost-avatar', MOR_PHHEE.avatarMs, MOR_PHHEE.avatarCrit(lv)); return true;
      case 'mass-fear': for (const m of this.near(player, MOR_PHHEE.massFearRadius)) if (this.ctx.rng() < MOR_PHHEE.massFear(lv)) { m.targetId = id; this.setStatus(m, 'fear', MOR_PHHEE.massFearMs, id); } return true;
    }
    return false;
  }

  step(now: number, dtMs: number) {
    // Damage over time (bleed, poison) once a second.
    this.dots = this.dots.filter((d) => {
      if (d.m.state === 'dead' || now >= d.until) return false;
      if (now >= d.next) { d.next = now + 1000; this.hit(d.m, d.owner, d.perTick, d.skill); }
      return true;
    });
    this.links = this.links.filter((l) => l.until > now && l.a.state !== 'dead' && l.b.state !== 'dead');
    // Prai curses tick and jump on when they expire.
    for (const [mid, pr] of [...this.prai.entries()]) {
      const m = this.alive(mid), p = this.ctx.profile(pr.owner);
      if (!m || !p) { this.prai.delete(mid); continue; }
      if (now >= pr.until) { this.prai.delete(mid); this.jump(pr, m); continue; }
      if (now >= pr.next) {
        pr.next = now + 1000;
        const dmg = this.magic(m, pr.owner, MOR_PHHEE.curse(combatStats(p).matk, pr.level) * (1 + MOR_PHHEE.jumpBonus * pr.jumps));
        this.hit(m, pr.owner, dmg, 'prai-whispering-curse');
        if (this.lv(p, 'vampiric-instinct')) this.ctx.heal(pr.owner, Math.round(dmg * MOR_PHHEE.vampiric(this.lv(p, 'vampiric-instinct'))));
      }
    }
    // Taunts keep the monster on the tank.
    for (const m of this.ctx.monsters.values()) if (this.has(m, 'taunt') && m.state !== 'dead' && m.targetId && m.state !== 'chase' && m.state !== 'attack') m.state = 'chase';
    // Zones.
    for (const z of [...this.zones.values()]) {
      if (now >= z.until || !this.ctx.state.players.has(z.owner)) { this.removeZone(z.id); continue; }
      const p = this.ctx.profile(z.owner);
      if (!p) continue;
      if (z.kind === 'sacred-thread') {
        for (const m of this.ctx.monsters.values()) if (m.state !== 'dead' && Math.abs(m.x - z.x) <= z.radius && Math.abs(m.y - z.y) <= z.radius) this.slow(m, ACHAN.barrierSlow, 600);
        for (const [aid, ap] of this.ctx.state.players) if (Math.abs(ap.x - z.x) <= z.radius && Math.abs(ap.y - z.y) <= z.radius) this.addBuff(aid, 'sacred-thread', 600);
        continue;
      }
      if (z.kind === 'thread-fortress') { for (const a of this.allies(z, z.radius)) this.addBuff(a, 'thread-fortress', 600); continue; }
      if (z.kind === 'ice-ground') { for (const a of this.allies(z, z.radius)) this.addBuff(a, 'ice-ground', 600); continue; }
      if (now < z.nextTick) continue;
      z.nextTick = now + 1000;
      const matk = combatStats(p).matk;
      if (z.kind === 'archipelago') { const owner = this.ctx.state.players.get(z.owner); if (owner) { z.x = owner.x; z.y = owner.y; const s = this.ctx.state.zones.get(z.id); if (s) { s.x = z.x; s.y = z.y; } } }
      for (const m of this.near(z, z.radius)) {
        if (z.kind === 'poison-cloud') { this.hit(m, z.owner, this.magic(m, z.owner, SANTET.cloudDot(matk)), 'poison-cloud'); this.setStatus(m, 'poison', SANTET.poisonMs(z.level), z.owner); }
        if (z.kind === 'archipelago') { this.hit(m, z.owner, this.magic(m, z.owner, SANTET.archipelago(matk, z.level)), 'curse-of-the-archipelago'); this.slow(m, SANTET.archipelagoSlow, 1200); this.setStatus(m, 'cursed', 1200, z.owner); }
      }
    }
    this.stepSummons(now, dtMs);
    // Once a second: Colossus Blood Guard regen with an ally nearby.
    if (now >= this.nextSecond) {
      this.nextSecond = now + 1000;
      for (const [id, player] of this.ctx.state.players) {
        const p = this.ctx.profile(id);
        if (p && this.lv(p, 'colossus-blood') && this.allies(player, 3).length > 1) this.job(id).guard = Math.min(JUGGERNAUT.guardMax, this.job(id).guard + JUGGERNAUT.colossusGuardPerSec);
      }
    }
    // Malice: SP back while a cursed enemy is around.
    if (now >= this.nextMalice) {
      this.nextMalice = now + SANTET.maliceEveryMs;
      for (const [id, player] of this.ctx.state.players) {
        const p = this.ctx.profile(id);
        if (!p || !this.lv(p, 'malice') || !this.near(player, 7.5).some((m) => this.has(m, 'cursed') || this.has(m, 'def-down'))) continue;
        const q = structuredClone(p); q.sp = Math.min(q.spMax, q.sp + SANTET.maliceSp(this.lv(p, 'malice'))); this.ctx.setProfile(id, q);
      }
    }
    // Synced job gauges and monster stacks.
    for (const [id, player] of this.ctx.state.players) {
      const p = this.ctx.profile(id);
      const kind = p?.branch === 'juggernaut' ? 'guard' : p?.branch === 'keris' ? 'pamor' : '';
      const value = kind === 'guard' ? this.job(id).guard : kind === 'pamor' ? this.job(id).stage : 0;
      if (player.gaugeKind !== kind) player.gaugeKind = kind;
      if (player.gauge !== value) player.gauge = value;
    }
    for (const m of this.ctx.monsters.values()) {
      const st = this.ctx.state.monsters.get(m.id);
      if (!st) continue;
      const n = this.needles.get(m.id), pr = this.prai.get(m.id);
      const stacks = [n ? `needles:${n.count}` : '', pr ? `prai:${pr.jumps}` : '', (this.marks.get(m.id) ?? 0) > now ? 'oil:1' : ''].filter(Boolean).join(',');
      if (st.stacks !== stacks) st.stacks = stacks;
    }
  }

  private stepSummons(now: number, dtMs: number) {
    for (const s of [...this.summons.values()]) {
      const owner = this.ctx.state.players.get(s.owner), st = this.ctx.state.summons.get(s.id), p = this.ctx.profile(s.owner);
      if (!owner || !st || !p || now >= s.until || st.hp <= 0) { this.removeSummon(s.id); continue; }
      const home = { x: owner.x - 1.2, y: owner.y + 0.3 }, d = dist(st, home);
      if (d > 0.4) {
        const step = Math.min(d, 4.5 * dtMs / 1000), nx = st.x + (home.x - st.x) / d * step, ny = st.y + (home.y - st.y) / d * step;
        if (d > 6) { st.x = home.x; st.y = home.y; } else if (!isBlocked(this.ctx.walkMap(), nx, ny)) { st.x = nx; st.y = ny; }
        st.facing = home.x >= st.x ? 'east' : 'west';
      }
      if (now < s.nextAct) continue;
      const near = this.near(st, s.kind === 'phayon-colossus' ? 5 : 4).sort((a, b) => dist(a, st) - dist(b, st));
      const first = near[0];
      s.nextAct = now + (s.kind === 'shadow-clone' ? KERIS.cloneEveryMs : ACHAN.phayonEveryMs);
      if (!first) continue;
      st.acts++; st.facing = first.x >= st.x ? 'east' : 'west';
      if (s.kind === 'shadow-clone') this.hit(first, s.owner, this.phys(first, s.owner, KERIS.cloneAtk(combatStats(p).atk, s.level)), 'shadow-clone');
      else if (s.kind === 'hun-phayon') this.hit(first, s.owner, this.phys(first, s.owner, this.phayonAtk(s.owner, s.level)), 'summon-hun-phayon');
      else for (const m of this.near(first, ACHAN.cleaveRadius)) this.hit(m, s.owner, this.phys(m, s.owner, ACHAN.cleave(this.phayonAtk(s.owner, s.level), s.level)), 'giant-phayon-colossus');
    }
  }

  forget(id: string) {
    this.buffs.delete(id); this.jobs.delete(id);
    this.dots = this.dots.filter((d) => d.owner !== id);
    this.links = this.links.filter((l) => l.owner !== id);
    for (const [mid, pr] of [...this.prai.entries()]) if (pr.owner === id) this.prai.delete(mid);
    for (const [mid, n] of [...this.needles.entries()]) if (n.owner === id) this.needles.delete(mid);
    for (const z of [...this.zones.values()]) if (z.owner === id) this.removeZone(z.id);
    for (const s of [...this.summons.values()]) if (s.owner === id) this.removeSummon(s.id);
  }
}
