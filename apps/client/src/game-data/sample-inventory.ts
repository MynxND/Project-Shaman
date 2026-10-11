import type { InventoryStack, ItemDefinition } from '@shaman/shared';

// SAMPLE DATA for the inventory prototype. There is no server inventory yet; the window labels this clearly.
// Names, stats and prices are placeholders, not approved design (docs/design/ui-system.md).

const def = (d: ItemDefinition) => d;

export const SAMPLE_ITEMS: Readonly<Record<string, ItemDefinition>> = Object.fromEntries([
  def({ id: 'potion-red', name: { th: 'ยาฟื้นพลัง (เล็ก)', en: 'Healing Tonic (S)' }, category: 'consumable', rarity: 'common', weight: 0.5, maxStack: 999, sellPrice: 15, description: 'ฟื้นฟู HP 300 หน่วย ยาต้มจากสมุนไพรพื้นบ้าน' }),
  def({ id: 'potion-blue', name: { th: 'น้ำมนต์ฟื้นวิญญาณ', en: 'Spirit Tonic' }, category: 'consumable', rarity: 'common', weight: 0.5, maxStack: 999, sellPrice: 25, description: 'ฟื้นฟู SP 60 หน่วย' }),
  def({ id: 'herb-bundle', name: { th: 'มัดสมุนไพร', en: 'Herb Bundle' }, category: 'material', rarity: 'common', weight: 0.2, maxStack: 999, sellPrice: 4, description: 'วัตถุดิบสำหรับปรุงยา' }),
  def({ id: 'holy-water', name: { th: 'น้ำมนต์ศักดิ์สิทธิ์', en: 'Holy Water' }, category: 'consumable', rarity: 'uncommon', weight: 1, maxStack: 99, sellPrice: 60, description: 'ล้างคำสาประดับต่ำออกจากตัว' }),
  def({ id: 'bone', name: { th: 'กระดูกเก่า', en: 'Old Bone' }, category: 'material', rarity: 'common', weight: 1, maxStack: 999, sellPrice: 2, description: 'ใช้ทำเครื่องรางและพิธีกรรม' }),
  def({ id: 'raw-meat', name: { th: 'เนื้อดิบ', en: 'Raw Meat' }, category: 'material', rarity: 'common', weight: 1.5, maxStack: 999, sellPrice: 3, description: 'ของเซ่นไหว้ภูตป่า' }),
  def({ id: 'spirit-flower', name: { th: 'ดอกไม้วิญญาณ', en: 'Spirit Flower' }, category: 'material', rarity: 'uncommon', weight: 0.1, maxStack: 999, sellPrice: 18, description: 'บานเฉพาะคืนเดือนมืด' }),
  def({ id: 'dark-ore', name: { th: 'แร่ทมิฬ', en: 'Umbral Ore' }, category: 'material', rarity: 'uncommon', weight: 3, maxStack: 999, sellPrice: 30, description: 'แร่ที่ดูดซับพลังวิญญาณ' }),
  def({ id: 'ghost-feather', name: { th: 'ขนนกผี', en: 'Ghost Feather' }, category: 'material', rarity: 'rare', weight: 0.1, maxStack: 999, sellPrice: 80, description: 'หลุดจากวิญญาณนกที่ถูกปลดปล่อย' }),
  def({ id: 'talisman-paper', name: { th: 'กระดาษยันต์', en: 'Talisman Paper' }, category: 'etc', rarity: 'common', weight: 0.1, maxStack: 999, sellPrice: 8, description: 'กระดาษลงอักขระสำหรับลงยันต์' }),
  def({ id: 'cursed-doll', name: { th: 'ตุ๊กตาคำสาป', en: 'Cursed Doll' }, category: 'etc', rarity: 'rare', weight: 0.5, maxStack: 99, sellPrice: 120, description: 'ห้ามขาย ห้ามทิ้ง ห้ามมองตาตอนกลางคืน' }),
  def({ id: 'bronze-amulet', name: { th: 'เครื่องรางทองเหลือง', en: 'Bronze Amulet' }, category: 'equipment', rarity: 'uncommon', weight: 2, maxStack: 1, sellPrice: 150, description: 'เครื่องประดับคุ้มกันภูต', stats: { mdef: 6, luk: 2 } }),
  def({ id: 'shaman-sash', name: { th: 'ผ้าคาดเอวหมอผี', en: 'Shaman Sash' }, category: 'equipment', rarity: 'uncommon', weight: 10, maxStack: 1, sellPrice: 300, description: 'ผ้าคาดเอวผู้ฝึกหัด', stats: { def: 12, mdef: 8, int: 2 } }),
  def({ id: 'spirit-sash', name: { th: 'ผ้าคาดเอวจิตวิญญาณ', en: 'Spirit Sash' }, category: 'equipment', rarity: 'rare', weight: 10, maxStack: 1, sellPrice: 900, description: 'ทอด้วยด้ายที่ผ่านพิธีปลุกเสก', stats: { def: 25, mdef: 15, int: 4 } }),
  def({ id: 'spirit-bell', name: { th: 'กระดิ่งเรียกวิญญาณ', en: 'Spirit Bell' }, category: 'etc', rarity: 'legendary', weight: 1, maxStack: 1, sellPrice: 2400, description: 'ใช้ในพิธีอัญเชิญ' }),
].map((d) => [d.id, d]));

/** Equipped items by slot, for the comparison card. */
export const SAMPLE_EQUIPPED: Readonly<Record<string, string>> = { waist: 'shaman-sash' };
export const SAMPLE_EQUIP_SLOT: Readonly<Record<string, string>> = { 'shaman-sash': 'waist', 'spirit-sash': 'waist', 'bronze-amulet': 'accessory' };

const quantities: [string, number][] = [
  ['potion-red', 25], ['potion-blue', 12], ['herb-bundle', 8], ['holy-water', 3], ['bone', 47], ['raw-meat', 16],
  ['spirit-flower', 32], ['dark-ore', 16], ['ghost-feather', 3], ['talisman-paper', 54], ['cursed-doll', 1],
  ['bronze-amulet', 1], ['spirit-sash', 1], ['spirit-bell', 1], ['potion-red', 200],
];

export const SAMPLE_STACKS: readonly InventoryStack[] = quantities.map(([itemId, quantity], i) => ({ uid: `s${i}`, itemId, quantity, acquiredAt: 1000 - i }));
export const SAMPLE_CAPACITY = 2030;
export const itemIcon = (itemId: string) => `/assets/ui/items/${itemId}.png`;
