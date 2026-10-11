import { SKILL_BEHAVIOR_POLICY, type SkillBehavior, type SkillPresentation, type VfxFamily } from './skill-system.js';
import { applyRework, type BranchInfo, type NationSkill, type SkillRework } from './skills-thailand.js';

// Indonesia job skills (docs/design/skill-database-source.txt lines 677–837): branch A Santet Master → Santet Overlord
// (ranged curse caster), branch B Keris Master → Keris Shadow Blade (melee poison assassin). Behaviour/VFX plan:
// docs/design/skills/indonesia-v1/DESIGN_REVIEW.md (proposal 2026-10-10). Presentation catalogue only.
// CT/CD/durations/formulas copied from the source; null = not given by the source.

export type IndoBranch = 'santet' | 'keris';
type Vfx = Partial<Pick<NationSkill, 'areaCells' | 'placement' | 'reuses' | 'statuses' | 'buffAura' | 'summon'>>;

/** Proposed Thai display names (pending user approval; the source names skills in English only). */
const THAI_NAMES: Readonly<Record<string, string>> = {
  'black-magic-dart': 'เข็มมนต์ดำ', 'curse-of-agony': 'คำสาปทรมาน', 'soul-pluck': 'กระชากวิญญาณ', 'poison-cloud': 'หมอกพิษ',
  'voodoo-link': 'หุ่นผูกชะตา', 'dark-aura': 'รัศมีมนต์ดำ', 'santet-reach': 'มนต์ดำส่งไกล', 'hex-amplify': 'คำสาปทวีคูณ', malice: 'พยาบาท',
  'shadow-ward': 'เงาพรางกาย', 'curse-of-the-archipelago': 'มหาคำสาปหมู่เกาะ', 'mass-decay': 'คำสาปเน่าเปื่อย', 'heart-stop': 'บีบหัวใจ',
  'overlords-curse': 'คำสาปจอมราชันย์', 'endless-agony': 'ทรมานนิรันดร์',
  'poison-blade': 'กริชอาบพิษ', 'keris-thrust': 'แทงจุดตาย', 'shadow-stealth': 'ซ่อนกายในเงา', 'venom-spit': 'พ่นพิษ',
  assassinate: 'จู่โจมสังหาร', 'venom-mastery': 'ชำนาญพิษ', 'keris-mastery': 'ชำนาญกริช', 'silent-step': 'ก้าวไร้เสียง',
  'toxic-blood': 'โลหิตพิษ', 'backstab-expert': 'จ้วงแทงข้างหลัง', 'shadow-flash-strike': 'กริชเงาพันแทง', 'fatal-assassination': 'ปลิดชีพ',
  'shadow-clone': 'แยกร่างเงา', 'shadow-master': 'จ้าวแห่งเงา', 'venomous-overdrive': 'พิษเดือดคลั่ง',
};
/** Enlarged area effects (presentation only). */
const VFX_SCALE: Readonly<Record<string, number>> = { 'poison-cloud': 1.8, 'mass-decay': 2.2, 'curse-of-the-archipelago': 2.6 };

const s = (id: string, branch: IndoBranch, jobTier: 2 | 3, sourceLine: number, name: string, thai: string, maxLevel: number, behavior: SkillBehavior, family: VfxFamily,
  castMs: number | null, cooldownMs: number | null, durationMs: number | null, formula: string, vfx: Vfx = {}): NationSkill => ({
  id, branch, jobTier, sourceLine, name, thai, maxLevel, behavior, family, castMs, cooldownMs, durationMs, formula,
  thaiName: THAI_NAMES[id] ?? name, areaCells: null, placement: null, reuses: null, statuses: [], buffAura: false, summon: null, vfxScale: VFX_SCALE[id] ?? 1, ...vfx,
});

