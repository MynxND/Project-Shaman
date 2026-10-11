// Server-validated skill casting. The server checks that the skill is learned and active, runs the source cast time
// and cooldown, and cancels the cast when the caster walks. Since the starter hunting zone (2026-10-09) casts may
// carry a monster target; the effect (SP, damage, healing, slow) is applied on release by the server's combat system
// with the PROVISIONAL numbers in combat.ts. Without a target, offensive skills still cast but hit nothing.
import type { Facing } from './character.js';
import type { PlayerProfile } from './economy.js';
import type { MapDefinition, Position } from './world.js';
import { SKILL_BEHAVIOR_POLICY } from './skill-system.js';
import { SKILL_COMBAT } from './combat.js';
import { NATION_SKILL_INDEX, SKILL_TREE } from './skill-registry.js';
import { castsWhileMoving, HUNTER, hunterRange } from './hunter-combat.js';
import { GROUND_SPELLS, RUNE_SEER, WATER_SPELLS } from './rune-seer-combat.js';

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

export type SkillCastError = 'bad-request' | 'unknown-skill' | 'not-castable' | 'not-in-game' | 'not-learned' | 'no-talisman' | 'busy' | 'moving' | 'cooldown'
  | 'no-sp' | 'no-target' | 'too-far' | 'dead';

export const SKILL_CAST_ERROR_TH: Readonly<Record<SkillCastError, string>> = {
  'bad-request': 'คำขอร่ายสกิลไม่ถูกต้อง',
  'unknown-skill': 'ไม่รู้จักสกิลนี้',
  'not-castable': 'สกิลนี้เป็นสกิลติดตัว ไม่ต้องกดใช้',
  'not-in-game': 'สกิลนี้ยังไม่เปิดใช้ในเกม · กำลังเชื่อมระบบทีละสาย',
  'no-talisman': 'ต้องถือยันต์ 2 ใบก่อน Invoke',
  'not-learned': 'ยังไม่ได้เรียนสกิลนี้ · เปิดหน้าต่างสกิล (K) เพื่อเรียน',
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
  /** Chosen variant (Rune Trap Kit rune: snare / freeze / blast / flash). */
  variant?: string;
  /** Cast through Invoke (Onmyoji): the skill is the invoked spell; the Invoke button cools down for invokeCdMs. */
  invoke?: boolean; invokeCdMs?: number;
}

/** Combat use of a nation skill: SP, world range (units), what it aims at. PROVISIONAL (the catalogue leaves SP and
 *  world ranges open; Twin Shot's "range 9" is the catalogue value). Only skills whose effects run on the server are
 *  listed — every other nation skill answers 'not-in-game' until its slice lands. */
