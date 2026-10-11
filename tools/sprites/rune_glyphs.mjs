// Draws the Norway rune glyphs in code (user 2026-10-11: real Elder Futhark allowed). Letter shapes come from the
// Unicode Runic block rendered with Windows' Segoe UI Historic font (verified glyph forms — never AI-generated letters),
// thresholded to crisp pixels with a carved look: pale stone-light core, dark 1-px outline. One 24×32 cell per rune,
// published as single-frame kit sheets rune-<name> (tinted and pulsed in code).
// Usage: node tools/sprites/rune_glyphs.mjs
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';
const RUNES = { isa: 'ᛁ', hagalaz: 'ᚺ', perthro: 'ᛈ', kenaz: 'ᚲ', naudiz: 'ᚾ', thurisaz: 'ᚦ', dagaz: 'ᛞ', uruz: 'ᚢ', raidho: 'ᚱ' };
const FONT = 'C:/Windows/Fonts/seguihis.ttf';
if (!existsSync(FONT)) throw Error('Segoe UI Historic not found');
const W = 24, H = 32, BIG = 8; // render 8× then downscale with nearest → crisp strokes about 2 px wide
const RAW = 'docs/design/skills/norway-v1/raw/';
for (const [name, ch] of Object.entries(RUNES)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * BIG}" height="${H * BIG}"><style>@font-face{font-family:H;src:url('file:///${FONT}');}</style>
    <text x="50%" y="84%" text-anchor="middle" font-family="Segoe UI Historic, H" font-size="${H * BIG * 0.92}" font-weight="700" fill="#fff">${ch}</text></svg>`;
  const big = await sharp(Buffer.from(svg)).png().toBuffer();
  const { data, info } = await sharp(big).resize(W, H, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const on = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) on[k] = data[k * 4 + 3] > 110 ? 1 : 0;
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, p = k * 4;
    if (on[k]) { const top = y > 0 && !on[k - W]; const c = top ? [255, 244, 214] : [232, 220, 190]; out[p] = c[0]; out[p + 1] = c[1]; out[p + 2] = c[2]; out[p + 3] = 255; }
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < W && yy < H && on[yy * W + xx]; })) { out[p] = 40; out[p + 1] = 34; out[p + 2] = 30; out[p + 3] = 255; }
  }
  const dir = `${RAW}rune-${name}-post/`; mkdirSync(dir, { recursive: true });
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(dir + 'frame-00.png');
  writeFileSync(dir + 'jobs.json', JSON.stringify({ skill: `rune-${name}`, seedJob: 'code-drawn (Segoe UI Historic, Unicode Runic block)', animationJob: '', rune: ch }, null, 2));
  console.log('rune', name, ch);
}
