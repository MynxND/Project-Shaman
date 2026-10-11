export const HEAD_PROOF_VIEWS = ['south', 'east', 'north'] as const;
export type HeadProofView = typeof HEAD_PROOF_VIEWS[number];
export const HEAD_PROOF_LAYERS = ['hairBack', 'body', 'head', 'hairFront', 'crown'] as const;
export type HeadProofLayer = typeof HEAD_PROOF_LAYERS[number];
export interface HeadRigPoint { x: number; y: number }
export interface HairPalette { id: string; name: string; colors: readonly [string, string, string, string] }
export interface HeadProofViewData {
  neck: HeadRigPoint;
  crownSeat: HeadRigPoint;
  body: string;
  head: string;
  source: string;
  faceMask: string;
  crown: string;
  order: readonly HeadProofLayer[];
}
export interface HeadProofManifest {
  version: 1;
  id: string;
  canvas: { width: number; height: number; foot: HeadRigPoint };
  review: { approved: false; stage: 'three-view'; limitations: string[] };
  views: Record<HeadProofView, HeadProofViewData>;
  hairstyles: { id: string; name: string; views: Record<HeadProofView, { front: string; back: string }> }[];
  palettes: HairPalette[];
}
export interface HeadProofAppearance { hairstyle: string; palette: string; crown: boolean }

export function recolorHeadHair(pixels: Uint8ClampedArray, palette: HairPalette): void {
  const grayStops = [48, 104, 168, 232];
  const colors = palette.colors.map(color => [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)]);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (!pixels[offset + 3] || pixels[offset] !== pixels[offset + 1] || pixels[offset] !== pixels[offset + 2]) continue;
    const shade = grayStops.indexOf(pixels[offset] ?? -1);
    const color = colors[shade];
    if (color) pixels.set(color, offset);
  }
}

export function headProofLayers(manifest: HeadProofManifest, view: HeadProofView, appearance: HeadProofAppearance): { layer: HeadProofLayer; url: string }[] {
  const hair = manifest.hairstyles.find(style => style.id === appearance.hairstyle);
  if (!hair) throw new Error(`Unknown hairstyle: ${appearance.hairstyle}`);
  if (!manifest.palettes.some(palette => palette.id === appearance.palette)) throw new Error(`Unknown hair palette: ${appearance.palette}`);
  const data = manifest.views[view];
  const urls: Record<HeadProofLayer, string> = { hairBack: hair.views[view].back, body: data.body, head: data.head, hairFront: hair.views[view].front, crown: data.crown };
  return data.order.filter(layer => layer !== 'crown' || appearance.crown).map(layer => ({ layer, url: urls[layer] }));
}

export function validateHeadProof(manifest: HeadProofManifest): string[] {
  const errors: string[] = [];
  if (manifest.version !== 1 || !manifest.id || manifest.canvas.width !== 128 || manifest.canvas.height !== 128) errors.push('Expected native 128px head proof');
  if (manifest.review.approved !== false || manifest.review.stage !== 'three-view') errors.push('Three-view proof must await approval');
  if (manifest.hairstyles.length < 2 || new Set(manifest.hairstyles.map(style => style.id)).size !== manifest.hairstyles.length) errors.push('Expected two unique hairstyles');
  if (manifest.palettes.length < 3 || new Set(manifest.palettes.map(palette => palette.id)).size !== manifest.palettes.length) errors.push('Expected multiple unique hair palettes');
  for (const palette of manifest.palettes) if (palette.colors.length !== 4 || palette.colors.some(color => !/^#[0-9a-f]{6}$/i.test(color))) errors.push(`Invalid palette: ${palette.id}`);
  const pointValid = (point: HeadRigPoint) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x < 128 && point.y >= 0 && point.y < 128;
  if (!pointValid(manifest.canvas.foot)) errors.push('Invalid foot');
  for (const view of HEAD_PROOF_VIEWS) {
    const data = manifest.views[view];
    if (!data || !pointValid(data.neck) || !pointValid(data.crownSeat)) { errors.push(`${view}: invalid anchors`); continue; }
    if (data.order.length !== HEAD_PROOF_LAYERS.length || new Set(data.order).size !== HEAD_PROOF_LAYERS.length || data.order.some(layer => !HEAD_PROOF_LAYERS.includes(layer))) errors.push(`${view}: invalid order`);
    if (![data.body, data.head, data.source, data.faceMask, data.crown].every(url => url.startsWith('/assets/'))) errors.push(`${view}: invalid asset paths`);
    for (const hair of manifest.hairstyles) if (!hair.views[view]?.front.startsWith('/assets/') || !hair.views[view]?.back.startsWith('/assets/')) errors.push(`${hair.id}/${view}: missing hair parts`);
  }
  return errors;
}