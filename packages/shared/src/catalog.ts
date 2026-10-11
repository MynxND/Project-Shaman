import type { ItemDefinition } from './items.js';

// Item catalog used by the server (shops, rewards) and the client (names, icons). Names, stats and prices are
// PROVISIONAL (docs/design-decisions.md); icons live at /assets/ui/items/<id>.png.
const def = (d: ItemDefinition & { buyPrice?: number }) => d;

export type CatalogItem = ItemDefinition & { /** Shop price in silver; absent = not sold in shops. */ buyPrice?: number };

export const ITEMS: Readonly<Record<string, CatalogItem>> = Object.fromEntries([
  def({ id: 'potion-red', name: { th: 'ยาฟื้นพลัง (เล็ก)', en: 'Healing Tonic (S)' }, category: 'consumable', rarity: 'common', weight: 0.5, maxStack: 999, sellPrice: 15, buyPrice: 50, description: 'ฟื้นฟู HP 300 หน่วย ยาต้มจากสมุนไพรพื้นบ้าน' }),
  def({ id: 'potion-blue', name: { th: 'น้ำมนต์ฟื้นวิญญาณ', en: 'Spirit Tonic' }, category: 'consumable', rarity: 'common', weight: 0.5, maxStack: 999, sellPrice: 25, buyPrice: 80, description: 'ฟื้นฟู SP 60 หน่วย' }),
  def({ id: 'herb-bundle', name: { th: 'มัดสมุนไพร', en: 'Herb Bundle' }, category: 'material', rarity: 'common', weight: 0.2, maxStack: 999, sellPrice: 4, buyPrice: 15, description: 'วัตถุดิบสำหรับปรุงยา' }),
  def({ id: 'holy-water', name: { th: 'น้ำมนต์ศักดิ์สิทธิ์', en: 'Holy Water' }, category: 'consumable', rarity: 'uncommon', weight: 1, maxStack: 99, sellPrice: 60, buyPrice: 200, description: 'ล้างคำสาประดับต่ำออกจากตัว' }),
  def({ id: 'bone', name: { th: 'กระดูกเก่า', en: 'Old Bone' }, category: 'material', rarity: 'common', weight: 1, maxStack: 999, sellPrice: 2, description: 'ใช้ทำเครื่องรางและพิธีกรรม' }),
  def({ id: 'raw-meat', name: { th: 'เนื้อดิบ', en: 'Raw Meat' }, category: 'material', rarity: 'common', weight: 1.5, maxStack: 999, sellPrice: 3, description: 'ของเซ่นไหว้ภูตป่า' }),
  def({ id: 'spirit-flower', name: { th: 'ดอกไม้วิญญาณ', en: 'Spirit Flower' }, category: 'material', rarity: 'uncommon', weight: 0.1, maxStack: 999, sellPrice: 18, description: 'บานเฉพาะคืนเดือนมืด' }),
  def({ id: 'dark-ore', name: { th: 'แร่ทมิฬ', en: 'Umbral Ore' }, category: 'material', rarity: 'uncommon', weight: 3, maxStack: 999, sellPrice: 30, buyPrice: 120, description: 'แร่ที่ดูดซับพลังวิญญาณ ใช้หลอมอาวุธ' }),
  def({ id: 'ghost-feather', name: { th: 'ขนนกผี', en: 'Ghost Feather' }, category: 'material', rarity: 'rare', weight: 0.1, maxStack: 999, sellPrice: 80, description: 'หลุดจากวิญญาณนกที่ถูกปลดปล่อย' }),
  // Modular equipment set (2026-10-09, docs/design/equipment/README.md). Stats are provisional and small.
  def({ id: 'hat-ngob', name: { th: 'งอบสานไม้ไผ่', en: 'Woven Ngob Hat' }, category: 'equipment', rarity: 'common', weight: 3, maxStack: 1, sellPrice: 40, buyPrice: 160, description: 'งอบสานกันแดดของคนชายป่า', equipSlot: 'head', stats: { def: 2 } }),
  def({ id: 'hat-ritual', name: { th: 'มงคลสัมฤทธิ์', en: 'Bronze Ritual Circlet' }, category: 'equipment', rarity: 'uncommon', weight: 2, maxStack: 1, sellPrice: 120, buyPrice: 480, description: 'วงสัมฤทธิ์ห้อยพู่แดง ใช้ในพิธีเข้าทรง', equipSlot: 'head', stats: { mdef: 3, int: 1 } }),
  def({ id: 'robe-bronze-ward', name: { th: 'ชุดพิทักษ์สัมฤทธิ์', en: 'Bronze Ward Robe' }, category: 'equipment', rarity: 'uncommon', weight: 14, maxStack: 1, sellPrice: 220, buyPrice: 880, description: 'เสื้อคลุมเขียวหม่นบ่าเกล็ดสัมฤทธิ์ คาดผ้าแดง สวมแล้วเปลี่ยนชุดทั้งตัว', equipSlot: 'body', stats: { def: 8, mdef: 4 } }),
  def({ id: 'staff-bell', name: { th: 'ไม้เท้ากระดิ่ง', en: 'Bell Staff' }, category: 'equipment', rarity: 'uncommon', weight: 12, maxStack: 1, sellPrice: 200, buyPrice: 800, description: 'ไม้เท้าแกะสลักผูกกระดิ่งสัมฤทธิ์ ถือในมือ', equipSlot: 'weapon', stats: { matk: 8 } }),
  def({ id: 'staff-bone', name: { th: 'ไม้เท้ากระดูกหยก', en: 'Jade Bone Staff' }, category: 'equipment', rarity: 'rare', weight: 10, maxStack: 1, sellPrice: 400, buyPrice: 1600, description: 'ไม้เท้ากระดูกรัดสัมฤทธิ์ ยอดลูกแก้วหยก ถือในมือ', equipSlot: 'weapon', stats: { matk: 14 } }),
  def({ id: 'talisman-paper', name: { th: 'กระดาษยันต์', en: 'Talisman Paper' }, category: 'etc', rarity: 'common', weight: 0.1, maxStack: 999, sellPrice: 8, buyPrice: 30, description: 'กระดาษลงอักขระสำหรับลงยันต์' }),
  def({ id: 'cursed-doll', name: { th: 'ตุ๊กตาคำสาป', en: 'Cursed Doll' }, category: 'etc', rarity: 'rare', weight: 0.5, maxStack: 99, sellPrice: 120, description: 'ห้ามขาย ห้ามทิ้ง ห้ามมองตาตอนกลางคืน' }),
  def({ id: 'bronze-amulet', name: { th: 'เครื่องรางทองเหลือง', en: 'Bronze Amulet' }, category: 'equipment', rarity: 'uncommon', weight: 2, maxStack: 1, sellPrice: 150, buyPrice: 600, description: 'เครื่องประดับคุ้มกันภูต', stats: { mdef: 6, luk: 2 } }),
  def({ id: 'shaman-sash', name: { th: 'ผ้าคาดเอวหมอผี', en: 'Shaman Sash' }, category: 'equipment', rarity: 'uncommon', weight: 10, maxStack: 1, sellPrice: 300, buyPrice: 1200, description: 'ผ้าคาดเอวผู้ฝึกหัด', stats: { def: 12, mdef: 8, int: 2 } }),
  def({ id: 'spirit-sash', name: { th: 'ผ้าคาดเอวจิตวิญญาณ', en: 'Spirit Sash' }, category: 'equipment', rarity: 'rare', weight: 10, maxStack: 1, sellPrice: 900, buyPrice: 3600, description: 'ทอด้วยด้ายที่ผ่านพิธีปลุกเสก', stats: { def: 25, mdef: 15, int: 4 } }),
  def({ id: 'spirit-bell', name: { th: 'กระดิ่งเรียกวิญญาณ', en: 'Spirit Bell' }, category: 'etc', rarity: 'legendary', weight: 1, maxStack: 1, sellPrice: 2400, description: 'ใช้ในพิธีอัญเชิญ' }),
].map((d) => [d.id, d]));

