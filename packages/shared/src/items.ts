// Item and inventory contract. Provisional: there is no server inventory yet; the client prototype runs on
// sample data (docs/design/ui-system.md). Pure functions here are shared so a future server can reuse them.

export const ITEM_CATEGORIES = ['consumable', 'equipment', 'material', 'etc', 'card', 'set', 'cash'] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export const RARITY_ORDER: Readonly<Record<ItemRarity, number>> = { common: 0, uncommon: 1, rare: 2, legendary: 3 };

export type StatId = 'atk' | 'matk' | 'def' | 'mdef' | 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk';

export interface ItemDefinition {
  id: string;
  name: { th: string; en: string };
  category: ItemCategory;
  rarity: ItemRarity;
  /** Weight per unit. */
  weight: number;
  maxStack: number;
  /** Sale price per unit, in silver. */
  sellPrice: number;
  description: string;
  /** Equipment only. */
  stats?: Partial<Record<StatId, number>>;
  /** Equipment slot this item is worn in (equipment with a visible layer: see equipment.ts). */
  equipSlot?: 'head' | 'body' | 'waist' | 'weapon' | 'offhand' | 'cloak' | 'shoes' | 'accessory1' | 'accessory2';
}

export interface InventoryStack {
  /** Unique per stack, so two stacks of one item stay distinct. */
  uid: string;
  itemId: string;
  quantity: number;
  /** Ordering key for "newest first". */
  acquiredAt: number;
}

export type InventoryFilter = 'all' | ItemCategory;
export type InventorySort = 'newest' | 'name' | 'quantity' | 'weight' | 'rarity';

export interface InventoryQuery { category: InventoryFilter; search: string; sort: InventorySort }

/** Filters by category and a case-insensitive Thai/English name search, then sorts. Unknown items are dropped. */
export function queryInventory(
  stacks: readonly InventoryStack[],
  items: Readonly<Record<string, ItemDefinition>>,
  query: InventoryQuery,
): InventoryStack[] {
  const needle = query.search.trim().toLowerCase();
  const matches = stacks.filter((stack) => {
    const item = items[stack.itemId];
    if (!item) return false;
    if (query.category !== 'all' && item.category !== query.category) return false;
    return !needle || item.name.th.toLowerCase().includes(needle) || item.name.en.toLowerCase().includes(needle);
  });
  const byName = (a: InventoryStack, b: InventoryStack) => items[a.itemId]!.name.th.localeCompare(items[b.itemId]!.name.th, 'th');
  const compare: Record<InventorySort, (a: InventoryStack, b: InventoryStack) => number> = {
    newest: (a, b) => b.acquiredAt - a.acquiredAt,
    name: byName,
    quantity: (a, b) => b.quantity - a.quantity || byName(a, b),
    weight: (a, b) => items[b.itemId]!.weight * b.quantity - items[a.itemId]!.weight * a.quantity || byName(a, b),
    rarity: (a, b) => RARITY_ORDER[items[b.itemId]!.rarity] - RARITY_ORDER[items[a.itemId]!.rarity] || byName(a, b),
  };
  return matches.sort(compare[query.sort]);
}

/** Total carried weight (quantity x unit weight), rounded to one decimal. */
export function inventoryWeight(stacks: readonly InventoryStack[], items: Readonly<Record<string, ItemDefinition>>): number {
  const total = stacks.reduce((sum, s) => sum + (items[s.itemId]?.weight ?? 0) * s.quantity, 0);
  return Math.round(total * 10) / 10;
}

/** One page of a list; page is clamped to the valid range (1-based). An empty list has one empty page. */
export function paginate<T>(list: readonly T[], page: number, perPage: number): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, Math.floor(page)), pages);
  return { items: list.slice((current - 1) * perPage, current * perPage), page: current, pages };
}

export interface StatComparison { stat: StatId; current: number; candidate: number; delta: number }

/** Stat-by-stat comparison of a candidate item against the equipped one (missing stats count as 0). */
export function compareStats(equipped: ItemDefinition | undefined, candidate: ItemDefinition): StatComparison[] {
  const stats = new Set<StatId>([
    ...(Object.keys(equipped?.stats ?? {}) as StatId[]),
    ...(Object.keys(candidate.stats ?? {}) as StatId[]),
  ]);
  return [...stats].map((stat) => {
    const current = equipped?.stats?.[stat] ?? 0;
    const value = candidate.stats?.[stat] ?? 0;
    return { stat, current, candidate: value, delta: value - current };
  });
}
