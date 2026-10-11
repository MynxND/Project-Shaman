import type { CharacterSheet, EquipSlot } from '@shaman/shared';

// SAMPLE DATA for the character status prototype. There is no server character, level curve or stat formula yet
// (docs/design-decisions.md); the window labels these numbers as samples.

export const SAMPLE_SHEET: CharacterSheet = {
  name: 'ผู้เดินทางแห่งวิญญาณ', bodyType: 'male', classId: 'medium',
  baseLevel: 24, jobLevel: 17,
  baseExp: { current: 18_640, next: 42_000 }, jobExp: { current: 3_120, next: 9_800 },
  hp: { current: 842, max: 1_105 }, sp: { current: 196, max: 248 },
  stats: { str: 8, agi: 12, vit: 15, int: 32, dex: 20, luk: 6 },
  statusPoints: 14, skillPoints: 3,
  equipment: { waist: 'shaman-sash', accessory1: 'bronze-amulet' },
};

export const EQUIP_SLOT_LABEL: Readonly<Record<EquipSlot, { th: string; glyph: string }>> = {
  head: { th: 'ศีรษะ', glyph: '◠' }, body: { th: 'เสื้อ', glyph: '▥' }, waist: { th: 'ผ้าคาดเอว', glyph: '═' },
  weapon: { th: 'อาวุธ', glyph: '⟋' }, offhand: { th: 'มือรอง', glyph: '◇' }, cloak: { th: 'ผ้าคลุม', glyph: '⌓' },
  shoes: { th: 'รองเท้า', glyph: '⊔' }, accessory1: { th: 'เครื่องราง ๑', glyph: '○' }, accessory2: { th: 'เครื่องราง ๒', glyph: '○' },
};

/** Class path from the skill database (docs/design/skill-database-source.txt). Unlock conditions are not designed yet. */
export const SAMPLE_CLASS_PATH = {
  current: { id: 'medium', th: 'คลาสพื้นฐาน', en: 'Medium', tier: 'อาชีพที่ ๑ · ใช้ร่วมกันทุกประเทศ', skills: 10 },
  nation: { th: 'ประเทศไทย', en: 'Thailand' },
  branches: [
    { id: 'achan-saiyasat', th: 'อาจารย์ไสยเวท', en: 'Achan Saiyasat', third: 'Grand Necromancer' },
    { id: 'mor-phhee', th: 'หมอผีสายพราย', en: 'Mor Phhee', third: 'Prai Phhee Lord' },
  ],
} as const;

export const STAT_LABEL = {
  str: { th: 'พลังกาย', hint: 'กำลังโจมตีกายภาพ น้ำหนักที่แบก' },
  agi: { th: 'ว่องไว', hint: 'ความเร็วโจมตี การหลบหลีก' },
  vit: { th: 'อึด', hint: 'HP สูงสุด การป้องกัน' },
  int: { th: 'ปัญญา', hint: 'พลังเวท SP สูงสุด' },
  dex: { th: 'แม่นยำ', hint: 'ความแม่นยำ ความเร็วร่าย' },
  luk: { th: 'โชค', hint: 'คริติคอล ดรอปไอเทม' },
} as const;
