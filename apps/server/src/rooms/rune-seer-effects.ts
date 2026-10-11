import { ZoneState, type GameState } from '@shaman/schema';
import {
  combatSpec, combatStats, drawRune, iceWallCells, isBlocked, magicDamage, MONSTERS, provokeMonster, RUNE_SEER, RUNE_SPELLS,
  withBlockers, type MapDefinition, type MonsterMotion, type MonsterStatus, type NorseRune, type PlayerProfile, type Position,
} from '@shaman/shared';

// Rune Seer effects on the server (game integration slice 2, docs/design/combat/RUNE_SEER_COMBAT.md): the Rune Cast
// queue (every rune spell consumes the front rune for its effect), Runestone echoes, Cast the Lots reordering, Frost
// Bolt, Blizzard, the blocking breakable Ice Wall, Shatter Rune, Absolute Zero Field, Fimbulwinter, the hearth shield
// and the passives. Numbers come from shared RUNE_SEER (catalogue formulas; open inputs provisional).

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const BOLT_MS = 200;

export interface RuneSeerContext {
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
  /** The walkable map changed (an Ice Wall rose or fell). */
  walls(map: MapDefinition): void;
}

interface Seer { queue: NorseRune[]; lotsUntil: number; lotsLeft: number; lotsLv: number; lastSet: number; fimbulUntil: number; shield: number; shieldUntil: number }
interface Zone { id: string; kind: 'blizzard' | 'fimbulwinter' | 'runestone'; owner: string; x: number; y: number; radius: number; until: number; level: number; nextTick: number }
interface Wall { id: string; owner: string; cells: Position[]; segs: string[]; hp: number; hpMax: number; until: number; lastHit: Map<string, number> }

export class RuneSeerEffects {
  private seers = new Map<string, Seer>();
  private zones = new Map<string, Zone>();
  private walls = new Map<string, Wall>();
  private seq = 0;

  constructor(private readonly ctx: RuneSeerContext) {}

  private lv(p: PlayerProfile, id: string) { return p.skills[id] ?? 0; }
  private has(m: MonsterMotion, s: MonsterStatus) { return (m.statuses[s] ?? 0) > this.ctx.now(); }
  private alive(id: string | null | undefined) { const m = id ? this.ctx.monsters.get(id) : undefined; return m && m.state !== 'dead' ? m : undefined; }

  /** The seer's queue state (created with a fresh draw on first use). */
  seer(id: string): Seer {
    let s = this.seers.get(id);
    if (!s) {
      s = { queue: [], lotsUntil: 0, lotsLeft: 0, lotsLv: 0, lastSet: -Infinity, fimbulUntil: 0, shield: 0, shieldUntil: 0 };
      while (s.queue.length < RUNE_SEER.queueLength) s.queue.push(drawRune(() => this.ctx.rng()));
      this.seers.set(id, s);
    }
    return s;
  }
  private take(s: Seer): NorseRune {
    const rune = s.queue.shift()!;
    s.queue.push(drawRune(() => this.ctx.rng(), s.fimbulUntil > this.ctx.now()));
    return rune;
  }
  setStatus(m: MonsterMotion, s: MonsterStatus, ms: number, source: string) {
    m.statuses[s] = Math.max(m.statuses[s] ?? 0, this.ctx.now() + ms);
    this.ctx.status(m, s, ms, source);
  }

  /** Cast the Lots window: put the three front runes in the given order (a permutation of 0..2). */
  order(playerId: string, order: unknown): boolean {
    const s = this.seers.get(playerId);
    if (!s || s.lotsUntil <= this.ctx.now() || !Array.isArray(order) || order.length !== 3) return false;
    const idx = order.map(Number);
    if ([...idx].sort().join() !== '0,1,2') return false;
    s.queue.splice(0, 3, ...idx.map((i) => s.queue[i]!));
    return true;
  }
  /** Rune Mastery: change the front rune once every 10 s. */
  setFront(playerId: string, rune: unknown): boolean {
    const p = this.ctx.profile(playerId), s = this.seers.get(playerId);
    if (!p || !s || this.lv(p, 'rune-mastery') <= 0 || this.ctx.now() - s.lastSet < RUNE_SEER.runeSetMs) return false;
    if (!['ice', 'storm', 'fate', 'hearth'].includes(rune as string)) return false;
    s.queue[0] = rune as NorseRune; s.lastSet = this.ctx.now();
    return true;
  }

