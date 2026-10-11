import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NORWAY_BRANCHES, NORWAY_NEW_VFX, NORWAY_PRESENTATION, NORWAY_SKILLS, SKILL_BEHAVIOR_POLICY, validateSkillPresentation } from '../dist/index.js';

// Norway catalogue (docs/design/skills/norway-v1): Rune Seer from the source tree (Rune Cast rework), Ullr Hunter new.
const source = readFileSync(new URL('../../../docs/design/skill-database-source.txt', import.meta.url), 'utf8').split('\n');
const design = readFileSync(new URL('../../../docs/design/skills/norway-v1/NORWAY_DESIGN.md', import.meta.url), 'utf8');
for (const branch of ['rune-seer', 'ullr-hunter']) {
  const list = NORWAY_SKILLS.filter((k) => k.branch === branch);
  assert.equal(list.filter((k) => k.jobTier === 2).length, 10, branch);
  assert.equal(list.filter((k) => k.jobTier === 3).length, 5, branch);
  assert.ok(NORWAY_BRANCHES[branch].range && NORWAY_BRANCHES[branch].signature, branch + ' range/signature');
}
assert.equal(new Set(NORWAY_SKILLS.map((k) => k.id)).size, 30);
for (const k of NORWAY_SKILLS) {
  if (k.branch === 'rune-seer' && !k.rework) assert.ok(source[k.sourceLine - 1]?.includes(k.name), `${k.id}: source line ${k.sourceLine}`);
  else assert.ok(design.includes(`| ${k.id} |`) && design.includes(k.name), `${k.id}: in NORWAY_DESIGN.md`);
  assert.ok(/[฀-๿]/.test(k.thaiName), `${k.id}: Thai name`);
  assert.deepEqual(validateSkillPresentation(NORWAY_PRESENTATION[k.id]), [], k.id);
  if (k.behavior === 'PASSIVE_STAT') assert.ok(!k.placement && NORWAY_PRESENTATION[k.id].releaseEffect === null, `${k.id}: stat passives have no VFX`);
  if (k.reuses) assert.ok(NORWAY_SKILLS.some((o) => o.id === k.reuses), `${k.id}: reuse target exists`);
}
assert.ok(!NORWAY_SKILLS.some((k) => /Rain of Arrows/i.test(k.name)), 'USA owns Rain of Arrows');
assert.ok(!NORWAY_SKILLS.some((k) => k.branch === 'rune-seer' && /trap/i.test(k.name)), 'traps belong to the Hunter');
console.log(`skills-norway: 30 skills (Rune Seer reworked, Ullr Hunter new), policy-valid presentation, ${NORWAY_NEW_VFX.length} new release effects passed`);
// Ice Wall grows with level, blocks movement while standing and can be broken (source + user 2026-10-11).
const { iceWallSpec } = await import('../dist/index.js');
assert.deepEqual([1, 3, 5].map((l) => iceWallSpec(l).lengthCells), [4, 6, 8]);
assert.ok(iceWallSpec(5).heightScale > iceWallSpec(1).heightScale && iceWallSpec(5).hp === 15000 && iceWallSpec(3).blocksMovement && iceWallSpec(3).breakable);
assert.equal(NORWAY_SKILLS.find((k) => k.id === 'ice-wall').durationMs, 15000);
console.log('ice wall rule passed');