export type SkillAim = 'enemy' | 'self' | 'area' | 'ground' | 'dash';
export interface SkillCombatSpec { sp: number; range: number; target: SkillAim; areaRadius?: number; variants?: readonly string[] }
export const NATION_SKILL_COMBAT: Readonly<Record<string, SkillCombatSpec>> = {
  'twin-shot': { sp: 9, range: 9, target: 'enemy' },
  'falcon-strike': { sp: 12, range: 9, target: 'enemy' },
  'ski-dash': { sp: 10, range: 0, target: 'dash' },
  'rune-trap-kit': { sp: 10, range: 6, target: 'ground', areaRadius: 1.5, variants: ['snare', 'freeze', 'blast', 'flash'] },
  'charged-rune-arrow': { sp: 22, range: 10, target: 'enemy' },
  'ullrs-volley': { sp: 45, range: 12, target: 'self', areaRadius: 12 },
  'great-hunt': { sp: 50, range: 0, target: 'self' },
  'falcon-storm': { sp: 45, range: 10, target: 'enemy', areaRadius: 2.5 },
  // Rune Seer (slice 2): PROVISIONAL SP and ranges.
  'frost-bolt': { sp: 12, range: 9, target: 'enemy' },
  'blizzard-storm': { sp: 32, range: 9, target: 'ground', areaRadius: 3.5 },
  'ice-wall': { sp: 25, range: 7, target: 'ground' },
  'rune-trap': { sp: 15, range: 6, target: 'ground', areaRadius: 3 },
  prophecy: { sp: 20, range: 0, target: 'self' },
  'shatter-rune': { sp: 35, range: 9, target: 'enemy' },
  'absolute-zero-field': { sp: 40, range: 9, target: 'enemy' },
  fimbulwinter: { sp: 80, range: 0, target: 'self', areaRadius: 7.5 },
  // Japan (slice 3): PROVISIONAL SP and ranges. Talismans fill the ring; invoked spells are cast through 'invoke'.
  ...Object.fromEntries(['wood', 'fire', 'earth', 'metal', 'water'].map((e) => [e + '-talisman', { sp: 2, range: 0, target: 'self' } as SkillCombatSpec])),
  'bonfire-ward': { sp: 18, range: 7, target: 'ground', areaRadius: 2.5 },
  'ash-barrier': { sp: 18, range: 6, target: 'ground', areaRadius: 2.5 },
  'kongo-talisman': { sp: 15, range: 0, target: 'self' },
  'mirror-pond': { sp: 15, range: 7, target: 'ground', areaRadius: 1.5 },
  'spring-rain': { sp: 25, range: 6, target: 'ground', areaRadius: 3.5 },
  'root-fissure': { sp: 16, range: 7, target: 'enemy' },
  mudslide: { sp: 18, range: 5, target: 'enemy' },
  'steam-burst': { sp: 20, range: 9, target: 'enemy' },
  'molten-swallows': { sp: 16, range: 9, target: 'enemy' },
  'leaf-blade-storm': { sp: 24, range: 8, target: 'ground', areaRadius: 2.5 },
  ...Object.fromEntries(['kodama', 'kitsune', 'nurikabe', 'kamaitachi', 'mizuchi'].map((k) => ['summon-' + k, { sp: 30, range: 0, target: 'self' } as SkillCombatSpec])),
  'gogyo-mandala': { sp: 40, range: 0, target: 'self' },
  'gogyo-ring-seal': { sp: 50, range: 0, target: 'self', areaRadius: 5.5 },
  'shikigami-ascension': { sp: 40, range: 0, target: 'self' },
  'harae-sweep': { sp: 10, range: 0, target: 'self' },
  'kagura-purification-dance': { sp: 25, range: 0, target: 'self', areaRadius: 4.5 },
  'suzu-bell-blessing': { sp: 12, range: 0, target: 'self' },
  'ofuda-ward-shot': { sp: 10, range: 8, target: 'enemy' },
  'cleansing-rain': { sp: 40, range: 0, target: 'self', areaRadius: 7.5 },
  'divine-miracle-resurrection': { sp: 100, range: 0, target: 'self', areaRadius: 7.5 },
  'kotodama-sacred-song': { sp: 50, range: 0, target: 'self', areaRadius: 5.5 },
  'sun-pillar': { sp: 45, range: 7, target: 'ground', areaRadius: 2.5 },
};
/** Combat spec of any castable skill (Medium or nation). */
export function combatSpec(skillId: string): SkillCombatSpec | undefined { return SKILL_COMBAT[skillId] ?? NATION_SKILL_COMBAT[skillId]; }
/** Range for this caster, with passives that extend it (Bow Mastery). */
export function skillRange(skillId: string, skills: Readonly<Record<string, number>>): number {
  const spec = combatSpec(skillId);
  return spec ? hunterRange(skillId, spec.range, skills) : 0;
}
/** Cast rule of any castable skill: Medium source values, else the nation catalogue's cast and cooldown. */
export function castRule(skillId: string, skills: Readonly<Record<string, number>> = {}): SkillCastRule | undefined {
  const medium = SKILL_CAST_RULES[skillId];
  if (medium) return medium;
  const k = NATION_SKILL_INDEX[skillId];
  if (!k || !NATION_SKILL_COMBAT[skillId]) return undefined;
  let castMs = skillId === 'charged-rune-arrow' ? HUNTER.chargedCastMs(skills['rune-arrow-mastery'] ?? 0) : k.castMs ?? 0;
  // Rune Reading: ground spells cast faster; Rune Mastery: water/ice spells cool down faster.
  if (GROUND_SPELLS.has(skillId)) castMs = Math.round(castMs * RUNE_SEER.groundCast(skills['rune-reading'] ?? 0));
  const cooldownMs = Math.round((k.cooldownMs ?? 0) * (WATER_SPELLS.has(skillId) ? RUNE_SEER.runeMasteryCd(skills['rune-mastery'] ?? 0) : 1));
  return { castMs, cooldownMs, aim: NATION_SKILL_COMBAT[skillId]!.target === 'ground' ? { kind: 'ahead', units: 3 } : { kind: 'self' } };
}

export function parseSkillCastRequest(value: unknown): { skillId: string; variant?: string } | null {
  if (typeof value !== 'object' || value === null) return null;
  const { skillId, variant } = value as { skillId?: unknown; variant?: unknown };
  if (!(typeof skillId === 'string' && skillId.length > 0 && skillId.length <= 64)) return null;
  const spec = NATION_SKILL_COMBAT[skillId];
  return typeof variant === 'string' && spec?.variants?.includes(variant) ? { skillId, variant } : { skillId };
}

/** Why `skillId` cannot start now, or null when it can. `cooldowns` holds ready-at times (ms). */
export function skillCastError(profile: PlayerProfile, skillId: string, now: number, state: { casting: boolean; moving: boolean }, cooldowns: Readonly<Record<string, number>>): SkillCastError | null {
  const tree = SKILL_TREE[skillId];
  if (!tree) return 'unknown-skill';
  if (!SKILL_BEHAVIOR_POLICY[tree.behavior].hotbar) return 'not-castable';
  if (!castRule(skillId)) return 'not-in-game';
  if ((profile.skills[skillId] ?? 0) <= 0) return 'not-learned';
  if (state.casting) return 'busy';
  if (state.moving && !castsWhileMoving(skillId, profile.skills)) return 'moving';
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
  const aim = castRule(skillId)?.aim;
  if (!aim || aim.kind === 'self') return { x: from.x, y: from.y };
  const v = FACING_VECTOR[facing];
  return {
    x: Math.min(map.width - 1, Math.max(1, from.x + v.x * aim.units)),
    y: Math.min(map.height - 1, Math.max(1, from.y + v.y * aim.units)),
  };
}
