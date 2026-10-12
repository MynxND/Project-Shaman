// Player-facing skill text: catalogue formulas become per-level numbers with damage as % of ATK/MATK (Ragnarok-style),
// and no tree skill's text is left with an unsolved "Lv" expression or a raw PDMG/MDMG label. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NATION_BRANCHES, NATION_SKILL_INDEX, skillElement, skillLevelText, skillTree } from '../../../packages/shared/dist/index.js';

assert.equal(skillLevelText('MDMG (Water) = MATK × (1.0 + Lv × 0.2) ทุก 0.5 วินาที', 2), 'ดาเมจเวทธาตุน้ำ 140% MATK ทุก 0.5 วินาที');
assert.equal(skillLevelText('PDMG = ATK × (3.0 + Lv × 0.3)', 10), 'ดาเมจกายภาพ 600% ATK');
assert.equal(skillLevelText('ช้าลง 20% + Lv × 3%', 3), 'ช้าลง 29%');
assert.equal(skillLevelText('ดาเมจพิษ +5% × Lv (สูงสุด 50%)', 4), 'ดาเมจพิษ +20% (สูงสุด 50%)');
assert.equal(skillLevelText('ล่องหน 5 + Lv วินาที', 3), 'ล่องหน 8 วินาที');
assert.equal(skillLevelText('ATK +20 + Lv × 5', 5), 'ATK +45');
assert.equal(skillLevelText('ล้างสถานะ 1 + Lv ÷ 3 อย่าง', 5), 'ล้างสถานะ 2 อย่าง');
assert.equal(skillLevelText('HP 3,000 × Lv ตีแตกได้', 2), 'HP 6000 ตีแตกได้');
assert.equal(skillLevelText('วางกับดักได้ +1 อันที่ Lv3 และ Lv5', 4), 'วางกับดักได้ +1 อันที่ Lv3 และ Lv5', 'level labels stay');
assert.equal(skillLevelText('MDMG = MATK × (1.0 + Lv × 0.15); ×1.3 ต่อ Undead/Demon', 0), 'ดาเมจเวท 115% MATK · +30% ต่อ Undead/Demon', 'unlearned shows Lv 1');
assert.deepEqual(skillElement('MDMG (Holy) = MATK × 2'), { en: 'Holy', th: 'ศักดิ์สิทธิ์' });

const medium = JSON.parse(readFileSync(new URL('../public/assets/skills/medium-v1/manifest.json', import.meta.url), 'utf8')).skills;
const formulas = [...medium.map((k) => [k.id, k.formula, k.maxLevel]),
  ...NATION_BRANCHES.flatMap((b) => [2, 3].flatMap((t) => skillTree(t, b.branch).map((k) => [k.id, NATION_SKILL_INDEX[k.id].formula, k.maxLevel])))];
for (const [id, f, max] of formulas) for (const lv of [1, max]) {
  const out = skillLevelText(f, lv);
  assert.ok(!/(?:[×÷+\-]\s*Lv\b(?!\d))|(?:\bLv\s*[×÷+\-])/.test(out), `${id} Lv${lv}: unsolved Lv in "${out}"`);
  assert.ok(!/\b[PM]DMG\b/.test(out), `${id}: raw damage label in "${out}"`);
}
console.log(`skill text: ${formulas.length} skills × (Lv 1, max) solved into player text, % of ATK/MATK, element tags passed`);
