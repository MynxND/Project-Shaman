import Phaser from 'phaser';
import { SSR_BODY, SSR_HAIR, SSR_SKIN, ssrEnabled } from './ssr-head-config';
import { ssrCompose, ssrRampIndex, type ExpressionId, type HairColorId, type HairstyleId, type SsrAction, type SsrDirection, type SsrDrawItem, type SsrPart } from '@shaman/shared';

// Phase 4 of the Shaman Sprite Rig (docs/design/character-sprite-architecture.md): the V3 head in the game is drawn by the
// shared SSR composer from the converted parts in /assets/ssr (skin base + expression + hair ramp recoloured by palette,
// left views mirrored, placed on the SSR body's neck anchor). The body sprite and its animations stay as they were.
// Off switch: ssrEnabled() in ssr-head-config.ts (falls back to the head-layers-01 head).
const INDEX_KEY = 'ssr-parts-index', PALETTE_KEY = 'ssr-palettes', BODY_ID = SSR_BODY, SKIN_ID = SSR_SKIN;
const partKey = (id: string) => `ssr-part:${id}`, imageKey = (id: string) => `ssr:${id}`;

export function preloadSsr(scene: Phaser.Scene) {
  if (!ssrEnabled()) return;
  scene.load.once(`filecomplete-json-${INDEX_KEY}`, (_k: string, _t: string, ids: unknown) => {
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      if (typeof id !== 'string' || id === 'headBase.default') continue;
      scene.load.once(`filecomplete-json-${partKey(id)}`, (_k2: string, _t2: string, part: SsrPart) => {
        // The body draws through the existing V3 sprite; only its anchors are needed here.
        if (part.kind !== 'body') for (const img of part.images) scene.load.image(imageKey(img.id), img.url);
      });
      scene.load.json(partKey(id), `/assets/ssr/parts/${id}.json`);
    }
  });
  scene.load.json(INDEX_KEY, '/assets/ssr/parts/index.json');
  scene.load.json(PALETTE_KEY, '/assets/ssr/palettes.json');
}

export interface SsrAssets { parts: Record<string, SsrPart>; palettes: Record<string, string[]> }
/** Null when the SSR data did not load (or the flag is off): the caller keeps the legacy head. */
export function ssrAssets(scene: Phaser.Scene): SsrAssets | null {
  if (!ssrEnabled()) return null;
  const ids = scene.cache.json.get(INDEX_KEY) as string[] | undefined, pal = scene.cache.json.get(PALETTE_KEY) as { hair?: Record<string, string[]> } | undefined;
  if (!ids || !pal?.hair) return null;
  const parts: Record<string, SsrPart> = {};
  for (const id of ids) { const p = scene.cache.json.get(partKey(id)) as SsrPart | undefined; if (p) parts[id] = p; }
  if (!parts[BODY_ID] || !parts[SKIN_ID]) return null;
  for (const p of Object.values(parts)) if (p.kind !== 'body') for (const img of p.images) if (!scene.textures.exists(imageKey(img.id))) return null;
  return { parts, palettes: pal.hair };
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Draws one character's SSR head on the V3 body sprite; owns a small pool of images. */
export class SsrHead {
  private pool: Phaser.GameObjects.Image[] = [];
  constructor(private scene: Phaser.Scene, private assets: SsrAssets) {}

  supports(hair: HairstyleId) { const id = SSR_HAIR[hair]; return !!id && !!this.assets.parts[id]; }

  /** Places the head for the body's current action frame; the sprite origin is the body's feet (origin anchor). */
  /** `neckShift` (native px) moves the head for body frames outside the SSR clip table (V3 weapon-class attacks: the
   *  idle clip is drawn, shifted by that frame's neck pivot minus the idle neck). */
  draw(sprite: Phaser.GameObjects.Sprite, action: SsrAction, facing: SsrDirection, frame: number, hair: HairstyleId, color: HairColorId, expression: ExpressionId, neckShift = { x: 0, y: 0 }) {
    const { parts } = this.assets, attached = [parts[SKIN_ID]!];
    const face = expression !== 'neutral' ? parts[`face.${expression}`] : undefined;
    if (face) attached.push(face);
    const hairPart = parts[SSR_HAIR[hair] ?? ''];
    if (hairPart) attached.push(hairPart);
    const items = ssrCompose(parts[BODY_ID]!, attached, action, facing, frame).filter((it) => it.kind !== 'body');
    while (this.pool.length < items.length) this.pool.push(this.scene.add.image(0, 0, imageKey(items[0]!.image)).setOrigin(0, 0));
    const sx = sprite.scaleX, sy = sprite.scaleY;
    // Sprite origin = body canvas pixel (ox + 0.5, oy + 1), i.e. the feet; every item is in the same canvas space.
    const ox = sprite.originX * sprite.frame.width - 0.5, oy = sprite.originY * sprite.frame.height - 1;
    const tint = sprite.tintTopLeft;
    this.pool.forEach((img, i) => {
      const it = items[i];
      if (!it) { img.setVisible(false); return; }
      img.setTexture(this.texture(it, color)).setOrigin(0, 0)
        .setPosition(sprite.x + (it.x + neckShift.x - ox - 0.5) * sx, sprite.y + (it.y + neckShift.y - oy - 1) * sy).setScale(sx, sy)
        .setDepth(sprite.depth + 0.01 + it.order * 0.0002).setAlpha(sprite.alpha).setTint(tint).setVisible(sprite.visible);
    });
  }

  hide() { for (const img of this.pool) img.setVisible(false); }
  destroy() { for (const img of this.pool) img.destroy(); this.pool = []; }

  /** Mirrored and palette layers are baked once per image/palette into canvas textures (shared by all characters). */
  private texture(it: SsrDrawItem, color: HairColorId): string {
    const base = imageKey(it.image), pal = it.palette ? (this.assets.palettes[color] ? color : 'silver') : '';
    if (!it.mirror && !pal) { this.scene.textures.get(base).setFilter(Phaser.Textures.FilterMode.NEAREST); return base; }
    const key = `${base}:${it.mirror ? 'm' : ''}:${pal}`;
    if (this.scene.textures.exists(key)) return key;
    const src = this.scene.textures.get(base).getSourceImage() as HTMLImageElement;
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d')!;
    if (it.mirror) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(src, 0, 0);
    if (pal) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), cols = this.assets.palettes[pal]!.map(rgb);
      for (let i = 0; i < d.data.length; i += 4) {
        if (!d.data[i + 3]) continue;
        const k = ssrRampIndex(d.data[i]!), v = k >= 0 ? cols[k] : undefined;
        if (v) { d.data[i] = v[0]!; d.data[i + 1] = v[1]!; d.data[i + 2] = v[2]!; }
      }
      g.putImageData(d, 0, 0);
    }
    this.scene.textures.addCanvas(key, c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }
}