/** What each shop NPC sells (by NPC id). */
export const SHOPS: Readonly<Record<string, readonly string[]>> = {
  herbalist: ['potion-red', 'potion-blue', 'holy-water', 'herb-bundle'],
  'sw-merchant': ['potion-red', 'potion-blue', 'herb-bundle'],
  talisman: ['talisman-paper', 'bronze-amulet', 'shaman-sash', 'spirit-sash', 'dark-ore'],
};

/** Medium (1st job) skills from docs/design/skill-database-source.txt, with their max levels. */
export const MEDIUM_SKILLS = [
  { id: 'spirit-bolt', name: 'Spirit Bolt', kind: 'active', maxLevel: 10 },
  { id: 'soul-heal', name: 'Soul Heal', kind: 'active', maxLevel: 10 },
  { id: 'amulet-blast', name: 'Amulet Blast', kind: 'active', maxLevel: 5 },
  { id: 'ghost-sight', name: 'Ghost Sight', kind: 'active', maxLevel: 5 },
  { id: 'binding-thread', name: 'Binding Thread', kind: 'active', maxLevel: 5 },
  { id: 'spirit-sense', name: 'Spirit Sense', kind: 'passive', maxLevel: 10 },
  { id: 'amulet-mastery', name: 'Amulet Mastery', kind: 'passive', maxLevel: 10 },
  { id: 'meditation', name: 'Meditation', kind: 'passive', maxLevel: 10 },
  { id: 'vessel-body', name: 'Vessel Body', kind: 'passive', maxLevel: 5 },
  { id: 'soul-resonance', name: 'Soul Resonance', kind: 'passive', maxLevel: 5 },
] as const;
export type MediumSkillId = (typeof MEDIUM_SKILLS)[number]['id'];

