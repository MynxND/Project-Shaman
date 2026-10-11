import { SKILL_BEHAVIOR_POLICY, type SkillBehavior, type SkillPresentation, type VfxFamily } from './skill-system.js';

// Thailand job skills (docs/design/skill-database-source.txt lines 53–207): branch A Achan Saiyasat → Grand Necromancer,
// branch B Mor Phhee → Prai Phhee Lord. Behaviour/VFX plan reviewed with the user 2026-10-10
// (docs/design/skills/thailand-v1/DESIGN_REVIEW.md). Presentation catalogue only: no job change, learning or combat yet.
// CT/CD/durations/formulas are copied from the source; null = not given by the source (never "free"/"unlimited").

export type ThaiBranch = 'achan-saiyasat' | 'mor-phhee';
/** Where the release art plays: on the caster, on the target, as a ground zone, or on the caster's summon. */
export type ThaiVfxPlacement = 'self' | 'target' | 'zone' | 'summon' | 'tether' | 'projectile' | 'dash' | 'impact';
/** Shared status loops (one set for every nation, see the review §3). */
export type SharedStatus = 'stun' | 'fear' | 'root' | 'curse-dot' | 'poison' | 'status-immunity' | 'def-up' | 'def-down' | 'blind' | 'heal-block' | 'slow' | 'bleed' | 'knockdown' | 'taunt' | 'reflect' | 'invulnerable';

export interface ThaiSkill {
  id: string; branch: ThaiBranch; jobTier: 2 | 3; sourceLine: number;
  /** Thai skill name. The source tree names skills in English only; these are proposals awaiting user approval. */
  thaiName: string;
  name: string; thai: string; maxLevel: number; behavior: SkillBehavior; family: VfxFamily;
  castMs: number | null; cooldownMs: number | null; durationMs: number | null;
  /** Source formula, shortened to plain text. */
  formula: string;
  /** Area in source cells (e.g. 5 for 5×5); null = single target / self. */
  areaCells: number | null;
  placement: ThaiVfxPlacement | null;
  /** Release art shared with another skill (no new generation). */
  reuses: string | null;
  statuses: readonly SharedStatus[];
  /** Timed buff shown as a state-bound aura while it lasts (activation cue is the release). */
  buffAura: boolean;
  /** Creature sprite required later (not VFX). */
  summon: string | null;
  /** Release art size relative to its native pixels at actor scale (presentation only, never gameplay range). Area
   *  skills are enlarged so they fill the screen (user 2026-10-10: bigger, grander AOE without regenerating). */
  vfxScale: number;
  /** Set when the skill was reworked for uniqueness (SKILL_TREE_UNIQUENESS_AUDIT.md, user 2026-10-11): why it changed.
   *  sourceLine still points at the original source skill. */
  rework?: string;
}

/** Range class of a branch (audit rule): MELEE ≤ 2 cells, MID 3–6, RANGED ≥ 7. */
export type RangeClass = 'MELEE' | 'MID' | 'RANGED';
export interface BranchInfo { name: string; thai: string; tier3: string; range?: RangeClass; signature?: string }
/** A uniqueness rework applied on top of the source catalogue (ids stay, so art/icons keep mapping). */
export interface SkillRework {
  name?: string; thaiName?: string; thai?: string; formula?: string; behavior?: SkillBehavior;
  castMs?: number | null; cooldownMs?: number | null; durationMs?: number | null;
  statuses?: readonly SharedStatus[]; placement?: ThaiVfxPlacement | null; reuses?: string | null; areaCells?: number | null;
  why: string;
}
export function applyRework<T extends { id: string }>(list: readonly T[], rework: Readonly<Record<string, SkillRework>>): T[] {
  return list.map((k) => { const r = rework[k.id]; if (!r) return k; const { why, ...fields } = r; return { ...k, ...fields, rework: why }; });
}

const s = (id: string, branch: ThaiBranch, jobTier: 2 | 3, sourceLine: number, name: string, thai: string, maxLevel: number, behavior: SkillBehavior, family: VfxFamily,
  castMs: number | null, cooldownMs: number | null, durationMs: number | null, formula: string,
  vfx: Partial<Pick<ThaiSkill, 'areaCells' | 'placement' | 'reuses' | 'statuses' | 'buffAura' | 'summon'>> = {}): ThaiSkill => ({
  id, branch, jobTier, sourceLine, name, thai, maxLevel, behavior, family, castMs, cooldownMs, durationMs, formula,
  thaiName: THAI_NAMES[id] ?? name, areaCells: null, placement: null, reuses: null, statuses: [], buffAura: false, summon: null, vfxScale: VFX_SCALE[id] ?? 1, ...vfx,
});

