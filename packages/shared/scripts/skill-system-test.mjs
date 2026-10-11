import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEDIUM_SKILLS, MEDIUM_PRESENTATION, SKILL_BEHAVIOR_POLICY, VFX_FAMILIES, LAB_PASSIVE_AURA, castingEnvelope, validateSkillPresentation, spiritSenseDamageMultiplier, selectVisibleAuras } from '../dist/index.js';
assert.deepEqual(validateSkillPresentation(LAB_PASSIVE_AURA),[]);
assert.ok(!MEDIUM_SKILLS.some(s=>s.id===LAB_PASSIVE_AURA.skillId));
for (const skill of MEDIUM_SKILLS) {
  const def = MEDIUM_PRESENTATION[skill.id];
  assert.deepEqual(validateSkillPresentation(def), []);
  if (skill.kind === 'passive') {
    assert.equal(def.behavior, 'PASSIVE_STAT');
    assert.equal(SKILL_BEHAVIOR_POLICY[def.behavior].generateVfx, false);
    assert.equal(def.releaseEffect, null); assert.equal(def.circle, null); assert.equal(def.aura, null);
  }
}
for (const duration of [500, 1000, 1500, 2000]) {
  assert.equal(castingEnvelope(0,duration).phase,'invocation');
  assert.equal(castingEnvelope(duration*.5,duration).phase,'channeling');
  assert.equal(castingEnvelope(duration,duration).release,true);
  assert.equal(castingEnvelope(duration+260,duration).alpha,0);
  const cancelled = duration*.5;
  assert.equal(castingEnvelope(cancelled,duration,cancelled).release,false);
  assert.equal(castingEnvelope(cancelled+180,duration,cancelled).alpha,0);
  assert.equal(castingEnvelope(duration,duration,cancelled).release,false);
}
assert.equal(castingEnvelope(0,0).alpha,0);
assert.equal(spiritSenseDamageMultiplier(10,'Undead'),.8);
assert.equal(spiritSenseDamageMultiplier(50,'Demon'),.8);
assert.equal(spiritSenseDamageMultiplier(0,'Undead'),1);
assert.equal(spiritSenseDamageMultiplier(10,'Human'),1);
assert.equal(spiritSenseDamageMultiplier(NaN,'Demon'),1);
assert.deepEqual(selectVisibleAuras([{id:'off',priority:99,active:false},{id:'b',priority:1,active:true},{id:'a',priority:1,active:true}]).map(a=>a.id),['a']);
assert.deepEqual(selectVisibleAuras([{id:'a',priority:1,active:false}]),[]);
assert.equal(new Set(Object.values(VFX_FAMILIES).map(f=>f.geometry)).size,1);
assert.equal(SKILL_BEHAVIOR_POLICY.ACTIVE_INSTANT.circle,false);
assert.equal(SKILL_BEHAVIOR_POLICY.ACTIVE_CHANNEL.circle,true);
assert.equal(SKILL_BEHAVIOR_POLICY.PASSIVE_TRIGGER.castPose,false);
assert.equal(SKILL_BEHAVIOR_POLICY.PASSIVE_AURA.castPose,false);
assert.equal(SKILL_BEHAVIOR_POLICY.TOGGLE_BUFF.aura,true);
assert.ok(validateSkillPresentation({...MEDIUM_PRESENTATION['spirit-sense'], releaseEffect:'bad'}).includes('release-policy'));
assert.ok(validateSkillPresentation({...MEDIUM_PRESENTATION['spirit-sense'], behavior:'PASSIVE_AURA'}).includes('missing-aura'));
const audit = JSON.parse(readFileSync(new URL('../../../docs/design/skill-system/classification.json',import.meta.url)));
assert.equal(audit.skills.length,370);
assert.equal(new Set(audit.skills.map(s=>s.sourceKey)).size,370);
assert.ok(audit.skills.every(s=>s.sourceText.includes(s.name)));
console.log('PASS skill-system: behavior policy, source-duration cast/cancel, stat modifier, aura state/budget, all 370 source records');
