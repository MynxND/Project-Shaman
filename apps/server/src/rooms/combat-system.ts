import { CalonEncounter } from './calon-encounter.js';
import { KoscheiEncounter } from './koschei-encounter.js';
import { MaiyarapEncounter } from './maiyarap-encounter.js';
import{ShutenEncounter}from'./shuten-encounter.js';
import{shutenWalkMap}from'@shaman/shared';
import type{Facing}from'@shaman/shared';
import { MonsterState, type GameState } from '@shaman/schema';
import {
  addLoot, atkFor, expShares, MAGIC_BOLT, SHARED_EXP, basicAttackFor, combatSpec, combatStats, isBlocked, BASIC_ATTACK, bindingSlow, HUNTER, NATION_SKILL_COMBAT, skillRange, createMonster, gainExp, gainJobExp, JOB_PROGRESSION, ITEMS, magicDamage, matkFor, MONSTERS, physicalDamage,
  pickSpawnPoint, PLAYER_RESPAWN_MS, pointInRect, provokeMonster, questEvent, REGEN, REGEN_TICK_MS, SKILL_COMBAT, skillDamage,
  soulHealAmount, stepMonster, type MapDefinition, type MonsterStatus, type MonsterMotion, type PlayerProfile, type Position, type SpawnRegion,
} from '@shaman/shared';
import { HunterEffects } from './hunter-effects.js';
import { RuneSeerEffects } from './rune-seer-effects.js';
import { JapanEffects } from './japan-effects.js';
import { NationsEffects } from './nations-effects.js';

// Authoritative combat for one map room: monster spawning and AI, player basic attacks, skill effects on release,
// damage, death, EXP/level-ups, loot, regeneration and player respawn. Numbers come from packages/shared/src/combat.ts
// (provisional). Clients only send intents ('attack', 'skill' with a target) and draw the 'combat' events.

