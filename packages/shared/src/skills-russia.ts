import { SKILL_BEHAVIOR_POLICY, type SkillBehavior, type SkillPresentation, type VfxFamily } from './skill-system.js';
import { applyRework, type BranchInfo, type NationSkill, type SkillRework } from './skills-thailand.js';

// Russia / Siberia job skills (docs/design/skill-database-source.txt lines 1317–1476): branch A Juggernaut Volkhv →
// Juggernaut Warlord of Taiga (main tank; user 2026-10-11: one-handed axe + large shield), branch B Taiga Shaman →
// Berserker Wolf Shaman (two-handed axe bruiser). VFX plan: docs/design/skills/russia-v1/DESIGN_REVIEW.md.
// Presentation catalogue only. CT/CD/durations/formulas copied from the source; null = not given by the source.

export type RusBranch = 'juggernaut' | 'taiga';
type Vfx = Partial<Pick<NationSkill, 'areaCells' | 'placement' | 'reuses' | 'statuses' | 'buffAura' | 'summon'>>;

/** Proposed Thai display names (pending user approval; the source names skills in English only). */
const THAI_NAMES: Readonly<Record<string, string>> = {
  'wolf-spirit-armor': 'เกราะวิญญาณหมาป่า', 'taunting-howl': 'คำรามท้ารบ', 'siberian-frost-step': 'ก้าวน้ำแข็ง', 'shield-bash': 'กระแทกโล่',
  'snow-fort': 'ป้อมหิมะ', 'iron-will': 'จิตใจเหล็ก', 'vitality-boost': 'กายทรหด', 'heavy-armor-mastery': 'ชำนาญเกราะหนัก', 'taiga-survivor': 'ผู้รอดแห่งไทกา',
  'aggro-mastery': 'ชำนาญยั่วยุ', 'taigas-absolute-fortress': 'มหาปราการไทกา', 'titan-stomp': 'กระทืบธรณี', 'warlords-command': 'บัญชาแม่ทัพ',
  'unstoppable-will': 'จิตไม่หยุดยั้ง', 'colossus-blood': 'โลหิตยักษ์',
  'slavic-axe-strike': 'ฟันขวานสลาฟ', 'berserker-blood': 'โลหิตคลั่ง', 'wolf-pack-call': 'เรียกฝูงหมาป่า', 'leap-strike': 'กระโดดสับ',
  'blood-scent': 'กลิ่นคาวเลือด', rend: 'ฉีกบาดแผล', 'axe-mastery': 'ชำนาญขวาน', 'frenzy-aspd': 'ยิ่งเจ็บยิ่งคลั่ง', 'pain-killer': 'ไร้ความเจ็บปวด',
  'hunters-mark': 'ตรานักล่า', 'bloodthirsty-wolf-frenzy': 'หมาป่ากระหายเลือด', decapitate: 'สับคอ', 'blood-moon': 'จันทร์สีเลือด',
  'wolf-blood-mastery': 'สายเลือดหมาป่า', 'undying-rage': 'โทสะอมตะ',
};
/** Enlarged area effects (presentation only). */
const VFX_SCALE: Readonly<Record<string, number>> = { 'taunting-howl': 1.8, 'siberian-frost-step': 1.6, 'titan-stomp': 2, 'blood-moon': 1.1, 'warlords-command': 1.6 };

const s = (id: string, branch: RusBranch, jobTier: 2 | 3, sourceLine: number, name: string, thai: string, maxLevel: number, behavior: SkillBehavior, family: VfxFamily,
  castMs: number | null, cooldownMs: number | null, durationMs: number | null, formula: string, vfx: Vfx = {}): NationSkill => ({
  id, branch, jobTier, sourceLine, name, thai, maxLevel, behavior, family, castMs, cooldownMs, durationMs, formula,
  thaiName: THAI_NAMES[id] ?? name, areaCells: null, placement: null, reuses: null, statuses: [], buffAura: false, summon: null, vfxScale: VFX_SCALE[id] ?? 1, ...vfx,
});

