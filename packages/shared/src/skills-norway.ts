import { SKILL_BEHAVIOR_POLICY, type SkillBehavior, type SkillPresentation, type VfxFamily } from './skill-system.js';
import { applyRework, type BranchInfo, type NationSkill, type SkillRework } from './skills-thailand.js';

// Norway job skills (docs/design/skills/norway-v1/NORWAY_DESIGN.md; user 2026-10-11): branch A Rune Seer → Frost Rune
// Archmage (source tree lines 1003–1083, reworked around the Rune Cast queue), branch B Ullr Hunter → Ullr's Huntmaster
// (new bow hunter replacing Seidr Witch; sourceLine 0 = the design doc). Presentation catalogue only; numbers provisional.

export type NorwayBranch = 'rune-seer' | 'ullr-hunter';
/** The four runes of the Rune Cast queue. User 2026-10-11: real Elder Futhark allowed (Norway exception). Glyphs are
 *  drawn in code from verified forms; meanings follow the standard reading: Isa = ice, Hagalaz = hail, Perthro = lot
 *  cup / fate, Kenaz = torch. Runes with modern extremist re-use (Sowilo, Tiwaz, Othala, Algiz) are not used. */
export type NorseRune = 'ice' | 'storm' | 'fate' | 'hearth';
export const NORSE_RUNE_GLYPH: Readonly<Record<NorseRune, { rune: string; name: string }>> = {
  ice: { rune: 'ᛁ', name: 'Isa' }, storm: { rune: 'ᚺ', name: 'Hagalaz' }, fate: { rune: 'ᛈ', name: 'Perthro' }, hearth: { rune: 'ᚲ', name: 'Kenaz' },
};
/** Hunter rune traps and arrows (same rules): Naudiz = need/constraint (snare), Isa = ice (freeze), Thurisaz = thorn
 *  (blast + bleed), Dagaz = day/dawn (flash); Uruz = strength (charged arrow), Raidho = journey (homing volley). */
export const HUNTER_RUNES = { snare: 'ᚾ', freeze: 'ᛁ', blast: 'ᚦ', flash: 'ᛞ', charged: 'ᚢ', volley: 'ᚱ' } as const;
export const NORSE_RUNE_EFFECT: Readonly<Record<NorseRune, string>> = {
  ice: 'โอกาสแช่แข็ง ×2', storm: 'ผลักถอย 2 ช่อง / ขยายพื้นที่ 1 ช่อง', fate: 'คริติคอลเวท + คืน SP 20%', hearth: 'โล่ 5% Max HP ให้ผู้ร่าย',
};
type Vfx = Partial<Pick<NationSkill, 'areaCells' | 'placement' | 'reuses' | 'statuses' | 'buffAura' | 'summon'>>;

const THAI_NAMES: Readonly<Record<string, string>> = {
  'blizzard-storm': 'พายุหิมะ', 'rune-trap': 'หินรูน', prophecy: 'ทอยรูนทำนาย', 'frost-bolt': 'ศรน้ำแข็ง', 'ice-wall': 'กำแพงน้ำแข็ง',
  'frost-mastery': 'ชำนาญเวทน้ำแข็ง', 'rune-reading': 'อ่านรูน', 'chilling-aura': 'ออร่าเหน็บหนาว', 'winters-grasp': 'อ้อมกอดเหมันต์', 'cold-blood': 'เลือดเย็นชา',
  fimbulwinter: 'ฤดูหนาวมรณะ', 'absolute-zero-field': 'ศูนย์องศาสัมบูรณ์', 'shatter-rune': 'รูนแตกสลาย', 'rune-mastery': 'ชำนาญรูน', 'frost-penetration': 'น้ำแข็งทะลวง',
  'twin-shot': 'ยิงศรคู่', 'falcon-strike': 'เหยี่ยวจู่โจม', 'ski-dash': 'ไถลสกีหลบ', 'rune-trap-kit': 'กับดักรูน', 'charged-rune-arrow': 'ศรรูนอัดพลัง',
  'bow-mastery': 'ชำนาญธนู', 'trackers-eye': 'ตานักตามรอย', 'falcon-bond': 'เหยี่ยวคู่ใจ', 'trappers-craft': 'ช่างกับดัก', 'hunters-stride': 'ก้าวนักล่า',
  'ullrs-volley': 'ห่าศรอุลล์', 'great-hunt': 'มหาการล่า', 'falcon-storm': 'พายุเหยี่ยว', 'rune-arrow-mastery': 'ชำนาญศรรูน', 'hunters-patience': 'ความอดทนของนักล่า',
};
const VFX_SCALE: Readonly<Record<string, number>> = { 'blizzard-storm': 2, 'frost-bolt': 1.5, 'absolute-zero-field': 1.5, 'shatter-rune': 1.8, 'ice-wall': 1.25, fimbulwinter: 2.8, 'ullrs-volley': 1.4, 'falcon-storm': 1.5, 'great-hunt': 1.5, 'rune-trap-kit': 1.2 };

