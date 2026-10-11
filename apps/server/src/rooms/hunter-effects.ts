import { ZoneState, type GameState } from '@shaman/schema';
import {
  combatStats, HUNT_CONDITIONS, HUNTER, isBlocked, MONSTERS, physicalDamage, provokeMonster, type MapDefinition, type MonsterMotion,
  type MonsterStatus, type PlayerProfile, type Position, type TrapRune,
} from '@shaman/shared';

// Ullr Hunter effects on the server (game integration slice 1, docs/design/combat/ULLR_HUNTER_COMBAT.md): typed
// handlers per skill family — arrows (projectile damage + prey mark), the falcon (strike, auto-dive, storm), rune trap
// zones, Ski Dash displacement and the Great Hunt buff. Numbers come from shared HUNTER (catalogue formulas; inputs
// provisional). Clients only see the results: damage/status events, zones and player statuses in the synced state.

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const FACING_VECTOR: Readonly<Record<string, Position>> = {
  east: { x: 1, y: 0 }, 'south-east': { x: Math.SQRT1_2, y: Math.SQRT1_2 }, south: { x: 0, y: 1 }, 'south-west': { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
  west: { x: -1, y: 0 }, 'north-west': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }, north: { x: 0, y: -1 }, 'north-east': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
};
/** Arrow flight before damage lands (matches the fast spirit arrow VFX, NORWAY_PROJECTILE_TRAVEL). */
const ARROW_MS = 160;
const FALCON_MS = 260;

/** What the hunter effects need from the combat system. */
export interface HunterContext {
  map: MapDefinition;
  state: GameState;
  monsters: Map<string, MonsterMotion>;
  now(): number;
  rng(): number;
  profile(id: string): PlayerProfile | undefined;
  schedule(delayMs: number, run: () => void): void;
  /** Applies damage (mark bonus already included), provokes and handles death; `skill` labels the number. */
  damage(m: MonsterMotion, amount: number, playerId: string, skill?: string): void;
  /** Secondary presentation event: the client plays `skillId`'s VFX from the caster to the target or point. */
  fx(event: { caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string }): void;
  reduceCooldown(playerId: string, skillId: string, ms: number): void;
  /** A status landed on a monster (for the event log / floating text). */
  status(m: MonsterMotion, status: MonsterStatus, ms: number, source: string): void;
}

interface Zone { id: string; kind: 'trap' | 'snow-trail' | 'falcon-storm'; owner: string; variant: string; x: number; y: number; radius: number; until: number; level: number; nextTick: number; targetId?: string }

export class HunterEffects {
  /** Player buffs by session: status id → expiry (ms) plus the next-arrow crit bonus (%). */
  private buffs = new Map<string, { until: Partial<Record<'great-hunt' | 'dash-crit', number>>; critBonus: number }>();
  private zones = new Map<string, Zone>();
  private zoneSeq = 0;

  constructor(private readonly ctx: HunterContext) {}

  private level(p: PlayerProfile, id: string) { return p.skills[id] ?? 0; }
  private buff(id: string) { let b = this.buffs.get(id); if (!b) { b = { until: {}, critBonus: 0 }; this.buffs.set(id, b); } return b; }
  private hasBuff(id: string, key: 'great-hunt' | 'dash-crit') { return (this.buffs.get(id)?.until[key] ?? 0) > this.ctx.now(); }
  private has(m: MonsterMotion, s: MonsterStatus) { return (m.statuses[s] ?? 0) > this.ctx.now(); }
  private alive(id: string | null | undefined) { const m = id ? this.ctx.monsters.get(id) : undefined; return m && m.state !== 'dead' ? m : undefined; }

  setStatus(m: MonsterMotion, s: MonsterStatus, ms: number, source: string) {
    m.statuses[s] = Math.max(m.statuses[s] ?? 0, this.ctx.now() + ms);
    this.ctx.status(m, s, ms, source);
  }

