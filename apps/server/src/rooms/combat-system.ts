import { MonsterState, type GameState } from '@shaman/schema';
import {
  addLoot, atkFor, basicAttackFor, combatSpec, combatStats, isBlocked, BASIC_ATTACK, bindingSlow, HUNTER, NATION_SKILL_COMBAT, skillRange, createMonster, gainExp, gainJobExp, JOB_PROGRESSION, ITEMS, magicDamage, matkFor, MONSTERS, physicalDamage,
  pickSpawnPoint, PLAYER_RESPAWN_MS, pointInRect, provokeMonster, questEvent, REGEN, REGEN_TICK_MS, SKILL_COMBAT, skillDamage,
  soulHealAmount, stepMonster, type MapDefinition, type MonsterStatus, type MonsterMotion, type PlayerProfile, type Position, type SpawnRegion,
} from '@shaman/shared';
import { HunterEffects } from './hunter-effects.js';

// Authoritative combat for one map room: monster spawning and AI, player basic attacks, skill effects on release,
// damage, death, EXP/level-ups, loot, regeneration and player respawn. Numbers come from packages/shared/src/combat.ts
// (provisional). Clients only send intents ('attack', 'skill' with a target) and draw the 'combat' events.

export type CombatEvent =
  | { type: 'swing'; attacker: { kind: 'player' | 'monster'; id: string }; target: { kind: 'player' | 'monster'; id: string } }
  | { type: 'damage'; target: { kind: 'player' | 'monster'; id: string }; amount: number; source: string; skill?: string }
  | { type: 'heal'; target: { kind: 'player'; id: string }; amount: number }
  | { type: 'death'; target: { kind: 'player' | 'monster'; id: string }; killer?: string }
  | { type: 'levelup'; player: string; level: number }
  | { type: 'loot'; player: string; items: { itemId: string; qty: number }[] }
  /** A ranged monster's shot: flies from the monster to the player in `flightMs`; damage follows on arrival. */
  | { type: 'projectile'; from: string; to: string; kind: string; flightMs: number }
  /** A boss area attack warning on the ground (world units), landing after `ms`. */
  | { type: 'telegraph'; source: string; x: number; y: number; radius: number; ms: number }
  | { type: 'summon'; source: string; ids: string[] }
  /** A Hunter's bow shot (basic attack): flies from the player to the monster in `flightMs`. */
  | { type: 'arrow'; from: string; to: string; flightMs: number }
  /** A status landed on a monster (floating label / icon). */
  | { type: 'status'; target: string; status: MonsterStatus; ms: number; source: string }
  /** Secondary skill presentation (falcon auto-dive, volley arrows, trap bursts) played with the skill's VFX. */
  | { type: 'skillfx'; caster: string; skillId: string; targetId?: string; x?: number; y?: number; variant?: string };

export interface CombatHost {
  map: MapDefinition;
  state: GameState;
  now(): number;
  rng(): number;
  profile(id: string): PlayerProfile | undefined;
  setProfile(id: string, profile: PlayerProfile, note?: string): void;
  /** HP/SP/level/EXP changed: send the small vitals message (cheaper than a full profile). */
  vitals(id: string): void;
  broadcast(event: CombatEvent): void;
  /** Hunter's Patience: shortens a skill's remaining cooldown. */
  reduceCooldown(playerId: string, skillId: string, ms: number): void;
}

export type AttackError = 'no-target' | 'too-far' | 'dead';

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
/** Impact delay after a skill releases, so damage numbers match the effect (projectile flight, burst peak). */
const SKILL_IMPACT_MS: Record<string, number> = { 'spirit-bolt': 420, 'amulet-blast': 220, 'binding-thread': 300 };

