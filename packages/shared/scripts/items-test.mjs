// Behavioural checks for the inventory query helpers. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { compareStats, inventoryWeight, paginate, queryInventory } from '../dist/index.js';

const items = {
  potion: { id: 'potion', name: { th: 'ยาฟื้นพลัง', en: 'Healing Tonic' }, category: 'consumable', rarity: 'common', weight: 0.5, maxStack: 99, sellPrice: 10, description: '' },
  bone: { id: 'bone', name: { th: 'กระดูก', en: 'Bone' }, category: 'material', rarity: 'common', weight: 1, maxStack: 99, sellPrice: 2, description: '' },
  sash: { id: 'sash', name: { th: 'ผ้าคาดเอว', en: 'Sash' }, category: 'equipment', rarity: 'rare', weight: 10, maxStack: 1, sellPrice: 300, description: '', stats: { def: 12, int: 2 } },
  sash2: { id: 'sash2', name: { th: 'ผ้าคาดเอววิญญาณ', en: 'Spirit Sash' }, category: 'equipment', rarity: 'legendary', weight: 10, maxStack: 1, sellPrice: 900, description: '', stats: { def: 25, mdef: 15 } },
};
const stacks = [
  { uid: 'a', itemId: 'potion', quantity: 25, acquiredAt: 1 },
  { uid: 'b', itemId: 'bone', quantity: 3, acquiredAt: 3 },
  { uid: 'c', itemId: 'sash2', quantity: 1, acquiredAt: 2 },
  { uid: 'd', itemId: 'missing', quantity: 1, acquiredAt: 4 },
];
const q = (o) => queryInventory(stacks, items, { category: 'all', search: '', sort: 'newest', ...o }).map((s) => s.uid);
assert.deepEqual(q({}), ['b', 'c', 'a'], 'newest first, unknown items dropped');
assert.deepEqual(q({ category: 'equipment' }), ['c']);
assert.deepEqual(q({ search: 'TONIC' }), ['a'], 'English search is case-insensitive');
assert.deepEqual(q({ search: 'กระดูก' }), ['b'], 'Thai search');
assert.deepEqual(q({ sort: 'quantity' }), ['a', 'b', 'c']);
assert.deepEqual(q({ sort: 'rarity' }), ['c', 'b', 'a'], 'rarest first, ties by Thai name (กระดูก before ยาฟื้นพลัง)');
assert.deepEqual(q({ sort: 'weight' }), ['a', 'c', 'b'], 'heaviest stack first (12.5, 10, 3)');
assert.equal(inventoryWeight(stacks, items), 25.5, 'unknown items weigh nothing');
assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), { items: [3, 4], page: 2, pages: 3 });
assert.deepEqual(paginate([1, 2, 3], 9, 2), { items: [3], page: 2, pages: 2 }, 'page clamps');
assert.deepEqual(paginate([], 1, 54), { items: [], page: 1, pages: 1 });
const cmp = Object.fromEntries(compareStats(items.sash, items.sash2).map((c) => [c.stat, c.delta]));
assert.deepEqual(cmp, { def: 13, int: -2, mdef: 15 });
assert.deepEqual(compareStats(undefined, items.sash).map((c) => c.delta), [12, 2], 'nothing equipped compares against 0');
console.log('inventory helpers: ok');
