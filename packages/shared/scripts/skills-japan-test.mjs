import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JAPAN_CIRCLE_ART, japanCircleArt, JAPAN_BUFF_VFX, JAPAN_RELEASE_CIRCLE, japanCircleTints, GOGYO_GENERATES, GOGYO_OVERCOMES, JAPAN_NEW_VFX, JAPAN_PRESENTATION, JAPAN_SKILLS, JAPAN_VFX_MAIN, ONMYOJI_SPELL_ELEMENTS, SKILL_BEHAVIOR_POLICY, invokedSpell, validateSkillPresentation } from '../dist/index.js';

// Japan v2 catalogue (docs/design/skills/japan-v1): 2 classes × (10 + 5) tree skills, 15 invoked spells from the Five Phases.
const doc = (f) => readFileSync(new URL(`../../../docs/design/skills/japan-v1/${f}`, import.meta.url), 'utf8');
const design = doc('ONMYOJI_V2_DESIGN.md') + doc('MIKO_V2_DESIGN.md');
for (const branch of ['onmyoji', 'miko']) {
  const list = JAPAN_SKILLS.filter((k) => k.branch === branch);
  assert.equal(list.filter((k) => k.jobTier === 2).length, 10, branch);
  assert.equal(list.filter((k) => k.jobTier === 3).length, 5, branch);
}
const spells = JAPAN_SKILLS.filter((k) => k.branch === 'onmyoji-spells');
assert.equal(spells.length, 15);
assert.equal(new Set(JAPAN_SKILLS.map((k) => k.id)).size, 45);
for (const k of JAPAN_SKILLS) {
  assert.ok(design.includes(k.name.replace('Summon ', '').replace('’', "'")) || k.id.startsWith('summon-') || (k.id.endsWith('-talisman') && design.includes('Wood / Fire / Earth / Metal / Water Talisman')), `${k.id}: named in the v2 design`);
  assert.ok(/[฀-๿]/.test(k.thaiName), `${k.id}: Thai name`);
  assert.deepEqual(validateSkillPresentation(JAPAN_PRESENTATION[k.id]), [], k.id);
  if (k.behavior === 'PASSIVE_STAT') assert.ok(!k.placement && JAPAN_PRESENTATION[k.id].releaseEffect === null && !JAPAN_VFX_MAIN[k.id], `${k.id}: stat passives have no VFX`);
}
// Every unordered pair maps to exactly one spell, and the kind follows the cycles.
const E = ['wood', 'fire', 'earth', 'metal', 'water'];
const seen = new Set();
for (let i = 0; i < 5; i++) for (let j = i; j < 5; j++) {
  const a = E[i], b = E[j], id = invokedSpell(a, b);
  assert.equal(invokedSpell(b, a), id); seen.add(id);
  const kind = a === b ? 'summon' : GOGYO_GENERATES[a] === b || GOGYO_GENERATES[b] === a ? 'creation' : 'destruction';
  if (kind === 'summon') assert.ok(id.startsWith('summon-'), id);
  if (kind === 'destruction') assert.ok(GOGYO_OVERCOMES[a] === b || GOGYO_OVERCOMES[b] === a, id);
}
assert.equal(seen.size, 15);
assert.deepEqual([...seen].sort(), Object.keys(ONMYOJI_SPELL_ELEMENTS).sort());
assert.ok(!JAPAN_SKILLS.some((k) => /bow|arrow/i.test(k.name)), 'no bow (Norway/USA own bows)');
assert.ok(JAPAN_NEW_VFX.every((id) => SKILL_BEHAVIOR_POLICY[JAPAN_SKILLS.find((k) => k.id === id).behavior].generateVfx));
assert.equal(JAPAN_NEW_VFX.length, 15);
// Buff auras / area circles only on real buff or zone skills; area size matches the catalogue; circle tints resolve.
for (const [id, v] of Object.entries(JAPAN_BUFF_VFX)) { const k = JAPAN_SKILLS.find((x) => x.id === id); assert.ok(k && SKILL_BEHAVIOR_POLICY[k.behavior].release, id); if (v.area && k.areaCells) assert.equal(v.area, k.areaCells, id + ' area'); }
for (const id of Object.keys(JAPAN_RELEASE_CIRCLE)) assert.ok(JAPAN_SKILLS.some((k) => k.id === id), id);
assert.equal(japanCircleTints('steam-burst').length, 2);
// Circle archetypes: 8 distinct arts; summons use the summoning circle, unlisted skills the Ultimate Ritual master.
assert.equal(new Set(Object.values(JAPAN_CIRCLE_ART)).size, 8); assert.equal(japanCircleArt('summon-mizuchi'), 'jp-circle-summoning'); assert.equal(japanCircleArt('gogyo-mandala'), 'jp-master-circle');
for (const k of JAPAN_SKILLS) assert.ok(Object.values(JAPAN_CIRCLE_ART).includes(japanCircleArt(k.id)), k.id); assert.equal(japanCircleTints('summon-kitsune').length, 1);
console.log(`skills-japan: 30 tree skills + 15 invoked spells, Five Phases pairs, Thai names, policy-valid presentation, ${JAPAN_NEW_VFX.length} own release effects passed`);