export class CombatSystem {
  readonly monsters = new Map<string, MonsterMotion>();
  private respawns: { regionId: string; kind: string; id: string; at: number }[] = [];
  private attacks = new Map<string, { monsterId: string; nextAt: number }>();
  private lastCombat = new Map<string, number>();
  private downUntil = new Map<string, number>();
  private lastHitBy = new Map<string, string>();
  private pending: { at: number; run: () => void }[] = [];
  private summonSeq = 0;
  private nextRegen = 0;
  /** Ullr Hunter skill families (arrows, falcon, traps, dash, Great Hunt). */
  readonly hunter: HunterEffects;

  constructor(private readonly host: CombatHost) {
    this.hunter = new HunterEffects({
      map: host.map, state: host.state, monsters: this.monsters, now: () => host.now(), rng: () => host.rng(), profile: (id) => host.profile(id),
      schedule: (delay, run) => this.pending.push({ at: host.now() + delay, run }),
      damage: (m, amount, playerId, skill) => { if (m.state !== 'dead') this.damageMonster(m, amount, playerId, skill); },
      fx: (e) => host.broadcast({ type: 'skillfx', ...e }),
      reduceCooldown: (id, skillId, ms) => host.reduceCooldown(id, skillId, ms),
      status: (m, status, ms, source) => { host.broadcast({ type: 'status', target: m.id, status, ms, source }); this.sync(m); },
    });
    const now = host.now();
    for (const region of host.map.spawnRegions ?? []) {
      for (const group of region.monsters) for (let i = 0; i < group.count; i++) this.spawn(region, group.kind, `${region.id}-${group.kind}-${i}`, now);
    }
  }

  private region(id: string): SpawnRegion | undefined { return this.host.map.spawnRegions?.find((r) => r.id === id); }

  private spawn(region: SpawnRegion, kind: string, id: string, now: number) {
    const def = MONSTERS[kind];
    const at = def && pickSpawnPoint(this.host.map, region, () => this.host.rng());
    if (!def || !at) { this.respawns.push({ regionId: region.id, kind, id, at: now + 2000 }); return; }
    const m = createMonster(id, kind, region, at, now);
    this.monsters.set(id, m);
    let s = this.host.state.monsters.get(id);
    if (!s) { s = new MonsterState(); s.kind = kind; this.host.state.monsters.set(id, s); }
    this.sync(m);
  }

  private sync(m: MonsterMotion) {
    const s = this.host.state.monsters.get(m.id);
    if (!s) return;
    const def = MONSTERS[m.kind]!;
    s.x = m.x; s.y = m.y; s.facing = m.facing; s.state = m.state; s.hp = Math.max(0, m.hp); s.hpMax = def.hp;
    const now = this.host.now();
    const statuses = m.state === 'dead' ? '' : (Object.keys(m.statuses) as MonsterStatus[]).filter((k) => (m.statuses[k] ?? 0) > now).join(',');
    if (s.statuses !== statuses) s.statuses = statuses;
  }

  isDown(playerId: string) { return this.downUntil.has(playerId); }

  /** Player asks to auto-attack a monster (repeats every BASIC_ATTACK.delayMs while in reach). */
  requestAttack(playerId: string, monsterId: string, at: Position): AttackError | null {
    if (this.isDown(playerId)) return 'dead';
    const m = this.monsters.get(monsterId);
    if (!m || m.state === 'dead') return 'no-target';
    const profile = this.host.profile(playerId);
    if (dist(at, m) > (profile ? basicAttackFor(profile, BASIC_ATTACK).range : BASIC_ATTACK.range) + 0.6) return 'too-far';
    const current = this.attacks.get(playerId);
    this.attacks.set(playerId, { monsterId, nextAt: current?.monsterId === monsterId ? current.nextAt : this.host.now() });
    return null;
  }
  /** Stops auto-attacking; returns the monster that was being attacked, if any. */
  stopAttack(playerId: string): string | null { const a = this.attacks.get(playerId); this.attacks.delete(playerId); return a?.monsterId ?? null; }

