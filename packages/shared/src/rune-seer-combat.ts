// Rune Seer (Norway) combat rules for the authoritative server (game integration slice 2, user 2026-10-11).
// Catalogue formulas (skills-norway.ts, Rune Cast rework) written once as code. PROVISIONAL inputs are documented in
// docs/design/combat/RUNE_SEER_COMBAT.md (SP, ranges, knockback/shield/crit sizes where the text is open).
import type { NorseRune } from './skills-norway.js';
import { iceWallSpec } from './skills-norway.js';
import type { MapDefinition, Rect } from './world.js';

export const NORSE_RUNES: readonly NorseRune[] = ['ice', 'storm', 'fate', 'hearth'];
/** Rune glyph art (norway-v1) per queue rune. */
export const RUNE_ART: Readonly<Record<NorseRune, string>> = { ice: 'rune-isa', storm: 'rune-hagalaz', fate: 'rune-perthro', hearth: 'rune-kenaz' };
export const RUNE_TH: Readonly<Record<NorseRune, string>> = { ice: 'ᛁ น้ำแข็ง', storm: 'ᚺ พายุ', fate: 'ᛈ ชะตา', hearth: 'ᚲ เตาไฟ' };

/** Spells that consume the front rune (Rune Cast hook) — Shatter Rune consumes the whole queue. */
export const RUNE_SPELLS = new Set(['frost-bolt', 'blizzard-storm', 'shatter-rune']);
/** Water/ice spells (Frost Mastery, Rune Mastery cooldown, Frost Penetration). */
export const WATER_SPELLS = new Set(['frost-bolt', 'blizzard-storm', 'fimbulwinter', 'shatter-rune', 'absolute-zero-field', 'ice-wall']);
/** Ground-placed skills (Rune Reading: cast time −4% × Lv). */
export const GROUND_SPELLS = new Set(['blizzard-storm', 'ice-wall', 'rune-trap']);

export const RUNE_SEER = {
  /** Queue length the server keeps; the seer sees 3 (4 with Rune Reading). */
  queueLength: 4,
  visibleRunes: (readingLv: number) => (readingLv > 0 ? 4 : 3),
  /** Rune effects: ice = freeze chance ×2; storm = knockback 2 cells (single target) / area +1 cell; fate = magic crit
   *  + refund 20% of the SP cost; hearth = shield 5% Max HP on the caster. */
  stormKnockback: 2,
  stormArea: 1,
  fateCritMultiplier: 1.5,
  fateRefund: 0.2,
  hearthShield: 0.05,
  /** PROVISIONAL: a hearth shield lasts this long. */
  shieldMs: 10000,
  /** Frost Bolt: MATK × (1.5 + Lv × 0.3); freeze 5% + 1% × Lv for 3 s (+0.5 s × Winter's Grasp Lv). */
  frostBolt: (matk: number, lv: number) => matk * (1.5 + lv * 0.3),
  freezeChance: (lv: number) => 0.05 + 0.01 * lv,
  freezeMs: (graspLv: number) => 3000 + 500 * graspLv,
  /** Blizzard: 7×7 cells, MATK × (1.0 + Lv × 0.2) every 0.5 s for 5 s, slow 20% + 3% × Lv. */
  blizzard: (matk: number, lv: number) => matk * (1 + lv * 0.2),
  blizzardCells: 7, blizzardTickMs: 500, blizzardMs: 5000,
  blizzardSlow: (lv: number) => 1 - (0.2 + 0.03 * lv),
  /** Runestone: 2 stones for 60 s; spells cast within 3 cells repeat the front rune's effect once. */
  stoneLimit: 2, stoneMs: 60000, stoneRadius: 3,
  /** Cast the Lots (Prophecy): 3 new runes, reorder freely for `lotsMs`; next 3 rune spells +5% × Lv (10% × Lv ÷ 2). */
  lotsMs: 10000, lotsSpells: 3, lotsBonus: (lv: number) => 0.05 * lv,
  /** Shatter Rune: MATK × (10 + Lv × 2), +15% per rune consumed (whole queue); a frozen target ignores MDEF. */
  shatter: (matk: number, lv: number, runes: number) => matk * (10 + lv * 2) * (1 + 0.15 * runes),
  /** Absolute Zero Field: freeze 2 + Lv × 0.6 s, works on bosses. */
  absoluteZeroMs: (lv: number) => Math.round((2 + lv * 0.6) * 1000),
  /** Fimbulwinter: 15 cells around the caster, MATK × (2 + Lv × 0.5) every second for 10 s, slow 90%; every drawn rune is ice. */
  fimbulwinter: (matk: number, lv: number) => matk * (2 + lv * 0.5),
  fimbulCells: 15, fimbulTickMs: 1000, fimbulMs: 10000, fimbulSlow: 0.1,
  /** Passives. */
  frostMastery: (lv: number) => 1 + 0.025 * lv,
  groundCast: (readingLv: number) => 1 - 0.04 * readingLv,
  chillingAura: { radius: 3, aspd: (lv: number) => 1 + 0.03 * lv },
  frozenMdef: (graspLv: number) => (graspLv > 0 ? 0.8 : 1),
  runeMasteryCd: (lv: number) => 1 - 0.06 * lv,
  /** Rune Mastery: change the front rune once every 10 s. */
  runeSetMs: 10000,
  frostPenetration: (lv: number) => 0.1 * lv,
  /** PROVISIONAL Ice Wall break: monsters pressed against the wall hit it with their attack. */
  wall: iceWallSpec,
};

export function drawRune(rng: () => number, fimbulwinter = false): NorseRune {
  return fimbulwinter ? 'ice' : NORSE_RUNES[Math.floor(rng() * NORSE_RUNES.length) % NORSE_RUNES.length]!;
}

/** Cells of an Ice Wall centred on `at`, perpendicular to the cast direction (caster → at), one per unit. */
export function iceWallCells(from: { x: number; y: number }, at: { x: number; y: number }, level: number): { x: number; y: number }[] {
  const n = RUNE_SEER.wall(level).lengthCells;
  const dx = at.x - from.x, dy = at.y - from.y, d = Math.hypot(dx, dy) || 1;
  const px = -dy / d, py = dx / d;
  return Array.from({ length: n }, (_, i) => { const o = i - (n - 1) / 2; return { x: at.x + px * o, y: at.y + py * o }; });
}

/** A walkable view of `map` with extra square blockers (Ice Wall cells, 1×1 unit) for movement checks. */
export function withBlockers(map: MapDefinition, cells: readonly { x: number; y: number }[]): MapDefinition {
  if (!cells.length) return map;
  const rects: Rect[] = cells.map((c) => ({ x: c.x - 0.5, y: c.y - 0.5, w: 1, h: 1 }));
  return { ...map, blockers: [...map.blockers, ...rects] };
}
