import { EXPRESSIONS, HAIRSTYLES, type ExpressionId, type HairstyleId } from '@shaman/shared';
import { BODY_DIRECTIONS, type NativePoint } from './body-eight-model';

// Layered V3 head (docs/design/character-v3/head-layers-01): every layer is a 128 canvas aligned to the same
// per-direction neck pivot. Each hairstyle has its own base (bald face + that style's skull) so no foreign scalp shows. Faces exist only for directions that show one (back views have none).
export type HeadAsset = { url: string; sha256: string };
export type HeadLayerDirection = { direction: string; pivot: NativePoint; bases: Record<HairstyleId, HeadAsset>; faces: Partial<Record<ExpressionId, HeadAsset>>; hair: Record<HairstyleId, HeadAsset>; accents?: Partial<Record<HairstyleId, HeadAsset>> };
export type HeadLayersManifest = { version: 'head-layers/2'; directions: HeadLayerDirection[] };

const asset = (a: HeadAsset | undefined) => !!a && a.url.startsWith('/assets/character-v3/head-layers-01/') && /^[a-f0-9]{64}$/.test(a.sha256);
export function parseHeadLayers(value: unknown): HeadLayersManifest {
  const m = value as HeadLayersManifest;
  if (!m || m.version !== 'head-layers/2' || m.directions?.length !== 8) throw Error('ชุดหัวแยกชั้นไม่ตรงสเปก');
  for (const [i, d] of m.directions.entries()) {
    if (d.direction !== BODY_DIRECTIONS[i] || !Number.isInteger(d.pivot?.x) || !Number.isInteger(d.pivot?.y)) throw Error('ข้อมูลทิศของหัวไม่ถูกต้อง');
    for (const h of HAIRSTYLES) if (!asset(d.hair?.[h.id]) || !asset(d.bases?.[h.id])) throw Error(`ผมทรง ${h.id} ทิศ ${d.direction} หาย`);
    for (const a of Object.values(d.accents ?? {})) if (!asset(a)) throw Error('ของประดับผมไม่ถูกต้อง');
    for (const [id, f] of Object.entries(d.faces ?? {})) if (!EXPRESSIONS.some((e) => e.id === id) || !asset(f)) throw Error('หน้าไม่ถูกต้อง');
  }
  return m;
}