  /** Validates a skill's target at cast start: a living monster within the skill's (provisional) range. */
  skillTarget(skillId: string, targetId: unknown, at: Position, skills: Readonly<Record<string, number>> = {}): { error: 'no-target' | 'too-far' | null; aim: Position | null } {
    const rule = combatSpec(skillId);
    if (!rule || rule.target === 'self' || rule.target === 'dash' || typeof targetId !== 'string') {
      // Nation single-target skills need a target (Medium kept its "cast at nothing" behaviour).
      return { error: rule && rule.target === 'enemy' && NATION_SKILL_COMBAT[skillId] ? 'no-target' : null, aim: null };
    }
    const m = this.monsters.get(targetId);
    if (!m || m.state === 'dead') return { error: 'no-target', aim: null };
    if (dist(at, m) > skillRange(skillId, skills) + 0.5) return { error: 'too-far', aim: null };
    return { error: null, aim: { x: m.x, y: m.y } };
  }

  /** A cast released (server timing): apply its effect. Self skills ignore `targetId`. */
  releaseSkill(playerId: string, skillId: string, targetId: string | null, aim: Position, variant?: string) {
    const profile = this.host.profile(playerId);
    if (profile && !this.isDown(playerId) && NATION_SKILL_COMBAT[skillId]) {
      this.lastCombat.set(playerId, this.host.now());
      this.hunter.release(playerId, skillId, targetId, aim, variant);
      return;
    }
    const rule = SKILL_COMBAT[skillId];
    if (!profile || !rule || this.isDown(playerId)) return;
    const level = profile.skills[skillId] ?? 1;
    const matk = matkFor(profile.level);
    this.lastCombat.set(playerId, this.host.now());
    if (skillId === 'soul-heal') {
      const p = structuredClone(profile);
      const amount = Math.min(p.hpMax - p.hp, soulHealAmount(level, matk, p.spMax));
      p.hp += amount;
      this.host.setProfile(playerId, p); this.host.vitals(playerId);
      this.host.broadcast({ type: 'heal', target: { kind: 'player', id: playerId }, amount });
      return;
    }
    if (rule.target === 'self') return; // Ghost Sight: no hidden monsters exist yet, so it has no effect.
    const victims = rule.target === 'area'
      ? [...this.monsters.values()].filter((m) => m.state !== 'dead' && Math.abs(m.x - aim.x) <= (rule.areaRadius ?? 1.5) && Math.abs(m.y - aim.y) <= (rule.areaRadius ?? 1.5))
      : targetId ? [this.monsters.get(targetId)].filter((m): m is MonsterMotion => !!m && m.state !== 'dead') : [];
    const delay = SKILL_IMPACT_MS[skillId] ?? 200;
    this.pending.push({ at: this.host.now() + delay, run: () => {
      for (const m of victims) {
        if (m.state === 'dead') continue;
        const def = MONSTERS[m.kind]!;
        if (skillId === 'binding-thread') {
          const slow = bindingSlow(level);
          m.slowFactor = slow.factor; m.slowUntil = this.host.now() + slow.durationMs; m.statuses.slow = m.slowUntil;
          provokeMonster(m, playerId);
          this.host.broadcast({ type: 'damage', target: { kind: 'monster', id: m.id }, amount: 0, source: playerId, skill: skillId });
          continue;
        }
        this.damageMonster(m, magicDamage(skillDamage(skillId, level, matk, def.race), def.mdef, this.host.rng()), playerId, skillId);
      }
    } });
  }

  private damageMonster(m: MonsterMotion, amount: number, playerId: string, skill?: string) {
    m.hp -= amount;
    this.lastCombat.set(playerId, this.host.now());
    this.host.broadcast({ type: 'damage', target: { kind: 'monster', id: m.id }, amount, source: playerId, ...(skill ? { skill } : {}) });
    if (m.hp > 0) { provokeMonster(m, playerId); this.sync(m); return; }
    this.killMonster(m, playerId);
  }