  /** Damage a hit on the seer: the hearth shield absorbs first. Returns what is left. */
  absorb(playerId: string, amount: number): number {
    const s = this.seers.get(playerId);
    if (!s || s.shield <= 0 || s.shieldUntil <= this.ctx.now()) return amount;
    const used = Math.min(s.shield, amount);
    s.shield -= used;
    return amount - used;
  }

  /** Magic damage of a seer spell against a monster (Frost Mastery, Frost Penetration, frozen MDEF, Lots bonus, crit). */
  private magic(m: MonsterMotion, p: PlayerProfile, raw: number, opts: { crit?: boolean; ignoreMdef?: boolean; lots?: number }) {
    const def = MONSTERS[m.kind]!;
    const frozen = this.has(m, 'freeze');
    const mdef = opts.ignoreMdef ? 0 : def.mdef * (1 - RUNE_SEER.frostPenetration(this.lv(p, 'frost-penetration'))) * (frozen ? RUNE_SEER.frozenMdef(this.lv(p, 'winters-grasp')) : 1);
    const scaled = raw * RUNE_SEER.frostMastery(this.lv(p, 'frost-mastery')) * (1 + (opts.lots ?? 0)) * (opts.crit ? RUNE_SEER.fateCritMultiplier : 1);
    return magicDamage(scaled, mdef, this.ctx.rng());
  }
  private freeze(m: MonsterMotion, p: PlayerProfile, chance: number, source: string) {
    if (m.state !== 'dead' && this.ctx.rng() < chance) this.setStatus(m, 'freeze', RUNE_SEER.freezeMs(this.lv(p, 'winters-grasp')), source);
  }
  private knockback(m: MonsterMotion, from: Position, units: number) {
    const d = dist(m, from) || 1, ux = (m.x - from.x) / d, uy = (m.y - from.y) / d;
    for (let s = 0.25; s <= units; s += 0.25) {
      const next = { x: m.x + ux * 0.25, y: m.y + uy * 0.25 };
      if (isBlocked(this.wallMap(), next.x, next.y)) break;
      m.x = next.x; m.y = next.y;
    }
  }

  /** The rune effect a spell gets (twice next to the seer's Runestone). */
  private runeEffect(playerId: string, p: PlayerProfile, rune: NorseRune, times: number, skillId: string) {
    const out = { freezeMul: 1, knockback: 0, area: 0, crit: false };
    if (rune === 'ice') out.freezeMul = 2 ** times;
    if (rune === 'storm') { out.knockback = RUNE_SEER.stormKnockback * times; out.area = RUNE_SEER.stormArea * times; }
    if (rune === 'fate') {
      out.crit = true;
      const refund = Math.round((combatSpec(skillId)?.sp ?? 0) * RUNE_SEER.fateRefund * times);
      if (refund > 0) { const q = structuredClone(p); q.sp = Math.min(q.spMax, q.sp + refund); this.ctx.setProfile(playerId, q); }
    }
    if (rune === 'hearth') {
      const s = this.seer(playerId);
      s.shield = Math.round(p.hpMax * RUNE_SEER.hearthShield * times); s.shieldUntil = this.ctx.now() + RUNE_SEER.shieldMs;
    }
    return out;
  }
  /** Consumes the front rune for a rune spell; returns its effect and the Lots bonus. */
  private castRune(playerId: string, p: PlayerProfile, skillId: string, at: Position) {
    const s = this.seer(playerId);
    const rune = this.take(s);
    const player = this.ctx.state.players.get(playerId);
    const echo = [...this.zones.values()].some((z) => z.kind === 'runestone' && z.owner === playerId && (dist(z, at) <= z.radius || (player && dist(z, player) <= z.radius)));
    this.ctx.fx({ caster: playerId, skillId: 'rune-cast', x: at.x, y: at.y, variant: rune });
    const lots = s.lotsLeft > 0 ? (s.lotsLeft--, RUNE_SEER.lotsBonus(s.lotsLv)) : 0;
    return { rune, lots, ...this.runeEffect(playerId, p, rune, echo ? 2 : 1, skillId) };
  }