  /** Twin Shot's prey mark (also every hunter attack during Great Hunt). */
  private mark(m: MonsterMotion, playerId: string, p: PlayerProfile) {
    const lv = Math.max(1, this.level(p, 'twin-shot'));
    m.markedBy = { playerId, level: lv };
    this.setStatus(m, 'mark', HUNTER.markMs(this.level(p, 'trackers-eye')), playerId);
  }
  /** Hunt conditions on this prey for this hunter (Great Hunt: a marked prey counts all three). */
  conditions(m: MonsterMotion, playerId: string) {
    const marked = this.has(m, 'mark') && m.markedBy?.playerId === playerId;
    if (marked && this.hasBuff(playerId, 'great-hunt')) return 3;
    return HUNT_CONDITIONS.filter((c) => c === 'mark' ? marked : this.has(m, c)).length;
  }
  /** Physical arrow damage against the prey: defence, Twin Shot prey bonus, crit (Ski Dash bonus is used up). */
  private arrow(m: MonsterMotion, playerId: string, raw: number, consumeCrit = true) {
    const def = MONSTERS[m.kind]!;
    const stats = combatStats(this.ctx.profile(playerId)!);
    const b = this.buffs.get(playerId);
    const bonus = b && this.hasBuff(playerId, 'dash-crit') ? b.critBonus : 0;
    const crit = this.ctx.rng() < HUNTER.critChance(stats.luk, bonus);
    if (bonus && consumeCrit) { b!.until['dash-crit'] = 0; b!.critBonus = 0; }
    const marked = this.has(m, 'mark') && m.markedBy?.playerId === playerId ? 1 + HUNTER.markBonus(m.markedBy.level) : 1;
    return Math.max(1, Math.round(physicalDamage(raw, def.def, this.ctx.rng()) * marked * (crit ? HUNTER.critMultiplier : 1)));
  }
  private falconDamage(p: PlayerProfile, lv: number) { const s = combatStats(p); return HUNTER.falcon(s.dex, s.int, lv); }

  /** The falcon dives at a prey: Falcon Strike's damage; on a marked prey it reveals (8 s) and blinds (1 s). */
  private falconDive(playerId: string, m: MonsterMotion, skillId: string) {
    const p = this.ctx.profile(playerId);
    if (!p) return;
    const amount = Math.round(this.falconDamage(p, this.level(p, 'falcon-strike')) * (0.9 + 0.2 * this.ctx.rng()));
    this.ctx.schedule(FALCON_MS, () => {
      if (m.state === 'dead') return;
      if (this.has(m, 'mark') && m.markedBy?.playerId === playerId) {
        this.setStatus(m, 'revealed', HUNTER.revealMs, playerId);
        this.setStatus(m, 'blind', HUNTER.falconBlindMs, playerId);
      }
      this.ctx.damage(m, Math.max(1, amount), playerId, skillId);
    });
  }

  /** A Hunter's basic bow shot landed: Great Hunt marks; Falcon Bond may send the falcon. */
  onBasicHit(playerId: string, m: MonsterMotion) {
    const p = this.ctx.profile(playerId);
    if (!p || p.branch !== 'ullr-hunter') return;
    const gh = this.hasBuff(playerId, 'great-hunt');
    if (gh) this.mark(m, playerId, p);
    if (this.level(p, 'falcon-bond') <= 0 || m.state === 'dead') return;
    const marked = this.has(m, 'mark') && m.markedBy?.playerId === playerId;
    if (this.ctx.rng() < HUNTER.falconBondChance(combatStats(p).luk, marked, gh)) {
      this.ctx.fx({ caster: playerId, skillId: 'falcon-bond', targetId: m.id });
      this.falconDive(playerId, m, 'falcon-bond');
    }
  }
  /** Basic bow damage with the prey bonus and crit rules. */
  basicDamage(playerId: string, m: MonsterMotion, atk: number) { return this.arrow(m, playerId, atk, false); }

