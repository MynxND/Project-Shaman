// Sacred Thread Barrier v2 post-processing (no generation; user 2026-10-10: fix the washed-out animation for free, use the
// Thai theme colours red + purple, replace the inner marks with ancient-Thai-style letters, make the centre clear).
// Input: docs/design/skills/thailand-v1/raw/sacred-thread-barrier-v2/{seed,frame-NN}.png (PixelLab).
// Output: raw/sacred-thread-barrier-v2-post/frame-NN.png (+ jobs.json copy) for pack_thai_vfx.mjs.
// Steps per frame: (1) tone-match the frame to the seed so later frames do not wash out to white; (2) recolour every
// non-purple pixel onto a crimson ramp by luminance (purple fire/smoke kept); (3) put the seed's rim smoke back under the
// frame with a slow drift; (4) clear the centre; (5) draw a ring of ancient-Thai-style letters around the centre and one
// large letter in each side seal. Letters are decorative shapes in an old Thai style, not a real text or mantra.
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';

const SRC = 'docs/design/skills/thailand-v1/raw/sacred-thread-barrier-v2/';
const OUT = 'docs/design/skills/thailand-v1/raw/sacred-thread-barrier-v2-post/';
mkdirSync(OUT, { recursive: true });
const W = 256, H = 160, CX = 124, CY = 78;

const read = async (p) => (await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
const lum = (b, i) => 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2];
function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx / 255 };
}
/** Purple/violet/magenta pixels (fire, smoke) keep their colour. */
const purple = (b, i) => { const { h, s } = hsv(b[i], b[i + 1], b[i + 2]); return s > 0.25 && h >= 250 && h <= 330; };
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
// Thai theme crimson ramp, dark -> light; the top stays rose (never white).
const RAMP = ['#1e0610', '#3a0a18', '#5c1022', '#84182c', '#a8223a', '#c83a4e', '#e06474', '#f2909c', '#ffbcc6'].map(hex);
const ellipse = (x, y, rx, ry) => ((x - CX) / rx) ** 2 + ((y - CY) / ry) ** 2;

const seed = await read(SRC + 'seed.png');
// Seed luminance distribution of non-purple pixels = target tone for every frame.
const target = [];
for (let k = 0; k < W * H; k++) if (seed[k * 4 + 3] && !purple(seed, k * 4)) target.push(lum(seed, k * 4));
target.sort((a, b) => a - b);
// Rim smoke from the seed: dark violet pixels outside the outer ring.
const smoke = Buffer.alloc(W * H * 4);
for (let k = 0; k < W * H; k++) {
  const i = k * 4, x = k % W, y = (k / W) | 0;
  if (seed[i + 3] && purple(seed, i) && lum(seed, i) < 110 && ellipse(x, y, 104, 48) > 0.8) seed.copy(smoke, i, i, i + 4);
}

// Ancient-Thai-style letter shapes (5 × 6, loop heads); decorative only.
const GLYPHS = [
  ['.###.', '#...#', '##..#', '.#..#', '.#..#', '.#..#'],
  ['#...#', '##..#', '#...#', '#...#', '#..##', '.##.#'],
  ['.###.', '#...#', '#.#.#', '##..#', '#...#', '#...#'],
  ['.###.', '#...#', '..#.#', '.##.#', '#...#', '.###.'],
  ['#...#', '##..#', '#...#', '#...#', '#.#.#', '.#.##'],
  ['.##..', '#..#.', '##.##', '#...#', '#...#', '.###.'],
];
const LETTER = RAMP[8], LETTER_SHADOW = RAMP[1];
function put(buf, x, y, c, a = 255) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a; }
function glyph(buf, g, x0, y0, scale = 1) {
  for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy][gx] === '#')
    for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
      put(buf, x0 + gx * scale + sx, y0 + gy * scale + sy + 1, LETTER_SHADOW);
    }
  for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 5; gx++) if (g[gy][gx] === '#')
    for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) put(buf, x0 + gx * scale + sx, y0 + gy * scale + sy, LETTER);
}
// Letter ring: evenly spaced by arc length on an ellipse just inside the inner ring.
const RING = { rx: 26, ry: 11, count: 14 };
const ringPts = (() => {
  const pts = []; let len = 0, prev = null;
  for (let t = 0; t <= 2000; t++) { const a = (t / 2000) * Math.PI * 2 - Math.PI / 2, p = { x: CX + RING.rx * Math.cos(a), y: CY + RING.ry * Math.sin(a) }; if (prev) len += Math.hypot(p.x - prev.x, p.y - prev.y); pts.push({ ...p, len }); prev = p; }
  return Array.from({ length: RING.count }, (_, n) => pts.find((p) => p.len >= (n * len) / RING.count));
})();
// Side seals (measured on the frames): interiors to clear and re-letter.
const SEALS = [{ x0: 66, y0: 73, x1: 79, y1: 85, g: 0 }, { x0: 172, y0: 73, x1: 185, y1: 85, g: 2 }];