  /** A Rune Seer skill released. Returns false when it is not one. */
  release(playerId: string, skillId: string, targetId: string | null, aim: Position): boolean {
    const p = this.ctx.profile(playerId), player = this.ctx.state.players.get(playerId);
    if (!p || !player) return false;
    const lv = Math.max(1, this.lv(p, skillId));
    const matk = combatStats(p).matk;
    const target = this.alive(targetId);
    const now = this.ctx.now();
    switch (skillId) {
      case 'frost-bolt': {
        if (!target) return true;
        const r = this.castRune(playerId, p, skillId, target);
        this.ctx.schedule(BOLT_MS, () => {
          if (target.state === 'dead') return;
          this.ctx.damage(target, this.magic(target, p, RUNE_SEER.frostBolt(matk, lv), { crit: r.crit, lots: r.lots }), playerId, skillId);
          if ((target.state as string) === 'dead') return;
          this.freeze(target, p, RUNE_SEER.freezeChance(lv) * r.freezeMul, playerId);
          if (r.knockback) this.knockback(target, player, r.knockback);
        });
        return true;
      }
      case 'blizzard-storm': {
        const r = this.castRune(playerId, p, skillId, aim);
        const radius = RUNE_SEER.blizzardCells / 2 + r.area;
        this.addZone({ kind: 'blizzard', owner: playerId, x: aim.x, y: aim.y, radius, until: now + RUNE_SEER.blizzardMs, level: lv, nextTick: now + 300 }, { crit: r.crit, lots: r.lots, freeze: r.rune === 'ice' ? RUNE_SEER.freezeChance(0) * r.freezeMul : 0 });
        return true;
      }
      case 'shatter-rune': {
        if (!target) return true;
        const s = this.seer(playerId);
        const visible = RUNE_SEER.visibleRunes(this.lv(p, 'rune-reading'));
        const runes = Array.from({ length: visible }, () => this.take(s));
        const effects = runes.map((rune) => this.runeEffect(playerId, p, rune, 1, skillId));
        for (const rune of runes) this.ctx.fx({ caster: playerId, skillId: 'rune-cast', targetId: target.id, variant: rune });
        const crit = effects.some((e) => e.crit), ignoreMdef = this.has(target, 'freeze');
        this.ctx.schedule(250, () => {
          if (target.state === 'dead') return;
          this.ctx.damage(target, this.magic(target, p, RUNE_SEER.shatter(matk, lv, runes.length), { crit, ignoreMdef }), playerId, skillId);
          if ((target.state as string) === 'dead') return;
          const freezeMul = effects.reduce((n, e) => n * e.freezeMul, 1);
          if (freezeMul > 1) this.freeze(target, p, RUNE_SEER.freezeChance(0) * freezeMul, playerId);
          const kb = effects.reduce((n, e) => n + e.knockback, 0);
          if (kb) this.knockback(target, player, kb);
        });
        return true;
      }
      case 'absolute-zero-field': if (target) this.setStatus(target, 'freeze', RUNE_SEER.absoluteZeroMs(lv), playerId); return true;
      case 'fimbulwinter': {
        this.seer(playerId).fimbulUntil = now + RUNE_SEER.fimbulMs;
        this.addZone({ kind: 'fimbulwinter', owner: playerId, x: player.x, y: player.y, radius: RUNE_SEER.fimbulCells / 2, until: now + RUNE_SEER.fimbulMs, level: lv, nextTick: now + 500 });
        return true;
      }
      case 'prophecy': {
        const s = this.seer(playerId);
        s.queue = s.queue.map(() => drawRune(() => this.ctx.rng(), s.fimbulUntil > now));
        s.lotsUntil = now + RUNE_SEER.lotsMs; s.lotsLeft = RUNE_SEER.lotsSpells; s.lotsLv = lv;
        return true;
      }
      case 'rune-trap': {
        const mine = [...this.zones.values()].filter((z) => z.kind === 'runestone' && z.owner === playerId).sort((a, b) => a.until - b.until);
        while (mine.length >= RUNE_SEER.stoneLimit) this.removeZone(mine.shift()!.id);
        if (!isBlocked(this.wallMap(), aim.x, aim.y)) this.addZone({ kind: 'runestone', owner: playerId, x: aim.x, y: aim.y, radius: RUNE_SEER.stoneRadius, until: now + RUNE_SEER.stoneMs, level: lv, nextTick: 0 });
        return true;
      }
      case 'ice-wall': {
        const spec = RUNE_SEER.wall(lv);
        const units = [...this.ctx.monsters.values()].filter((m) => m.state !== 'dead').map((m) => ({ x: m.x, y: m.y }))
          .concat([...this.ctx.state.players.values()].map((q) => ({ x: q.x, y: q.y })));
        // Cells on blocked ground or on a creature are skipped (nobody is trapped inside the ice).
        const cells = iceWallCells(player, aim, lv).filter((c) => !isBlocked(this.ctx.map, c.x, c.y) && !units.some((u) => Math.abs(u.x - c.x) < 0.75 && Math.abs(u.y - c.y) < 0.75));
        if (!cells.length) return true;
        const id = `wall-${++this.seq}`;
        const wall: Wall = { id, owner: playerId, cells, segs: [], hp: spec.hp, hpMax: spec.hp, until: now + spec.durationMs, lastHit: new Map() };
        cells.forEach((c, i) => {
          const segId = `${id}-${i}`;
          const z = new ZoneState(); z.kind = 'ice-wall'; z.variant = String(spec.heightScale); z.owner = playerId; z.x = c.x; z.y = c.y; z.radius = 0.5; z.hp = wall.hp; z.hpMax = wall.hpMax;
          this.ctx.state.zones.set(segId, z); wall.segs.push(segId);
        });
        this.walls.set(id, wall);
        this.ctx.walls(this.wallMap());
        return true;
      }
    }
    return false;
  }