  private killMonster(m: MonsterMotion, killer: string) {
    const def = MONSTERS[m.kind]!;
    const region = this.region(m.regionId);
    m.state = 'dead'; m.hp = 0; m.targetId = null; m.swingAt = 0; m.statuses = {}; m.markedBy = undefined;
    this.sync(m);
    this.host.broadcast({ type: 'death', target: { kind: 'monster', id: m.id }, killer });
    for (const [pid, a] of this.attacks) if (a.monsterId === m.id) this.attacks.delete(pid);
    if (m.summoned) {
      // Boss minions do not respawn: remove them once the death animation has played.
      this.pending.push({ at: this.host.now() + 2500, run: () => { this.monsters.delete(m.id); this.host.state.monsters.delete(m.id); } });
    } else this.respawns.push({ regionId: m.regionId, kind: m.kind, id: m.id, at: this.host.now() + (region?.respawnMs ?? 10000) });
    // Rewards go to the player who landed the killing blow (shared EXP is a later design decision).
    const profile = this.host.profile(killer);
    if (!profile) return;
    const p = structuredClone(profile);
    const levels = gainExp(p, def.exp);
    // Job EXP is separate from base EXP (job-progression.ts): explicit per monster, else base EXP × the configured ratio.
    const jobExp = (def as { jobExp?: number }).jobExp ?? Math.round(def.exp * JOB_PROGRESSION.jobExpRatio);
    const jobLevels = gainJobExp(p, jobExp);
    const drops = def.drops.filter((d) => this.host.rng() < d.chance).map((d) => ({ itemId: d.itemId, qty: 1 }));
    const looted = addLoot(p, drops, Date.now());
    const quest = questEvent(p, { kind: 'kill', monster: m.kind }, Date.now());
    const after = quest && quest.ok ? quest.profile : p;
    const notes = [`+${def.exp} EXP · +${jobExp} Job EXP`, ...(jobLevels > 0 ? [`Job Level ${p.jobLevel} (+${jobLevels} แต้มสกิล)`] : []), ...looted.map((d) => `ได้รับ ${ITEMS[d.itemId]?.name.th ?? d.itemId} ×${d.qty}`), ...(quest && quest.ok && quest.note ? [quest.note] : [])];
    this.host.setProfile(killer, after, notes.join(' · '));
    if (looted.length) this.host.broadcast({ type: 'loot', player: killer, items: looted });
    if (levels > 0) this.host.broadcast({ type: 'levelup', player: killer, level: after.level });
  }

  private hitPlayer(playerId: string, monster: MonsterMotion, fixed?: number) {
    const profile = this.host.profile(playerId);
    if (!profile || this.isDown(playerId)) return;
    const def = MONSTERS[monster.kind]!;
    const amount = fixed ?? physicalDamage(def.atk, 0, this.host.rng());
    const p = structuredClone(profile);
    p.hp = Math.max(0, p.hp - amount);
    this.lastCombat.set(playerId, this.host.now());
    this.lastHitBy.set(playerId, monster.id);
    this.host.setProfile(playerId, p); this.host.vitals(playerId);
    this.host.broadcast({ type: 'damage', target: { kind: 'player', id: playerId }, amount, source: monster.id });
    if (p.hp > 0) return;
    // Down: no actions until respawn at the map's arrival point (no EXP penalty in this prototype).
    this.downUntil.set(playerId, this.host.now() + PLAYER_RESPAWN_MS);
    this.attacks.delete(playerId);
    const player = this.host.state.players.get(playerId);
    if (player) { player.dead = true; player.moving = false; }
    this.host.broadcast({ type: 'death', target: { kind: 'player', id: playerId }, killer: monster.id });
  }

  /** Ranged blow: the projectile flies to where the player stands; damage lands on arrival if they are still close. */
  private shoot(m: MonsterMotion, playerId: string, speed: number) {
    const player = this.host.state.players.get(playerId);
    if (!player) return;
    const at = { x: player.x, y: player.y };
    const flightMs = Math.round(dist(m, at) / speed * 1000);
    this.host.broadcast({ type: 'projectile', from: m.id, to: playerId, kind: m.kind, flightMs });
    this.pending.push({ at: this.host.now() + flightMs, run: () => {
      const p = this.host.state.players.get(playerId);
      // Dodgeable: walking more than a unit away from the aimed spot makes it miss.
      if (p && !p.dead && dist(p, at) <= 1.0) this.hitPlayer(playerId, m);
    } });
  }