/** Proposed Thai names (2026-10-10, pending user approval; the source gives only English skill names). */
const THAI_NAMES: Readonly<Record<string, string>> = {
  'summon-hun-phayon': 'เสกหุ่นพยนต์', 'sacred-thread-barrier': 'วงสายสิญจน์', 'curse-breaking': 'ถอนคุณไสย', 'phayon-repair': 'ซ่อมหุ่นพยนต์',
  'achans-command': 'บัญชาครู', 'phayon-durability': 'พยนต์คงกระพัน', 'sacred-aura': 'รัศมีคุ้มกาย', 'guardian-link': 'ผูกวิญญาณพยนต์',
  'ward-mastery': 'ชำนาญสายสิญจน์', 'iron-shield-incantation': 'คาถาเกราะเพชร', 'giant-phayon-colossus': 'มหายักษ์พยนต์', 'fortress-of-sacred-thread': 'มหาปราการสายสิญจน์',
  'underworld-soul-pull': 'บ่วงยมโลก', 'colossus-resonance': 'พลังพยนต์สะท้อน', 'transcendent-medium': 'ร่างทรงอภิญญา',
  'ghost-possession': 'พรายเข้าสิง', 'prai-whispering-curse': 'มนตร์พรายกระซิบ', 'soul-drain': 'สูบวิญญาณ', 'terrorize-howl': 'เสียงกรีดร้องพราย',
  'shadow-snare': 'บ่วงเงาพราย', 'dark-affinity': 'สายเลือดมืด', 'vampiric-instinct': 'กระหายโลหิต', 'soul-harvest': 'เก็บวิญญาณ',
  'agile-spirit': 'กายเบาดั่งผี', 'blood-oil-coating': 'ชโลมน้ำมันพราย', 'prai-curse-explosion': 'ระเบิดคำสาปพราย', 'shadow-ghost-avatar': 'อวตารเงาพราย',
  'mass-fear': 'อาถรรพ์ขวัญผวา', 'soul-harvester': 'ยมทูต', 'absolute-soul-defense': 'พรายรับเคราะห์',
};

/** Enlarged area effects (existing art scaled up, no regeneration). */
const VFX_SCALE: Readonly<Record<string, number>> = {
  'sacred-thread-barrier': 1.8, 'fortress-of-sacred-thread': 3, 'underworld-soul-pull': 2, 'terrorize-howl': 1.8, 'mass-fear': 2.2,
  'giant-phayon-colossus': 1.5, 'prai-curse-explosion': 1.4, 'achans-command': 1.3, 'summon-hun-phayon': 1.2,
};

export const THAI_BRANCHES: Readonly<Record<ThaiBranch, BranchInfo>> = {
  'achan-saiyasat': { name: 'Achan Saiyasat', thai: 'อาจารย์ไสยเวท', tier3: 'Grand Necromancer', range: 'MID', signature: 'ขึงสายสิญจน์เป็นเส้นระหว่างหมุด หุ่นพยนต์ และผู้ร่าย ศัตรูที่ข้ามเส้นโดนผล พันธมิตรในกรอบได้รับการคุ้มครอง (เส้นและรูปทรง ไม่ใช่วงกลม)' },
  'mor-phhee': { name: 'Mor Phhee', thai: 'หมอผีสายพราย', tier3: 'Prai Phhee Lord', range: 'MELEE', signature: 'นักสู้ประชิดถือมีดหมอ พรายสิงศัตรูที่ฟันโดนแล้วกระโดดไปตัวถัดไปเมื่อมันตายหรือครบเวลา ยิ่งกระโดดหลายทอดยิ่งแรง' },
};

