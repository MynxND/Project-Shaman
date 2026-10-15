// Monster behaviour as a pure step function run by the authoritative server (and by tests). States:
// idle -> wander -> idle, chase -> attack (aggro), return (leash / target lost), dead -> respawn. Passive monsters
// only chase after being hit (provokeMonster). Monsters never act inside safe zones and never cross blocked ground.
import {elevationPassage} from './elevation.js';
import { MONSTERS, type MonsterDefinition } from './combat.js';
import { isBlocked, pointInRect, type MapDefinition, type Position, type SpawnRegion } from './world.js';
import type { MonsterStatus } from './hunter-combat.js';

export type MonsterAiState = 'idle' | 'wander' | 'chase' | 'attack' | 'return' | 'dead';

export interface MonsterMotion {
  id: string;
  kind: string;
  regionId: string;
  home: Position;
  x: number; y: number;
  facing: 'east' | 'west';
  state: MonsterAiState;
  hp: number;
  targetId: string | null;
  /** Wander destination. */
  goal: Position | null;
  /** Next time an idle monster may wander (ms). */
  nextActionAt: number;
  lastAttackAt: number;
  /** A swing in progress lands at this time (ms), or 0. */
  swingAt: number;
  respawnAt: number;
  slowUntil: number; slowFactor: number;
  /** Status expiry times (ms) set by skills: root/freeze stop movement (freeze also stops attacks), blind stops
   *  noticing players and makes blows miss; mark/revealed/trapped are the Ullr Hunter's hunt conditions. */
  statuses: Partial<Record<MonsterStatus, number>>;
  /** Who marked this prey (the Twin Shot bonus belongs to that hunter) and their Twin Shot level. */
  markedBy?: { playerId: string; level: number };
  /** Attack delay multiplier from auras (Chilling Aura: 1 + 3% × Lv); 1 when absent. */
  attackDelayMul?: number;
  /** Overrides the definition's behaviour (summoned minions are always aggressive). */
  aggressive?: boolean;
  /** Summoned by a boss: never respawns. */
  summoned?: boolean;
  /** Boss timers (ms). */
  nextSlamAt?: number; nextSummonAt?: number;
}

export interface MonsterTarget { id: string; x: number; y: number; alive: boolean; hidden?: boolean }
export type MonsterEvent = { type: 'swing'; monsterId: string; targetId: string } | { type: 'hit'; monsterId: string; targetId: string };

const inSafeZone = (map: MapDefinition, p: Position) => (map.safeZones ?? []).some((r) => pointInRect(p, r));
const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

/** A walkable spawn point inside the region, away from safe zones, or null after `tries` attempts. */
export function pickSpawnPoint(map: MapDefinition, region: SpawnRegion, rng: () => number, tries = 40): Position | null {
  for (let i = 0; i < tries; i++) {
    const p = { x: region.area.x + rng() * region.area.w, y: region.area.y + rng() * region.area.h };
    if (!isBlocked(map, p.x, p.y) && !inSafeZone(map, p)) return p;
  }
  return null;
}

export function createMonster(id: string, kind: string, region: SpawnRegion, at: Position, now: number): MonsterMotion {
  const def = MONSTERS[kind]!;
  return {
    id, kind, regionId: region.id, home: { ...at }, x: at.x, y: at.y, facing: 'east', state: 'idle', hp: def.hp,
    targetId: null, goal: null, nextActionAt: now + 1000, lastAttackAt: 0, swingAt: 0, respawnAt: 0, slowUntil: 0, slowFactor: 1, statuses: {},
  };
}

/** Moves toward `to` by up to `step` units, sliding along blocked ground. Returns true when it arrived. */
function moveToward(m: MonsterMotion, to: Position, step: number, map: MapDefinition): boolean {
  const d = dist(m, to);
  if (d <= step) {
    if (!isBlocked(map, to.x, to.y) && elevationPassage(map,m,to)) { m.x = to.x; m.y = to.y; }
    return true;
  }
  const dx = (to.x - m.x) / d * step, dy = (to.y - m.y) / d * step;
  const options = [{ x: m.x + dx, y: m.y + dy }, { x: m.x + dx, y: m.y }, { x: m.x, y: m.y + dy }];
  const next = options.find((p) => !isBlocked(map, p.x, p.y) && elevationPassage(map,m,p));
  if (Math.abs(dx) > 0.001) m.facing = dx > 0 ? 'east' : 'west';
  if (!next) return true; // Stuck: treat as arrived so the AI picks something else.
  m.x = next.x; m.y = next.y;
  return false;
}

/** A passive (or any) monster that was hit fights back, unless it is dead or walking home. */
export function provokeMonster(m: MonsterMotion, attackerId: string) {
  if (m.state === 'dead' || m.state === 'return') return;
  if (m.state !== 'attack' && m.state !== 'chase') m.state = 'chase';
  m.targetId ??= attackerId;
}