  /** The map with every standing Ice Wall cell blocked. */
  wallMap(): MapDefinition { return withBlockers(this.ctx.map, [...this.walls.values()].flatMap((w) => w.cells)); }

  private zoneOpts = new Map<string, { crit: boolean; lots: number; freeze: number }>();
  private addZone(z: Omit<Zone, 'id'>, opts?: { crit: boolean; lots: number; freeze: number }) {
    const id = `rzone-${++this.seq}`;
    this.zones.set(id, { ...z, id });
    if (opts) this.zoneOpts.set(id, opts);
    const s = new ZoneState(); s.kind = z.kind; s.owner = z.owner; s.x = z.x; s.y = z.y; s.radius = z.radius;
    this.ctx.state.zones.set(id, s);
  }
  private removeZone(id: string) { this.zones.delete(id); this.zoneOpts.delete(id); this.ctx.state.zones.delete(id); }
  private removeWall(w: Wall) {
    this.walls.delete(w.id);
    for (const s of w.segs) this.ctx.state.zones.delete(s);
    this.ctx.walls(this.wallMap());
  }

  step(now: number) {
    for (const z of [...this.zones.values()]) {
      if (now >= z.until || !this.ctx.state.players.has(z.owner)) { this.removeZone(z.id); continue; }
      if (z.kind === 'runestone' || now < z.nextTick) continue;
      const p = this.ctx.profile(z.owner);
      if (!p) continue;
      const matk = combatStats(p).matk, opts = this.zoneOpts.get(z.id);
      if (z.kind === 'fimbulwinter') {
        // Follows the caster: the whole screen around them.
        const owner = this.ctx.state.players.get(z.owner);
        if (owner) { z.x = owner.x; z.y = owner.y; const s = this.ctx.state.zones.get(z.id); if (s) { s.x = z.x; s.y = z.y; } }
      }
      z.nextTick = now + (z.kind === 'blizzard' ? RUNE_SEER.blizzardTickMs : RUNE_SEER.fimbulTickMs);
      const raw = z.kind === 'blizzard' ? RUNE_SEER.blizzard(matk, z.level) : RUNE_SEER.fimbulwinter(matk, z.level);
      const slow = z.kind === 'blizzard' ? RUNE_SEER.blizzardSlow(z.level) : RUNE_SEER.fimbulSlow;
      for (const m of [...this.ctx.monsters.values()]) {
        if (m.state === 'dead' || dist(m, z) > z.radius) continue;
        m.slowFactor = Math.min(m.slowUntil > now ? m.slowFactor : 1, slow); m.slowUntil = Math.max(m.slowUntil, now + 1000); m.statuses.slow = m.slowUntil;
        this.ctx.damage(m, this.magic(m, p, raw, { crit: opts?.crit, lots: opts?.lots }), z.owner, z.kind === 'blizzard' ? 'blizzard-storm' : 'fimbulwinter');
        if (opts?.freeze) this.freeze(m, p, opts.freeze, z.owner);
        provokeMonster(m, z.owner);
      }
    }
    // Ice Walls: melt after their time, crack when monsters pressed against them hit them.
    for (const w of [...this.walls.values()]) {
      if (now >= w.until || !this.ctx.state.players.has(w.owner)) { this.removeWall(w); continue; }
      for (const m of this.ctx.monsters.values()) {
        if (m.state !== 'chase' && m.state !== 'attack') continue;
        if (!w.cells.some((c) => dist(c, m) <= 1.1)) continue;
        const def = MONSTERS[m.kind]!;
        if (now - (w.lastHit.get(m.id) ?? 0) < def.attackDelayMs) continue;
        w.lastHit.set(m.id, now); w.hp -= def.atk;
      }
      if (w.hp <= 0) { this.removeWall(w); continue; }
      for (const s of w.segs) { const z = this.ctx.state.zones.get(s); if (z && z.hp !== w.hp) z.hp = w.hp; }
    }
    // Chilling Aura: monsters near a seer attack slower. Rune queues and shields are synced for everyone.
    for (const m of this.ctx.monsters.values()) m.attackDelayMul = 1;
    for (const [id, player] of this.ctx.state.players) {
      const p = this.ctx.profile(id);
      if (!p || p.branch !== 'rune-seer') { if (player.runes) player.runes = ''; continue; }
      const s = this.seer(id);
      const aura = this.lv(p, 'chilling-aura');
      if (aura > 0) for (const m of this.ctx.monsters.values()) if (m.state !== 'dead' && dist(m, player) <= RUNE_SEER.chillingAura.radius) m.attackDelayMul = Math.max(m.attackDelayMul ?? 1, RUNE_SEER.chillingAura.aspd(aura));
      const runes = s.queue.slice(0, RUNE_SEER.visibleRunes(this.lv(p, 'rune-reading'))).join(',');
      if (player.runes !== runes) player.runes = runes;
      const list = [s.shield > 0 && s.shieldUntil > now ? 'hearth-shield' : '', s.lotsUntil > now ? 'cast-the-lots' : '', s.fimbulUntil > now ? 'fimbulwinter' : ''].filter(Boolean);
      // Merge with statuses other systems set (Hunter buffs are never on a seer, so the seer owns the field).
      const joined = list.join(',');
      if (player.statuses !== joined) player.statuses = joined;
    }
  }

  forget(playerId: string) {
    this.seers.delete(playerId);
    for (const z of [...this.zones.values()]) if (z.owner === playerId) this.removeZone(z.id);
    for (const w of [...this.walls.values()]) if (w.owner === playerId) this.removeWall(w);
  }
}
