import { ssrCompose, ssrRampIndex, type ExpressionId, type HairColorId, type HairstyleId, type SsrDirection, type SsrPart } from '@shaman/shared';
import { SSR_BODY, SSR_HAIR, SSR_SKIN } from './ssr-head-config';

// Canvas (DOM) drawing of an SSR character for React windows; same parts and composer as the game's SsrHead.
export interface SsrCanvasAssets { parts: Record<string, SsrPart>; palettes: Record<string, string[]>; images: Map<string, HTMLImageElement> }

function loadImage(url: string) { return new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(Error(url)); i.src = url; }); }
const json = async <T,>(url: string): Promise<T> => { const r = await fetch(url); if (!r.ok) throw Error(url); return r.json() as Promise<T>; };

/** Loads every SSR part (idle images of the body only) and the hair palettes. */
export async function loadSsrCanvasAssets(): Promise<SsrCanvasAssets> {
  const ids = (await json<string[]>('/assets/ssr/parts/index.json')).filter((id) => id !== 'headBase.default');
  const [list, pal] = await Promise.all([Promise.all(ids.map((id) => json<SsrPart>(`/assets/ssr/parts/${id}.json`))), json<{ hair: Record<string, string[]> }>('/assets/ssr/palettes.json')]);
  const parts = Object.fromEntries(list.map((p) => [p.id, p]));
  const urls = new Set<string>();
  for (const p of list) {
    // The body only needs its idle frames here (the window shows the standing pose).
    const used = p.kind === 'body' ? new Set(Object.values(p.clips).filter((c) => c.action === 'idle').flatMap((c) => c.frames?.flatMap((f) => f.layers.map((l) => l.image)) ?? [])) : null;
    for (const img of p.images) if (!used || used.has(img.id)) urls.add(img.url);
  }
  const images = new Map(await Promise.all([...urls].map(async (u) => [u, await loadImage(u)] as const)));
  return { parts, palettes: pal.hair, images };
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Draws the idle character on a 128 × 128 canvas context. */
export function drawSsrIdle(g: CanvasRenderingContext2D, a: SsrCanvasAssets, facing: SsrDirection, hair: HairstyleId, color: HairColorId, face: ExpressionId) {
  const attached = [a.parts[SSR_SKIN]!];
  const fp = face !== 'neutral' ? a.parts[`face.${face}`] : undefined;
  if (fp) attached.push(fp);
  const hp = a.parts[SSR_HAIR[hair] ?? ''];
  if (hp) attached.push(hp);
  const cols = (a.palettes[color] ?? a.palettes.silver ?? []).map(rgb);
  for (const it of ssrCompose(a.parts[SSR_BODY]!, attached, 'idle', facing, 0)) {
    const img = a.images.get(it.url);
    if (!img) continue;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const cg = c.getContext('2d')!;
    if (it.mirror) { cg.translate(c.width, 0); cg.scale(-1, 1); }
    cg.drawImage(img, 0, 0);
    if (it.palette) {
      cg.setTransform(1, 0, 0, 1, 0, 0);
      const d = cg.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        if (!d.data[i + 3]) continue;
        const k = ssrRampIndex(d.data[i]!), v = k >= 0 ? cols[k] : undefined;
        if (v) { d.data[i] = v[0]!; d.data[i + 1] = v[1]!; d.data[i + 2] = v[2]!; }
      }
      cg.putImageData(d, 0, 0);
    }
    g.drawImage(c, it.x, it.y);
  }
}