export const RUS_BRANCHES: Readonly<Record<RusBranch, BranchInfo>> = {
  juggernaut: { name: 'Juggernaut Volkhv', thai: 'นักเวทสลาฟสายประจันบาน', tier3: 'Juggernaut Warlord of Taiga', range: 'MELEE', signature: 'แทงค์ยึดตำแหน่ง: กันด้วยโล่ได้เกจ Guard สกิลแทงค์ใช้ Guard · ก้าวน้ำแข็งและป้อมหิมะทิ้งพื้นน้ำแข็งที่ยืนแล้วได้โบนัส (ต่างจากหมีที่แปลงร่าง และเสือที่เน้นหลบ)' },
  taiga: { name: 'Taiga Shaman', thai: 'ชาแมนแห่งไทกา', tier3: 'Berserker Wolf Shaman', range: 'MELEE', signature: 'ล่าตามรอยเลือด: ศัตรูที่เลือดไหลทิ้งรอยเลือด พุ่งไล่ตามรอยต่อเนื่องได้ ฆ่าได้รีเซ็ตคูลดาวน์ (แนว "ยิ่งเลือดน้อยยิ่งแรง" ยกให้เม็กซิโก เหลือแค่โลหิตคลั่ง)' },
};

const BASE_SKILLS: readonly NationSkill[] = [
  // Branch A — Juggernaut Volkhv (class 2)
  s('wolf-spirit-armor', 'juggernaut', 2, 1324, 'Wolf Spirit Armor', 'อัญเชิญวิญญาณหมาป่าเป็นเกราะขนสัตว์หนาทึบ', 10, 'ACTIVE_INSTANT', 'yantra', 0, 30000, 60000,
    'DEF +20% + Lv × 3% · ทุก 10 VIT = DEF +5 · 60 วินาที', { placement: 'self', buffAura: true }),
  s('taunting-howl', 'juggernaut', 2, 1329, 'Taunting Howl', 'คำรามดั่งจ่าฝูงท้าทายศัตรูรอบตัว', 10, 'ACTIVE_INSTANT', 'yantra', 0, 15000, null,
    'ศัตรูในระยะ 9×9 ถูกบังคับตีผู้ร่าย 3 + Lv วินาที (บอสไม่เปลี่ยนเป้า)', { areaCells: 9, placement: 'self', statuses: ['taunt'] }),
  s('siberian-frost-step', 'juggernaut', 2, 1334, 'Siberian Frost Step', 'กระทืบเท้าสร้างคลื่นความเย็น', 5, 'ACTIVE_CAST', 'spirit', 500, 8000, 5000,
    'PDMG (Water) = ATK × (1.5 + Lv × 0.5) วง 5×5 · ASPD/ความเร็ว −30% 5 วินาที', { areaCells: 5, placement: 'self', statuses: ['slow'] }),
  s('shield-bash', 'juggernaut', 2, 1340, 'Shield Bash', 'กระแทกศัตรูด้วยโล่', 5, 'ACTIVE_INSTANT', 'yantra', 0, 10000, null,
    'PDMG = ATK × 2.0 + Shield DEF × Lv · Stun 2 วินาที (ขัดบอสได้)', { placement: 'impact', statuses: ['stun'] }),
  s('snow-fort', 'juggernaut', 2, 1346, 'Snow Fort', 'ก่อกำแพงหิมะเวทปกป้องตัวเอง', 5, 'ACTIVE_CAST', 'spirit', 1000, 30000, 10000,
    'ลดดาเมจระยะไกลและเวท 10% × Lv (สูงสุด 50%) 10 วินาที', { placement: 'self', buffAura: true }),
  s('iron-will', 'juggernaut', 2, 1351, 'Iron Will', 'จิตใจเหล็กกล้าไม่ยอมจำนน', 10, 'PASSIVE_STAT', 'yantra', null, null, null, 'ต้าน Stun/Knockback/Fear 5% × Lv (สูงสุด 50%)'),
  s('vitality-boost', 'juggernaut', 2, 1355, 'Vitality Boost', 'ร่างกายแข็งแกร่งจากความหนาว', 10, 'PASSIVE_STAT', 'yantra', null, null, null, 'Max HP +3% × Lv (สูงสุด 30%) · น้ำยาฟื้นฟู +20%'),
  s('heavy-armor-mastery', 'juggernaut', 2, 1359, 'Heavy Armor Mastery', 'คุ้นเคยกับเกราะหนัก', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ใส่ Heavy Armor: DEF +5% × Lv · ไม่ช้าลง'),
  s('taiga-survivor', 'juggernaut', 2, 1363, 'Taiga Survivor', 'สัญชาตญาณเอาตัวรอด', 5, 'PASSIVE_TRIGGER', 'yantra', null, null, null,
    'HP < 30% → DEF +10% × Lv (สูงสุด 50%)', { placement: 'self', reuses: 'wolf-spirit-armor' }),
  s('aggro-mastery', 'juggernaut', 2, 1367, 'Aggro Mastery', 'กลิ่นอายยั่วยุศัตรูตลอดเวลา', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'Aggro จากทุกการโจมตี/สกิล +20% × Lv (สูงสุด 100%)'),
  // Branch A — Juggernaut Warlord of Taiga (class 3)
  s('taigas-absolute-fortress', 'juggernaut', 3, 1373, 'Taiga’s Absolute Fortress', 'ปักหลักสร้างบาเรียหมาป่าเหล็กไร้เทียมทาน', 5, 'ACTIVE_INSTANT', 'yantra', 0, 150000, 10000,
    'อมตะ 100% 5 + Lv วินาที (สูงสุด 10) · ขยับ/ตี/ร่ายไม่ได้', { placement: 'self', buffAura: true, statuses: ['invulnerable'] }),
  s('titan-stomp', 'juggernaut', 3, 1378, 'Titan Stomp', 'กระทืบพื้นจนแผ่นดินแยก', 5, 'ACTIVE_CAST', 'yantra', 1500, 45000, null,
    'PDMG = ATK × (3.0 + Lv) + 20% Max HP ผู้ร่าย · 7×7 · Knockdown 2 วินาที', { areaCells: 7, placement: 'self', statuses: ['knockdown'] }),
  s('warlords-command', 'juggernaut', 3, 1383, "Warlord's Command", 'คำสั่งแม่ทัพเหล็ก ปาร์ตี้เตรียมรับแรงกระแทก', 5, 'ACTIVE_CAST', 'yantra', 2000, 90000, 20000,
    'ปาร์ตี้ในหน้าจอ: สะท้อนดาเมจประชิด 10% × Lv (สูงสุด 50%) 20 วินาที', { placement: 'self', statuses: ['reflect'] }),
  s('unstoppable-will', 'juggernaut', 3, 1388, 'Unstoppable Will', 'เจตจำนงที่ไม่มีสิ่งใดหยุดยั้ง', 5, 'PASSIVE_TRIGGER', 'yantra', null, null, null,
    'HP < 30% → กันสถานะผิดปกติทุกชนิดจนกว่า HP > 30%', { placement: 'self', reuses: 'taigas-absolute-fortress' }),
  s('colossus-blood', 'juggernaut', 3, 1392, 'Colossus Blood', 'ยิ่งถูกรุม เลือดยิ่งสูบฉีด', 5, 'PASSIVE_STAT', 'yantra', null, null, null, 'ศัตรูรอบตัว (3×3) > 3 ตัว: ผลฮีล/น้ำยา +10% × Lv'),
  // Branch B — Taiga Shaman (class 2)
  s('slavic-axe-strike', 'taiga', 2, 1403, 'Slavic Axe Strike', 'ง้างขวานสับเต็มแรง', 10, 'ACTIVE_INSTANT', 'binding', 0, 2000, null,
    'PDMG = ATK × (2.0 + Lv × 0.3) · Bleed 10% + Lv × 2% 10 วินาที', { placement: 'impact', statuses: ['bleed'] }),
  s('berserker-blood', 'taiga', 2, 1409, 'Berserker Blood', 'กรีดเลือดตนเองปลุกสัญชาตญาณดิบ', 10, 'ACTIVE_INSTANT', 'binding', 0, 40000, 30000,
    'เสีย HP 15% · ATK +3% × Lv (สูงสุด 30%) · ASPD +10% 30 วินาที', { placement: 'self', buffAura: true }),
  s('wolf-pack-call', 'taiga', 2, 1414, 'Wolf Pack Call', 'เป่าเขาสัตว์เรียกวิญญาณหมาป่า 3 ตัว', 5, 'ACTIVE_CAST', 'spirit', 1000, 15000, null,
    'หมาป่าพุ่งชนเป็นแนวตรง PDMG = ATK × (1.0 + Lv × 0.5) ต่อฮิต (3 ฮิต)', { placement: 'dash' }),
  s('leap-strike', 'taiga', 2, 1419, 'Leap Strike', 'กระโดดสับขวานลงกลางวงศัตรู', 5, 'ACTIVE_INSTANT', 'binding', 0, 12000, null,
    'พุ่ง 7 ช่อง · PDMG = ATK × (2.0 + Lv) รัศมี 3×3 รอบจุดลง', { areaCells: 3, placement: 'target' }),
  s('blood-scent', 'taiga', 2, 1424, 'Blood Scent', 'ดมกลิ่นเลือดแล้วพุ่งประชิด', 5, 'ACTIVE_INSTANT', 'binding', 0, 8000, null,
    'พุ่งไปหาเป้าหมายที่ติด Bleed · Critical Rate +10 × Lv ครั้งถัดไป', { placement: 'dash' }),
  s('rend', 'taiga', 2, 1429, 'Rend', 'ฉีกกระชากบาดแผล', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'PDMG ใส่เป้าหมายติด Bleed +2% × Lv (สูงสุด 20%)'),
  s('axe-mastery', 'taiga', 2, 1433, 'Axe Mastery', 'ชำนาญการใช้ขวาน', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ใช้ Axe: PDMG +40 · เจาะเกราะ +1.5% × Lv'),
  s('frenzy-aspd', 'taiga', 2, 1437, 'Frenzy ASPD', 'ยิ่งเจ็บ ยิ่งคลุ้มคลั่ง', 10, 'PASSIVE_STAT', 'binding', null, null, null, 'ทุก HP 10% ที่หายไป ASPD +1% × Lv'),
  s('pain-killer', 'taiga', 2, 1441, 'Pain Killer', 'อะดรีนาลีนระงับความเจ็บปวด', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'Endure ถาวร (ไม่ชะงักเมื่อโดนตี)'),
  s('hunters-mark', 'taiga', 2, 1445, "Hunter's Mark", 'สายตานักล่า', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'โดน Slavic Axe Strike แล้วล่องหนไม่ได้ 3 × Lv วินาที'),
  // Branch B — Berserker Wolf Shaman (class 3)
  s('bloodthirsty-wolf-frenzy', 'taiga', 3, 1451, 'Bloodthirsty Wolf Frenzy', 'คลุ้มคลั่งขั้นสูงสุด ร่างกายแดงเถือก', 5, 'ACTIVE_INSTANT', 'binding', 0, 60000, 12000,
    'ASPD +200% · ดูดเลือด 3% × Lv (สูงสุด 15%) 12 วินาที', { placement: 'self', buffAura: true }),
  s('decapitate', 'taiga', 3, 1456, 'Decapitate', 'ง้างขวานสับคอปลิดชีพ', 5, 'ACTIVE_CAST', 'binding', 1000, 20000, null,
    'PDMG = ATK × (10.0 + Lv × 2.0) · ไม่ใช่บอส HP < 30%: ตายทันที 10% × Lv', { placement: 'target' }),
  s('blood-moon', 'taiga', 3, 1462, 'Blood Moon', 'พระจันทร์สีเลือดปรากฏ บัฟปาร์ตี้', 5, 'ACTIVE_CAST', 'binding', 3000, 120000, 30000,
    'ปาร์ตี้ในรัศมี 11×11: PDMG +20% · Critical Damage +10% × Lv 30 วินาที', { areaCells: 11, placement: 'self' }),
  s('wolf-blood-mastery', 'taiga', 3, 1467, 'Wolf Blood Mastery', 'สายเลือดหมาป่าทวีคูณ', 5, 'PASSIVE_STAT', 'binding', null, null, null, 'ยิ่ง HP ต่ำดาเมจยิ่งสูง สูงสุด × (1.10 + Lv × 0.04) เมื่อ HP < 10%'),
  s('undying-rage', 'taiga', 3, 1471, 'Undying Rage', 'โกรธแค้นจนปฏิเสธความตาย', 5, 'PASSIVE_TRIGGER', 'binding', null, null, null,
    'HP 0 → Undying 5 วินาที (HP 1 อมตะ) · ฆ่าได้ 1 ตัว ฟื้น HP 20% (CD 300 วินาที)', { placement: 'self' }),
];

/** Uniqueness rework (SKILL_TREE_UNIQUENESS_AUDIT.md + docs/design/skills/REWORK_V2.md, user approved 2026-10-11). */
const REWORK: Readonly<Record<string, SkillRework>> = {
  'taunting-howl': { name: 'Shield Clang', thaiName: 'เคาะโล่ท้ารบ', thai: 'ฟาดขวานกับโล่เสียงก้อง ยั่วศัตรูรอบตัว',
    formula: 'ศัตรูในระยะ 9×9 ถูกบังคับตีผู้ร่าย 3 + Lv วินาที · ได้ Guard +20', why: 'roar-taunt copied the bear (Ireland); a shield clash is Juggernaut-only (art: howl shockwave until re-skinned)' },
  'shield-bash': { formula: 'PDMG = ATK × 2.0 + Shield DEF × Lv · Stun 2 วินาที · ได้ Guard +10', why: 'builds the Guard meter' },
  'siberian-frost-step': { formula: 'PDMG (Water) = ATK × (1.5 + Lv × 0.5) วง 5×5 · ช้าลง 30% 5 วินาที · ทิ้งพื้นน้ำแข็ง 8 วินาที: ยืนบนพื้นนี้ DEF +10%',
    why: 'frost ground the tank holds' },
  'titan-stomp': { formula: 'PDMG = ATK × (3.0 + Lv) + 20% Max HP ผู้ร่าย · 7×7 · Knockdown 2 วินาที · ใช้ Guard ทั้งหมด: ดาเมจ +1% ต่อ Guard',
    why: 'spends Guard instead of copying Colossal Slam' },
  'colossus-blood': { name: 'Hold the Line', thaiName: 'ยืนหยัดแนวหน้า', thai: 'ยิ่งปกป้องพันธมิตรด้านหลัง ยิ่งแข็งแกร่ง',
    formula: 'Guard +2 ต่อวินาทีเมื่อมีพันธมิตรอยู่ด้านหลังในระยะ 3 ช่อง · Guard เต็ม 100: ลดดาเมจ 15%', why: 'positional tank identity' },
  'blood-scent': { formula: 'พุ่งตามรอยเลือดไปหาเป้าหมายที่ติด Bleed · ฆ่าได้คูลดาวน์รีเซ็ต · Critical Rate +10 × Lv ครั้งถัดไป', why: 'Taiga signature: chained hunt along blood trails' },
  'frenzy-aspd': { name: 'Blood Frenzy', thaiName: 'คลั่งกลิ่นเลือด', thai: 'ยิ่งมีศัตรูเลือดไหลรอบตัว ยิ่งตีเร็ว',
    formula: 'ASPD +1% × Lv ต่อศัตรูที่เลือดไหลในระยะ 5 ช่อง (สูงสุด 5 ตัว)', why: '"low HP = faster" belongs to Mexico; now bleed-hunt based' },
  'wolf-blood-mastery': { name: 'Pack Hunt', thaiName: 'ล่าเป็นฝูง', thai: 'ดาเมจเพิ่มตามจำนวนเหยื่อที่เลือดไหล',
    formula: 'ดาเมจ +4% × Lv ต่อศัตรูที่เลือดไหลในระยะ 5 ช่อง (สูงสุด 5 ตัว)', why: '"low HP = power" moved to Mexico; Taiga keeps it only in Berserker Blood' },
  'undying-rage': { name: 'Last Howl', thaiName: 'หอนสุดท้าย', thai: 'ก่อนล้มลง พุ่งไปหาเหยื่อที่เลือดไหลแล้วสูบชีวิตกลับมา',
    formula: 'HP จะเหลือ 0: พุ่งไปศัตรูที่เลือดไหลใกล้สุดใน 7 ช่อง ฟื้น HP 20% จากมัน (CD 300 วินาที) · ไม่มีเป้าหมายเลือดไหล = ไม่ทำงาน',
    why: 'cheat-death crowding; now tied to the bleed hunt (art: shards kept)' },
};
export const RUSSIA_SKILLS: readonly NationSkill[] = applyRework(BASE_SKILLS, REWORK);


export const RUSSIA_PRESENTATION: Readonly<Record<string, SkillPresentation>> = Object.fromEntries(RUSSIA_SKILLS.map((k) => {
  const p = SKILL_BEHAVIOR_POLICY[k.behavior];
  return [k.id, { skillId: k.id, behavior: k.behavior, family: k.family, castTimeMs: k.behavior.startsWith('PASSIVE') ? null : k.castMs,
    circle: p.circle ? 'ritual-circle-v1' : null, releaseEffect: p.release ? (k.reuses ?? k.id) : null, aura: null } satisfies SkillPresentation];
}));
export const RUSSIA_NEW_VFX: readonly string[] = RUSSIA_SKILLS.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].generateVfx && !k.reuses).map((k) => k.id);