/** Advances one monster by `dtMs`. Mutates `m`; returns swing/hit events for the server to apply and broadcast. */
export function stepMonster(m: MonsterMotion, players: readonly MonsterTarget[], dtMs: number, now: number, map: MapDefinition, rng: () => number): MonsterEvent[] {
  const def: MonsterDefinition = MONSTERS[m.kind]!;
  if (m.state === 'dead') return [];
  const has = (status: MonsterStatus) => now < (m.statuses[status] ?? 0);
  // Frozen monsters do nothing; a swing in progress is lost.
  if (has('freeze') || has('stun')) { m.swingAt = 0; return []; }
  // Fear: run away from whoever it fears (its current target), no blows.
  if (has('fear')) {
    const from = m.targetId ? players.find((p) => p.id === m.targetId) : undefined;
    m.swingAt = 0;
    if (from) { const d = dist(m, from) || 1; moveToward(m, { x: m.x + (m.x - from.x) / d * 3, y: m.y + (m.y - from.y) / d * 3 }, def.speed * dtMs / 1000, map); }
    return [];
  }
  const rooted = has('root'), blind = has('blind') || has('silence');
  const speed = rooted ? 0 : def.speed * (now < m.slowUntil ? m.slowFactor : 1);
  const step = speed * dtMs / 1000;
  const events: MonsterEvent[] = [];
  // Hidden players (stealth) cannot be chased or noticed.
  const target = m.targetId ? players.find((p) => p.id === m.targetId && p.alive && !p.hidden) ?? null : null;
  const giveUp = () => { m.state = 'return'; m.targetId = null; m.swingAt = 0; m.goal = null; };

  switch (m.state) {
    case 'idle':
    case 'wander': {
      if ((m.aggressive ?? def.behavior === 'aggressive') && !blind) {
        // Summoned minions of a passive kind still need eyes: at least 5 units.
        const range = m.aggressive ? Math.max(def.aggroRange, 5) : def.aggroRange;
        const seen = players.filter((p) => p.alive && !p.hidden && !inSafeZone(map, p) && dist(p, m) <= range).sort((a, b) => dist(a, m) - dist(b, m))[0];
        if (seen) { m.state = 'chase'; m.targetId = seen.id; m.goal = null; break; }
      }
      if (m.state === 'idle' && now >= m.nextActionAt) {
        const a = rng() * Math.PI * 2, r = def.wander.radius * Math.sqrt(rng());
        const goal = { x: m.home.x + Math.cos(a) * r, y: m.home.y + Math.sin(a) * r };
        // Wandering stays inside the monster's own spawn region (its allowed area).
        const area = map.spawnRegions?.find((r) => r.id === m.regionId)?.area;
        if (!isBlocked(map, goal.x, goal.y) && !inSafeZone(map, goal) && (!area || pointInRect(goal, area))) { m.goal = goal; m.state = 'wander'; }
        else m.nextActionAt = now + 500;
      } else if (m.state === 'wander' && m.goal) {
        if (moveToward(m, m.goal, step * 0.6, map)) {
          m.goal = null; m.state = 'idle';
          m.nextActionAt = now + def.wander.pauseMs[0] + rng() * (def.wander.pauseMs[1] - def.wander.pauseMs[0]);
        }
      }
      break;
    }
    case 'chase': {
      if (!target || dist(m, m.home) > def.leash || inSafeZone(map, target)) { giveUp(); break; }
      if (dist(m, target) <= def.attackRange) { m.state = 'attack'; break; }
      moveToward(m, target, step, map);
      break;
    }
    case 'attack': {
      if (!target || inSafeZone(map, target)) { giveUp(); break; }
      m.facing = target.x >= m.x ? 'east' : 'west';
      if (m.swingAt > 0) {
        if (now >= m.swingAt) {
          m.swingAt = 0;
          // The blow lands only if the target is still within reach (a little grace for latency).
          if (!blind && dist(m, target) <= def.attackRange * 1.25) events.push({ type: 'hit', monsterId: m.id, targetId: target.id });
        }
        break;
      }
      if (dist(m, target) > def.attackRange * 1.1) { m.state = 'chase'; break; }
      if (now - m.lastAttackAt >= def.attackDelayMs * (m.attackDelayMul ?? 1)) {
        m.lastAttackAt = now; m.swingAt = now + def.attackWindupMs;
        events.push({ type: 'swing', monsterId: m.id, targetId: target.id });
      }
      break;
    }
    case 'return': {
      // Walks home briskly, healing on the way like most MMORPG monsters; cannot be re-aggroed until home.
      // Heal Block (Santet) stops the usual healing on the way home.
      if (!rooted && moveToward(m, m.home, step * 1.5, map)) { m.state = 'idle'; if (!has('heal-block')) m.hp = def.hp; m.nextActionAt = now + 1000; }
      break;
    }
  }
  return events;
}
