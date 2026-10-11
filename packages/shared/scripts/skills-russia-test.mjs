import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RUSSIA_NEW_VFX, RUSSIA_PRESENTATION, RUSSIA_SKILLS, SKILL_BEHAVIOR_POLICY, validateSkillPresentation } from '../dist/index.js';

// Russia catalogue: matches the source tree and the shared behaviour policy (docs/design/skills/russia-v1).
const rework = readFileSync(new URL('../../../docs/design/skills/REWORK_V2.md', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../../docs/design/skill-database-source.txt', import.meta.url), 'utf8').split('\n');
assert.equal(RUSSIA_SKILLS.length, 30);
for (const branch of ['juggernaut', 'taiga']) {
  const list = RUSSIA_SKILLS.filter((k) => k.branch === branch);
  assert.equal(list.filter((k) => k.jobTier === 2).length, 10, branch);
  assert.equal(list.filter((k) => k.jobTier === 3).length, 5, branch);
}
assert.equal(new Set(RUSSIA_SKILLS.map((k) => k.id)).size, 30);
for (const k of RUSSIA_SKILLS) {
  // Reworked skills (REWORK_V2.md) keep their source line for traceability but may carry a new name.
  if (k.rework) assert.ok(rework.includes(`| ${k.id} | `) && rework.includes(k.name), `${k.id}: listed in REWORK_V2.md`);
  else assert.ok(source[k.sourceLine - 1]?.includes(k.name), `${k.id}: source line ${k.sourceLine}`);
  assert.ok(/[฀-๿]/.test(k.thaiName), `${k.id}: Thai name`);
  assert.deepEqual(validateSkillPresentation(RUSSIA_PRESENTATION[k.id]), [], k.id);
  if (k.behavior === 'PASSIVE_STAT') assert.ok(!k.placement && RUSSIA_PRESENTATION[k.id].releaseEffect === null, `${k.id}: stat passives have no VFX`);
  if (k.reuses && !k.reuses.startsWith('status:')) assert.ok(RUSSIA_SKILLS.some((o) => o.id === k.reuses), `${k.id}: reuse target exists`);
}
const by = (id) => RUSSIA_SKILLS.find((k) => k.id === id);
assert.equal(by('titan-stomp').castMs, 1500); assert.equal(by('taigas-absolute-fortress').cooldownMs, 150000); assert.equal(by('blood-moon').castMs, 3000);
assert.ok(RUSSIA_NEW_VFX.every((id) => SKILL_BEHAVIOR_POLICY[by(id).behavior].generateVfx));
assert.equal(RUSSIA_NEW_VFX.length, 17);
console.log(`skills-russia: 30 source-matched skills, Thai names, policy-valid presentation, ${RUSSIA_NEW_VFX.length} new release effects passed`);
