import assert from 'node:assert/strict';
import { MEDIUM_SKILLS, MEDIUM_PRESENTATION, SKILL_BEHAVIOR_POLICY, SKILL_CAST_RULES, SKILL_CAST_ERROR_TH, newProfile, parseSkillCastRequest, skillAimPoint, skillCastError } from '../dist/index.js';

// Every hotbar skill has a cast rule whose cast time matches the central presentation policy; passives have none.
for (const skill of MEDIUM_SKILLS) {
  const behavior = MEDIUM_PRESENTATION[skill.id].behavior;
  if (SKILL_BEHAVIOR_POLICY[behavior].hotbar) {
    assert.ok(SKILL_CAST_RULES[skill.id], skill.id);
    assert.equal(SKILL_CAST_RULES[skill.id].castMs, MEDIUM_PRESENTATION[skill.id].castTimeMs, skill.id);
    assert.ok(SKILL_CAST_RULES[skill.id].cooldownMs > 0, skill.id);
  } else assert.equal(SKILL_CAST_RULES[skill.id], undefined, skill.id);
}
for (const key of Object.keys(SKILL_CAST_ERROR_TH)) assert.ok(SKILL_CAST_ERROR_TH[key].length > 0);

assert.deepEqual(parseSkillCastRequest({ skillId: 'spirit-bolt' }), { skillId: 'spirit-bolt' });
for (const bad of [null, 1, {}, { skillId: 3 }, { skillId: '' }, { skillId: 'x'.repeat(65) }]) assert.equal(parseSkillCastRequest(bad), null);

const profile = newProfile({ x: 40, y: 33 });
const idle = { casting: false, moving: false };
assert.equal(skillCastError(profile, 'spirit-bolt', 0, idle, {}), null, 'new characters know Spirit Bolt');
assert.equal(skillCastError(profile, 'amulet-blast', 0, idle, {}), 'not-learned');
assert.equal(skillCastError(profile, 'meditation', 0, idle, {}), 'not-castable');
assert.equal(skillCastError(profile, 'nope', 0, idle, {}), 'unknown-skill');
assert.equal(skillCastError(profile, 'spirit-bolt', 0, { casting: true, moving: false }, {}), 'busy');
assert.equal(skillCastError(profile, 'spirit-bolt', 0, { casting: false, moving: true }, {}), 'moving');
assert.equal(skillCastError(profile, 'spirit-bolt', 999, idle, { 'spirit-bolt': 1000 }), 'cooldown');
assert.equal(skillCastError(profile, 'spirit-bolt', 1000, idle, { 'spirit-bolt': 1000 }), null);

// Presentation aim point: self skills stay on the caster; others sit ahead, inside the map.
const map = { width: 80, height: 60 };
assert.deepEqual(skillAimPoint('soul-heal', { x: 10, y: 10 }, 'east', map), { x: 10, y: 10 });
assert.deepEqual(skillAimPoint('amulet-blast', { x: 10, y: 10 }, 'east', map), { x: 13, y: 10 });
assert.deepEqual(skillAimPoint('spirit-bolt', { x: 40, y: 30 }, 'north', map), { x: 40, y: 25 });
assert.deepEqual(skillAimPoint('spirit-bolt', { x: 2, y: 2 }, 'north-west', map), { x: 1, y: 1 });
console.log('skill casts: rules match presentation, request parsing, learned/busy/moving/cooldown checks and aim points passed');

// Cast pose timing: steady frame rate, intro -> channel ping-pong -> release, for every source cast time.
const { castPoseFrame, castReleaseMs, CAST_POSE_FPS } = await import('../dist/index.js');
for (const castMs of [500, 1000, 1500, 2000]) {
  let last = -1, maxJump = 0;
  for (let t = 0; t < castMs; t += 1000 / CAST_POSE_FPS / 2) {
    const f = castPoseFrame(t, castMs, 12, null);
    assert.ok(f !== null && f >= 0 && f < Math.round(12 * 0.65), `channel frame in range (${castMs} ms)`);
    if (last >= 0) maxJump = Math.max(maxJump, Math.abs(f - last));
    last = f;
  }
  assert.ok(maxJump <= 2, `no frame jumps while casting (${castMs} ms: ${maxJump})`);
}
assert.equal(castPoseFrame(0, 1500, 12, 0), Math.round(12 * 0.65), 'release starts at the release frames');
assert.equal(castPoseFrame(0, 1500, 12, castReleaseMs(12) + 1), null, 'pose ends after the release frames');
assert.equal(castPoseFrame(100, 0, 12, null), null, 'instant skills have no pose');
console.log('cast pose: steady-rate intro, ping-pong channel and release frames passed');
// Game integration slices 1-4: every active skill of the 5 nations has a cast rule and a combat spec.
{
  const { SKILL_TREE, SKILL_BEHAVIOR_POLICY, castRule, combatSpec } = await import('../dist/index.js');
  const missing = Object.values(SKILL_TREE).filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].hotbar && (!castRule(k.id) || !combatSpec(k.id)));
  assert.deepEqual(missing.map((k) => k.id), [], 'every hotbar skill is castable in game');
  console.log('skill casts: every active of Medium + 5 nations is castable in game passed');
}
