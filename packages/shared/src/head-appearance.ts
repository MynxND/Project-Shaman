// Character V3 head customization (docs/design/character-v3/head-layers-01/README.md). The head is drawn in layers
// on the body's neck pivot: bald base head -> expression overlay (visible facings only) -> hair (runtime tint).
// Chosen at character creation and synced in PlayerState.head; a short-lived in-game emote overrides the face.

export const HAIRSTYLES = [
  { id: 'natural-short', th: 'ผมสั้นธรรมดา' },
  { id: 'side-sweep', th: 'ปัดข้าง' },
  { id: 'spiky-up', th: 'สั้นตั้ง' },
  { id: 'high-topknot', th: 'มวยสูง' },
  { id: 'golden-part', th: 'แสกข้างยาว' },
  { id: 'kid-clean', th: 'แสกกลางสั้น' },
  { id: 'face-fit-short', th: 'หน้าม้าปัดเต็ม' },
  { id: 'eye-veil', th: 'หน้าม้าปิดตาบางส่วน' },
  { id: 'korean-wolf', th: 'แสกกลางเกาหลี Wolf Cut · ปลายเงิน' },
  { id: 'swept-spikes', th: 'ผมตั้งปัดหลัง' },
  { id: 'curtain-gold', th: 'แสกกลางกรอบหน้า' },
] as const;
export type HairstyleId = (typeof HAIRSTYLES)[number]['id'];

/** Hair art is pale silver; these multiply-tints recolour it at runtime (no extra generation per colour). */
export const HAIR_COLORS = [
  { id: 'silver', th: 'เงินม่วง', tint: 0xc9c3e6 },
  { id: 'white', th: 'ขาว', tint: 0xffffff },
  { id: 'gray', th: 'เทา', tint: 0xbeb8d4 },
  { id: 'black', th: 'ดำ', tint: 0x4a4658 },
  { id: 'brown', th: 'น้ำตาล', tint: 0x9a6a48 },
  { id: 'gold', th: 'ทอง', tint: 0xe8c370 },
  { id: 'red', th: 'แดง', tint: 0xc4504a },
  { id: 'teal', th: 'เขียวหม่น', tint: 0x5fa39a },
  { id: 'blue', th: 'น้ำเงิน', tint: 0x6a86d0 },
] as const;
export type HairColorId = (typeof HAIR_COLORS)[number]['id'];

export const EXPRESSIONS = [
  { id: 'neutral', th: 'ปกติ' },
  { id: 'cold', th: 'เย็นชา' },
  { id: 'smile', th: 'ยิ้ม' },
  { id: 'angry', th: 'โกรธ' },
  { id: 'sad', th: 'เศร้า' },
  { id: 'surprised', th: 'ตกใจ' },
  { id: 'closed', th: 'หลับตา' },
  { id: 'violet-sharp', th: 'หน้าคม · ตาสีม่วง' },
  { id: 'teal-soft', th: 'หน้าละมุน · ตาฟ้าอมเขียว' },
  { id: 'cold-detached', th: 'เย็นชา · เบื่อโลก' },
] as const;
export type ExpressionId = (typeof EXPRESSIONS)[number]['id'];

/** How long an in-game emote overrides the chosen face. */
export const EMOTE_MS = 2500;

export interface HeadAppearance { hair: HairstyleId; hairColor: HairColorId; face: ExpressionId }
export const DEFAULT_HEAD: HeadAppearance = { hair: 'natural-short', hairColor: 'white', face: 'neutral' };

const has = <T extends { id: string }>(list: readonly T[], id: unknown): id is T['id'] => typeof id === 'string' && list.some((x) => x.id === id);
export const isHairstyle = (v: unknown): v is HairstyleId => has(HAIRSTYLES, v);
export const isHairColor = (v: unknown): v is HairColorId => has(HAIR_COLORS, v);
export const isExpression = (v: unknown): v is ExpressionId => has(EXPRESSIONS, v);

/** Untrusted input -> a valid appearance; unknown parts fall back to the default. */
export function sanitizeHead(value: unknown): HeadAppearance {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return { hair: isHairstyle(v.hair) ? v.hair : DEFAULT_HEAD.hair, hairColor: isHairColor(v.hairColor) ? v.hairColor : DEFAULT_HEAD.hairColor, face: isExpression(v.face) ? v.face : DEFAULT_HEAD.face };
}
/** Synced form: "hair.color.face". */
export const encodeHead = (h: HeadAppearance) => `${h.hair}.${h.hairColor}.${h.face}`;
export function decodeHead(text: string): HeadAppearance {
  const [hair, hairColor, face] = String(text ?? '').split('.');
  return sanitizeHead({ hair, hairColor, face });
}
export const hairTint = (id: HairColorId) => HAIR_COLORS.find((c) => c.id === id)!.tint;