const s = (id: string, branch: NorwayBranch, jobTier: 2 | 3, sourceLine: number, name: string, thai: string, maxLevel: number, behavior: SkillBehavior, family: VfxFamily,
  castMs: number | null, cooldownMs: number | null, durationMs: number | null, formula: string, vfx: Vfx = {}): NationSkill => ({
  id, branch, jobTier, sourceLine, name, thai, maxLevel, behavior, family, castMs, cooldownMs, durationMs, formula,
  thaiName: THAI_NAMES[id] ?? name, areaCells: null, placement: null, reuses: null, statuses: [], buffAura: false, summon: null, vfxScale: VFX_SCALE[id] ?? 1, ...vfx,
});

export const NORWAY_BRANCHES: Readonly<Record<NorwayBranch, BranchInfo>> = {
  'rune-seer': { name: 'Rune Seer', thai: 'แม่มดรูน', tier3: 'Frost Rune Archmage', range: 'RANGED',
    signature: 'ทอยรูน: ถือคิวรูน 3 อันที่สุ่มจาก 4 แบบ (น้ำแข็ง พายุ ชะตา เตาไฟ) ทุกเวทโจมตีกินรูนหน้าสุดแล้วได้ผลของรูนนั้น ต้องวางแผนว่าเวทไหนกินรูนไหน' },
  'ullr-hunter': { name: 'Ullr Hunter', thai: 'นักล่าแห่งอุลล์', tier3: "Ullr's Huntmaster", range: 'RANGED',
    signature: 'นักล่าธนูแบบฮันเตอร์: ยิงศรคู่มาร์กเหยื่อ → เหยี่ยวโฉบเปิดตำแหน่ง (โฉบเองด้วยโชค LUK) → กับดักรูน 4 แบบ (ᚾ ตรึง ᛁ แช่แข็ง ᚦ ระเบิดหนาม ᛞ แสงวาบ) → ศรรูนอัดพลังแรงขึ้น 25% ต่อเงื่อนไข (สูงสุด 75%) · ยิงไกลที่สุด ยิงไปเดินไป ต่างจากสไนเปอร์ยืนยิงของอเมริกา' },
};

