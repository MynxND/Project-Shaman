// NPC service rules (server-authoritative). Run after `pnpm build`.
import assert from 'node:assert/strict';
import { acceptQuest, buy, carriedWeight, heal, learnSkill, moveStack, newProfile, QUESTS, questEvent, refine, refineQuote, sell, setSavePoint, teleport } from '../dist/index.js';

const p0 = newProfile({ x: 40, y: 36 });
assert.equal(p0.silver, 3000);
let r = buy(p0, 'herbalist', 'potion-red', 4, 1);
assert.ok(r.ok); assert.equal(r.profile.silver, 3000 - 200);
assert.equal(r.profile.stacks.filter((s) => s.itemId === 'potion-red').reduce((n, s) => n + s.quantity, 0), 9, 'topped up the existing stack');
assert.equal(p0.silver, 3000, 'pure: input untouched');
assert.deepEqual(buy(p0, 'herbalist', 'bronze-amulet', 1, 1), { ok: false, error: 'not-sold-here' });
assert.deepEqual(buy(p0, 'herbalist', 'potion-red', 0, 1), { ok: false, error: 'bad-quantity' });
assert.deepEqual(buy(p0, 'talisman', 'spirit-sash', 1, 1), { ok: false, error: 'not-enough-silver' });
assert.deepEqual(buy({ ...p0, silver: 1e9 }, 'talisman', 'dark-ore', 300, 1), { ok: false, error: 'too-heavy' });

const potion = r.profile.stacks.find((s) => s.itemId === 'potion-red');
r = sell(r.profile, potion.uid, 2);
assert.ok(r.ok); assert.equal(r.profile.silver, 2800 + 30);
assert.deepEqual(sell(r.profile, potion.uid, 99), { ok: false, error: 'bad-quantity' });

const sash = r.profile.stacks.find((s) => s.itemId === 'shaman-sash');
r = moveStack(r.profile, sash.uid, true);
assert.ok(r.ok && r.profile.storage.length === 1 && !r.profile.stacks.some((s) => s.uid === sash.uid));
r = moveStack(r.profile, sash.uid, false);
assert.ok(r.ok && r.profile.storage.length === 0);

assert.deepEqual(refine(r.profile, sash.uid, 0), { ok: false, error: 'missing-material' });
r = buy(r.profile, 'talisman', 'dark-ore', 2, 2);
const before = r.profile.silver;
r = refine(r.profile, sash.uid, 0.99);
assert.ok(r.ok); assert.equal(r.profile.refine[sash.uid], 1, 'levels 0-3 always succeed');
assert.equal(r.profile.silver, before - refineQuote(0).silver);
assert.equal(refineQuote(6).chance < 1, true);
const fail = refine({ ...r.profile, refine: { [sash.uid]: 6 }, silver: 1e6, stacks: [...r.profile.stacks, { uid: 'ore', itemId: 'dark-ore', quantity: 9, acquiredAt: 0 }] }, sash.uid, 0.999);
assert.ok(fail.ok && fail.profile.refine[sash.uid] === 6, 'failure keeps the level');
assert.deepEqual(refine(r.profile, potion.uid, 0), { ok: false, error: 'not-equipment' });

assert.equal(heal(p0).profile.hp, p0.hpMax);
assert.deepEqual(setSavePoint(p0, { x: 3, y: 4 }).profile.savePoint, { x: 3, y: 4 });
r = learnSkill(p0, 'spirit-bolt');
assert.ok(r.ok && r.profile.skills['spirit-bolt'] === 2 && r.profile.skillPoints === 2);
assert.deepEqual(learnSkill({ ...p0, skillPoints: 0 }, 'soul-heal'), { ok: false, error: 'no-skill-points' });
assert.deepEqual(learnSkill({ ...p0, skills: { 'vessel-body': 5 } }, 'vessel-body'), { ok: false, error: 'skill-max' });

// Quest: accept, visit the tree, talk to the herbalist, return to the elder.
r = acceptQuest(p0, 'first-steps');
assert.ok(r.ok);
assert.equal(questEvent(r.profile, { kind: 'talk', npc: 'herbalist' }, 0), null, 'steps happen in order');
const tree = QUESTS['first-steps'].steps[0];
r = questEvent(r.profile, { kind: 'visit', at: { x: tree.x + 1, y: tree.y } }, 0);
r = questEvent(r.profile, { kind: 'talk', npc: 'herbalist' }, 0);
const silver = r.profile.silver;
r = questEvent(r.profile, { kind: 'talk', npc: 'elder' }, 0);
assert.ok(r.ok && r.profile.quests['first-steps'].done);
assert.equal(r.profile.silver, silver + 1500);
assert.deepEqual(acceptQuest(r.profile, 'first-steps'), { ok: false, error: 'quest-done' });

const t = teleport(p0, 'market');
assert.ok(t.ok && t.to.x === 62 && t.profile.silver === 2900);
assert.deepEqual(teleport(p0, 'save').to, { x: 40, y: 36 });
assert.ok(carriedWeight(p0.stacks) > 0);
console.log('economy and NPC services: ok');