  /** Mini boss: telegraphed root slam on its target, and summoned minions once wounded. */
  private bossStep(m: MonsterMotion, boss: NonNullable<(typeof MONSTERS)[string]['boss']>, now: number) {
    const fighting = (m.state === 'chase' || m.state === 'attack') && m.targetId;
    if (!fighting) { m.nextSlamAt = undefined; m.nextSummonAt = undefined; return; }
    m.nextSlamAt ??= now + boss.slam.everyMs / 2;
    m.nextSummonAt ??= now;
    const target = this.host.state.players.get(m.targetId!);
    if (target && now >= m.nextSlamAt) {
      m.nextSlamAt = now + boss.slam.everyMs;
      const at = { x: target.x, y: target.y };
      this.host.broadcast({ type: 'telegraph', source: m.id, x: at.x, y: at.y, radius: boss.slam.radius, ms: boss.slam.windupMs });
      this.pending.push({ at: now + boss.slam.windupMs, run: () => {
        if (m.state === 'dead') return;
        for (const [pid, p] of this.host.state.players) if (!p.dead && dist(p, at) <= boss.slam.radius) this.hitPlayer(pid, m, boss.slam.damage);
      } });
    }
    const def = MONSTERS[m.kind]!;
    const adds = [...this.monsters.values()].filter((x) => x.summoned && x.regionId === m.regionId && x.state !== 'dead').length;
    if (m.hp <= def.hp * boss.summon.belowHp && now >= m.nextSummonAt && adds < boss.summon.max) {
      m.nextSummonAt = now + boss.summon.everyMs;
      const region = this.region(m.regionId);
      if (!region) return;
      const ids: string[] = [];
      for (let i = 0; i < Math.min(boss.summon.count, boss.summon.max - adds); i++) {
        const a = this.host.rng() * Math.PI * 2;
        const at = { x: m.x + Math.cos(a) * 1.6, y: m.y + Math.sin(a) * 1.0 };
        if (isBlocked(this.host.map, at.x, at.y)) continue;
        const id = `${m.id}-add-${++this.summonSeq}`;
        const add = createMonster(id, boss.summon.kind, region, at, now);
        Object.assign(add, { aggressive: true, summoned: true, state: 'chase', targetId: m.targetId });
        this.monsters.set(id, add);
        const st = new MonsterState(); st.kind = boss.summon.kind; this.host.state.monsters.set(id, st);
        this.sync(add);
        ids.push(id);
      }
      if (ids.length) this.host.broadcast({ type: 'summon', source: m.id, ids });
    }
  }

  /** Removes a leaving player from all combat bookkeeping. */
  forget(playerId: string) {
    this.attacks.delete(playerId); this.lastCombat.delete(playerId); this.downUntil.delete(playerId); this.lastHitBy.delete(playerId);
    this.hunter.forget(playerId);
    for (const m of this.monsters.values()) if (m.targetId === playerId) m.targetId = null;
  }