const BASE_SKILLS: readonly NationSkill[] = [
  // Rune Seer (class 2) — source formulas
  s('blizzard-storm', 'rune-seer', 2, 1008, 'Blizzard Storm', 'พายุหิมะถล่มพื้นที่ 7×7', 10, 'ACTIVE_CAST', 'spirit', 2500, 7000, 5000,
    'MDMG (Water) = MATK × (1.0 + Lv × 0.2) ทุก 0.5 วินาที 5 วินาที · ช้าลง 20% + Lv × 3%', { areaCells: 7, placement: 'zone', statuses: ['slow'] }),
  s('rune-trap', 'rune-seer', 2, 1014, 'Rune Trap', 'สลักหินรูนวางบนพื้น', 5, 'ACTIVE_CAST', 'yantra', 1000, 3000, 60000,
    'เหยียบแล้วระเบิด MDMG = MATK × (3.0 + Lv) รัศมี 3×3', { areaCells: 3, placement: 'zone' }),
  s('prophecy', 'rune-seer', 2, 1019, 'Prophecy', 'ทำนายอนาคตแห่งชัยชนะ', 10, 'ACTIVE_CAST', 'yantra', 2000, 30000, null,
    'ปาร์ตี้ Critical Rate +2 × Lv · Critical Damage +2% × Lv', { placement: 'self' }),
  s('frost-bolt', 'rune-seer', 2, 1024, 'Frost Bolt', 'ศรน้ำแข็งทะลวงเป้าหมายเดี่ยว', 10, 'ACTIVE_CAST', 'spirit', 1000, 1500, null,
    'MDMG (Water) = MATK × (1.5 + Lv × 0.3) · แช่แข็ง 5% + Lv × 1% 3 วินาที', { placement: 'projectile', statuses: ['slow'] }),
  s('ice-wall', 'rune-seer', 2, 1030, 'Ice Wall', 'กำแพงน้ำแข็งสกัดเส้นทาง ยาวและสูงขึ้นตามเลเวล', 5, 'ACTIVE_CAST', 'spirit', 1500, 20000, 15000,
    'กำแพงยาว 3 + Lv ช่อง สูงขึ้นทุกเลเวล · ผู้เล่นและมอนสเตอร์เดินผ่านไม่ได้ขณะกำแพงยังตั้งอยู่ · HP 3,000 × Lv ตีแตกได้ · ละลายเองใน 15 วินาที', { placement: 'zone' }),
  s('frost-mastery', 'rune-seer', 2, 1035, 'Frost Mastery', 'เชี่ยวชาญเวทแดนเหนือ', 10, 'PASSIVE_STAT', 'spirit', null, null, null, 'ดาเมจธาตุน้ำ/น้ำแข็ง +2.5% × Lv'),
  s('rune-reading', 'rune-seer', 2, 1039, 'Rune Reading', 'อ่านและสลักอักขระรวดเร็ว', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'CT สกิลวางพื้น −4% × Lv'),
  s('chilling-aura', 'rune-seer', 2, 1043, 'Chilling Aura', 'ออร่าหนาวเหน็บรอบตัว', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'ศัตรูในรัศมี 3 ช่อง ASPD −3% × Lv'),
  s('winters-grasp', 'rune-seer', 2, 1047, "Winter's Grasp", 'อ้อมกอดแห่งเหมันต์', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'Freeze นานขึ้น 0.5 × Lv วินาที · ติด Freeze MDEF −20%'),
  s('cold-blood', 'rune-seer', 2, 1051, 'Cold Blood', 'เลือดเย็นชา', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'ต้านธาตุน้ำ +10% × Lv · กัน Freeze ตนเอง'),
  // Frost Rune Archmage (class 3)
  s('fimbulwinter', 'rune-seer', 3, 1057, 'Fimbulwinter', 'อัญเชิญฤดูหนาวมรณะทั่วจอ', 5, 'ACTIVE_CAST', 'spirit', 4000, 90000, 10000,
    'MDMG (Water) = MATK × (2.0 + Lv × 0.5) ทุกวินาที 10 วินาที · ช้าลง 90% ทั้งจอ', { areaCells: 15, placement: 'zone', statuses: ['slow'] }),
  s('absolute-zero-field', 'rune-seer', 3, 1063, 'Absolute Zero Field', 'แช่แข็งเป้าหมายเดี่ยว (ใช้กับบอสได้)', 5, 'ACTIVE_CAST', 'spirit', 1500, 45000, 5000,
    'Absolute Freeze 2 + Lv × 0.6 วินาที', { placement: 'target', statuses: ['stun'] }),
  s('shatter-rune', 'rune-seer', 3, 1068, 'Shatter Rune', 'จุดชนวนรูนน้ำแข็งในตัวเป้าหมาย', 5, 'ACTIVE_INSTANT', 'binding', 0, 15000, null,
    'Burst MDMG = MATK × (10.0 + Lv × 2.0) · ติด Freeze: ทะลุ MDEF 100%', { placement: 'target' }),
  s('rune-mastery', 'rune-seer', 3, 1074, 'Rune Mastery', 'ปรมาจารย์อักขระโบราณ', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'CD เวทน้ำ/น้ำแข็ง −6% × Lv'),
  s('frost-penetration', 'rune-seer', 3, 1078, 'Frost Penetration', 'น้ำแข็งทะลวงทุกสิ่ง', 5, 'PASSIVE_STAT', 'spirit', null, null, null, 'เวทธาตุน้ำมองข้าม MDEF 10% × Lv'),
  // Ullr Hunter (class 2) — v2: RO-Hunter-like bow class with rune traps and an auto-diving falcon (NORWAY_DESIGN.md)
  s('twin-shot', 'ullr-hunter', 2, 0, 'Twin Shot', 'ยิงศรสองดอกติดกันใส่เป้าหมาย และทำเครื่องหมายเหยื่อ', 10, 'ACTIVE_INSTANT', 'binding', 0, 800, null,
    'ระยะ 9 + Bow Mastery · PDMG = ATK × (1.0 + Lv × 0.1) × 2 ดอก · ทำเครื่องหมายเหยื่อ 20 วินาที (เงื่อนไขการล่าข้อ 1) · เหยื่อรับดาเมจจากนักล่า +1% × Lv', { placement: 'projectile' }),
  s('falcon-strike', 'ullr-hunter', 2, 0, 'Falcon Strike', 'สั่งเหยี่ยวโฉบเป้าหมาย', 10, 'ACTIVE_INSTANT', 'spirit', 0, 6000, null,
    'ดาเมจเหยี่ยว = (DEX ÷ 10 + INT ÷ 2) × 2 × Lv (ไม่ขึ้นกับ ATK เหมือนเหยี่ยวจริง) · เหยื่อที่มาร์ก: เปิดตำแหน่ง ล่องหนไม่ได้ 8 วินาที + ตาบอด 1 วินาที (เงื่อนไขการล่าข้อ 2)', { placement: 'projectile', statuses: ['blind'] }),
  s('ski-dash', 'ullr-hunter', 2, 0, 'Ski Dash', 'ไถลสกีถอยหลังหนีศัตรู', 5, 'ACTIVE_INSTANT', 'spirit', 0, 10000, null,
    'ถอยหลัง 5 ช่อง ทิ้งรอยหิมะให้ศัตรูช้าลง 30% 3 วินาที · ศรลูกถัดไปคริติคอล +10 × Lv', { placement: 'dash', statuses: ['slow'] }),
  s('rune-trap-kit', 'ullr-hunter', 2, 0, 'Rune Trap Kit', 'วางกับดักแกะสลักรูน กดซ้ำเพื่อเปลี่ยนรูน', 10, 'ACTIVE_CAST', 'binding', 500, 3000, 60000,
    'วางได้ 3 อัน (Trapper\'s Craft +) · ᚾ Naudiz: ตรึง 2 + Lv × 0.3 วินาที · ᛁ Isa: แช่แข็ง 1 + Lv × 0.2 วินาที · ᚦ Thurisaz: ระเบิดหนาม PDMG = DEX × (2 + Lv) + เลือดไหล · ᛞ Dagaz: แสงวาบ ตาบอด 3 วินาที · ทุกกับดักที่ติดนับเป็นเงื่อนไขการล่าข้อ 3', { areaCells: 3, placement: 'zone', statuses: ['root', 'bleed', 'blind'] }),
  s('charged-rune-arrow', 'ullr-hunter', 2, 0, 'Charged Rune Arrow', 'ง้างศรสลักรูน ᚢ Uruz อัดพลังแล้วปล่อย', 10, 'ACTIVE_CHANNEL', 'yantra', 1500, 6000, null,
    'PDMG = ATK × (2.0 + Lv × 0.4) × (1 + เวลาง้าง 0–1.5 วินาที ÷ 1.5) · +25% ต่อเงื่อนไขการล่าที่เหยื่อติด (มาร์ก / เปิดตำแหน่ง / ติดกับดัก) สูงสุด +75%', { placement: 'projectile' }),
  s('bow-mastery', 'ullr-hunter', 2, 0, 'Bow Mastery', 'ชำนาญธนูยาว ยิงไกลที่สุดในสายนักล่า', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ใช้ Bow: ระยะยิง +1 ช่องทุก 2 Lv (สูงสุด +5) · PDMG +3 × Lv · ASPD +1% × Lv'),
  s('falcon-bond', 'ullr-hunter', 2, 0, 'Falcon Bond', 'เหยี่ยวคู่ใจโฉบตามเองระหว่างยิง', 10, 'PASSIVE_TRIGGER', 'spirit', null, null, null,
    'โจมตีปกติมีโอกาส (LUK ÷ 3)% ให้เหยี่ยวโฉบเอง (ใช้ดาเมจ Falcon Strike Lv ที่เรียน) · เหยื่อที่มาร์กโดนบ่อยขึ้น 2 เท่า', { placement: 'target', reuses: 'falcon-strike' }),
  s('trappers-craft', 'ullr-hunter', 2, 0, "Trapper's Craft", 'ช่างทำกับดักผู้ชำนาญ', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'วางกับดักได้ +1 อันที่ Lv3 และ Lv5 · ผลกับดัก +6% × Lv · เก็บกับดักคืนได้ (คืน CD 50%)'),
  s('trackers-eye', 'ullr-hunter', 2, 0, "Tracker's Eye", 'มองเห็นรอยเท้าเหยื่อ', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'เห็นเหยื่อที่มาร์กทะลุสิ่งกีดขวาง · มาร์กนานขึ้น 2 × Lv วินาที · ตรวจจับล่องหนรอบตัว 3 ช่อง'),
  s('hunters-stride', 'ullr-hunter', 2, 0, "Hunter's Stride", 'ยิงไปเดินไปไม่เสียจังหวะ', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ยิงขณะเดินได้ (ความเร็ว −20%, ลดลง 4% × Lv) · หลัง Ski Dash ความเร็ว +5% × Lv 3 วินาที'),
  // Ullr's Huntmaster (class 3)
  s('ullrs-volley', 'ullr-hunter', 3, 0, "Ullr's Volley", 'ปล่อยห่าศรสลักรูน ᚱ Raidho วิ่งหาเหยื่อที่มาร์ก', 5, 'ACTIVE_CAST', 'yantra', 1500, 30000, null,
    'ศร 6 + Lv ลูก ตามหาเหยื่อที่มาร์กทุกตัวบนจอ · PDMG = ATK × (1.5 + Lv × 0.3) ต่อลูก (ไม่ใช่ฝนธนูแบบอเมริกา)', { placement: 'projectile' }),
  s('great-hunt', 'ullr-hunter', 3, 0, 'Great Hunt', 'เรียกปาร์ตี้ออกล่าพร้อมกัน', 5, 'ACTIVE_CAST', 'binding', 2000, 120000, 20000,
    '20 วินาที: ทุกการโจมตีของปาร์ตี้มาร์กเหยื่อได้ · นักล่าได้เงื่อนไขการล่าครบ 3 ข้อกับเหยื่อที่มาร์ก · เหยี่ยวโฉบเองบ่อยขึ้น 2 เท่า', { areaCells: 11, placement: 'self', buffAura: true }),
  s('falcon-storm', 'ullr-hunter', 3, 0, 'Falcon Storm', 'ฝูงวิญญาณเหยี่ยวโฉบถล่มพื้นที่', 5, 'ACTIVE_CAST', 'spirit', 1500, 45000, 4000,
    'ดาเมจเหยี่ยว × (1 + Lv × 0.3) ทุก 0.5 วินาที 4 วินาที วง 5×5 รอบเหยื่อที่มาร์ก · ตาบอด 1 วินาที', { areaCells: 5, placement: 'zone', statuses: ['blind'] }),
  s('rune-arrow-mastery', 'ullr-hunter', 3, 0, 'Rune Arrow Mastery', 'ปรมาจารย์ศรรูน', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'Charged Rune Arrow ง้างเร็วขึ้น 6% × Lv · ดาเมจ +4% × Lv · ยิงทะลุเป้าหมายแรกได้'),
  s('hunters-patience', 'ullr-hunter', 3, 0, "Hunter's Patience", 'ความอดทนของนักล่า', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ทุกครั้งที่กับดักทำงาน CD ศรรูนอัดพลัง −1 วินาที × Lv ÷ 2', { placement: 'self', reuses: 'rune-trap-kit' }),
];

/** Rune Cast rework of the source Rune Seer (NORWAY_DESIGN.md): rune hooks, no traps, no party crit buff. */
const REWORK: Readonly<Record<string, SkillRework>> = {
  'blizzard-storm': { formula: 'MDMG (Water) = MATK × (1.0 + Lv × 0.2) ทุก 0.5 วินาที 5 วินาที · ช้าลง 20% + Lv × 3% · กินรูนหน้าสุด', why: 'Rune Cast hook' },
  'frost-bolt': { formula: 'MDMG (Water) = MATK × (1.5 + Lv × 0.3) · แช่แข็ง 5% + Lv × 1% · กินรูนหน้าสุด (น้ำแข็ง: แช่แข็ง ×2)', why: 'Rune Cast hook' },
  'rune-trap': { name: 'Runestone', thaiName: 'หินรูนสลัก', thai: 'ปักหินรูนตั้งตรง เวทที่ร่ายใกล้หินจะได้ผลรูนซ้ำอีกครั้ง',
    formula: 'ปักได้ 2 ก้อน 60 วินาที · เวทที่ร่ายในระยะ 3 ช่องจากหิน ได้ผลรูนหน้าสุดซ้ำ 1 ครั้ง (ไม่กินรูนเพิ่ม)', why: 'traps now belong to the Ullr Hunter; the stone echoes runes' },
  prophecy: { name: 'Cast the Lots', thaiName: 'ทอยรูนทำนาย', thai: 'ทอยรูนใหม่ทั้งคิวแล้วเลือกเรียงลำดับเอง',
    formula: 'เปิดรูน 3 อันใหม่ เลือกเรียงลำดับได้ · 3 เวทถัดไปผลรูน +10% × Lv ÷ 2', why: 'party crit buff overlapped Gut/Taiga; now steers the Rune Cast queue' },
  'rune-reading': { formula: 'เห็นรูนในคิว 4 อัน (แทน 3) · CT สกิลวางพื้น −4% × Lv', why: 'reads the queue further ahead' },
  'shatter-rune': { formula: 'Burst MDMG = MATK × (10.0 + Lv × 2.0) · กินรูนทั้งคิว: +15% ต่อรูน · ติด Freeze: ทะลุ MDEF 100%', why: 'cash-in of the whole queue' },
  'rune-mastery': { formula: 'CD เวทน้ำ/น้ำแข็ง −6% × Lv · ทุก 10 วินาทีเปลี่ยนรูนหน้าสุดเป็นรูนที่ต้องการได้ 1 ครั้ง', why: 'more control over the random draw' },
  fimbulwinter: { formula: 'MDMG (Water) = MATK × (2.0 + Lv × 0.5) ทุกวินาที 10 วินาที · ช้าลง 90% ทั้งจอ · ระหว่างนั้นทุกรูนที่จั่วเป็นรูนน้ำแข็ง', why: 'Rune Cast hook' },
};
export const NORWAY_SKILLS: readonly NationSkill[] = applyRework(BASE_SKILLS, REWORK);

export const NORWAY_PRESENTATION: Readonly<Record<string, SkillPresentation>> = Object.fromEntries(NORWAY_SKILLS.map((k) => {
  const p = SKILL_BEHAVIOR_POLICY[k.behavior];
  return [k.id, { skillId: k.id, behavior: k.behavior, family: k.family, castTimeMs: k.behavior.startsWith('PASSIVE') ? null : k.castMs,
    circle: p.circle ? 'ritual-circle-v1' : null, releaseEffect: p.release ? (k.reuses ?? k.id) : null, aura: null } satisfies SkillPresentation];
}));
export const NORWAY_NEW_VFX: readonly string[] = NORWAY_SKILLS.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].generateVfx && !k.reuses).map((k) => k.id);

import type { VfxLayer, VfxLayerKind } from './skills-russia.js';
const RUNE_SEER_RUNES = ['rune-isa', 'rune-hagalaz', 'rune-perthro', 'rune-kenaz'] as const;
/** Trap runes in Rune Trap Kit order, and the trigger effect shown for each (same loop index). */
const TRAP_RUNES = ['rune-naudiz', 'rune-isa', 'rune-thurisaz', 'rune-dagaz'] as const;
const TRAP_BURSTS = ['trap-snare', 'kit-snow-burst', 'trap-blast', 'trap-flash'] as const;
/** Main art taken from a kit sheet (and optional tint) instead of the skill's own sheet. */
export const NORWAY_VFX_MAIN: Readonly<Record<string, { layer: VfxLayerKind; asset?: string; tint?: number; offsetY?: number }>> = {
  'twin-shot': { layer: 'front', asset: 'kit-spirit-arrow' }, 'falcon-strike': { layer: 'front', asset: 'kit-bone-falcon-dive' },
  'falcon-bond': { layer: 'front', asset: 'kit-bone-falcon-dive' }, 'ski-dash': { layer: 'ground', asset: 'kit-snow-burst' },
  'rune-trap-kit': { layer: 'ground', asset: 'kit-trap-base' }, 'charged-rune-arrow': { layer: 'front', asset: 'kit-spirit-arrow' },
  'ullrs-volley': { layer: 'front', asset: 'kit-spirit-arrow' }, 'falcon-storm': { layer: 'front', asset: 'kit-bone-falcon-dive' },
  'hunters-patience': { layer: 'ground', asset: 'kit-trap-base' }, 'great-hunt': { layer: 'ground' }, 'blizzard-storm': { layer: 'ground' },
  // QA: the Fimbulwinter seed came back as an opaque landscape painting (rejected, not animated) — built from Blizzard art.
  fimbulwinter: { layer: 'ground', asset: 'blizzard-storm', tint: 0xc8dcf0 },
};
/** Extra layers: code-drawn real runes (cycling one per preview loop), extra arrows/falcons, trap trigger bursts. */
export const NORWAY_VFX_LAYERS: Readonly<Record<string, readonly VfxLayer[]>> = {
  'twin-shot': [{ asset: 'kit-spirit-arrow', layer: 'front', offsetY: 10, delay: 0.04, followRotation: true, hideAfter: 0.14 }, { asset: 'kit-spirit-impact', layer: 'front', atTarget: true, delay: 0.1, scale: 0.7 }],
  'ullrs-volley': [...[-24, -12, 12, 24].map((offsetY, i) => ({ asset: 'kit-spirit-arrow', layer: 'front' as const, offsetY, delay: 0.02 * (i + 1), followRotation: true, hideAfter: 0.2 })), { asset: 'shatter-rune', layer: 'front' as const, atTarget: true, delay: 0.16, scale: 1.1 }],
  'falcon-storm': [{ asset: 'kit-bone-falcon-dive', layer: 'front', offsetX: -44, delay: 0.15 }, { asset: 'kit-bone-falcon-dive', layer: 'front', offsetX: 44, delay: 0.3, flipX: true }],
  'rune-trap-kit': [{ asset: 'rune-naudiz', cycle: TRAP_RUNES, layer: 'front', offsetY: -120, scale: 1.8 }, { asset: 'trap-snare', cycle: TRAP_BURSTS, layer: 'front', delay: 0.45 }],
  'charged-rune-arrow': [{ asset: 'kit-spirit-impact', layer: 'front', atTarget: true, delay: 0.08, scale: 1.3 }, { asset: 'kit-snow-burst', layer: 'front', atTarget: true, delay: 0.1, scale: 1.2 },{ asset: 'charged-rune-arrow', layer: 'front', atCaster: true, tint: 0xd8b8ff }, { asset: 'rune-uruz', layer: 'front', atCaster: true, offsetY: -80, scale: 1.8 }],
  'rune-trap': [{ asset: 'rune-isa', cycle: RUNE_SEER_RUNES, layer: 'front', offsetY: -64, scale: 2.2 }],
  // Ice Wall at max level in the viewer (iceWallSpec(5): 8 cells, taller): the wall art repeats along the line.
  'ice-wall': [{ asset: 'ice-wall', layer: 'front', offsetX: -150, delay: 0.05, flipX: true }, { asset: 'ice-wall', layer: 'front', offsetX: 150, delay: 0.1 }, { asset: 'kit-snow-burst', layer: 'front', scale: 1.6, alpha: 0.8 }],
  'absolute-zero-field': [{ asset: 'kit-snow-burst', layer: 'ground', scale: 1.4 }, { asset: 'shatter-rune', layer: 'front', delay: 0.75, scale: 1.3 }],
  prophecy: [{ asset: 'rune-isa', cycle: RUNE_SEER_RUNES, layer: 'front', offsetY: -56, scale: 2 }],
  'falcon-strike': [{ asset: 'kit-spirit-impact', layer: 'front', atTarget: true, delay: 0.18, scale: 0.8 }],
  'frost-bolt': [{ asset: 'shatter-rune', layer: 'front', atTarget: true, delay: 0.2, scale: 1.1 }, { asset: 'kit-snow-burst', layer: 'front', atTarget: true, delay: 0.22, scale: 1.1 }, { asset: 'rune-isa', layer: 'front', scale: 1.2 }],
  'shatter-rune': [{ asset: 'kit-snow-burst', layer: 'front', scale: 1.8 }, { asset: 'absolute-zero-field', layer: 'front', scale: 0.9, offsetX: -40, delay: 0.1 }, { asset: 'rune-isa', cycle: RUNE_SEER_RUNES, layer: 'front', offsetY: -24, scale: 2.4 }],
  'blizzard-storm': [{ asset: 'absolute-zero-field', layer: 'front', scale: 0.7, offsetX: -70, delay: 0.3 }, { asset: 'absolute-zero-field', layer: 'front', scale: 0.6, offsetX: 80, delay: 0.45, flipX: true }, { asset: 'rune-hagalaz', layer: 'front', offsetY: -130, scale: 2.2 }],
  fimbulwinter: [{ asset: 'rune-isa', layer: 'front', offsetY: -140, scale: 2.8 }, { asset: 'kit-snow-burst', layer: 'front', scale: 2.2, offsetX: -60 }, { asset: 'kit-snow-burst', layer: 'front', scale: 2.2, offsetX: 60, flipX: true, delay: 0.2 }, { asset: 'absolute-zero-field', layer: 'front', scale: 0.8, offsetX: 90, delay: 0.35 }, { asset: 'absolute-zero-field', layer: 'front', scale: 0.7, offsetX: -90, delay: 0.5 }],
  'great-hunt': [{ asset: 'kit-bone-falcon', layer: 'front', offsetY: -90, delay: 0.2 }],
};

/** Arrow travel time as a fraction of the release (user 2026-10-11: arrows were far too slow — shoot and hit at once).
 *  The arrow disappears on arrival and the impact layers (atTarget) take over. Default projectile travel is 0.7. */
export const NORWAY_PROJECTILE_TRAVEL: Readonly<Record<string, number>> = {
  'twin-shot': 0.1, 'charged-rune-arrow': 0.08, 'ullrs-volley': 0.16, 'falcon-strike': 0.18, 'frost-bolt': 0.2,
};
/** Persistent companions (user: the Falcon Bond falcon stays with the hunter at all times). Drawn beside the caster on
 *  every skill of the branch, gliding in a loop. */
export const NATION_COMPANIONS: Readonly<Record<string, { asset: string; tint?: number; offsetX: number; offsetY: number; scale?: number }>> = {
  'ullr-hunter': { asset: 'kit-bone-falcon', offsetX: -46, offsetY: -96, scale: 0.6 },
};

/** Ice Wall rule (source tree line 1030 + user 2026-10-11: longer and bigger with every level, blocks everyone except the
 *  caster's side from walking through while it stands, can be broken). One segment per cell along the cast line. */
export interface IceWallSpec { lengthCells: number; heightScale: number; hp: number; durationMs: number; blocksMovement: true; breakable: true }
export function iceWallSpec(level: number): IceWallSpec {
  const lv = Math.max(1, Math.min(5, Math.floor(level)));
  return { lengthCells: 3 + lv, heightScale: 1 + lv * 0.12, hp: 3000 * lv, durationMs: 15000, blocksMovement: true, breakable: true };
}