const BASE_SKILLS: readonly ThaiSkill[] = [
  // Branch A — class 2
  s('summon-hun-phayon', 'achan-saiyasat', 2, 58, 'Summon Hun Phayon', 'ปั้นดินเป่าคาถาเสกหุ่นพยนต์มาสู้และดึงความสนใจมอนสเตอร์', 10, 'ACTIVE_CAST', 'yantra', 3000, 15000, null,
    'หุ่น Max HP = Max HP ผู้ร่าย × (1.0 + Lv × 0.2) · ATK = INT × Lv · ใช้ "ดินเหนียวอาคม" 1 ก้อน', { placement: 'summon', summon: 'hun-phayon' }),
  s('sacred-thread-barrier', 'achan-saiyasat', 2, 64, 'Sacred Thread Barrier', 'ขึงสายสิญจน์ 5×5 ช่อง ปาร์ตี้ในเขตกันสถานะผิดปกติ', 10, 'ACTIVE_CAST', 'yantra', 2500, 45000, null,
    'กัน Stun/Freeze/Silence/Sleep · อยู่ 10 + Lv × 2 วินาที', { areaCells: 5, placement: 'zone', statuses: ['status-immunity'] }),
  s('curse-breaking', 'achan-saiyasat', 2, 69, 'Curse Breaking', 'สวดถอนคุณไสย ล้างสถานะผิดปกติและคำสาปเป้าหมายเดี่ยว', 5, 'ACTIVE_CAST', 'yantra', 1500, 5000, null,
    'โอกาสสำเร็จ 50% + Lv × 10% + INT ÷ 10', { placement: 'target' }),
  s('phayon-repair', 'achan-saiyasat', 2, 74, 'Phayon Repair', 'ถ่ายพลังเวทซ่อมหุ่นพยนต์ของตนเอง', 5, 'ACTIVE_CAST', 'yantra', 1000, 3000, null,
    'ฟื้น HP หุ่น 10% + Lv × 5% ของ Max HP หุ่น', { placement: 'summon', reuses: 'soul-heal' }),
  s('achans-command', 'achan-saiyasat', 2, 79, 'Achan’s Command', 'สั่งหุ่นพยนต์พุ่งกระแทกเป้าหมาย ทำให้มึน', 5, 'ACTIVE_INSTANT', 'yantra', 0, 10000, null,
    'PDMG = ATK หุ่น × (2.0 + Lv × 0.5) · Stun 100% 2 วินาที', { placement: 'target', statuses: ['stun'] }),
  s('phayon-durability', 'achan-saiyasat', 2, 84, 'Phayon Durability', 'เสริมโครงสร้างหุ่นพยนต์', 10, 'PASSIVE_STAT', 'yantra', null, null, null, 'หุ่น DEF/MDEF +5 × Lv และต้านคริติคอล'),
  s('sacred-aura', 'achan-saiyasat', 2, 88, 'Sacred Aura', 'ออร่าศักดิ์สิทธิ์คุ้มครองผู้ร่าย', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ลดเวลาติดสถานะผิดปกติ 10% × Lv (สูงสุด 50%)'),
  s('guardian-link', 'achan-saiyasat', 2, 92, 'Guardian Link', 'ผูกวิญญาณกับหุ่นพยนต์ แบ่งความเจ็บปวด', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ส่งดาเมจที่ผู้ร่ายรับให้หุ่น 4% × Lv (สูงสุด 20%)'),
  s('ward-mastery', 'achan-saiyasat', 2, 96, 'Ward Mastery', 'ขยายขอบเขตอาคมสายสิญจน์', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'Sacred Thread Barrier 5×5 → 7×7 เมื่ออัปเต็ม และอยู่นานขึ้น 5 วินาที'),
  s('iron-shield-incantation', 'achan-saiyasat', 2, 100, 'Iron Shield Incantation', 'คาถาเกราะเพชร ทำงานเองในปาร์ตี้', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'DEF พื้นฐานปาร์ตี้ในหน้าจอ +2% × Lv'),
  // Branch A — class 3 Grand Necromancer
  s('giant-phayon-colossus', 'achan-saiyasat', 3, 106, 'Giant Phayon Colossus', 'เสกหุ่นพยนต์ยักษ์ทองคำแทนตัวเดิม โจมตีกวาดเป็นวงกว้าง', 5, 'ACTIVE_CAST', 'yantra', 5000, 120000, null,
    'Max HP = Max HP ผู้ร่าย × 5.0 · PDMG (Cleave) = ATK × (5.0 + Lv)', { placement: 'summon', summon: 'phayon-colossus' }),
  s('fortress-of-sacred-thread', 'achan-saiyasat', 3, 111, 'Fortress of Sacred Thread', 'ขึงตาข่ายอาคมยักษ์ 31×31 ช่อง มอบเกราะให้พันธมิตร', 5, 'ACTIVE_CAST', 'yantra', 3000, 180000, 15000,
    'Hard DEF/MDEF +20% × Lv นาน 15 วินาที', { areaCells: 31, placement: 'zone', reuses: 'sacred-thread-barrier', statuses: ['def-up'] }),
  s('underworld-soul-pull', 'achan-saiyasat', 3, 116, 'Underworld Soul Pull', 'หลุมดำอาคม ดึงศัตรูในระยะ 11×11 มารวมจุดเดียว', 5, 'ACTIVE_CAST', 'spirit', 2000, 60000, null,
    'MDMG = MATK × (4.0 + Lv × 1.2)', { areaCells: 11, placement: 'zone' }),
  s('colossus-resonance', 'achan-saiyasat', 3, 121, 'Colossus Resonance', 'อาคมสะท้อนบนผิวหุ่นพยนต์', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'สะท้อนดาเมจกายภาพประชิด 6% × Lv (สูงสุด 30%)'),
  s('transcendent-medium', 'achan-saiyasat', 3, 125, 'Transcendent Medium', 'ศาสตร์เข้าทรงขั้นสูงสุด', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ลด CD และ CT สกิลสายอาจารย์ไสยเวท 4% × Lv'),
  // Branch B — class 2
  s('ghost-possession', 'mor-phhee', 2, 134, 'Ghost Possession', 'ยืมพลังพรายสิงร่างตนเอง เข้าสถานะร่างทรง', 10, 'ACTIVE_INSTANT', 'binding', 0, 60000, 60000,
    'โจมตีปกติเป็นธาตุมืด · ASPD +3% × Lv · MATK +2% × Lv นาน 60 วินาที', { placement: 'self', buffAura: true }),
  s('prai-whispering-curse', 'mor-phhee', 2, 139, 'Prai Whispering Curse', 'กระซิบพรายสาปแช่ง ดาเมจต่อเนื่องทะลุพลังป้องกัน 50%', 10, 'ACTIVE_CAST', 'binding', 1000, 5000, 10000,
    'MDMG ต่อวินาที = MATK × (0.2 + Lv × 0.05) นาน 10 วินาที', { placement: 'target', statuses: ['curse-dot'] }),
  s('soul-drain', 'mor-phhee', 2, 144, 'Soul Drain', 'กระชากวิญญาณเป้าหมาย สูบเลือดมาฟื้นฟูตนเอง', 10, 'ACTIVE_CAST', 'binding', 1500, 8000, null,
    'MDMG = MATK × (2.0 + Lv × 0.3) · ฟื้น HP 30% ของดาเมจ', { placement: 'tether' }),
  s('terrorize-howl', 'mor-phhee', 2, 150, 'Terrorize Howl', 'ตะโกนเสียงวิญญาณร้ายรอบตัว 7×7', 5, 'ACTIVE_CAST', 'binding', 1000, 15000, 4000,
    'โอกาส Fear 30% + Lv × 10% นาน 4 วินาที', { areaCells: 7, placement: 'self', statuses: ['fear'] }),
  s('shadow-snare', 'mor-phhee', 2, 155, 'Shadow Snare', 'เงาพรายพุ่งจับขาศัตรู 1 เป้าหมาย', 5, 'ACTIVE_INSTANT', 'binding', 0, 12000, null,
    'Root 1.0 + Lv × 0.5 วินาที', { placement: 'target', statuses: ['root'] }),
  s('dark-affinity', 'mor-phhee', 2, 160, 'Dark Affinity', 'ความคุ้นเคยกับศาสตร์มืด', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ดาเมจเวทธาตุมืด +2% × Lv'),
  s('vampiric-instinct', 'mor-phhee', 2, 164, 'Vampiric Instinct', 'สัญชาตญาณกระหายเลือดจากคำสาป', 10, 'PASSIVE_STAT', 'binding', null, null, null, '0.5% × Lv ของดาเมจคำสาป (รวม DOT) เป็น HP'),
  s('soul-harvest', 'mor-phhee', 2, 168, 'Soul Harvest', 'เก็บเกี่ยววิญญาณผู้แพ้', 5, 'PASSIVE_TRIGGER', 'binding', null, null, 10000,
    'ศัตรูตายใต้ Prai Whispering Curse → MATK +2% ซ้อน 1 × Lv ครั้ง นาน 10 วินาที', { placement: 'self', reuses: 'soul-drain' }),
  s('agile-spirit', 'mor-phhee', 2, 172, 'Agile Spirit', 'ร่างเบาราววิญญาณ', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ระหว่าง Ghost Possession: Flee +6 × Lv'),
  s('blood-oil-coating', 'mor-phhee', 2, 176, 'Blood Oil Coating', 'อาบอาวุธด้วยน้ำมันพราย', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'โจมตีปกติมีโอกาส 1% × Lv ติด Poison (HP −1% ของ Max HP ต่อวินาที)', { placement: 'target', reuses: 'status:poison', statuses: ['poison'] }),
  // Branch B — class 3 Prai Phhee Lord
  s('prai-curse-explosion', 'mor-phhee', 3, 182, 'Prai Curse Explosion', 'จุดชนวนคำสาปในศัตรูทุกตัวให้ระเบิด', 5, 'ACTIVE_CAST', 'binding', 2000, 40000, null,
    'MDMG = MATK × 5.0 · ติด DOT อยู่: + MATK × วินาที DOT ที่เหลือ', { placement: 'target' }),
  s('shadow-ghost-avatar', 'mor-phhee', 3, 188, 'Shadow Ghost Avatar', 'สละเลือดกลายร่างเป็นเงาดำทมิฬลอยเหนือพื้น', 5, 'ACTIVE_INSTANT', 'binding', 0, 120000, 20000,
    'เสีย HP 30% · Magic Critical = 20% × Lv (สูงสุด 100%) นาน 20 วินาที', { placement: 'self', buffAura: true }),
  s('mass-fear', 'mor-phhee', 3, 193, 'Mass Fear', 'รังสีอำมหิตคลุมทั่วแผนที่', 5, 'ACTIVE_CAST', 'binding', 3000, 90000, 5000,
    'โอกาส Fear 50% + Lv × 10% นาน 5 วินาที ทะลุการต้านทานพื้นฐาน', { placement: 'self', statuses: ['fear'] }),
  s('soul-harvester', 'mor-phhee', 3, 198, 'Soul Harvester', 'ผู้เก็บเกี่ยววิญญาณที่แท้จริง', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ศัตรูติดคำสาปตาย → โอกาส 20% × Lv รีเซ็ต CD ของ Prai Curse Explosion และ Soul Drain', { placement: 'self', reuses: 'soul-harvest' }),
  s('absolute-soul-defense', 'mor-phhee', 3, 202, 'Absolute Soul Defense', 'วิญญาณพรายรับเคราะห์แทนร่าง', 5, 'PASSIVE_TRIGGER', 'spirit', null, null, null,
    'HP จะเหลือ 0 → โอกาส 3% × Lv (สูงสุด 15%) ลบดาเมจและฟื้น HP 20% (CD เอฟเฟกต์ 60 วินาที)', { placement: 'self' }),
];

/** Uniqueness rework (SKILL_TREE_UNIQUENESS_AUDIT.md + docs/design/skills/REWORK_V2.md, user approved 2026-10-11). */
const REWORK: Readonly<Record<string, SkillRework>> = {
  'sacred-thread-barrier': { thai: 'ปักหมุดสายสิญจน์ 4 จุดขึงเป็นกรอบ พันธมิตรในกรอบกันสถานะ ศัตรูที่ข้ามเส้นช้าลง',
    formula: 'กรอบสูงสุด 5×5 · กัน Stun/Freeze/Silence/Sleep · ศัตรูข้ามเส้นช้าลง 30% · อยู่ 10 + Lv × 2 วินาที', statuses: ['status-immunity', 'slow'],
    why: 'Achan signature: thread lines between pegs instead of a generic circle ward' },
  'ward-mastery': { name: 'Thread Weaving', thaiName: 'ชำนาญขึงสายสิญจน์', thai: 'ขึงสายสิญจน์ได้หลายหมุดและยาวขึ้น',
    formula: 'หมุด +1 ที่ Lv3 และ Lv5 (ขึงเป็นห้าเหลี่ยม/หกเหลี่ยมได้) · เส้นยาวขึ้น 1 ช่องต่อ Lv', why: 'duplicate name and "5x5 → 7x7" with Japan; now feeds the thread-line mechanic' },
  'underworld-soul-pull': { name: 'Thread Snare Web', thaiName: 'ข่ายสายสิญจน์ดึงตัว', thai: 'ขึงข่ายสายสิญจน์จากทุกหมุด ดึงศัตรูที่ติดเส้นเข้าหาจุดกลางข่าย',
    formula: 'MDMG = MATK × (4.0 + Lv × 1.2) · ดึงศัตรูที่อยู่บนเส้นเข้ากลางข่าย · ตรึง 1.5 วินาที', statuses: ['root'],
    why: 'same skill and underworld story as China\'s Underworld Gate; now a thread web' },
  'ghost-possession': { thai: 'พรายสิงร่างตนเอง ถือมีดหมอฟันประชิด',
    formula: 'ระยะตี 1–2 ช่อง · โจมตีปกติเป็นธาตุมืด · ASPD +3% × Lv · ทุกการฟันโดนส่งพรายเข้าสิง 1 ตน · 60 วินาที', why: 'Mor Phhee becomes the melee possessed fighter (range rule), separate from ranged Santet' },
  'prai-whispering-curse': { name: 'Prai Haunt', thaiName: 'ปล่อยพรายสิง', thai: 'ส่งพรายเข้าสิงศัตรู เมื่อศัตรูตายหรือครบ 6 วินาที พรายกระโดดไปตัวที่ใกล้ที่สุด',
    formula: 'ระยะ 2 ช่อง · MDMG ต่อวินาที = MATK × (0.2 + Lv × 0.05) · กระโดดได้ 3 + Lv ÷ 3 ครั้ง · แรงขึ้น +15% ต่อการกระโดด', statuses: ['curse-dot'],
    why: 'was a generic ranged curse DOT (same as Santet/Voodoo/Blood Mage); now the jumping prai signature' },
  'soul-drain': { formula: 'ระยะ 3 ช่อง · MDMG = MATK × (2.0 + Lv × 0.3) · +20% ต่อครั้งที่พรายกระโดดแล้ว (สูงสุด 5) · ฟื้น HP 30% ของดาเมจ',
    why: 'feeds the jump count instead of being a plain drain like Soul Pluck' },
  'blood-oil-coating': { name: 'Prai Lure', thaiName: 'น้ำมันพรายล่อวิญญาณ', thai: 'ชโลมมีดหมอด้วยน้ำมันพราย ศัตรูที่โดนฟันกลายเป็นเป้าที่พรายกระโดดไปก่อน',
    formula: 'ตีปกติมีโอกาส 4% × Lv ทำเครื่องหมาย 8 วินาที · พรายกระโดดหาเป้าที่มีเครื่องหมายก่อน', statuses: [], reuses: 'prai-whispering-curse',
    why: 'poison overlapped Keris; poison stays Keris-only' },
  'prai-curse-explosion': { thai: 'จุดระเบิดพรายทุกตนที่สิงศัตรูอยู่',
    formula: 'MDMG ต่อพราย = MATK × 5.0 × (1 + 0.2 × จำนวนครั้งที่พรายตนนั้นกระโดด)', why: 'detonates the jumping prai instead of copying Voodoo Mastered' },
  'absolute-soul-defense': { name: 'Prai Takes the Blow', thai: 'สละพรายหนึ่งตนให้รับเคราะห์แทนร่าง',
    formula: 'HP จะเหลือ 0 ขณะมีพรายสิงศัตรูอยู่: สละพราย 1 ตน รับดาเมจแทน ฟื้น HP 10% × Lv (CD 60 วินาที)', why: 'cheat-death crowding (7 branches): now a cost paid with an active prai, not a random chance' },
};
export const THAILAND_SKILLS: readonly ThaiSkill[] = applyRework(BASE_SKILLS, REWORK);


/** Policy-checked presentation for each Thai skill (same shape as MEDIUM_PRESENTATION). */
export const THAILAND_PRESENTATION: Readonly<Record<string, SkillPresentation>> = Object.fromEntries(THAILAND_SKILLS.map((k) => {
  const p = SKILL_BEHAVIOR_POLICY[k.behavior];
  return [k.id, {
    skillId: k.id, behavior: k.behavior, family: k.family,
    castTimeMs: k.behavior.startsWith('PASSIVE') ? null : k.castMs,
    circle: p.circle ? 'ritual-circle-v1' : null, releaseEffect: p.release ? (k.reuses ?? k.id) : null, aura: null,
  } satisfies SkillPresentation];
}));

/** Skills whose release needs new PixelLab art (not PASSIVE_STAT, not reused). */
export const THAILAND_NEW_VFX: readonly string[] = THAILAND_SKILLS.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].generateVfx && !k.reuses).map((k) => k.id);

/** Same shape for any nation catalogue (branch id is nation-specific). */
export type NationSkill = Omit<ThaiSkill, 'branch'> & { branch: string };