/** Extra VFX layers composed with a skill's own art (PRODUCTION_SPEC.md): shared kit assets reused across skills.
 *  `scale` is relative to the native art at actor scale; ground layers sit at the anchor's feet, others on the main art.
 *  `pulse`: a single still frame pulsed in code (grow + fade, like a heartbeat) instead of generated frames. */
export type VfxLayerKind = 'ground' | 'behind' | 'front' | 'particles' | 'aura';
/** `alpha` multiplies opacity (translucent formations); `cropFromY` shows only the part below that fraction (front half of a wall). */
/** `offsetX` shifts it sideways (px at actor scale), `flipX` mirrors it (a mirrored copy closes a one-sided shape), `tint` recolours it. */
export interface VfxLayer { asset: string; layer: VfxLayerKind; scale?: number; pulse?: boolean; alpha?: number; cropFromY?: number; offsetX?: number; offsetY?: number; flipX?: boolean; tint?: number;
  /** Starts later in the release (fraction 0–1) — a second burst; `followRotation` turns it with the main art (projectiles). */
  delay?: number; followRotation?: boolean;
  /** Variants shown one per preview loop instead of `asset` (e.g. the five Ascension great forms). */
  cycle?: readonly string[];
  /** Drawn at the caster's chest instead of on the main art (a bow charging while the arrow flies). */
  atCaster?: boolean;
  /** Drawn on the target's chest (an arrow impact); `hideAfter` hides the layer after that release fraction (an arrow that has arrived). */
  atTarget?: boolean; hideAfter?: number }
