// Server-validated skill casting. The server checks that the skill is learned and active, runs the source cast time
// and cooldown, and cancels the cast when the caster walks. Since the starter hunting zone (2026-10-09) casts may
// carry a monster target; the effect (SP, damage, healing, slow) is applied on release by the server's combat system
// with the PROVISIONAL numbers in combat.ts. Without a target, offensive skills still cast but hit nothing.
import type { Facing } from './character.js';
import type { PlayerProfile } from './economy.js';
import type { MapDefinition, Position } from './world.js';
import { MEDIUM_PRESENTATION, SKILL_BEHAVIOR_POLICY } from './skill-system.js';

export interface SkillCastRule {
  /** Source cast time (ms); 0 = instant. */
  castMs: number;
  /** Source cooldown (ms), counted from the release. */
  cooldownMs: number;
  /**
   * Where the release effect is drawn. 'ahead' places it this many world units in front of the caster. This is a
   * provisional presentation point, not an approved skill range or a target.
   */
  aim: { kind: 'self' } | { kind: 'ahead'; units: number };
}

/** Cast and cooldown values come from docs/design/skills/medium-v1/design.json (source skill database). */
export const SKILL_CAST_RULES: Readonly<Record<string, SkillCastRule>> = {
  'spirit-bolt': { castMs: 1500, cooldownMs: 1000, aim: { kind: 'ahead', units: 5 } },
  'soul-heal': { castMs: 2000, cooldownMs: 2000, aim: { kind: 'self' } },
  'amulet-blast': { castMs: 1000, cooldownMs: 3000, aim: { kind: 'ahead', units: 3 } },
  'ghost-sight': { castMs: 0, cooldownMs: 30000, aim: { kind: 'self' } },
  'binding-thread': { castMs: 500, cooldownMs: 8000, aim: { kind: 'ahead', units: 3 } },
};

export type SkillCastError = 'bad-request' | 'unknown-skill' | 'not-castable' | 'not-learned' | 'busy' | 'moving' | 'cooldown'
  | 'no-sp' | 'no-target' | 'too-far' | 'dead';

export const SKILL_CAST_ERROR_TH: Readonly<Record<SkillCastError, string>> = {
  'bad-request': 'คำขอร่ายสกิลไม่ถูกต้อง',
  'unknown-skill': 'ไม่รู้จักสกิลนี้',
  'not-castable': 'สกิลนี้เป็นสกิลติดตัว ไม่ต้องกดใช้',
  'not-learned': 'ยังไม่ได้เรียนสกิลนี้ · เรียนได้ที่อาจารย์คง สำนักฝึกคาถา',
  busy: 'กำลังร่ายสกิลอื่นอยู่',
  moving: 'หยุดเดินก่อนจึงร่ายสกิลได้',
  cooldown: 'สกิลยังไม่พร้อม (คูลดาวน์)',
  'no-sp': 'SP ไม่พอ',
  'no-target': 'เป้าหมายหายไปแล้ว',
  'too-far': 'เป้าหมายอยู่ไกลเกินระยะร่าย',
  dead: 'หมดสติอยู่ ร่ายสกิลไม่ได้',
};

/** Synchronized cast event: start (cast pose and circle), release (effect), cancel (fade, no release). */
export interface SkillCastEvent {
  caster: string;
  skillId: string;
  phase: 'start' | 'release' | 'cancel';
  castMs: number;
  cooldownMs: number;
  facing: Facing;
  /** Caster feet and effect point, in world units. */
  x: number; y: number;
  aimX: number; aimY: number;
  /** The monster the skill was aimed at, when there was one. */
  targetId?: string;
}

export function parseSkillCastRequest(value: unknown): { skillId: string } | null {
  if (typeof value !== 'object' || value === null) return null;
  const skillId = (value as { skillId?: unknown }).skillId;
  return typeof skillId === 'string' && skillId.length > 0 && skillId.length <= 64 ? { skillId } : null;
}

/** Why `skillId` cannot start now, or null when it can. `cooldowns` holds ready-at times (ms). */
export function skillCastError(profile: PlayerProfile, skillId: string, now: number, state: { casting: boolean; moving: boolean }, cooldowns: Readonly<Record<string, number>>): SkillCastError | null {
  const presentation = MEDIUM_PRESENTATION[skillId];
  if (!presentation) return 'unknown-skill';
  if (!SKILL_BEHAVIOR_POLICY[presentation.behavior].hotbar || !SKILL_CAST_RULES[skillId]) return 'not-castable';
  if ((profile.skills[skillId] ?? 0) <= 0) return 'not-learned';
  if (state.casting) return 'busy';
  if (state.moving) return 'moving';
  if ((cooldowns[skillId] ?? 0) > now) return 'cooldown';
  return null;
}

const FACING_VECTOR: Readonly<Record<Facing, Position>> = {
  east: { x: 1, y: 0 }, 'south-east': { x: Math.SQRT1_2, y: Math.SQRT1_2 }, south: { x: 0, y: 1 },
  'south-west': { x: -Math.SQRT1_2, y: Math.SQRT1_2 }, west: { x: -1, y: 0 }, 'north-west': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  north: { x: 0, y: -1 }, 'north-east': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
};

/** The presentation point for a skill's release effect, kept inside the map. */
export function skillAimPoint(skillId: string, from: Position, facing: Facing, map: Pick<MapDefinition, 'width' | 'height'>): Position {
  const aim = SKILL_CAST_RULES[skillId]?.aim;
  if (!aim || aim.kind === 'self') return { x: from.x, y: from.y };
  const v = FACING_VECTOR[facing];
  return {
    x: Math.min(map.width - 1, Math.max(1, from.x + v.x * aim.units)),
    y: Math.min(map.height - 1, Math.max(1, from.y + v.y * aim.units)),
  };
}