export const INDO_BRANCHES: Readonly<Record<IndoBranch, BranchInfo>> = {
  santet: { name: 'Santet Master', thai: 'จอมมนต์ดำซันเตท', tier3: 'Santet Overlord', range: 'RANGED', signature: 'เตอลูห์: ส่งของมนต์ดำ (เข็ม ตะปู ลูกไฟดำ) ลอยไปช้าๆ แล้วตกใส่ทีหลัง ฝังเป็นเข็มในร่างสะสมได้ แล้วค่อยจุดทีเดียว (หน่วงเวลา + สะสม + จุดระเบิด ไม่ใช่ดาเมจต่อเนื่อง)' },
  keris: { name: 'Keris Master', thai: 'นักรบกริช', tier3: 'Keris Shadow Blade', range: 'MELEE', signature: 'ปลุกลายกริช 3 ขั้นจากการฆ่าด้วยพิษหรือแทงข้างหลัง แต่ละขั้นเปลี่ยนท่าแทงจุดตายและ ultimate · พิษเป็นของสายนี้สายเดียว' },
};

const BASE_SKILLS: readonly NationSkill[] = [
  // Branch A — Santet Master (class 2)
  s('black-magic-dart', 'santet', 2, 684, 'Black Magic Dart', 'ส่งอาคมมืด (เกลอ) พุ่งตัดขั้วหัวใจจากระยะไกล', 10, 'ACTIVE_CAST', 'binding', 1500, 4000, null,
    'MDMG (Shadow) = MATK × (3.0 + Lv × 0.4) · ไกลขึ้น +5%/ช่อง (สูงสุด +50% ที่ 10 ช่อง)', { placement: 'projectile' }),
  s('curse-of-agony', 'santet', 2, 690, 'Curse of Agony', 'คำสาปทรมานเป้าหมายเดี่ยว', 10, 'ACTIVE_CAST', 'binding', 1000, 12000, 8000,
    'DEF/MDEF −4% × Lv (สูงสุด 40%) นาน 8 วินาที', { placement: 'target', statuses: ['def-down'] }),
  s('soul-pluck', 'santet', 2, 695, 'Soul Pluck', 'กระชากวิญญาณบางส่วนของเป้าหมาย', 5, 'ACTIVE_CAST', 'spirit', 1000, 15000, null,
    'MDMG = MATK × (1.5 + Lv × 0.2) · Heal Block 1.0 + Lv × 0.5 วินาที', { placement: 'target', statuses: ['heal-block'] }),
  s('poison-cloud', 'santet', 2, 701, 'Poison Cloud', 'หมอกพิษมนต์ดำคลุม 5×5 ช่อง', 5, 'ACTIVE_CAST', 'binding', 2000, 10000, null,
    'DOT = 50% MATK ต่อวินาที · Poison 10% × Lv', { areaCells: 5, placement: 'zone', statuses: ['poison'] }),
  s('voodoo-link', 'santet', 2, 706, 'Voodoo Link', 'ผูกชะตาศัตรู 2 ตัวเข้าด้วยกัน', 5, 'ACTIVE_CAST', 'binding', 1500, 20000, 10000,
    'ส่งต่อดาเมจ 10% × Lv ให้ตัวที่ถูกผูก · 10 วินาที · ห่างไม่เกิน 7 ช่อง', { placement: 'tether' }),
  s('dark-aura', 'santet', 2, 711, 'Dark Aura', 'กลิ่นอายมนต์ดำรอบตัว', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ศัตรูในรัศมี 3 ช่อง MDEF −1.5% × Lv'),
  s('santet-reach', 'santet', 2, 715, 'Santet Reach', 'ส่งอาคมได้ไกลกว่าคนทั่วไป', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ระยะร่ายเวทโจมตี +1 × Lv ช่อง'),
  s('hex-amplify', 'santet', 2, 719, 'Hex Amplify', 'ขยายความรุนแรงของคำสาป', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ดาเมจคำสาปและ DOT +1.5% × Lv'),
  s('malice', 'santet', 2, 723, 'Malice', 'ดูดกลืนความสิ้นหวัง', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ศัตรูติดคำสาปในหน้าจอ → ฟื้น SP 2 × Lv ทุก 3 วินาที', { placement: 'self', reuses: 'soul-pluck' }),
  s('shadow-ward', 'santet', 2, 727, 'Shadow Ward', 'เงาพรางตาคุ้มครอง', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ลดดาเมจระยะไกลที่ได้รับ 4% × Lv'),
  // Branch A — Santet Overlord (class 3)
  s('curse-of-the-archipelago', 'santet', 3, 733, 'Curse of the Archipelago', 'มหาคำสาปแห่งหมู่เกาะ คลื่นความมืดทั่วหน้าจอ', 5, 'ACTIVE_CAST', 'binding', 3000, 60000, 15000,
    'DOT = MATK × (1.0 + Lv × 0.2) ต่อวินาที 15 วินาที · ศัตรูช้าลง 50%', { placement: 'self', statuses: ['slow'] }),
  s('mass-decay', 'santet', 3, 738, 'Mass Decay', 'คำสาปเน่าเปื่อยวงกว้าง 9×9 ช่อง', 5, 'ACTIVE_CAST', 'binding', 2000, 45000, 8000,
    'Heal Block 100% 8 วินาที · สูบ SP 2% × Lv ของ Max SP ศัตรู', { areaCells: 9, placement: 'zone', statuses: ['heal-block'] }),
  s('heart-stop', 'santet', 3, 743, 'Heart Stop', 'บีบรัดหัวใจเป้าหมายอย่างรุนแรง', 5, 'ACTIVE_INSTANT', 'binding', 0, 30000, null,
    'MDMG = MATK × (10.0 + Lv × 2.0) · ขัดจังหวะการร่าย (รวมบอส) · มึน 1 วินาที', { placement: 'target', statuses: ['stun'] }),
  s('overlords-curse', 'santet', 3, 748, 'Overlord’s Curse', 'กฎแห่งมหาคำสาป', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'เป้าหมายติดดีบัฟ ≥ 2 ชนิด รับดาเมจ +4% × Lv (สูงสุด 20%)'),
  s('endless-agony', 'santet', 3, 752, 'Endless Agony', 'ความทรมานไม่มีวันสิ้นสุด', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ตีเป้าหมายที่ติด DOT ของตน → ยืด DOT 0.5 × Lv วินาที/ฮิต', { placement: 'target', reuses: 'curse-of-agony' }),
  // Branch B — Keris Master (class 2)
  s('poison-blade', 'keris', 2, 763, 'Poison Blade', 'อาบกริชด้วยพิษมนต์ดำ', 10, 'ACTIVE_INSTANT', 'binding', 0, 5000, 60000,
    'ATK +20 + Lv × 5 · โอกาส Deadly Poison 5% + Lv × 1% · 60 วินาที', { placement: 'self', buffAura: true, statuses: ['poison'] }),
  s('keris-thrust', 'keris', 2, 768, 'Keris Thrust', 'พุ่งแทงกริชทะลวงจุดตาย', 10, 'ACTIVE_INSTANT', 'binding', 0, 3000, null,
    'PDMG = ATK × (3.0 + Lv × 0.3) · จากด้านหลังคริติคอล 100%', { placement: 'impact' }),
  s('shadow-stealth', 'keris', 2, 774, 'Shadow Stealth', 'กลืนตัวตนหายไปในเงามืด', 5, 'ACTIVE_INSTANT', 'binding', 0, 15000, null,
    'ล่องหน 5 + Lv วินาที · ช้าลง 20% · ตีออกจากล่องหน +50%', { placement: 'self', buffAura: true }),
  s('venom-spit', 'keris', 2, 779, 'Venom Spit', 'พ่นพิษใส่หน้าเป้าหมายระยะ 5 ช่อง', 5, 'ACTIVE_INSTANT', 'binding', 0, 8000, null,
    'PDMG = ATK × 2.0 · Blind + Poison 3 + Lv วินาที', { placement: 'projectile', statuses: ['blind', 'poison'] }),
  s('assassinate', 'keris', 2, 784, 'Assassinate', 'พุ่งตัวเข้าหาเป้าหมายในระยะ 7 ช่องแล้วฟัน', 5, 'ACTIVE_INSTANT', 'binding', 0, 6000, null,
    'PDMG = ATK × (1.5 + Lv × 0.3) · ขัดจังหวะการร่าย', { placement: 'dash' }),
  s('venom-mastery', 'keris', 2, 789, 'Venom Mastery', 'ชำนาญการปรุงและใช้พิษ', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ดาเมจพิษ +5% × Lv (สูงสุด 50%)'),
  s('keris-mastery', 'keris', 2, 793, 'Keris Mastery', 'ศิลปะการใช้กริช', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ใช้กริช/มีดสั้น: PDMG +40 · ASPD +1.5% × Lv'),
  s('silent-step', 'keris', 2, 797, 'Silent Step', 'วิชาเดินเท้าเบาไร้เสียง', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'มอนสเตอร์โจมตีก่อนมองไม่เห็น 15% × Lv'),
  s('toxic-blood', 'keris', 2, 801, 'Toxic Blood', 'เลือดเจือพิษ', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ถูกตีประชิด → ผู้โจมตีติด Poison 5% × Lv', { placement: 'target', reuses: 'status:poison', statuses: ['poison'] }),
  s('backstab-expert', 'keris', 2, 805, 'Backstab Expert', 'สัญชาตญาณนักฆ่าจากมุมมืด', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ตีด้านหลัง +3% × Lv (สูงสุด 15%)'),
  // Branch B — Keris Shadow Blade (class 3)
  s('shadow-flash-strike', 'keris', 3, 811, 'Shadow Flash Strike', 'วิชากริชเงา แทง 99 ฮิตในเสี้ยววินาที', 5, 'ACTIVE_INSTANT', 'binding', 0, 30000, null,
    'PDMG รวม = ATK × (15.0 + Lv × 2.0) · ฆ่าได้รีเซ็ต CD Shadow Stealth', { placement: 'target' }),
  s('fatal-assassination', 'keris', 3, 817, 'Fatal Assassination', 'เชือดคอปลิดชีพ', 5, 'ACTIVE_CAST', 'binding', 500, 15000, null,
    'PDMG = ATK × (8.0 + Lv × 1.0) · ติดพิษ: เจาะเกราะ 100%', { placement: 'target' }),
  s('shadow-clone', 'keris', 3, 823, 'Shadow Clone', 'แยกร่างเงาออกมาช่วยสู้', 5, 'ACTIVE_CAST', 'binding', 1000, 60000, 15000,
    'ร่างเงา ATK 50% + Lv × 10% · 15 วินาที · โดน 3 ฮิตสลาย', { placement: 'summon', summon: 'shadow-clone (tinted copy of the caster)' }),
  s('shadow-master', 'keris', 3, 828, 'Shadow Master', 'ปรมาจารย์แห่งเงา', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ล่องหนไม่ช้าลง · PDMG +4% × Lv ระหว่างล่องหนและฮิตแรก'),
  s('venomous-overdrive', 'keris', 3, 832, 'Venomous Overdrive', 'ร่างกายสูบฉีดเมื่อได้กลิ่นความตาย', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'ตีเป้าหมายติดพิษ → ASPD สูงสุดชั่วคราว · Critical Damage +5% × Lv', { placement: 'self', reuses: 'poison-blade' }),
];

/** Uniqueness rework (SKILL_TREE_UNIQUENESS_AUDIT.md + docs/design/skills/REWORK_V2.md, user approved 2026-10-11). */
const REWORK: Readonly<Record<string, SkillRework>> = {
  'black-magic-dart': { thai: 'ส่งเข็มมนต์ดำลอยไปช้าๆ ตกใส่เป้าหมายหลัง 1.5 วินาที แล้วฝังในร่าง',
    formula: 'MDMG (Shadow) = MATK × (3.0 + Lv × 0.4) หลังหน่วง 1.5 วินาที · ฝังเข็ม 1 เล่ม (สะสมสูงสุด 5)', why: 'Santet signature (teluh sending): delay + stored needles instead of instant damage' },
  'soul-pluck': { formula: 'MDMG = MATK × (1.5 + Lv × 0.2) หลังหน่วง 1 วินาที · ฝังเข็ม 2 เล่ม · Heal Block 1.0 + Lv × 0.5 วินาที',
    why: 'feeds the stored-needle mechanic' },
  'voodoo-link': { name: 'Bound Fate', thaiName: 'ผูกชะตาคู่', thai: 'ผูกศัตรู 2 ตัว ของมนต์ดำที่ส่งใส่ตัวหนึ่งจะตกใส่อีกตัวด้วย',
    formula: 'ดาเมจและเข็มที่ฝัง แชร์ 30% + Lv × 5% ให้อีกตัว · 10 วินาที · ห่างไม่เกิน 7 ช่อง', why: '"Voodoo" belongs to Haiti/Philippines; now shares sent objects' },
  'hex-amplify': { formula: 'ดาเมจตอนจุดเข็มที่ฝังและคำสาปของสายนี้ +1.5% × Lv', why: 'points at the needle mechanic instead of DOT' },
  'endless-agony': { name: 'Teluh Barrage', thaiName: 'ระดมส่งเข็มมนต์ดำ', thai: 'ดึงเข็มที่ฝังในศัตรูทุกตัวบนจอให้ระเบิดพร้อมกัน', behavior: 'ACTIVE_CAST',
    castMs: 1500, cooldownMs: 30000, formula: 'MDMG ต่อเข็ม = MATK × (1.5 + Lv × 0.5) · เข็มที่จุดแล้วหายไป', placement: 'target', reuses: 'black-magic-dart',
    why: 'was a DOT extender (same as Voodoo Cruelty); now the cash-in of the sending mechanic' },
  'keris-thrust': { formula: 'PDMG = ATK × (3.0 + Lv × 0.3) · จากด้านหลังคริติคอล 100% · ลายกริชขั้น 2 ขึ้นไป: เจาะเกราะ 30%', why: 'scales with the pamor stage' },
  'shadow-clone': { name: 'Keris Soul', thaiName: 'วิญญาณกริช', thai: 'ปลุกวิญญาณกริชให้ลอยออกมาแทงศัตรูแทนร่างเงา',
    formula: 'กริชลอย ATK 50% + Lv × 10% · 15 วินาที · โดน 3 ฮิตสลาย', why: 'dark clone overlapped Korea; a floating keris is Keris-only (VFX: current clone art until a keris sheet is approved)' },
  'venomous-overdrive': { name: 'Pamor Awakening', thaiName: 'ปลุกลายกริช', thai: 'ลายกริชตื่น 3 ขั้นจากการฆ่าด้วยพิษหรือแทงข้างหลัง',
    formula: 'ทุก 3 การฆ่า (พิษ/แทงหลัง) = 1 ขั้น · ขั้น 1: ASPD +10% · ขั้น 2: แทงจุดตายเจาะเกราะ 30% · ขั้น 3: ultimate ครั้งถัดไป +10% × Lv แล้วกลับขั้น 0',
    why: 'Keris signature: the keris awakens (pamor) instead of a generic frenzy' },
};
export const INDONESIA_SKILLS: readonly NationSkill[] = applyRework(BASE_SKILLS, REWORK);


export const INDONESIA_PRESENTATION: Readonly<Record<string, SkillPresentation>> = Object.fromEntries(INDONESIA_SKILLS.map((k) => {
  const p = SKILL_BEHAVIOR_POLICY[k.behavior];
  return [k.id, { skillId: k.id, behavior: k.behavior, family: k.family, castTimeMs: k.behavior.startsWith('PASSIVE') ? null : k.castMs,
    circle: p.circle ? 'ritual-circle-v1' : null, releaseEffect: p.release ? (k.reuses ?? k.id) : null, aura: null } satisfies SkillPresentation];
}));
export const INDONESIA_NEW_VFX: readonly string[] = INDONESIA_SKILLS.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].generateVfx && !k.reuses).map((k) => k.id);
