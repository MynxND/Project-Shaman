export * from './hair-collection.js';
export const GAME_ROOM = 'game';
export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'disconnected';
/**
 * Movement intent. A stop (x = y = 0) may carry stopAt, the client's predicted resting point; the server
 * accepts it only when it is close to its own position and walkable (see acceptStopAt), so a stop does not
 * slide by the network latency.
 */
export interface MovementInput { x: number; y: number; sequence: number; stopAt?: { x: number; y: number } }
export type NationId = 'th' | 'cn' | 'jp' | 'kr' | 'id' | 'ph' | 'no' | 'ie' | 'ru' | 'us' | 'ht' | 'mx';
export interface SkillDefinition {
  id: string; classId: string; name: string; jobTier: 1 | 2 | 3;
  /** Required central behavior/VFX definition; kind is only the source/tree label. */
  presentation: import('./skill-system.js').SkillPresentation;
  kind: 'active' | 'passive'; maxLevel: number;
  prerequisites: readonly { skillId: string; level: number }[] | null;
  castTimeMs: number | null; cooldownMs: number | null;
  rangeWorldUnits: number | null; effectIds: readonly string[];
}
// null represents an unresolved design decision, never a free/unlimited value.
export function isMovementInput(value: unknown): value is MovementInput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.x === 'number' && Number.isFinite(v.x) && Math.abs(v.x) <= 1
    && typeof v.y === 'number' && Number.isFinite(v.y) && Math.abs(v.y) <= 1
    && typeof v.sequence === 'number' && Number.isSafeInteger(v.sequence) && v.sequence >= 0
    && (v.stopAt === undefined || isStopAt(v.stopAt, v.x, v.y));
}
function isStopAt(value: unknown, x: unknown, y: unknown): boolean {
  if (x !== 0 || y !== 0 || typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return typeof p.x === 'number' && Number.isFinite(p.x) && typeof p.y === 'number' && Number.isFinite(p.y);
}
export * from './character.js';
export * from './world.js';
export * from './maps/umbral-capital.js';
export * from './maps/whispering-spiritwood.js';
export * from './maps/index.js';
export * from './facing.js';
export * from './items.js';
export * from './progression.js';
export * from './market.js';
export * from './stick.js';
export * from './minimap.js';
export * from './npc.js';
export * from './citizens.js';
export * from './catalog.js';
export * from './economy.js';
export * from './skill-system.js';
export * from './skill-cast.js';
export * from './combat.js';
export * from './equipment.js';
export * from './monster-ai.js';
export * from './modular-character.js';
export * from './head-rig.js';
export * from './character-foundation.js';
export * from './character-v2.js';
export * from './head-appearance.js';
export * from './sprite-rig.js';
export * from './skills-thailand.js';
export * from './skills-indonesia.js';
export * from './skills-russia.js';
export * from './skills-japan.js';
export * from './skill-circles.js';
export * from './skills-norway.js';
export * from './skill-registry.js';
export * from './job-progression.js';
export * from './hunter-combat.js';

export * from './rune-seer-combat.js';
export * from './japan-combat.js';
