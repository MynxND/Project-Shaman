import { HEAD_PROOF_LAYERS, type HairPalette, type HeadProofAppearance, type HeadProofLayer, type HeadProofViewData, type HeadRigPoint } from './head-rig.js';

export const HAIR_COLLECTION_VIEWS = ['south', 'east', 'north', 'west'] as const;
export type HairCollectionView = typeof HAIR_COLLECTION_VIEWS[number];
export interface HairCollectionStyle {
  id: string;
  name: string;
  status: string;
  views: Record<HairCollectionView, { status: string; front: string | null; back: string | null }>;
}
export interface HairCollectionManifest {
  version: 1;
  id: string;
  canvas: { width: number; height: number; foot: HeadRigPoint };
  review: { approved: false; stage: 'four-static-view-collection'; limitations: string[] };
  views: Record<HairCollectionView, HeadProofViewData>;
  hairstyles: HairCollectionStyle[];
  palettes: HairPalette[];
}
export function hairCollectionReady(style: HairCollectionStyle): style is HairCollectionStyle & { views: Record<HairCollectionView, { status: string; front: string; back: string }> } {
  return style.status === 'complete-candidate' && HAIR_COLLECTION_VIEWS.every(view => {
    const parts = style.views[view];
    return parts?.status === 'complete-candidate' && Boolean(parts.front?.startsWith('/assets/') && parts.back?.startsWith('/assets/'));
  });
}
export function hairCollectionLayers(manifest: HairCollectionManifest, view: HairCollectionView, appearance: HeadProofAppearance): { layer: HeadProofLayer; url: string }[] {
  const hair = manifest.hairstyles.find(style => style.id === appearance.hairstyle);
  if (!hair || !hairCollectionReady(hair)) throw new Error(`Hairstyle is not ready: ${appearance.hairstyle}`);
  if (!manifest.palettes.some(palette => palette.id === appearance.palette)) throw new Error(`Unknown hair palette: ${appearance.palette}`);
  const data = manifest.views[view];
  const urls: Record<HeadProofLayer, string> = { hairBack: hair.views[view].back!, hairFront: hair.views[view].front!, body: data.body, head: data.head, crown: data.crown };
  return data.order.filter(layer => layer !== 'crown' || appearance.crown).map(layer => ({ layer, url: urls[layer] }));
}
export function validateHairCollection(manifest: HairCollectionManifest): string[] {
  const errors: string[] = [];
  if (manifest.version !== 1 || manifest.canvas.width !== 128 || manifest.canvas.height !== 128 || manifest.canvas.foot.x !== 64 || manifest.canvas.foot.y !== 124) errors.push('Expected native128 foot-centered collection');
  if (manifest.review.approved !== false || manifest.review.stage !== 'four-static-view-collection') errors.push('Collection must await visual approval');
  if (manifest.hairstyles.length !== 14 || new Set(manifest.hairstyles.map(style => style.id)).size !== 14) errors.push('Expected fourteen unique designs');
  if (!manifest.hairstyles.some(hairCollectionReady)) errors.push('No complete candidate to review');
  for (const palette of manifest.palettes) if (palette.colors.length !== 4 || palette.colors.some(color => !/^#[0-9a-f]{6}$/i.test(color))) errors.push(`Invalid palette: ${palette.id}`);
  for (const view of HAIR_COLLECTION_VIEWS) {
    const data = manifest.views[view];
    if (!data || ![data.body, data.head, data.crown, data.source, data.faceMask].every(url => url.startsWith('/assets/'))) { errors.push(`${view}: invalid base`); continue; }
    if (data.order.length !== 5 || new Set(data.order).size !== 5 || data.order.some(layer => !HEAD_PROOF_LAYERS.includes(layer))) errors.push(`${view}: invalid order`);
  }
  for (const style of manifest.hairstyles) if (style.status === 'complete-candidate' && !hairCollectionReady(style)) errors.push(`${style.id}: incomplete selectable style`);
  return errors;
}