export type CombatEvent =
  | { type: 'swing'; attacker: { kind: 'player' | 'monster'; id: string }; target: { kind: 'player' | 'monster'; id: string }; facing?: Facing }
  | { type: 'damage'; target: { kind: 'player' | 'monster'; id: string }; amount: number; source: string; skill?: string }
  | { type: 'heal'; target: { kind: 'player'; id: string }; amount: number }
  | { type: 'death'; target: { kind: 'player' | 'monster'; id: string }; killer?: string }
  | { type: 'levelup'; player: string; level: number }
  | { type: 'loot'; player: string; items: { itemId: string; qty: number }[] }
  /** A ranged monster's shot: flies from the monster to the player in `flightMs`; damage follows on arrival. */
  | { type: 'projectile'; from: string; to: string; kind: string; flightMs: number; origin?: Position; aim?: Position }
  /** A boss area attack warning on the ground (world units), landing after `ms`. */
  | { type: 'telegraph'; source: string; x: number; y: number; radius: number; ms: number }
  | { type: 'summon'; source: string; ids: string[] }
  /** A Hunter's bow shot (basic attack): flies from the player to the monster in `flightMs`. */
  | { type: 'arrow'; from: string; to: string; flightMs: number }
  /** Magic weapon basic attack: a spirit bolt from a player to a monster (MAGIC_BOLT). */
  | { type: 'bolt'; from: string; to: string; flightMs: number }
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
  readonly shuten:ShutenEncounter|null;
  readonly maiyarap: MaiyarapEncounter | null;
  readonly koschei: KoscheiEncounter | null;
  readonly calon: CalonEncounter | null;
  private respawns: { regionId: string; kind: string; id: string; at: number }[] = [];
  private attacks = new Map<string, { monsterId: string; nextAt: number }>();
  private lastCombat = new Map<string, number>();
  private downUntil = new Map<string, number>();
  private lastHitBy = new Map<string, string>();
  private pending: { at: number; run: () => void }[] = [];
  private summonSeq = 0;
  /** Damage dealt to each living monster by each player (shared EXP, Phase 5). */
  private damageBy = new Map<string, Map<string, number>>();
  private nextRegen = 0;
  /** Ullr Hunter skill families (arrows, falcon, traps, dash, Great Hunt). */
  readonly hunter: HunterEffects;
  /** Rune Seer skill families (rune queue, frost spells, Ice Wall, Runestone, Fimbulwinter). */
  readonly runeSeer: RuneSeerEffects;
  /** Onmyoji + Miko (talismans, Invoke spells, residue combos, shikigami, purification → blessing) and the player buff layer. */
  readonly japan: JapanEffects;
  /** Russia, Indonesia and Thailand branches (Guard, blood hunt, needles, pamor, sacred thread + puppet, prai). */
  readonly nations: NationsEffects;
  /** Walkable map with standing Ice Walls (players and monsters move on this). */
  walkMap: MapDefinition;

  constructor(private readonly host: CombatHost) {
    this.hunter = new HunterEffects({
      map: host.map, state: host.state, monsters: this.monsters, now: () => host.now(), rng: () => host.rng(), profile: (id) => host.profile(id),
      schedule: (delay, run) => this.pending.push({ at: host.now() + delay, run }),
      damage: (m, amount, playerId, skill) => { if (m.state !== 'dead') this.damageMonster(m, amount, playerId, skill); },
      fx: (e) => host.broadcast({ type: 'skillfx', ...e }),
      reduceCooldown: (id, skillId, ms) => host.reduceCooldown(id, skillId, ms),
      status: (m, status, ms, source) => { host.broadcast({ type: 'status', target: m.id, status, ms, source }); this.sync(m); },
    });
    this.walkMap = host.map;
    this.runeSeer = new RuneSeerEffects({
      map: host.map, state: host.state, monsters: this.monsters, now: () => host.now(), rng: () => host.rng(), profile: (id) => host.profile(id),
      setProfile: (id, p) => { host.setProfile(id, p); host.vitals(id); },
      schedule: (delay, run) => this.pending.push({ at: host.now() + delay, run }),
      damage: (m, amount, playerId, skill) => { if (m.state !== 'dead') this.damageMonster(m, amount, playerId, skill); },
      status: (m, status, ms, source) => { host.broadcast({ type: 'status', target: m.id, status, ms, source }); this.sync(m); },
      fx: (e) => host.broadcast({ type: 'skillfx', ...e }),
      walls: (map) => { this.walkMap = map; },
    });
    this.japan = new JapanEffects({
      map: host.map, state: host.state, monsters: this.monsters, now: () => host.now(), rng: () => host.rng(), profile: (id) => host.profile(id),
      setProfile: (id, p) => { host.setProfile(id, p); host.vitals(id); },
      schedule: (delay, run) => this.pending.push({ at: host.now() + delay, run }),
      damage: (m, amount, playerId, skill) => { if (m.state !== 'dead') this.damageMonster(m, amount, playerId, skill); },
      status: (m, status, ms, source) => { host.broadcast({ type: 'status', target: m.id, status, ms, source }); this.sync(m); },
      fx: (e) => host.broadcast({ type: 'skillfx', ...e }),
      heal: (id, amount) => this.healPlayer(id, amount),
      revive: (id) => this.revive(id),
      isDown: (id) => this.isDown(id),
      walkMap: () => this.walkMap,
      reduceCooldown: (id, skillId, ms) => host.reduceCooldown(id, skillId, ms),
    });
    this.nations = new NationsEffects({
      map: host.map, state: host.state, monsters: this.monsters, now: () => host.now(), rng: () => host.rng(), profile: (id) => host.profile(id),
      setProfile: (id, p) => { host.setProfile(id, p); host.vitals(id); },
      schedule: (delay, run) => this.pending.push({ at: host.now() + delay, run }),
      damage: (m, amount, playerId, skill) => { if (m.state !== 'dead') this.damageMonster(m, amount, playerId, skill); },
      status: (m, status, ms, source) => { host.broadcast({ type: 'status', target: m.id, status, ms, source }); this.sync(m); },
      fx: (e) => host.broadcast({ type: 'skillfx', ...e }),
      heal: (id, amount) => this.healPlayer(id, amount),
      isDown: (id) => this.isDown(id),
      walkMap: () => this.walkMap,
      reduceCooldown: (id, skillId, ms) => host.reduceCooldown(id, skillId, ms),
      cleanse: (id, count) => this.japan.cleanse(id, count),
    });
    const now = host.now();
    for (const region of host.map.spawnRegions ?? []) {
      for (const group of region.monsters) for (let i = 0; i < group.count; i++) this.spawn(region, group.kind, `${region.id}-${group.kind}-${i}`, now);
    }
    this.shuten=host.map.id==='mount-oe-fortress'?new ShutenEncounter(host,this.monsters,{reset:id=>{this.damageBy.delete(id);for(const[pid,a]of this.attacks)if(a.monsterId===id||a.monsterId.startsWith('oe-'))this.attacks.delete(pid);},sync:m=>this.sync(m),hit:(id,m,damage)=>this.hitPlayer(id,m,damage),walkMap:()=>this.walkMap}):null;
    this.maiyarap = host.map.id === 'maiyarap-palace' ? new MaiyarapEncounter(host, this.monsters, { sync: m => this.sync(m), hit: (id, m, damage) => { const hp = host.profile(id)?.hp ?? 0; this.hitPlayer(id, m, damage); return (host.profile(id)?.hp ?? hp) < hp; }, reset: id => { this.damageBy.delete(id); for (const [pid, a] of this.attacks) if (a.monsterId === id) this.attacks.delete(pid); } }) : null;
    this.koschei = host.map.id === 'frozen-necropolis' ? new KoscheiEncounter(host,this.monsters,{sync:m=>this.sync(m),hit:(id,m,damage)=>this.hitPlayer(id,m,damage),reset:id=>{this.damageBy.delete(id);for(const[pid,a]of this.attacks)if(a.monsterId===id)this.attacks.delete(pid);}}) : null;
    this.calon = host.map.id === 'girah-ruined-temple' ? new CalonEncounter(host,this.monsters,{sync:m=>this.sync(m),hit:(id,m,damage)=>this.hitPlayer(id,m,damage),reset:id=>{this.damageBy.delete(id);for(const[pid,a]of this.attacks)if(a.monsterId===id)this.attacks.delete(pid);}}) : null;
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
  /** Hit or attacked within the combat lock (REGEN.combatLockMs): no skill reset while fighting. */
  inCombat(playerId: string) { return this.host.now() - (this.lastCombat.get(playerId) ?? -Infinity) < REGEN.combatLockMs || this.attacks.has(playerId); }

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
      if (!this.nations.release(playerId, skillId, targetId, aim) && !this.japan.release(playerId, skillId, targetId, aim) && !this.runeSeer.release(playerId, skillId, targetId, aim)) this.hunter.release(playerId, skillId, targetId, aim, variant);
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

  private damageMonster(m: MonsterMotion, raw: number, playerId: string, skill?: string) {
    m=this.shuten?.damageTarget(m)??m;
    if(m.state==='dead'||m.hp<=0)return;
    // Player buffs/debuffs (curse, blessings, bonfire, kotodama, Oracle's Vision) scale every source of damage.
    const scaled = raw > 0 ? Math.max(1, Math.round(raw * this.japan.dealtMul(playerId, m) * this.nations.dealtMul(playerId, m))) : raw;
    const amount=this.calon ? this.calon.filterDamage(m,scaled,playerId) : this.koschei ? this.koschei.filterDamage(m,scaled,playerId) : this.maiyarap ? this.maiyarap.filterDamage(m,scaled,playerId) : this.shuten?.filterDamage(m,scaled)??scaled;this.shuten?.damaged(m,amount);
    if (amount > 0 && m.hp > 0) { let d = this.damageBy.get(m.id); if (!d) { d = new Map(); this.damageBy.set(m.id, d); } d.set(playerId, (d.get(playerId) ?? 0) + Math.min(amount, m.hp)); }
    m.hp -= amount;
    this.nations.onDamage(m, amount, playerId, skill);
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
    if(this.shuten?.object(m)){this.shuten.objectDied(m);for(const[pid,a]of this.attacks)if(a.monsterId===m.id)this.attacks.delete(pid);return;}
    if(this.calon?.object(m)){this.calon.objectDied(m);for(const[pid,a]of this.attacks)if(a.monsterId===m.id)this.attacks.delete(pid);return;}
    if(this.koschei?.object(m)){this.koschei.objectDied();for(const[pid,a]of this.attacks)if(a.monsterId===m.id)this.attacks.delete(pid);return;}
    if (this.maiyarap?.object(m)) { this.maiyarap.objectDied(); for (const [pid, a] of this.attacks) if (a.monsterId === m.id) this.attacks.delete(pid); return; }
    this.nations.onKill(killer, m);
    for (const [pid, a] of this.attacks) if (a.monsterId === m.id) this.attacks.delete(pid);
    if (m.summoned) {
      // Boss minions do not respawn: remove them once the death animation has played.
      this.pending.push({ at: this.host.now() + 2500, run: () => { this.monsters.delete(m.id); this.host.state.monsters.delete(m.id); } });
    } else this.respawns.push({ regionId: m.regionId, kind: m.kind, id: m.id, at: this.host.now() + (region?.respawnMs ?? 10000) });
    // Shared EXP (Phase 5, provisional): every player still in the room who damaged it gets a share by damage; the top
    // damage dealer takes the loot; helpers with enough damage get the quest kill.
    const damage = new Map([...(this.damageBy.get(m.id) ?? new Map([[killer, 1]]))].filter(([id]) => this.host.state.players.has(id) && this.host.profile(id)));
    this.damageBy.delete(m.id);
    if (!damage.size && this.host.profile(killer)) damage.set(killer, 1);
    const total = [...damage.values()].reduce((n, d) => n + d, 0);
    const looter = [...damage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const shares = expShares(def.exp, damage);
    for (const [pid, exp] of shares) {
      const profile = this.host.profile(pid);
      if (!profile) continue;
      const p = structuredClone(profile);
      const levels = gainExp(p, exp);
      // Job EXP is separate from base EXP (job-progression.ts): explicit per monster, else base EXP × the configured ratio.
      const jobExp = Math.max(1, Math.round(((def as { jobExp?: number }).jobExp ?? def.exp * JOB_PROGRESSION.jobExpRatio) * exp / def.exp));
      const jobLevels = gainJobExp(p, jobExp);
      const drops = pid === looter ? def.drops.filter((d) => this.host.rng() < d.chance).map((d) => ({ itemId: d.itemId, qty: 1 })) : [];
      const looted = addLoot(p, drops, Date.now());
      const credited = (damage.get(pid) ?? 0) / total >= SHARED_EXP.questShare || pid === killer;
      const quest = credited ? questEvent(p, { kind: 'kill', monster: m.kind }, Date.now()) : null;
      const after = quest && quest.ok ? quest.profile : p;
      const notes = [`+${exp} EXP · +${jobExp} Job EXP${damage.size > 1 ? ` (แบ่งกัน ${damage.size} คน)` : ''}`, ...(jobLevels > 0 ? [`Job Level ${p.jobLevel} (+${jobLevels} แต้มสกิล)`] : []), ...looted.map((d) => `ได้รับ ${ITEMS[d.itemId]?.name.th ?? d.itemId} ×${d.qty}`), ...(quest && quest.ok && quest.note ? [quest.note] : [])];
      this.host.setProfile(pid, after, notes.join(' · '));
      if (looted.length) this.host.broadcast({ type: 'loot', player: pid, items: looted });
      if (levels > 0) this.host.broadcast({ type: 'levelup', player: pid, level: after.level });
    }
  }

  private hitPlayer(playerId: string, monster: MonsterMotion, fixed?: number, ranged = false) {
    const profile = this.host.profile(playerId);
    if (!profile || this.isDown(playerId)) return;
    const def = MONSTERS[monster.kind]!;
    // Suzu Bell flee dodges; then the hearth shield, kongō shield and damage-taken buffs (weaken, guard, ash barrier, Holy Ward).
    if (this.japan.dodges(playerId) || this.nations.dodges(playerId)) { this.host.broadcast({ type: 'damage', target: { kind: 'player', id: playerId }, amount: 0, source: monster.id }); return; }
    const amount = this.nations.taken(playerId, this.japan.taken(playerId, this.runeSeer.absorb(playerId, fixed ?? physicalDamage(def.atk, 0, this.host.rng())), monster), ranged);
    const p = structuredClone(profile);
    p.hp = Math.max(0, p.hp - amount);
    // Undying Rage / Absolute Soul Defense may turn a lethal blow into a save (they set the new HP themselves).
    if (p.hp <= 0 && this.nations.onLethal(playerId)) { this.host.broadcast({ type: 'damage', target: { kind: 'player', id: playerId }, amount, source: monster.id }); this.host.vitals(playerId); return; }
    this.lastCombat.set(playerId, this.host.now());
    this.lastHitBy.set(playerId, monster.id);
    this.host.setProfile(playerId, p); this.host.vitals(playerId);
    this.host.broadcast({ type: 'damage', target: { kind: 'player', id: playerId }, amount, source: monster.id });
    if (p.hp > 0) { this.japan.onPlayerHit(playerId, monster); this.nations.onPlayerHit(playerId, monster, amount, ranged); return; }
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
    this.host.broadcast({ type: 'projectile', from: m.id, to: playerId, kind: m.kind, flightMs, origin: { x: m.x, y: m.y }, aim: at });
    this.pending.push({ at: this.host.now() + flightMs, run: () => {
      const p = this.host.state.players.get(playerId);
      // Dodgeable: walking more than a unit away from the aimed spot makes it miss.
      if (p && !p.dead && dist(p, at) <= 1.0) this.hitPlayer(playerId, m, undefined, true);
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
    for (const d of this.damageBy.values()) d.delete(playerId);
    this.hunter.forget(playerId);
    this.runeSeer.forget(playerId);
    this.japan.forget(playerId);
    this.nations.forget(playerId);
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
    this.runeSeer.step(now);
    this.japan.step(now, dtMs);
    this.nations.step(now, dtMs);
    // Player statuses everyone sees: every system's buffs and debuffs merged.
    for (const [id, player] of host.state.players) {
      const list = [...this.hunter.statusesOf(id), ...this.runeSeer.statusesOf(id), ...this.japan.statusesOf(id), ...this.nations.statusesOf(id)].join(',');
      if (player.statuses !== list) player.statuses = list;
    }
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
    const targets = [...host.state.players.entries()].map(([id, p]) => ({ id, x: p.x, y: p.y, alive: !p.dead, hidden: this.nations.hidden(id) }));
    for (const m of this.monsters.values()) {
      if (m.state === 'dead'||this.shuten?.controlled(m)||this.maiyarap?.controlled(m)||this.koschei?.controlled(m)||this.calon?.controlled(m)) continue;
      const events = stepMonster(m, targets, dtMs, now, this.walkMap, () => host.rng());
      const def = MONSTERS[m.kind]!;
      for (const e of events) {
        if (e.type === 'swing') host.broadcast({ type: 'swing', attacker: { kind: 'monster', id: m.id }, target: { kind: 'player', id: e.targetId }, facing:m.facing });
        else if (def.projectile) this.shoot(m, e.targetId, def.projectile.speed);
        else this.hitPlayer(e.targetId, m);
      }
      if (def.boss) this.bossStep(m, def.boss, now);
      if (m.state === 'idle' && m.hp >= def.hp && this.damageBy.has(m.id)) this.damageBy.delete(m.id);
      this.sync(m);
    }
    this.koschei?.step(dtMs);
    this.calon?.step(dtMs);
    this.maiyarap?.step(dtMs);
    this.shuten?.step(dtMs);
    if(this.shuten)this.walkMap=shutenWalkMap(this.walkMap,this.shuten.state.damageMask);
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
      a.nextAt = now + basic.delayMs / (this.japan.aspdMul(pid) * this.nations.aspdMul(pid));
      player.facing = m.x >= player.x ? (m.y > player.y + 0.6 ? 'south-east' : m.y < player.y - 0.6 ? 'north-east' : 'east') : (m.y > player.y + 0.6 ? 'south-west' : m.y < player.y - 0.6 ? 'north-west' : 'west');
      host.broadcast({ type: 'swing', attacker: { kind: 'player', id: pid }, target: { kind: 'monster', id: m.id } });
      // Blind (a monster debuff) makes half of the blows miss.
      if (this.japan.misses(pid)) { host.broadcast({ type: 'damage', target: { kind: 'monster', id: m.id }, amount: 0, source: pid }); continue; }
      if (basic.bolt) {
        // Magic weapon: a spirit bolt (MATK vs MDEF) that lands when it arrives.
        const flightMs = Math.round(d / MAGIC_BOLT.speed * 1000);
        host.broadcast({ type: 'bolt', from: pid, to: m.id, flightMs });
        const matk = combatStats(profile).matk;
        this.pending.push({ at: now + flightMs, run: () => { if (m.state !== 'dead') this.damageMonster(m, magicDamage(matk, MONSTERS[m.kind]!.mdef, host.rng()), pid); } });
        continue;
      }
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
      const hp0 = m.hp;
      this.damageMonster(m, physicalDamage(atkFor(profile.level) + this.nations.basicBonus(pid), MONSTERS[m.kind]!.def, host.rng()), pid);
      this.nations.onBasicHit(pid, m, Math.max(0, hp0 - m.hp));
    }
    // Regeneration: full out of combat; in combat only a trickle of SP (Phase 5, provisional).
    if (now >= this.nextRegen) {
      this.nextRegen = now + REGEN_TICK_MS;
      for (const id of host.state.players.keys()) {
        const profile = host.profile(id);
        if (!profile || this.isDown(id)) continue;
        if (now - (this.lastCombat.get(id) ?? 0) < REGEN.combatLockMs) {
          if (profile.sp < profile.spMax) { const p = structuredClone(profile); p.sp = Math.min(p.spMax, p.sp + Math.max(1, Math.round(p.spMax * REGEN.combatSp))); host.setProfile(id, p); host.vitals(id); }
          continue;
        }
        if (profile.hp >= profile.hpMax && profile.sp >= profile.spMax) continue;
        const p = structuredClone(profile);
        p.hp = Math.min(p.hpMax, p.hp + Math.max(1, Math.round(p.hpMax * REGEN.hp)));
        p.sp = Math.min(p.spMax, p.sp + Math.max(1, Math.round(p.spMax * REGEN.sp)));
        host.setProfile(id, p); host.vitals(id);
      }
    }
  }

  /** Heals a player (capped at max HP) and tells everyone. */
  healPlayer(id: string, amount: number) {
    const profile = this.host.profile(id);
    if (!profile || this.isDown(id) || amount <= 0) return;
    const p = structuredClone(profile);
    const healed = Math.min(p.hpMax - p.hp, Math.round(amount));
    if (healed <= 0) return;
    p.hp += healed;
    this.host.setProfile(id, p); this.host.vitals(id);
    this.host.broadcast({ type: 'heal', target: { kind: 'player', id }, amount: healed });
  }
  /** Brings a downed player back where they fell (Divine Miracle Resurrection). */
  revive(id: string): boolean {
    if (!this.downUntil.has(id)) return false;
    this.downUntil.delete(id);
    const player = this.host.state.players.get(id), profile = this.host.profile(id);
    if (player) player.dead = false;
    if (profile) { const p = structuredClone(profile); p.hp = p.hpMax; this.host.setProfile(id, p, 'ฟื้นคืนชีพด้วยปาฏิหาริย์'); this.host.vitals(id); }
    return true;
  }

  /** True when `p` stands in one of this map's safe zones. */
  inSafeZone(p: Position) { return (this.host.map.safeZones ?? []).some((r) => pointInRect(p, r)); }
}