const frames = readdirSync(SRC).filter((f) => /^frame-\d+\.png$/.test(f)).sort();
for (const [n, f] of frames.entries()) {
  const src = await read(SRC + f), out = Buffer.alloc(W * H * 4);
  // (1) tone match: quantile-map this frame's non-purple luminance onto the seed's.
  const ls = [];
  for (let k = 0; k < W * H; k++) if (src[k * 4 + 3] && !purple(src, k * 4)) ls.push(lum(src, k * 4));
  const sorted = [...ls].sort((a, b) => a - b), rank = (L) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < L) lo = m + 1; else hi = m; } return lo / Math.max(1, sorted.length); };
  // (3) smoke under the frame, drifting a pixel left/right over the loop.
  const dx = Math.round(Math.sin((n / frames.length) * Math.PI * 2) * 1.5);
  for (let k = 0; k < W * H; k++) { const i = k * 4; if (!smoke[i + 3]) continue; const x = (k % W) + dx, y = (k / W) | 0; if (x >= 0 && x < W) smoke.copy(out, (y * W + x) * 4, i, i + 4); }
  // (2) Detail comes from the seed (the animation washes out); motion comes from the frame: where the frame is brighter
  //     than its own tone-matched level, the seed's crimson step is lifted (sweeping glow), and the frame's purple fire
  //     replaces the seed's (flicker).
  for (let k = 0; k < W * H; k++) {
    const i = k * 4, x = k % W, y = (k / W) | 0;
    if (ellipse(x, y, 31, 13) < 1) continue; // (4) clear centre
    const fp = src[i + 3] && purple(src, i), sp = seed[i + 3] && purple(seed, i);
    if (fp) { src.copy(out, i, i, i + 4); continue; }
    if (!seed[i + 3] || sp) continue;
    let step = Math.min(RAMP.length - 1, Math.floor((lum(seed, i) / 255) * RAMP.length));
    if (src[i + 3]) {
      const matched = target[Math.min(target.length - 1, Math.floor(rank(lum(src, i)) * target.length))];
      step = Math.min(RAMP.length - 1, step + Math.max(0, Math.round((matched - lum(seed, i)) / 45)));
    }
    const c = RAMP[step];
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = seed[i + 3];
  }
  // (5) letters: ring around the clear centre (soft pulse: every other letter dims on alternate frames) and the seals.
  ringPts.forEach((p, m) => glyph(out, GLYPHS[m % GLYPHS.length], Math.round(p.x) - 2, Math.round(p.y) - 3));
  for (const s of SEALS) {
    for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) put(out, x, y, RAMP[1]);
    glyph(out, GLYPHS[s.g], s.x0 + 2, s.y0, 2);
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(OUT + f);
}
copyFileSync(SRC + 'jobs.json', OUT + 'jobs.json');
console.log('post frames', frames.length, '->', OUT);
