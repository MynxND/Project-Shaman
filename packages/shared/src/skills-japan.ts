import { SKILL_BEHAVIOR_POLICY, type SkillBehavior, type SkillPresentation, type VfxFamily } from './skill-system.js';
import type { BranchInfo, NationSkill } from './skills-thailand.js';
import type { VfxLayer, VfxLayerKind } from './skills-russia.js';

// Japan job skills, v2 (approved by the user 2026-10-11; replaces the Onmyoji/Miko lists of
// docs/design/skill-database-source.txt): Onmyoji → Grand Onmyoji Master (Five Phases invoker,
// docs/design/skills/japan-v1/ONMYOJI_V2_DESIGN.md) and Miko → High Oracle Priestess (purification into blessing,
// MIKO_V2_DESIGN.md). The 15 invoked spells are not tree skills; they are listed as their own lab set.
// Presentation catalogue only; all numbers are provisional design values (sourceLine 0 = v2 design doc, not the source).

export type JapanBranch = 'onmyoji' | 'onmyoji-spells' | 'miko';
export type GogyoElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type Vfx = Partial<Pick<NationSkill, 'areaCells' | 'placement' | 'reuses' | 'statuses' | 'buffAura' | 'summon'>>;

/** Generating cycle (相生) and overcoming cycle (相剋), in order. */
export const GOGYO_GENERATES: Readonly<Record<GogyoElement, GogyoElement>> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
export const GOGYO_OVERCOMES: Readonly<Record<GogyoElement, GogyoElement>> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
export const GOGYO_THAI: Readonly<Record<GogyoElement, string>> = { wood: 'ไม้', fire: 'ไฟ', earth: 'ดิน', metal: 'โลหะ', water: 'น้ำ' };
/** Runtime tint per element (presentation only): kit art is drawn on washi off-white and multiplied by these. */
export const GOGYO_TINT: Readonly<Record<GogyoElement, number>> = { wood: 0x9fd88a, fire: 0xff9a5c, earth: 0xd8a860, metal: 0xe6e9f0, water: 0x86aaff };

/** Which spell a pair of held elements invokes (order does not matter): same element = shikigami, generating
 *  neighbours = creation, overcoming pair = destruction. Exactly 15 pairs. */
export function invokedSpell(a: GogyoElement, b: GogyoElement): string {
  const key = [a, b].sort().join('+');
  const spell = ONMYOJI_SPELL_BY_PAIR[key];
  if (!spell) throw new Error(`no spell for ${key}`);
  return spell;
}
export const ONMYOJI_SPELL_ELEMENTS: Readonly<Record<string, readonly [GogyoElement, GogyoElement]>> = {
  'bonfire-ward': ['wood', 'fire'], 'ash-barrier': ['fire', 'earth'], 'kongo-talisman': ['earth', 'metal'], 'mirror-pond': ['metal', 'water'], 'spring-rain': ['water', 'wood'],
  'root-fissure': ['wood', 'earth'], mudslide: ['earth', 'water'], 'steam-burst': ['water', 'fire'], 'molten-swallows': ['fire', 'metal'], 'leaf-blade-storm': ['metal', 'wood'],
  'summon-kodama': ['wood', 'wood'], 'summon-kitsune': ['fire', 'fire'], 'summon-nurikabe': ['earth', 'earth'], 'summon-kamaitachi': ['metal', 'metal'], 'summon-mizuchi': ['water', 'water'],
};
const ONMYOJI_SPELL_BY_PAIR: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(ONMYOJI_SPELL_ELEMENTS).map(([id, pair]) => [[...pair].sort().join('+'), id]));

