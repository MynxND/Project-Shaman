// Gameplay-scale preview of the Japan master circle prototype (no generation). World space: characters at 0.5
// (FoundationScene CHARACTER_SCALE), effects at 0.5/0.72 of lab size (SkillCastLayer), camera base zoom 2 on a 1080p
// screen (VIEW 960×720) — so the 1× world render is upscaled 2× (nearest) to show real on-screen size.
// Usage: node tools/sprites/preview_jp_circle.mjs <out.png>
import { sharp } from '../rig/body-eight-lib.mjs';
const R = 'docs/design/skills/japan-v1/raw/', out = process.argv[2] ?? 'docs/design/skills/japan-v1/prototype-gameplay-scale.png';
const FX = 0.5 / 0.72, CAST_K = 0.95, W = 300, H = 200;
const tinted = async (file, hex, w, h, angle = 0) => {
  let img = sharp(file).ensureAlpha();
  if (angle) img = sharp(await img.rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer());
  const buf = await img.resize(w, h, { kernel: 'nearest', fit: 'fill' }).png().toBuffer();
  if (!hex) return buf;
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) { data[i] = data[i] * r / 255; data[i + 1] = data[i + 1] * g / 255; data[i + 2] = data[i + 2] * b / 255; }
  return sharp(data, { raw: info }).png().toBuffer();
};
const panel = async (hex, label) => {
  const ground = await sharp('apps/client/public/assets/umbral/ground/ritual-paving.png').resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.6 }).png().toBuffer();
  const feetX = W / 2, feetY = 130;
  const cw = Math.round(192 * FX * CAST_K), ch = Math.round(cw / 2);
  // Rotated top-down circle, then squashed to the ground ellipse (same as the lab's container).
  const circle = await tinted(R + 'jp-master-circle/seed.png', hex, cw, ch, 20);
  const sat = await tinted(R + 'jp-cast-circle-satellite/seed.png', hex, Math.round(64 * FX * CAST_K), Math.round(32 * FX * CAST_K));
  const smoke = await tinted(R + 'jp-spirit-smoke/seed.png', hex, Math.round(128 * FX), Math.round(64 * FX));
  const crest = await tinted(R + 'jp-ofuda-crest/seed.png', null, Math.round(64 * FX), Math.round(96 * FX));
  const actor = await sharp('apps/client/public/assets/pixellab/main-male-v1/east.png').resize(64, 64, { kernel: 'nearest' }).png().toBuffer();
  const satR = 112 * FX * CAST_K;
  return sharp(ground).composite([
    { input: circle, left: Math.round(feetX - cw / 2), top: Math.round(feetY - ch / 2) },
    { input: sat, left: Math.round(feetX + satR - 22 * FX), top: Math.round(feetY - 11 * FX) },
    { input: sat, left: Math.round(feetX - satR - 22 * FX), top: Math.round(feetY - 11 * FX) },
    { input: smoke, left: Math.round(feetX - 44), top: Math.round(feetY - 4) },
    { input: actor, left: feetX - 32, top: feetY - 62 },
    { input: crest, left: Math.round(feetX - 22), top: Math.round(feetY - 62 - 70) },
  ]).png().toBuffer();
};
const a = await panel('#FFE2A8', 'protection'), b = await panel('#FF7A50', 'attack');
const both = await sharp({ create: { width: W * 2 + 10, height: H, channels: 4, background: '#18312e' } })
  .composite([{ input: a, left: 0, top: 0 }, { input: b, left: W + 10, top: 0 }]).png().toBuffer();
await sharp(both).resize((W * 2 + 10) * 2, H * 2, { kernel: 'nearest' }).png().toFile(out);
console.log('preview', out);
