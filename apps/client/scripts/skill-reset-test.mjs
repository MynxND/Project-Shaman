// Skill reset for Silver (economy.ts SKILL_RESET, provisional price): refunds every learned level except the free
// starting Spirit Bolt Lv 1, charges max(minSilver, points × silverPerPoint), refuses with nothing to refund or too
// little Silver. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { newProfile, resetSkills, skillResetCost, SKILL_RESET, WHISPERING_SPIRITWOOD } from '../../../packages/shared/dist/index.js';

const fresh = newProfile(WHISPERING_SPIRITWOOD.spawn);
assert.deepEqual(skillResetCost(fresh), { points: 0, silver: 0 }, 'a new character has nothing to reset');
assert.equal(resetSkills(fresh).ok, false);
assert.equal(resetSkills(fresh).error, 'nothing-to-reset');

const learned = { ...structuredClone(fresh), silver: 5000, skillPoints: 2, skills: { 'spirit-bolt': 4, 'amulet-blast': 3, meditation: 2 } };
const cost = skillResetCost(learned);
assert.equal(cost.points, 3 + 3 + 2, 'Spirit Bolt Lv 1 stays free');
assert.equal(cost.silver, Math.max(SKILL_RESET.minSilver, 8 * SKILL_RESET.silverPerPoint));
const out = resetSkills(learned);
assert.ok(out.ok);
assert.deepEqual(out.profile.skills, { 'spirit-bolt': 1 });
assert.equal(out.profile.skillPoints, 2 + 8);
assert.equal(out.profile.silver, 5000 - cost.silver);

const small = { ...structuredClone(fresh), silver: 5000, skills: { 'spirit-bolt': 2 } };
assert.equal(skillResetCost(small).silver, SKILL_RESET.minSilver, 'minimum price for a small reset');
const poor = { ...structuredClone(learned), silver: cost.silver - 1 };
assert.equal(resetSkills(poor).error, 'not-enough-silver');
console.log('skill reset: refund all but the free Spirit Bolt, Silver price + minimum, nothing-to-reset and not-enough-silver refusals passed');
