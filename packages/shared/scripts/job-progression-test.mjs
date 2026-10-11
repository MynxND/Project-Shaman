import assert from 'node:assert/strict';
import { advanceJob, gainJobExp, jobExpToNext, JOB_PROGRESSION, learnSkill, migrateProfile, NATION_BRANCHES, newProfile, PROFILE_VERSION, QUESTS, questFor, SKILL_TREE, skillTree } from '../dist/index.js';

// Ragnarok-inspired job progression (user 2026-10-11; GAME_INTEGRATION_PLAN.md phase 1).
const p0 = newProfile({ x: 1, y: 1 });
assert.equal(p0.profileVersion, PROFILE_VERSION); assert.equal(p0.jobTier, 1); assert.equal(p0.jobLevel, 1); assert.equal(p0.branch, null);
// Migration: an old (v1) profile gains job fields, keeps skills and points.
const old = { ...p0, skills: { 'spirit-bolt': 3 }, skillPoints: 2 };
for (const k of ['profileVersion', 'jobTier', 'nation', 'branch', 'jobLevel', 'jobExp']) delete old[k];
const m = migrateProfile(old);
assert.equal(m.jobTier, 1); assert.equal(m.jobLevel, 1); assert.equal(m.skills['spirit-bolt'], 3); assert.equal(m.skillPoints, 2); assert.equal(m.profileVersion, PROFILE_VERSION);
// Registry: 10 Medium + 10 branches × 15; Japan invoked spells are not tree skills.
assert.equal(NATION_BRANCHES.length, 10);
assert.equal(skillTree(1, null).length, 10);
for (const b of NATION_BRANCHES) { assert.equal(skillTree(2, b.branch).length, 10, b.branch); assert.equal(skillTree(3, b.branch).length, 5, b.branch); }
assert.ok(!SKILL_TREE['steam-burst'] && SKILL_TREE['twin-shot']?.branch === 'ullr-hunter' && SKILL_TREE['ullrs-volley']?.tier === 3);
// Job EXP: 1 skill point per Job Level, capped at the tier max.
const p = migrateProfile(structuredClone(p0)); p.skillPoints = 0;
let total = 0; for (let l = 1; l < 10; l++) total += jobExpToNext(1, l);
assert.equal(gainJobExp(p, total + 9999), 9); assert.equal(p.jobLevel, JOB_PROGRESSION.maxJobLevel[1]); assert.equal(p.skillPoints, 9); assert.equal(gainJobExp(p, 500), 0);
// Learning: tier-2 skills locked while tier 1; Medium learnable.
assert.deepEqual(learnSkill(p, 'twin-shot'), { ok: false, error: 'skill-locked' });
assert.ok(learnSkill(p, 'soul-heal').ok);
// Advancement needs the quest; then pick a branch; Job Level resets; Base Level, skills and points stay.
assert.deepEqual(advanceJob(p, 'ullr-hunter'), { ok: false, error: 'job-quest-missing' });
assert.equal(questFor(p, 'elder')?.id === 'first-steps' || questFor(p, 'elder')?.id === 'job-apprentice-trial', true);
p.quests['job-apprentice-trial'] = { step: 2, done: true };
assert.deepEqual(advanceJob(p, 'not-a-branch'), { ok: false, error: 'bad-branch' });
const a = advanceJob({ ...p, level: 12 }, 'ullr-hunter');
assert.ok(a.ok); const h = a.profile;
assert.equal(h.jobTier, 2); assert.equal(h.nation, 'no'); assert.equal(h.branch, 'ullr-hunter'); assert.equal(h.jobLevel, 1); assert.equal(h.level, 12);
assert.equal(h.skills['spirit-bolt'], p.skills['spirit-bolt']); assert.equal(h.skillPoints, 9);
// Now the Hunter tree opens, other branches and tier 3 stay locked; job quests only for the matching branch.
assert.ok(learnSkill(h, 'twin-shot').ok);
assert.deepEqual(learnSkill(h, 'frost-bolt'), { ok: false, error: 'skill-locked' });
assert.deepEqual(learnSkill(h, 'ullrs-volley'), { ok: false, error: 'skill-locked' });
assert.ok(QUESTS['job-trial-ullr-hunter'] && QUESTS['job-trial-rune-seer']);
assert.deepEqual(advanceJob(h), { ok: false, error: 'job-level-low' });
h.jobLevel = JOB_PROGRESSION.advanceAt[2]; h.quests['job-trial-ullr-hunter'] = { step: 3, done: true };
const t3 = advanceJob(h); assert.ok(t3.ok); assert.equal(t3.profile.jobTier, 3); assert.equal(t3.profile.jobLevel, 1);
assert.ok(learnSkill(t3.profile, 'ullrs-volley').ok);
assert.deepEqual(advanceJob(t3.profile), { ok: false, error: 'max-tier' });
console.log('job progression: migration, registry, job EXP/points, locks, quests, advancement tiers 1→2→3 passed');
