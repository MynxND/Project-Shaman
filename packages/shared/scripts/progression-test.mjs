// Behavioural checks for the provisional character sheet rules. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { applyStatPoints, equipmentBonus, statPointCost, PROVISIONAL_STAT_CAP } from '../dist/index.js';

const sheet = {
  name: 'test', bodyType: 'male', classId: 'medium', baseLevel: 10, jobLevel: 5,
  baseExp: { current: 0, next: 100 }, jobExp: { current: 0, next: 100 }, hp: { current: 1, max: 1 }, sp: { current: 1, max: 1 },
  stats: { str: 1, agi: 1, vit: 1, int: 10, dex: 1, luk: 98 }, statusPoints: 5, skillPoints: 0, equipment: {},
};
assert.equal(statPointCost({ str: 2, int: 1 }), 3);
const ok = applyStatPoints(sheet, { str: 2, int: 3 });
assert.equal(ok.ok, true);
assert.deepEqual([ok.sheet.stats.str, ok.sheet.stats.int, ok.sheet.statusPoints], [3, 13, 0]);
assert.equal(sheet.stats.str, 1, 'original sheet is not mutated');
assert.deepEqual(applyStatPoints(sheet, { str: 6 }), { ok: false, error: 'not-enough-points' });
assert.deepEqual(applyStatPoints(sheet, { str: -1 }), { ok: false, error: 'negative' });
assert.deepEqual(applyStatPoints(sheet, { str: 0.5 }), { ok: false, error: 'not-integer' });
assert.deepEqual(applyStatPoints(sheet, { luk: PROVISIONAL_STAT_CAP }), { ok: false, error: 'over-cap' });
assert.equal(applyStatPoints(sheet, { luk: 1 }).ok, true, 'reaching the cap exactly is allowed');
const items = { a: { stats: { int: 2, def: 9 } }, b: { stats: { luk: 2 } } };
assert.deepEqual(equipmentBonus({ waist: 'a', accessory1: 'b', head: 'missing' }, items), { str: 0, agi: 0, vit: 0, int: 2, dex: 0, luk: 2 });
console.log('progression helpers: ok');