export const RUSSIA_VFX_LAYERS: Readonly<Record<string, readonly VfxLayer[]>> = {
  'siberian-frost-step': [{ asset: 'kit-frost-crack-ring', layer: 'ground' }, { asset: 'kit-snow-ice-burst', layer: 'particles', scale: 1.2 }],
  'shield-bash': [{ asset: 'kit-frost-crack-ring', layer: 'ground', scale: 0.5 }, { asset: 'kit-iron-sparks', layer: 'particles' }, { asset: 'kit-snow-ice-burst', layer: 'particles', scale: 0.6 }],
  'titan-stomp': [{ asset: 'kit-frost-crack-ring', layer: 'ground', scale: 1.6 }, { asset: 'kit-snow-ice-burst', layer: 'particles', scale: 1.4 }],
  'leap-strike': [{ asset: 'kit-frost-crack-ring', layer: 'ground', scale: 0.8 }, { asset: 'kit-snow-ice-burst', layer: 'particles' }],
  'slavic-axe-strike': [{ asset: 'kit-iron-sparks', layer: 'particles' }],
  decapitate: [{ asset: 'kit-iron-sparks', layer: 'particles', scale: 1.3 }],
  'berserker-blood': [{ asset: 'kit-crimson-rage-aura', layer: 'aura' }],
  'bloodthirsty-wolf-frenzy': [{ asset: 'kit-crimson-rage-aura', layer: 'aura', scale: 1.15 }],
  'undying-rage': [{ asset: 'kit-crimson-rage-aura', layer: 'aura', scale: 1.1 }, { asset: 'kit-heartbeat-ring', layer: 'ground', pulse: true }],
  'snow-fort': [{ asset: 'snow-fort', layer: 'front', cropFromY: 0.6 }],
  'taigas-absolute-fortress': [{ asset: 'kit-embroidery-ground-band', layer: 'ground', scale: 0.8, alpha: 0.7 }],
  'warlords-command': [{ asset: 'kit-embroidery-ground-band', layer: 'ground' }, { asset: 'kit-shield-wall-ring', layer: 'front', alpha: 0.45 }],
  'blood-moon': [{ asset: 'kit-wolf-ridge-ring', layer: 'behind', scale: 2 }, { asset: 'kit-embroidery-ground-band', layer: 'ground', scale: 1.6 }],
};

/** Where a skill's own art sits when it is not the default (front of the actor); `offsetY` lifts it (moon above heads). */
export const RUSSIA_VFX_MAIN: Readonly<Record<string, { layer: VfxLayerKind; offsetY?: number }>> = {
  'snow-fort': { layer: 'behind' }, 'taigas-absolute-fortress': { layer: 'behind' }, 'warlords-command': { layer: 'behind' },
  'blood-moon': { layer: 'behind', offsetY: -150 },
  'wolf-spirit-armor': { layer: 'behind' }, 'taunting-howl': { layer: 'behind' },
};
