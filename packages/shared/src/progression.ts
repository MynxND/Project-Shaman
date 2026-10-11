// Character sheet contract for the status screen. PROVISIONAL: levels, point costs, stat caps and derived
// formulas are open design questions (docs/design-decisions.md). Rules here are placeholders that are easy to
// replace and are labelled as such in the UI.
import type { BodyType } from './character.js';
import type { ItemDefinition } from './items.js';

export const BASE_STATS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
export type BaseStat = (typeof BASE_STATS)[number];
export type BaseStats = Record<BaseStat, number>;

export const EQUIP_SLOTS = ['head', 'body', 'waist', 'weapon', 'offhand', 'cloak', 'shoes', 'accessory1', 'accessory2'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

/** Provisional: 1 status point per stat point, stats capped at 99. */
export const PROVISIONAL_STAT_COST = 1;
export const PROVISIONAL_STAT_CAP = 99;

export interface CharacterSheet {
  name: string;
  bodyType: BodyType;
  /** Stable class id, e.g. 'medium'. */
  classId: string;
  baseLevel: number;
  jobLevel: number;
  baseExp: { current: number; next: number };
  jobExp: { current: number; next: number };
  hp: { current: number; max: number };
  sp: { current: number; max: number };
  stats: BaseStats;
  statusPoints: number;
  skillPoints: number;
  equipment: Partial<Record<EquipSlot, string>>;
}

/** Status points needed to raise the stats by `pending` (only increases cost points). */
export function statPointCost(pending: Partial<BaseStats>): number {
  return BASE_STATS.reduce((sum, s) => sum + Math.max(0, pending[s] ?? 0) * PROVISIONAL_STAT_COST, 0);
}

/**
 * Applies a pending allocation if it is valid: whole non-negative increases only, within the cap, and affordable.
 * Returns the updated sheet, or an error code the UI can explain.
 */
export function applyStatPoints(sheet: CharacterSheet, pending: Partial<BaseStats>):
  { ok: true; sheet: CharacterSheet } | { ok: false; error: 'negative' | 'not-integer' | 'over-cap' | 'not-enough-points' } {
  for (const s of BASE_STATS) {
    const add = pending[s] ?? 0;
    if (!Number.isInteger(add)) return { ok: false, error: 'not-integer' };
    if (add < 0) return { ok: false, error: 'negative' };
    if (sheet.stats[s] + add > PROVISIONAL_STAT_CAP) return { ok: false, error: 'over-cap' };
  }
  const cost = statPointCost(pending);
  if (cost > sheet.statusPoints) return { ok: false, error: 'not-enough-points' };
  const stats = { ...sheet.stats };
  for (const s of BASE_STATS) stats[s] += pending[s] ?? 0;
  return { ok: true, sheet: { ...sheet, stats, statusPoints: sheet.statusPoints - cost } };
}

/** Bonus to each base stat from equipped items (items carry their bonuses in `stats`). */
export function equipmentBonus(equipment: CharacterSheet['equipment'], items: Readonly<Record<string, ItemDefinition>>): BaseStats {
  const bonus: BaseStats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  for (const itemId of Object.values(equipment)) {
    const item = itemId ? items[itemId] : undefined;
    for (const s of BASE_STATS) bonus[s] += item?.stats?.[s] ?? 0;
  }
  return bonus;
}