  /** A Hunter skill released (server timing). Returns false when the skill is not a Hunter skill. */
  release(playerId: string, skillId: string, targetId: string | null, aim: Position, variant?: string): boolean {
    const p = this.ctx.profile(playerId);
    const player = this.ctx.state.players.get(playerId);
    if (!p || !player) return false;
    const lv = Math.max(1, this.level(p, skillId));
    const stats = combatStats(p);
    const target = this.alive(targetId);
    switch (skillId) {
      case 'twin-shot': {
        if (!target) return true;
        for (let i = 0; i < 2; i++) this.ctx.schedule(ARROW_MS + i * 120, () => {
          if (target.state === 'dead') return;
          if (i === 0) this.mark(target, playerId, p);
          this.ctx.damage(target, this.arrow(target, playerId, HUNTER.twinShot(stats.atk, lv)), playerId, skillId);
        });
        return true;
      }
      case 'falcon-strike': if (target) this.falconDive(playerId, target, skillId); return true;
      case 'charged-rune-arrow': {
        if (!target) return true;
        const conditions = this.conditions(target, playerId);
        const raw = HUNTER.charged(stats.atk, lv, conditions, this.level(p, 'rune-arrow-mastery'));
        const behind = this.level(p, 'rune-arrow-mastery') > 0 ? this.pierced(player, target) : undefined;
        this.ctx.schedule(ARROW_MS, () => {
          if (target.state !== 'dead') this.ctx.damage(target, this.arrow(target, playerId, raw), playerId, skillId);
          if (behind && behind.state !== 'dead') this.ctx.damage(behind, this.arrow(behind, playerId, raw, false), playerId, skillId);
        });
        return true;
      }
      case 'ski-dash': {
        const v = FACING_VECTOR[player.facing] ?? FACING_VECTOR.south!;
        const from = { x: player.x, y: player.y };
        let to = from;
        for (let d = 0.25; d <= HUNTER.dashUnits; d += 0.25) {
          const next = { x: from.x - v.x * d, y: from.y - v.y * d };
          if (isBlocked(this.ctx.map, next.x, next.y) || next.x < 1 || next.y < 1 || next.x > this.ctx.map.width - 1 || next.y > this.ctx.map.height - 1) break;
          to = next;
        }
        player.x = to.x; player.y = to.y; player.moving = false;
        this.addZone({ kind: 'snow-trail', owner: playerId, variant: '', x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, radius: Math.max(HUNTER.snowSlow.radius, dist(from, to) / 2), until: this.ctx.now() + HUNTER.snowSlow.lingerMs, level: lv, nextTick: 0 });
        const b = this.buff(playerId);
        b.until['dash-crit'] = this.ctx.now() + 10000; b.critBonus = HUNTER.dashCrit(lv);
        return true;
      }
      case 'rune-trap-kit': {
        const rune = (variant ?? 'snare') as TrapRune;
        const mine = [...this.zones.values()].filter((z) => z.kind === 'trap' && z.owner === playerId).sort((a, b) => a.until - b.until);
        // Over the limit: the oldest trap breaks (RO-like), so placing never silently fails.
        while (mine.length >= HUNTER.trapLimit(this.level(p, 'trappers-craft'))) this.removeZone(mine.shift()!.id);
        if (isBlocked(this.ctx.map, aim.x, aim.y)) return true;
        this.addZone({ kind: 'trap', owner: playerId, variant: rune, x: aim.x, y: aim.y, radius: HUNTER.trapRadius, until: this.ctx.now() + HUNTER.trapMs, level: lv, nextTick: this.ctx.now() + 500 });
        return true;
      }
      case 'ullrs-volley': {
        const marked = [...this.ctx.monsters.values()].filter((m) => m.state !== 'dead' && dist(m, player) <= HUNTER.volleyRadius && this.has(m, 'mark') && m.markedBy?.playerId === playerId);
        const prey = marked.length ? marked : target ? [target] : [];
        if (!prey.length) return true;
        const arrows = HUNTER.volleyArrows(lv);
        for (let i = 0; i < arrows; i++) {
          const m = prey[i % prey.length]!;
          if (i < prey.length) this.ctx.fx({ caster: playerId, skillId, targetId: m.id });
          this.ctx.schedule(ARROW_MS + 220 + i * 60, () => { if (m.state !== 'dead') this.ctx.damage(m, this.arrow(m, playerId, HUNTER.volley(stats.atk, lv), false), playerId, skillId); });
        }
        return true;
      }
      case 'great-hunt': this.buff(playerId).until['great-hunt'] = this.ctx.now() + HUNTER.greatHuntMs; return true;
      case 'falcon-storm': {
        const centre = target ?? undefined;
        this.addZone({ kind: 'falcon-storm', owner: playerId, variant: '', x: centre?.x ?? aim.x, y: centre?.y ?? aim.y, radius: HUNTER.stormRadius, until: this.ctx.now() + HUNTER.stormMs, level: lv, nextTick: this.ctx.now() + 300, ...(centre ? { targetId: centre.id } : {}) });
        return true;
      }
    }
    return false;
  }

  /** The next living monster within a unit of the arrow's line, up to `pierceUnits` past the target. */
  private pierced(from: Position, target: MonsterMotion) {
    const d = dist(from, target) || 1, ux = (target.x - from.x) / d, uy = (target.y - from.y) / d;
    let best: MonsterMotion | undefined, bestT = Infinity;
    for (const m of this.ctx.monsters.values()) {
      if (m === target || m.state === 'dead') continue;
      const t = (m.x - target.x) * ux + (m.y - target.y) * uy;
      const off = Math.abs((m.x - target.x) * uy - (m.y - target.y) * ux);
      if (t > 0 && t <= HUNTER.pierceUnits && off <= 1 && t < bestT) { best = m; bestT = t; }
    }
    return best;
  }

  private addZone(z: Omit<Zone, 'id'>) {
    const id = `zone-${++this.zoneSeq}`;
    this.zones.set(id, { ...z, id });
    const s = new ZoneState();
    s.kind = z.kind; s.variant = z.variant; s.owner = z.owner; s.x = z.x; s.y = z.y; s.radius = z.radius;
    this.ctx.state.zones.set(id, s);
  }
  private removeZone(id: string) { this.zones.delete(id); this.ctx.state.zones.delete(id); }