const THAI_NAMES: Readonly<Record<string, string>> = {
  'wood-talisman': 'ยันต์ธาตุไม้', 'fire-talisman': 'ยันต์ธาตุไฟ', 'earth-talisman': 'ยันต์ธาตุดิน', 'metal-talisman': 'ยันต์ธาตุโลหะ', 'water-talisman': 'ยันต์ธาตุน้ำ',
  'onmyo-seal': 'ตราประทับองเมียว', 'sosho-flow': 'วงธาตุส่งเสริม', 'sokoku-break': 'ธาตุข่มทำลาย', 'taikyoku-balance': 'สมดุลหยินหยาง', 'shikigami-pact': 'พันธะชิกิงามิ',
  'gogyo-mandala': 'มณฑลเบญจธาตุ', 'gogyo-ring-seal': 'วงผนึกเบญจธาตุ', 'shikigami-ascension': 'ชิกิงามิร่างใหญ่', 'third-talisman': 'ยันต์ใบที่สาม', 'onmyo-mastery': 'ชำนาญองเมียว',
  'bonfire-ward': 'เขตกองไฟ', 'ash-barrier': 'กำแพงเถ้าหิน', 'kongo-talisman': 'ยันต์โล่หินทอง', 'mirror-pond': 'สระกระจกน้ำ', 'spring-rain': 'ฝนชุ่มใบ',
  'root-fissure': 'รากแยกแผ่นดิน', mudslide: 'โคลนถล่ม', 'steam-burst': 'ไอน้ำระเบิด', 'molten-swallows': 'นกกระดาษหลอมเหล็ก', 'leaf-blade-storm': 'พายุใบมีด',
  'summon-kodama': 'อัญเชิญโคดามะ', 'summon-kitsune': 'อัญเชิญจิ้งจอกไฟ', 'summon-nurikabe': 'อัญเชิญนุริกาเบะ', 'summon-kamaitachi': 'อัญเชิญคามาอิทาจิ', 'summon-mizuchi': 'อัญเชิญมิซุจิ',
  'harae-sweep': 'ปัดเป่ามลทิน', 'kagura-purification-dance': 'ระบำคางุระ', 'suzu-bell-blessing': 'กระดิ่งอวยพร', 'ofuda-ward-shot': 'ยิงยันต์ขับมาร', 'cleansing-rain': 'ฝนชำระล้าง',
  'holy-ward': 'เกราะศักดิ์สิทธิ์', 'priestess-grace': 'พรมิโกะ', 'blessing-craft': 'มลทินกลายเป็นพร', purify: 'ชำระพิษ', 'shrine-path': 'ทางเดินศาลเจ้า',
  'divine-miracle-resurrection': 'ปาฏิหาริย์คืนชีพ', 'kotodama-sacred-song': 'บทเพลงวาจาสิทธิ์', 'sun-pillar': 'เสาแสงอาทิตย์', 'divine-grace': 'พรไม่สิ้นสุด', 'oracles-vision': 'ตาพยากรณ์',
};
/** Enlarged area effects (presentation only). */
const VFX_SCALE: Readonly<Record<string, number>> = {
  'bonfire-ward': 1.5, 'ash-barrier': 1.5, 'leaf-blade-storm': 1.5, mudslide: 1.3, 'spring-rain': 1.4, 'cleansing-rain': 1.8, 'kagura-purification-dance': 1.6,
  'kotodama-sacred-song': 1.7, 'gogyo-ring-seal': 2, 'gogyo-mandala': 1.5, 'divine-miracle-resurrection': 1.7, 'sun-pillar': 1.6, 'shikigami-ascension': 2.2,
  // Grander pass (user 2026-10-11: some skills were not grand or intimidating enough).
  'steam-burst': 1.6, 'mirror-pond': 1.6, 'kongo-talisman': 1.3, 'suzu-bell-blessing': 1.4, 'harae-sweep': 1.5, 'ofuda-ward-shot': 1.5, 'molten-swallows': 1.3,
};

const s = (id: string, branch: JapanBranch, jobTier: 2 | 3, name: string, thai: string, maxLevel: number, behavior: SkillBehavior, family: VfxFamily,
  castMs: number | null, cooldownMs: number | null, durationMs: number | null, formula: string, vfx: Vfx = {}): NationSkill => ({
  id, branch, jobTier, sourceLine: 0, name, thai, maxLevel, behavior, family, castMs, cooldownMs, durationMs, formula,
  thaiName: THAI_NAMES[id] ?? name, areaCells: null, placement: null, reuses: null, statuses: [], buffAura: false, summon: null, vfxScale: VFX_SCALE[id] ?? 1, ...vfx,
});
const talisman = (e: GogyoElement, name: string, held: string) =>
  s(`${e}-talisman`, 'onmyoji', 2, name, `จารธาตุ${GOGYO_THAI[e]}ลงยันต์ (วงยันต์ถือได้ 2 ใบ ใบเก่าหลุด)`, 10, 'ACTIVE_INSTANT', 'yantra', 0, 150, null,
    `ถือยันต์${GOGYO_THAI[e]}: ${held} · เลเวลธาตุ${GOGYO_THAI[e]}เพิ่มพลังทุกคาถาที่ใช้ธาตุนี้`, { placement: 'self' });
const shikigami = (e: GogyoElement, id: string, name: string, thai: string) =>
  s(id, 'onmyoji-spells', 2, name, thai, 10, 'ACTIVE_CAST', 'spirit', 1000, 20000, 30000,
    `${GOGYO_THAI[e]} + ${GOGYO_THAI[e]} · ชิกิงามิได้ 1 ตัว (2 ตัวเมื่อพันธะชิกิงามิ Lv5) · ตัวใหม่แทนตัวเก่าสุด`, { placement: 'summon', summon: id.replace('summon-', '') });

export const JAPAN_BRANCHES: Readonly<Record<JapanBranch, BranchInfo>> = {
  onmyoji: { name: 'Onmyoji', thai: 'องเมียวจิ', tier3: 'Grand Onmyoji Master', range: 'RANGED', signature: 'จารยันต์เบญจธาตุ 2 ใบแล้ว Invoke เป็น 15 คาถา ตามวงส่งเสริม/ข่ม รอยธาตุต่อคอมโบได้' },
  'onmyoji-spells': { name: 'Onmyoji invoked spells', thai: 'องเมียวจิ · คาถาผสมธาตุ', tier3: 'Invoke (ธาตุ 2 ใบ → 15 คาถา)' },
  miko: { name: 'Miko', thai: 'มิโกะ', tier3: 'High Oracle Priestess', range: 'RANGED', signature: 'ฮาราเอะ: สถานะผิดปกติที่ล้างให้ กลายเป็นบัฟที่คู่กันแก่ผู้นั้น' },
};

