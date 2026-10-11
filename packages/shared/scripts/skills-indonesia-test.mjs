import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDONESIA_NEW_VFX, INDONESIA_PRESENTATION, INDONESIA_SKILLS, SKILL_BEHAVIOR_POLICY, validateSkillPresentation } from '../dist/index.js';

// Indonesia catalogue: matches the source tree and the shared behaviour policy (docs/design/skills/indonesia-v1).
const rework = readFileSync(new URL('../../../docs/design/skills/REWORK_V2.md', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../../docs/design/skill-database-source.txt', import.meta.url), 'utf8').split('\n');
assert.equal(INDONESIA_SKILLS.length, 30);
for (const branch of ['santet', 'keris']) {
  const list = INDONESIA_SKILLS.filter((k) => k.branch === branch);
  assert.equal(list.filter((k) => k.jobTier === 2).length, 10, branch);
  assert.equal(list.filter((k) => k.jobTier === 3).length, 5, branch);
}
assert.equal(new Set(INDONESIA_SKILLS.map((k) => k.id)).size, 30);
for (const k of INDONESIA_SKILLS) {
  // Reworked skills (REWORK_V2.md) keep their source line for traceability but may carry a new name.
  if (k.rework) assert.ok(rework.includes(`| ${k.id} | `) && rework.includes(k.name), `${k.id}: listed in REWORK_V2.md`);
  else assert.ok(source[k.sourceLine - 1]?.includes(k.name), `${k.id}: source line ${k.sourceLine}`);
  assert.ok(/[฀-๿]/.test(k.thaiName), `${k.id}: Thai name`);
  assert.deepEqual(validateSkillPresentation(INDONESIA_PRESENTATION[k.id]), [], k.id);
  if (k.behavior === 'PASSIVE_STAT') assert.ok(!k.placement && INDONESIA_PRESENTATION[k.id].releaseEffect === null, `${k.id}: stat passives have no VFX`);
  if (k.reuses && !k.reuses.startsWith('status:')) assert.ok(INDONESIA_SKILLS.some((o) => o.id === k.reuses), `${k.id}: reuse target exists`);
}
const by = (id) => INDONESIA_SKILLS.find((k) => k.id === id);
assert.equal(by('heart-stop').castMs, 0); assert.equal(by('curse-of-the-archipelago').cooldownMs, 60000); assert.equal(by('fatal-assassination').castMs, 500);
assert.ok(INDONESIA_NEW_VFX.every((id) => SKILL_BEHAVIOR_POLICY[by(id).behavior].generateVfx));
assert.equal(INDONESIA_NEW_VFX.length, 16);
console.log(`skills-indonesia: 30 source-matched skills, Thai names, policy-valid presentation, ${INDONESIA_NEW_VFX.length} new release effects passed`);
