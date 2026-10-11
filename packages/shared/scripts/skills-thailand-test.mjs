import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKILL_BEHAVIOR_POLICY, THAILAND_NEW_VFX, THAILAND_PRESENTATION, THAILAND_SKILLS, validateSkillPresentation } from '../dist/index.js';

// Thailand catalogue: matches the source tree and the shared behaviour policy (docs/design/skills/thailand-v1).
const rework = readFileSync(new URL('../../../docs/design/skills/REWORK_V2.md', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../../docs/design/skill-database-source.txt', import.meta.url), 'utf8').split('\n');
assert.equal(THAILAND_SKILLS.length, 30);
for (const branch of ['achan-saiyasat', 'mor-phhee']) {
  const list = THAILAND_SKILLS.filter((k) => k.branch === branch);
  assert.equal(list.filter((k) => k.jobTier === 2).length, 10, branch);
  assert.equal(list.filter((k) => k.jobTier === 3).length, 5, branch);
}
assert.equal(new Set(THAILAND_SKILLS.map((k) => k.id)).size, 30, 'unique ids');
for (const k of THAILAND_SKILLS) {
  // Every entry points at its own source heading.
  // Reworked skills (REWORK_V2.md) keep their source line for traceability but may carry a new name.
  if (k.rework) assert.ok(rework.includes(`| ${k.id} | `) && rework.includes(k.name), `${k.id}: listed in REWORK_V2.md`);
  else assert.ok(source[k.sourceLine - 1]?.includes(k.name.replace('’', '’')), `${k.id}: source line ${k.sourceLine}`);
  assert.ok(/[฀-๿]/.test(k.thaiName), `${k.id}: Thai name`);
  const def = THAILAND_PRESENTATION[k.id];
  assert.deepEqual(validateSkillPresentation(def), [], k.id);
  if (k.behavior === 'PASSIVE_STAT') assert.ok(def.releaseEffect === null && def.circle === null && !k.placement, `${k.id}: stat passives have no VFX`);
  if (k.reuses && !k.reuses.startsWith('status:')) assert.ok(k.reuses === 'soul-heal' || THAILAND_SKILLS.some((o) => o.id === k.reuses), `${k.id}: reuse target exists`);
  if (k.buffAura) assert.ok(k.durationMs && k.behavior === 'ACTIVE_INSTANT', `${k.id}: timed buff aura`);
}
// Source CT/CD survive unchanged for a few spot checks.
const by = (id) => THAILAND_SKILLS.find((k) => k.id === id);
assert.equal(by('giant-phayon-colossus').castMs, 5000); assert.equal(by('giant-phayon-colossus').cooldownMs, 120000);
assert.equal(by('shadow-snare').castMs, 0); assert.equal(by('prai-whispering-curse').durationMs, 10000);
assert.ok(THAILAND_NEW_VFX.every((id) => SKILL_BEHAVIOR_POLICY[by(id).behavior].generateVfx));
assert.equal(THAILAND_NEW_VFX.length, 15);
console.log(`skills-thailand: 30 source-matched skills, policy-valid presentation, ${THAILAND_NEW_VFX.length} new release effects, stat passives without VFX passed`);