  /** A trap fires on `m`: its rune's effect, the trapped hunt condition and Hunter's Patience. */
  private trigger(z: Zone, m: MonsterMotion) {
    const p = this.ctx.profile(z.owner);
    if (!p) { this.removeZone(z.id); return; }
    const power = HUNTER.trapPower(this.level(p, 'trappers-craft'));
    const stats = combatStats(p);
    this.ctx.fx({ caster: z.owner, skillId: 'rune-trap-kit', x: z.x, y: z.y, variant: z.variant });
    const victims = [...this.ctx.monsters.values()].filter((v) => v.state !== 'dead' && dist(v, z) <= z.radius);
    for (const v of victims) {
      this.setStatus(v, 'trapped', HUNTER.trappedMs, z.owner);
      if (z.variant === 'snare') this.setStatus(v, 'root', HUNTER.snareMs(z.level) * power, z.owner);
      else if (z.variant === 'freeze') this.setStatus(v, 'freeze', HUNTER.freezeMs(z.level) * power, z.owner);
      else if (z.variant === 'flash') this.setStatus(v, 'blind', HUNTER.flashBlindMs * power, z.owner);
      else if (z.variant === 'blast') {
        this.ctx.damage(v, Math.round(physicalDamage(HUNTER.blast(stats.dex, z.level) * power, MONSTERS[v.kind]!.def, this.ctx.rng())), z.owner, 'rune-trap-kit');
        if (v.state === 'dead') continue;
        this.setStatus(v, 'bleed', HUNTER.bleed.ms, z.owner);
        const per = Math.round(HUNTER.bleed.perTick(stats.dex, z.level) * power);
        for (let t = HUNTER.bleed.tickMs; t <= HUNTER.bleed.ms; t += HUNTER.bleed.tickMs) this.ctx.schedule(t, () => { if (v.state !== 'dead' && this.has(v, 'bleed')) this.ctx.damage(v, per, z.owner, 'bleed'); });
      }
      provokeMonster(v, z.owner);
    }
    const patience = this.level(p, 'hunters-patience');
    if (patience > 0) this.ctx.reduceCooldown(z.owner, 'charged-rune-arrow', HUNTER.patienceMs(patience));
    this.removeZone(z.id);
  }

  step(now: number) {
    for (const z of [...this.zones.values()]) {
      if (now >= z.until || !this.ctx.state.players.has(z.owner)) { this.removeZone(z.id); continue; }
      if (z.kind === 'trap') {
        if (now < z.nextTick) continue;
        const hit = [...this.ctx.monsters.values()].find((m) => m.state !== 'dead' && dist(m, z) <= HUNTER.trapTrigger);
        if (hit) this.trigger(z, hit);
      } else if (z.kind === 'snow-trail') {
        for (const m of this.ctx.monsters.values()) {
          if (m.state === 'dead' || dist(m, z) > z.radius) continue;
          m.slowFactor = Math.min(m.slowUntil > now ? m.slowFactor : 1, HUNTER.snowSlow.factor); m.slowUntil = Math.max(m.slowUntil, now + HUNTER.snowSlow.ms);
          m.statuses.slow = m.slowUntil;
        }
      } else if (z.kind === 'falcon-storm' && now >= z.nextTick) {
        z.nextTick = now + HUNTER.stormTickMs;
        const follow = this.alive(z.targetId);
        if (follow) { z.x = follow.x; z.y = follow.y; const s = this.ctx.state.zones.get(z.id); if (s) { s.x = z.x; s.y = z.y; } }
        const p = this.ctx.profile(z.owner);
        if (!p) continue;
        const raw = HUNTER.storm(this.falconDamage(p, this.level(p, 'falcon-strike')), z.level);
        for (const m of [...this.ctx.monsters.values()]) {
          if (m.state === 'dead' || dist(m, z) > z.radius) continue;
          this.setStatus(m, 'blind', HUNTER.stormBlindMs, z.owner);
          this.ctx.damage(m, Math.max(1, Math.round(raw * (0.9 + 0.2 * this.ctx.rng()))), z.owner, 'falcon-storm');
        }
      }
    }
    // Player buff ids synced for everyone (aura / icons).
    for (const [id, b] of this.buffs) {
      const player = this.ctx.state.players.get(id);
      if (!player) { this.buffs.delete(id); continue; }
      const list = (Object.keys(b.until) as ('great-hunt' | 'dash-crit')[]).filter((k) => (b.until[k] ?? 0) > now).join(',');
      if (player.statuses !== list) player.statuses = list;
    }
  }

  forget(playerId: string) {
    this.buffs.delete(playerId);
    for (const z of [...this.zones.values()]) if (z.owner === playerId) this.removeZone(z.id);
  }
}