export const JAPAN_SKILLS: readonly NationSkill[] = [
  // Onmyoji (2nd job)
  talisman('wood', 'Wood Talisman', 'ฟื้น HP เพิ่ม'), talisman('fire', 'Fire Talisman', 'MATK เพิ่ม'), talisman('earth', 'Earth Talisman', 'DEF/MDEF เพิ่ม'),
  talisman('metal', 'Metal Talisman', 'คริเวท/เจาะ MDEF เพิ่ม'), talisman('water', 'Water Talisman', 'ร่ายเร็วขึ้น'),
  s('onmyo-seal', 'onmyoji', 2, 'Onmyō Seal', 'ปลดล็อก Invoke 急急如律令 เปลี่ยนยันต์ 2 ใบเป็นคาถา', 5, 'PASSIVE_TRIGGER', 'yantra', null, null, null,
    'Invoke CD 6 → 2 วินาทีตามเลเวล · Lv5 ถือคาถาได้ 2 ช่อง · ใช้ SP ทุกครั้ง', { placement: 'self' }),
  s('sosho-flow', 'onmyoji', 2, 'Sōshō Flow', 'คาถาที่ใช้ธาตุที่รอยธาตุส่งเสริม จะแรงขึ้นและต่อวงได้', 5, 'PASSIVE_TRIGGER', 'yantra', null, null, null,
    'ส่งเสริม: พลัง +30% → +50% · นานขึ้น 2 วินาที · รอยธาตุเปลี่ยนเป็นธาตุใหม่', { placement: 'target' }),
  s('sokoku-break', 'onmyoji', 2, 'Sōkoku Break', 'คาถาที่ใช้ธาตุที่ข่มรอยธาตุ จะทุบรอยแตกให้ผลพิเศษ', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ไม้แตก→เลือดไหล · ไฟแตก→ตาบอด · ดินแตก→DEF/MDEF −25% · โลหะแตก→เจาะ MDEF 40% · น้ำแตก→ตรึง', { placement: 'target', statuses: ['bleed', 'blind', 'def-down', 'root'] }),
  s('taikyoku-balance', 'onmyoji', 2, 'Taikyoku Balance', 'สลับคาถาสร้างกับคาถาทำลายได้สแตกสมดุล', 5, 'PASSIVE_TRIGGER', 'yantra', null, null, null,
    'สแตกละ +4% (สูงสุด 3) · ร่ายแบบเดียวกัน 3 ครั้งติดสแตกหาย', { placement: 'self' }),
  s('shikigami-pact', 'onmyoji', 2, 'Shikigami Pact', 'พันธะกับชิกิงามิ', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'ชิกิงามิ HP/เวลา +10% × Lv · Lv5 อัญเชิญได้ 2 ตัว'),
  // Grand Onmyoji Master (3rd job)
  s('gogyo-mandala', 'onmyoji', 3, 'Gogyō Mandala', 'มณฑลเบญจธาตุ: Invoke ไม่ติดคูลดาวน์', 5, 'ACTIVE_INSTANT', 'yantra', 0, 90000, 8000,
    '8 วินาที: Invoke ไม่มี CD · รอยธาตุอยู่นาน 2 เท่า', { placement: 'self', buffAura: true }),
  s('gogyo-ring-seal', 'onmyoji', 3, 'Gogyō Ring Seal', 'วงห้าจุดตามลำดับธาตุ จุดระเบิดรอยธาตุทั้งหมด', 5, 'ACTIVE_CAST', 'binding', 2000, 60000, null,
    'ดาเมจตามจำนวนธาตุที่ต่างกันบนจอ (1–5) · ครบ 5 ธาตุ Silence 3 วินาที · วงแหวน ไม่ใช่ดาว', { areaCells: 11, placement: 'zone' }),
  s('shikigami-ascension', 'onmyoji', 3, 'Shikigami Ascension', 'ชิกิงามิตัวปัจจุบันกลายเป็นร่างใหญ่', 5, 'ACTIVE_CAST', 'spirit', 1500, 120000, 20000,
    '20 วินาที: จิ้งจอกเก้าหาง / ป้อมนุริกาเบะ / ต้นไม้โคดามะ / คามาอิทาจิคู่ / มังกรมิซุจิ', { placement: 'summon', summon: 'shikigami-great-form' }),
  s('third-talisman', 'onmyoji', 3, 'Third Talisman', 'ช่องยันต์ใบที่สาม ใส่รสธาตุให้คาถา', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ธาตุใบที่ 3 เพิ่มคุณสมบัติเล็กน้อย เช่น ไอน้ำระเบิด + ดิน = ผลักถอย'),
  s('onmyo-mastery', 'onmyoji', 3, 'Onmyō Mastery', 'ร่ายคาถาไม่ซ้ำกันยิ่งเร็ว', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ทุกคาถาที่ต่างกันใน 10 วินาที Invoke CD −0.3 วินาที (สูงสุด −1.5)'),
  // Invoked spells (creation: generating neighbours)
  s('bonfire-ward', 'onmyoji-spells', 2, 'Bonfire Ward', 'ไม้ + ไฟ · เขตกองไฟจิ้งจอก', 10, 'ACTIVE_CAST', 'yantra', 800, 12000, 10000,
    'เขต 5×5: พันธมิตร ATK/MATK +10% · ศัตรูที่เดินเข้าติดเผาไหม้', { areaCells: 5, placement: 'zone' }),
  s('ash-barrier', 'onmyoji-spells', 2, 'Ash Barrier', 'ไฟ + ดิน · กำแพงเถ้าหิน', 10, 'ACTIVE_CAST', 'yantra', 800, 15000, 10000,
    'เขต 5×5: พันธมิตรรับดาเมจ −20% · ทิ้งรอยธาตุไฟ', { areaCells: 5, placement: 'zone' }),
  s('kongo-talisman', 'onmyoji-spells', 2, 'Kongō Talisman', 'ดิน + โลหะ · โล่หินทองให้พันธมิตร', 10, 'ACTIVE_INSTANT', 'yantra', 0, 10000, 15000,
    'โล่ดูดซับ = MATK × (2 + Lv × 0.4) · แตกแล้วเศษโลหะกระจายใส่ศัตรูรอบตัว', { placement: 'target' }),
  s('mirror-pond', 'onmyoji-spells', 2, 'Mirror Pond', 'โลหะ + น้ำ · สระกระจกน้ำ สลับตำแหน่ง/สะท้อนเวท', 10, 'ACTIVE_CAST', 'spirit', 500, 18000, 8000,
    'สลับที่กับสระหรือชิกิงามิ · สะท้อนเวทเป้าหมายเดี่ยว 1 ครั้ง', { areaCells: 3, placement: 'zone', statuses: ['reflect'] }),
  s('spring-rain', 'onmyoji-spells', 2, 'Spring Rain', 'น้ำ + ไม้ · ฝนชุ่มใบฟื้นฟูปาร์ตี้', 10, 'ACTIVE_CAST', 'spirit', 1500, 20000, 8000,
    'ฟื้น HP ต่อเนื่องในเขต 7×7 · ล้างสถานะผิดปกติ 1 อย่าง', { areaCells: 7, placement: 'zone' }),
  // Invoked spells (destruction: overcoming pairs)
  s('root-fissure', 'onmyoji-spells', 2, 'Root Fissure', 'ไม้ + ดิน · รากไม้แยกแผ่นดินเป็นแนวตรง', 10, 'ACTIVE_CAST', 'binding', 700, 8000, null,
    'MDMG = MATK × (2 + Lv × 0.3) เป็นแนว 7 ช่อง · ตรึง 2 วินาที', { placement: 'tether', statuses: ['root'] }),
  s('mudslide', 'onmyoji-spells', 2, 'Mudslide', 'ดิน + น้ำ · คลื่นโคลนทรงกรวย', 10, 'ACTIVE_CAST', 'binding', 900, 10000, null,
    'MDMG = MATK × (1.8 + Lv × 0.3) ทรงกรวย 5 ช่อง · ผลักถอย 2 ช่อง + ช้าลง', { placement: 'tether', statuses: ['knockdown', 'slow'] }),
  s('steam-burst', 'onmyoji-spells', 2, 'Steam Burst', 'น้ำ + ไฟ · ไอน้ำระเบิดเป้าหมายเดี่ยว', 10, 'ACTIVE_CAST', 'binding', 1000, 6000, null,
    'MDMG = MATK × (4 + Lv × 0.6) · ตาบอด 3 วินาที', { placement: 'target', statuses: ['blind'] }),
  s('molten-swallows', 'onmyoji-spells', 2, 'Molten Swallows', 'ไฟ + โลหะ · นกกระดาษหลอมเหล็กติดตามเป้า 3 ตัว', 10, 'ACTIVE_CAST', 'binding', 600, 7000, null,
    'MDMG = MATK × (1.2 + Lv × 0.2) × 3 · เจาะ MDEF 20%', { placement: 'projectile' }),
  s('leaf-blade-storm', 'onmyoji-spells', 2, 'Leaf Blade Storm', 'โลหะ + ไม้ · พายุใบมีด', 10, 'ACTIVE_CAST', 'binding', 1200, 14000, 3000,
    'MDMG = MATK × (0.8 + Lv × 0.15) ทุก 0.5 วินาที 3 วินาที วง 5×5', { areaCells: 5, placement: 'zone' }),
  // Invoked spells (shikigami: same element twice)
  shikigami('wood', 'summon-kodama', 'Summon Kodama', 'ไม้ + ไม้ · วิญญาณต้นไม้ ฮีลพันธมิตร ตรึงศัตรูที่แตะ'),
  shikigami('fire', 'summon-kitsune', 'Summon Kitsune', 'ไฟ + ไฟ · จิ้งจอกไฟ พ่นไฟเป็นแนวทุก 2 วินาที'),
  shikigami('earth', 'summon-nurikabe', 'Summon Nurikabe', 'ดิน + ดิน · กำแพงมีชีวิต กันทางเดิน/กระสุน ดึงศัตรู'),
  shikigami('metal', 'summon-kamaitachi', 'Summon Kamaitachi', 'โลหะ + โลหะ · พังพอนเคียว พุ่งทะลุศัตรูทิ้งรอยบาด'),
  shikigami('water', 'summon-mizuchi', 'Summon Mizuchi', 'น้ำ + น้ำ · งูน้ำ ทำให้ศัตรูรอบผู้ร่ายช้าลง'),
  // Miko (2nd job)
  s('harae-sweep', 'miko', 2, 'Harae Sweep', 'กวาดไม้โกเฮย์ล้างสถานะให้พันธมิตร แล้วแปลงเป็นบัฟ', 10, 'ACTIVE_INSTANT', 'spirit', 0, 4000, null,
    'ล้างสถานะ 1 + Lv ÷ 3 อย่าง · ทุกอย่างที่ล้างกลายเป็นบัฟที่คู่กัน 5 วินาที', { placement: 'target' }),
  s('kagura-purification-dance', 'miko', 2, 'Kagura Purification Dance', 'ระบำคางุระ ฮีลและชำระปาร์ตี้', 10, 'ACTIVE_CHANNEL', 'spirit', 2000, 15000, null,
    'ฮีล = MATK × (1 + Lv × 0.3) ปาร์ตี้ในระยะ 9×9 · ล้าง 1 อย่างต่อคน (แปลงเป็นบัฟ)', { areaCells: 9, placement: 'self' }),
  s('suzu-bell-blessing', 'miko', 2, 'Suzu Bell Blessing', 'สั่นกระดิ่งอวยพรพันธมิตร', 10, 'ACTIVE_INSTANT', 'spirit', 0, 3000, 60000,
    'ASPD +2% × Lv · Flee +3 × Lv 60 วินาที', { placement: 'target', buffAura: true }),
  s('ofuda-ward-shot', 'miko', 2, 'Ofuda Ward Shot', 'ปายันต์ชำระขับมาร (ไม่ใช้ธนู)', 5, 'ACTIVE_INSTANT', 'spirit', 0, 5000, null,
    'MDMG (Holy) = MATK × (2 + Lv × 0.5) · ผลักถอย 3 ช่อง', { placement: 'projectile', statuses: ['knockdown'] }),
  s('cleansing-rain', 'miko', 2, 'Cleansing Rain', 'ฝนชำระล้างทั้งปาร์ตี้', 5, 'ACTIVE_CAST', 'spirit', 3000, 120000, null,
    'ล้างทุกสถานะผิดปกติของปาร์ตี้ในจอ (รวม Stun/Freeze/Fear) · ทั้งหมดแปลงเป็นบัฟ', { areaCells: 15, placement: 'zone', statuses: ['status-immunity'] }),
  s('holy-ward', 'miko', 2, 'Holy Ward', 'แสงศักดิ์สิทธิ์คุ้มกาย', 10, 'PASSIVE_STAT', 'spirit', null, null, null, 'ดาเมจจาก Shadow/Undead −2.5% × Lv (สูงสุด 25%)'),
  s('priestess-grace', 'miko', 2, 'Priestess Grace', 'พลังรักษาของมิโกะ', 10, 'PASSIVE_STAT', 'spirit', null, null, null, 'ฮีลทุกชนิด +1.5% × Lv (สูงสุด 15%)'),
  s('blessing-craft', 'miko', 2, 'Blessing Craft', 'บัฟที่แปลงจากมลทินแรงและนานขึ้น (กลไกประจำสาย)', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'บัฟจากการแปลง +10% × Lv · นานขึ้น 1 วินาที × Lv'),
  s('purify', 'miko', 2, 'Purify', 'ออร่าชำระพิษรอบตัว', 5, 'PASSIVE_TRIGGER', 'spirit', null, null, null,
    'ทุก 5 วินาที โอกาส 10% × Lv ล้างพิษเพื่อนในระยะ 3×3 (แปลงเป็นฟื้น HP)', { placement: 'self' }),
  s('shrine-path', 'miko', 2, 'Shrine Path', 'เดินผ่านเขตพื้นของพันธมิตรแล้วเร็วขึ้น', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'ในเขตพื้นของพันธมิตร ความเร็ว +5% × Lv'),
  // High Oracle Priestess (3rd job)
  s('divine-miracle-resurrection', 'miko', 3, 'Divine Miracle Resurrection', 'ชุบชีวิตทั้งปาร์ตี้ (สกิลเดียวในเกม)', 5, 'ACTIVE_CAST', 'spirit', 5000, 600000, null,
    'ชุบชีวิตปาร์ตี้ทั้งหมดในจอ HP 100% · อมตะ 3 วินาที', { areaCells: 15, placement: 'zone', statuses: ['invulnerable'] }),
  s('kotodama-sacred-song', 'miko', 3, 'Kotodama Sacred Song', 'ขับเพลงวาจาสิทธิ์ปลุกใจปาร์ตี้', 5, 'ACTIVE_CHANNEL', 'spirit', 2000, 90000, 30000,
    'ปาร์ตี้ ATK/MATK +5% × Lv 30 วินาที', { areaCells: 11, placement: 'self' }),
  s('sun-pillar', 'miko', 3, 'Sun Pillar', 'เสาแสงอาทิตย์ (เดิม Amaterasu’s Light ไม่ใช้ชื่อเทพ)', 5, 'ACTIVE_CAST', 'spirit', 2500, 45000, 6000,
    'เขต 5×5: ศัตรู MDMG (Holy) = MATK × (3 + Lv) ต่อวินาที · พันธมิตรฟื้น HP 10% ต่อวินาที', { areaCells: 5, placement: 'zone' }),
  s('divine-grace', 'miko', 3, 'Divine Grace', 'ฮีลมีโอกาสรีเซ็ตคูลดาวน์', 5, 'PASSIVE_TRIGGER', 'spirit', null, null, null, 'โอกาส 4% × Lv (สูงสุด 20%) คูลดาวน์ฮีลกลายเป็น 0', { placement: 'self' }),
  s('oracles-vision', 'miko', 3, "Oracle's Vision", 'ปาร์ตี้มองเห็นหลอด HP บอส', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'แสดง HP บอสให้ปาร์ตี้ · ดาเมจใส่บอส +2% × Lv'),
];

/** Skills whose main art is a shared kit sheet (or another skill's sheet), optionally tinted, instead of their own. */
export const JAPAN_VFX_MAIN: Readonly<Record<string, { layer: VfxLayerKind; asset?: string; tint?: number; offsetY?: number; offsetX?: number }>> = {
  // QA fix (user 2026-10-11): the Kongō shell came out as an upright hoop; it is drawn twice, mirrored, to close an oval shell.
  'kongo-talisman': { layer: 'front', offsetX: -30 },
  ...Object.fromEntries((['wood', 'fire', 'earth', 'metal', 'water'] as const).map((e) => [`${e}-talisman`, { layer: 'aura', asset: 'kit-held-talisman', tint: GOGYO_TINT[e], offsetY: -70 }])),
  'onmyo-seal': { layer: 'front', asset: 'kit-ofuda-burst', offsetY: -40 },
  'sosho-flow': { layer: 'particles', asset: 'kit-mark-wood' },
  'sokoku-break': { layer: 'particles', asset: 'kit-mark-fire' },
  'taikyoku-balance': { layer: 'aura', asset: 'kit-held-talisman', offsetY: -70 },
  'gogyo-mandala': { layer: 'ground', asset: 'kit-gogyo-ring' },
  'gogyo-ring-seal': { layer: 'behind' },
  'shikigami-ascension': { layer: 'behind', asset: 'shikigami-summon', tint: 0xffd27a },
  'spring-rain': { layer: 'front', asset: 'cleansing-rain', tint: 0xb6e8a8 },
  'molten-swallows': { layer: 'front', asset: 'kit-paper-swallow', tint: 0xff9a4a },
  ...Object.fromEntries((['wood', 'fire', 'earth', 'metal', 'water'] as const).map((e) => [Object.keys(ONMYOJI_SPELL_ELEMENTS).find((id) => id.startsWith('summon-') && ONMYOJI_SPELL_ELEMENTS[id]![0] === e)!, { layer: 'front', asset: 'shikigami-summon', tint: GOGYO_TINT[e] }])),
  // Kitsune prototype: the paper-doll flash plays behind the fox, which bursts out in front of it.
  'summon-kitsune': { layer: 'behind', asset: 'shikigami-summon', tint: GOGYO_TINT.fire },
  'summon-kodama': { layer: 'behind', asset: 'shikigami-summon', tint: GOGYO_TINT.wood }, 'summon-nurikabe': { layer: 'behind', asset: 'shikigami-summon', tint: GOGYO_TINT.earth },
  'summon-kamaitachi': { layer: 'behind', asset: 'shikigami-summon', tint: GOGYO_TINT.metal }, 'summon-mizuchi': { layer: 'behind', asset: 'shikigami-summon', tint: GOGYO_TINT.water },
  'bonfire-ward': { layer: 'ground' }, 'ash-barrier': { layer: 'behind' }, 'mirror-pond': { layer: 'ground' }, 'leaf-blade-storm': { layer: 'ground' },
  'harae-sweep': { layer: 'front', asset: 'kit-gohei-sweep', offsetY: -40 },
  'kagura-purification-dance': { layer: 'ground' }, 'kotodama-sacred-song': { layer: 'ground' }, 'suzu-bell-blessing': { layer: 'front', offsetY: -60 },
  'ofuda-ward-shot': { layer: 'front', asset: 'kit-held-talisman', tint: 0xffd0c8 },
  purify: { layer: 'particles', asset: 'kit-blessing-glint', tint: 0xc8f0c0, offsetY: -40 },
  'divine-grace': { layer: 'particles', asset: 'kit-blessing-glint', offsetY: -40 },
};

const MARK: Readonly<Record<GogyoElement, string>> = { wood: 'kit-mark-wood', fire: 'kit-mark-fire', earth: 'kit-mark-earth', metal: 'kit-mark-metal', water: 'kit-mark-water' };
/** Residue marks of a spell's elements, pulsed on the target (the combo layer of ONMYOJI_V2_DESIGN.md). */
const residue = (id: string): VfxLayer[] => [...new Set(ONMYOJI_SPELL_ELEMENTS[id] ?? [])].map((e) => ({ asset: MARK[e], layer: 'particles', pulse: true, scale: 1.2 }));
/** Extra layers composed with each skill's main art (shared kit). Every invoked spell opens with the ofuda burst. */
export const JAPAN_VFX_LAYERS: Readonly<Record<string, readonly VfxLayer[]>> = {
  ...Object.fromEntries(Object.keys(ONMYOJI_SPELL_ELEMENTS).map((id) => [id, [{ asset: 'kit-ofuda-burst', layer: 'front', scale: 0.8, alpha: 0.85 }, ...residue(id)] as VfxLayer[]])),
  ...Object.fromEntries((['wood', 'fire', 'earth', 'metal', 'water'] as const).map((e) => [`${e}-talisman`, [{ asset: MARK[e], layer: 'particles', pulse: true }] as VfxLayer[]])),
  'sosho-flow': [{ asset: 'kit-mark-fire', layer: 'particles', pulse: true, scale: 1.4 }],
  'sokoku-break': [{ asset: 'kit-mark-water', layer: 'particles', pulse: true, scale: 1.4 }, { asset: 'kit-ofuda-burst', layer: 'front', scale: 0.4 }],
  'gogyo-mandala': [{ asset: 'kit-held-talisman', layer: 'aura', scale: 1.2 }],
  'gogyo-ring-seal': [{ asset: 'kit-gogyo-ring', layer: 'ground', scale: 1.3 }],
  'kongo-talisman': [{ asset: 'kit-ofuda-burst', layer: 'front', scale: 0.6, alpha: 0.8 }, ...residue('kongo-talisman'), { asset: 'kongo-talisman', layer: 'front', offsetX: 30, flipX: true, alpha: 0.85 }],
  // QA fix: the rain art is sparse; two offset, mirrored copies thicken it (Cleansing Rain and Spring Rain).
  'cleansing-rain': [{ asset: 'kit-blessing-glint', layer: 'particles', scale: 1.6 }, { asset: 'cleansing-rain', layer: 'front', offsetX: -70, flipX: true, alpha: 0.75 }, { asset: 'cleansing-rain', layer: 'front', offsetX: 70, alpha: 0.75 }],
  'spring-rain': [{ asset: 'kit-ofuda-burst', layer: 'front', scale: 0.6, alpha: 0.8 }, ...residue('spring-rain'), { asset: 'cleansing-rain', layer: 'front', offsetX: -70, flipX: true, alpha: 0.75, tint: 0xb6e8a8 }, { asset: 'cleansing-rain', layer: 'front', offsetX: 70, alpha: 0.75, tint: 0xb6e8a8 }],
  'steam-burst': [{ asset: 'kit-ofuda-burst', layer: 'front', scale: 0.8, alpha: 0.85 }, ...residue('steam-burst'), { asset: 'steam-burst', layer: 'front', offsetX: 26, delay: 0.25, scale: 0.8, alpha: 0.85 }],
  'molten-swallows': [...residue('molten-swallows'), { asset: 'kit-paper-swallow', layer: 'front', tint: 0xff9a4a, offsetY: -16, delay: 0.12, followRotation: true }, { asset: 'kit-paper-swallow', layer: 'front', tint: 0xff9a4a, offsetY: 16, delay: 0.24, followRotation: true }],
  'ofuda-ward-shot': [{ asset: 'kit-blessing-glint', layer: 'particles', delay: 0.6, scale: 1.4 }],
  'harae-sweep': [{ asset: 'kit-blessing-glint', layer: 'particles', scale: 1.4 }],
  'kagura-purification-dance': [{ asset: 'kit-blessing-glint', layer: 'particles', scale: 1.4 }],
  'suzu-bell-blessing': [{ asset: 'kit-blessing-glint', layer: 'particles' }],
  'divine-miracle-resurrection': [{ asset: 'kit-blessing-glint', layer: 'particles', scale: 1.8 }],
  'sun-pillar': [{ asset: 'kit-blessing-glint', layer: 'particles', scale: 1.2 }],
};

export const JAPAN_PRESENTATION: Readonly<Record<string, SkillPresentation>> = Object.fromEntries(JAPAN_SKILLS.map((k) => {
  const p = SKILL_BEHAVIOR_POLICY[k.behavior];
  return [k.id, { skillId: k.id, behavior: k.behavior, family: k.family, castTimeMs: k.behavior.startsWith('PASSIVE') ? null : k.castMs,
    circle: p.circle ? 'ritual-circle-v1' : null, releaseEffect: p.release ? (JAPAN_VFX_MAIN[k.id]?.asset ?? k.reuses ?? k.id) : null, aura: null } satisfies SkillPresentation];
}));
/** Skills that need their own generated release art (kit-composed or tinted ones excluded). */
export const JAPAN_NEW_VFX: readonly string[] = JAPAN_SKILLS.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].generateVfx && !k.reuses && !JAPAN_VFX_MAIN[k.id]?.asset).map((k) => k.id);

/** Japan casting circle (CIRCLES_AND_AURAS_PROPOSAL.md, style A: Gogyō pentagon, no star): flat top-down art that code
 *  squashes to the ground, rotates, tints and orbits two satellites around. Tint per skill: the spell's elements
 *  alternate (Onmyoji), crimson-gold (Miko), antique gold otherwise. */
// Main = the master Onmyoji circle, line-only and brightened (user 2026-10-11); jp-cast-circle-main stays as a spare base ring.
export const JAPAN_CIRCLE_ASSETS = { main: 'jp-master-circle', satellite: 'jp-cast-circle-satellite' } as const;
export const JAPAN_CIRCLE_GOLD = 0xffe2a8;
export const JAPAN_CIRCLE_MIKO = 0xffb4a0;
export function japanCircleTints(skillId: string): readonly number[] {
  const pair = ONMYOJI_SPELL_ELEMENTS[skillId];
  if (pair) return [...new Set(pair)].map((e) => GOGYO_TINT[e]);
  const element = (['wood', 'fire', 'earth', 'metal', 'water'] as const).find((e) => skillId === `${e}-talisman`);
  if (element) return [GOGYO_TINT[element]];
  return JAPAN_SKILLS.find((k) => k.id === skillId)?.branch === 'miko' ? [JAPAN_CIRCLE_MIKO] : [JAPAN_CIRCLE_GOLD];
}
/** While a buff lasts (user 2026-10-11): area buffs keep a Japan circle on the ground sized to their area (cells);
 *  single-target buffs keep an aura on that player (orbiting talismans, blessing glint, or the shell held dimmed). */
export const JAPAN_BUFF_VFX: Readonly<Record<string, { area?: number; aura?: 'talismans' | 'glint' | 'shell' }>> = {
  'bonfire-ward': { area: 5, aura: 'glint' }, 'ash-barrier': { area: 5 }, 'spring-rain': { area: 7, aura: 'glint' }, 'mirror-pond': { area: 3 },
  'kagura-purification-dance': { area: 9, aura: 'glint' }, 'kotodama-sacred-song': { area: 11, aura: 'glint' }, 'sun-pillar': { area: 5 },
  'gogyo-mandala': { area: 5, aura: 'talismans' }, 'suzu-bell-blessing': { aura: 'glint' }, 'kongo-talisman': { aura: 'shell' },
  ...Object.fromEntries((['wood', 'fire', 'earth', 'metal', 'water'] as const).map((e) => [`${e}-talisman`, { aura: 'talismans' as const }])),
};
/** Grand releases get a Japan circle under the anchor while they play (cells = size, spin = turns per second). */
export const JAPAN_RELEASE_CIRCLE: Readonly<Record<string, { cells: number; spin?: number }>> = {
  'steam-burst': { cells: 3, spin: 0.5 }, 'gogyo-ring-seal': { cells: 11, spin: 1.2 }, 'divine-miracle-resurrection': { cells: 9 }, 'shikigami-ascension': { cells: 7, spin: 0.8 },
  'cleansing-rain': { cells: 13 }, 'summon-kitsune': { cells: 5, spin: 0.6 }, 'summon-kodama': { cells: 5, spin: 0.6 }, 'summon-nurikabe': { cells: 5, spin: 0.6 }, 'summon-kamaitachi': { cells: 5, spin: 0.6 }, 'summon-mizuchi': { cells: 5, spin: 0.6 }, 'root-fissure': { cells: 3 }, mudslide: { cells: 3 }, 'leaf-blade-storm': { cells: 5, spin: 1 },
};

/** Kitsune shikigami prototype (SHIKIGAMI_PROTOTYPE.md): paper-doll flash and smoke first, then the fox bursts out and
 *  bites with blazing tail fire, over the master circle, with the ofuda crest floating above. Other shikigami keep the
 *  tinted flash until their creatures are approved. */
const shikigamiLayers = (creature: string, e: GogyoElement): VfxLayer[] => [
  { asset: 'jp-spirit-smoke', layer: 'ground', scale: 1.3, tint: GOGYO_TINT[e], alpha: 0.85 },
  { asset: creature, layer: 'front', delay: 0.22 },
  { asset: 'jp-ofuda-crest', layer: 'front', offsetY: -150, scale: 0.8 },
];
/** The five Ascension great forms (the current shikigami's great form; the viewer shows one per loop). */
export const JAPAN_GREAT_FORMS: readonly string[] = ['great-kitsune', 'great-nurikabe', 'great-kodama', 'great-kamaitachi', 'great-mizuchi'];
export const JAPAN_SHIKIGAMI_LAYERS: Readonly<Record<string, readonly VfxLayer[]>> = {
  'shikigami-ascension': [
    { asset: 'jp-spirit-smoke', layer: 'ground', scale: 1.6, tint: 0xffd27a, alpha: 0.85 },
    { asset: 'great-kitsune', cycle: JAPAN_GREAT_FORMS, layer: 'front', delay: 0.2 },
    { asset: 'jp-ofuda-crest', layer: 'front', offsetY: -190 },
  ],
  'summon-kodama': shikigamiLayers('shikigami-kodama', 'wood'), 'summon-nurikabe': shikigamiLayers('shikigami-nurikabe', 'earth'),
  'summon-kamaitachi': shikigamiLayers('shikigami-kamaitachi', 'metal'), 'summon-mizuchi': shikigamiLayers('shikigami-mizuchi', 'water'),
  'summon-kitsune': [
    { asset: 'jp-spirit-smoke', layer: 'ground', scale: 1.3, tint: 0xffb48a, alpha: 0.85 },
    { asset: 'shikigami-kitsune', layer: 'front', delay: 0.22 },
    { asset: 'jp-ofuda-crest', layer: 'front', offsetY: -150, scale: 0.8 },
  ],
};
/** Release time in the viewer when the default 1.4 s is too short (a creature attack needs time to read). */
export const JAPAN_RELEASE_MS: Readonly<Record<string, number>> = Object.fromEntries(['summon-kitsune', 'summon-kodama', 'summon-nurikabe', 'summon-kamaitachi', 'summon-mizuchi', 'shikigami-ascension'].map((id) => [id, id === 'shikigami-ascension' ? 3000 : 2600]));

/** Onmyoji circle archetypes by skill function (CIRCLE_SET_REFERENCE.md; user 2026-10-11): one circle system with
 *  interchangeable art; the Gogyō element only colours it. Ultimate Ritual = the master circle. */
export type JapanCircleArchetype = 'ultimate' | 'protection' | 'summoning' | 'purification' | 'attack' | 'binding' | 'sealing' | 'spirit';
export const JAPAN_CIRCLE_ART: Readonly<Record<JapanCircleArchetype, string>> = {
  ultimate: 'jp-master-circle', protection: 'jp-circle-protection', summoning: 'jp-circle-summoning', purification: 'jp-circle-purification',
  attack: 'jp-circle-attack', binding: 'jp-circle-binding', sealing: 'jp-circle-sealing', spirit: 'jp-circle-spirit',
};
const ARCHETYPE_OF: Readonly<Record<string, JapanCircleArchetype>> = {
  'ash-barrier': 'protection', 'kongo-talisman': 'protection', 'mirror-pond': 'protection', 'suzu-bell-blessing': 'protection',
  'summon-kodama': 'summoning', 'summon-kitsune': 'summoning', 'summon-nurikabe': 'summoning', 'summon-kamaitachi': 'summoning', 'summon-mizuchi': 'summoning',
  'spring-rain': 'purification', 'harae-sweep': 'purification', 'kagura-purification-dance': 'purification', 'cleansing-rain': 'purification', purify: 'purification', 'divine-grace': 'purification',
  'steam-burst': 'attack', 'molten-swallows': 'attack', 'leaf-blade-storm': 'attack', 'ofuda-ward-shot': 'attack', 'sun-pillar': 'attack',
  'root-fissure': 'binding', mudslide: 'binding', 'sokoku-break': 'binding',
  'gogyo-ring-seal': 'sealing',
  'bonfire-ward': 'spirit', 'kotodama-sacred-song': 'spirit', 'taikyoku-balance': 'spirit', 'sosho-flow': 'spirit',
};
/** Circle art for a skill (casting circle and area/release circles); anything unlisted uses the Ultimate Ritual master. */
export function japanCircleArt(skillId: string): string { return JAPAN_CIRCLE_ART[ARCHETYPE_OF[skillId] ?? 'ultimate']; }