  step(dtMs: number) {
    const host = this.host, now = host.now();
    // Scheduled skill impacts.
    if (this.pending.length) {
      const due = this.pending.filter((p) => p.at <= now);
      this.pending = this.pending.filter((p) => p.at > now);
      for (const p of due) p.run();
    }
    this.hunter.step(now);
    // Respawns.
    for (const r of this.respawns.filter((r) => r.at <= now)) {
      const region = this.region(r.regionId);
      if (region) this.spawn(region, r.kind, r.id, now);
    }
    this.respawns = this.respawns.filter((r) => r.at > now);
    // Player respawn after being downed.
    for (const [id, until] of this.downUntil) {
      if (until > now) continue;
      this.downUntil.delete(id);
      const player = host.state.players.get(id);
      const profile = host.profile(id);
      if (!player || !profile) continue;
      const p = structuredClone(profile);
      p.hp = Math.max(1, Math.round(p.hpMax / 2)); p.sp = Math.max(p.sp, Math.round(p.spMax / 2));
      host.setProfile(id, p, 'ฟื้นคืนสติที่จุดปลอดภัย'); host.vitals(id);
      player.x = host.map.spawn.x; player.y = host.map.spawn.y; player.dead = false;
    }
    // Monster AI.
    const targets = [...host.state.players.entries()].map(([id, p]) => ({ id, x: p.x, y: p.y, alive: !p.dead }));
    for (const m of this.monsters.values()) {
      if (m.state === 'dead') continue;
      const events = stepMonster(m, targets, dtMs, now, host.map, () => host.rng());
      const def = MONSTERS[m.kind]!;
      for (const e of events) {
        if (e.type === 'swing') host.broadcast({ type: 'swing', attacker: { kind: 'monster', id: m.id }, target: { kind: 'player', id: e.targetId } });
        else if (def.projectile) this.shoot(m, e.targetId, def.projectile.speed);
        else this.hitPlayer(e.targetId, m);
      }
      if (def.boss) this.bossStep(m, def.boss, now);
      this.sync(m);
    }
    // Player basic attacks.
    for (const [pid, a] of this.attacks) {
      const player = host.state.players.get(pid);
      const m = this.monsters.get(a.monsterId);
      const profile = host.profile(pid);
      if (!player || !m || !profile || m.state === 'dead' || player.dead) { this.attacks.delete(pid); continue; }
      const d = dist(player, m);
      const basic = basicAttackFor(profile, BASIC_ATTACK);
      if (d > Math.max(10, basic.range + 2)) { this.attacks.delete(pid); continue; }
      if (d > basic.range + 0.4 || now < a.nextAt) continue;
      a.nextAt = now + basic.delayMs;
      player.facing = m.x >= player.x ? (m.y > player.y + 0.6 ? 'south-east' : m.y < player.y - 0.6 ? 'north-east' : 'east') : (m.y > player.y + 0.6 ? 'south-west' : m.y < player.y - 0.6 ? 'north-west' : 'west');
      host.broadcast({ type: 'swing', attacker: { kind: 'player', id: pid }, target: { kind: 'monster', id: m.id } });
      if (basic.ranged) {
        // Bow shot: damage lands when the arrow arrives (the falcon may follow it, Falcon Bond).
        const flightMs = Math.round(d / HUNTER.arrowSpeed * 1000);
        host.broadcast({ type: 'arrow', from: pid, to: m.id, flightMs });
        const atk = combatStats(profile).atk;
        this.pending.push({ at: now + flightMs, run: () => {
          if (m.state === 'dead') return;
          this.damageMonster(m, this.hunter.basicDamage(pid, m, atk), pid);
          if ((m.state as string) !== 'dead') this.hunter.onBasicHit(pid, m);
        } });
        continue;
      }
      this.damageMonster(m, physicalDamage(atkFor(profile.level), MONSTERS[m.kind]!.def, host.rng()), pid);
    }
    // Out-of-combat regeneration.
    if (now >= this.nextRegen) {
      this.nextRegen = now + REGEN_TICK_MS;
      for (const id of host.state.players.keys()) {
        const profile = host.profile(id);
        if (!profile || this.isDown(id) || now - (this.lastCombat.get(id) ?? 0) < REGEN.combatLockMs) continue;
        if (profile.hp >= profile.hpMax && profile.sp >= profile.spMax) continue;
        const p = structuredClone(profile);
        p.hp = Math.min(p.hpMax, p.hp + Math.max(1, Math.round(p.hpMax * REGEN.hp)));
        p.sp = Math.min(p.spMax, p.sp + Math.max(1, Math.round(p.spMax * REGEN.sp)));
        host.setProfile(id, p); host.vitals(id);
      }
    }
  }

  /** True when `p` stands in one of this map's safe zones. */
  inSafeZone(p: Position) { return (this.host.map.safeZones ?? []).some((r) => pointInRect(p, r)); }
}
