// Free post-pass for the Kitsune attack (user 2026-10-11: bigger tail fire). The animation kept the tail fire small,
// so pixel flames are drawn up from each frame's own red tail tips (they follow the tails), and washed white flare
// pixels become flame colours (no opaque white). Frames are padded so tall flames are not clipped.
// Input raw/shikigami-kitsune-master/frame-NN.png → raw/shikigami-kitsune-attack-post/frame-NN.png (+ jobs.json).
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';
const SRC = 'docs/design/skills/japan-v1/raw/shikigami-kitsune-master/', OUT = 'docs/design/skills/japan-v1/raw/shikigami-kitsune-attack-post/';
const PAD_TOP = 40, PAD_LEFT = 16, PAD_RIGHT = 16;
mkdirSync(OUT, { recursive: true });
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const FLAME = ['#5a1208', '#9c2210', '#d8401a', '#f2742a', '#f9a83c', '#fdd76a'].map(hex); // bottom → tip, never white
const OUTLINE = hex('#3a0c08');
const files = readdirSync(SRC).filter((f) => /^frame-\d+\.png$/.test(f)).sort();
for (const [fi, f] of files.entries()) {
  const src = await sharp(SRC + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = src.info.width + PAD_LEFT + PAD_RIGHT, H = src.info.height + PAD_TOP;
  const data = Buffer.alloc(W * H * 4);
  for (let y = 0; y < src.info.height; y++) src.data.copy(data, ((y + PAD_TOP) * W + PAD_LEFT) * 4, y * src.info.width * 4, (y + 1) * src.info.width * 4);
  const at = (x, y) => (y * W + x) * 4;
  // Washed white (the bite flare) → bright flame by luminance.
  for (let k = 0; k < W * H; k++) { const p = k * 4; if (data[p + 3] && Math.min(data[p], data[p + 1], data[p + 2]) > 235) { const c = FLAME[5]; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; } }
  // Tail tips: strong red pixels in the tail area (left 50% and upper 42% of the canvas, where the three tails are; the red back markings stay clear), topmost per column.
  const tips = [];
  for (let x = PAD_LEFT; x < PAD_LEFT + src.info.width * 0.5; x++) for (let y = PAD_TOP; y < PAD_TOP + src.info.height * 0.42; y++) {
    const p = at(x, y); const r = data[p], g = data[p + 1], b = data[p + 2];
    if (data[p + 3] && r > 150 && g < 110 && b < 110) { tips.push([x, y]); break; }
  }
  // Group neighbouring columns into tips and draw a flame tongue above each column of each group.
  const groups = []; for (const t of tips) { const last = groups.at(-1); if (last && t[0] - last.at(-1)[0] <= 2) last.push(t); else groups.push([t]); }
  const paint = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = at(x, y); data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; data[p + 3] = 255; };
  for (const [gi, g] of groups.entries()) {
    if (g.length < 3) continue;
    const mid = g.length / 2;
    for (const [i, [x, y]] of g.entries()) {
      const edge = 1 - Math.abs(i - mid) / mid; // tall in the middle of the tip, short at the sides
      const h = Math.round((10 + 22 * edge) * (0.8 + 0.25 * Math.sin(fi * 1.7 + gi * 2.1 + i * 0.9)));
      for (let d = 0; d < h; d++) {
        const sway = Math.round(Math.sin((d / h) * 3 + fi * 1.3 + gi) * (d / h) * 2.5);
        paint(x + sway, y - d, FLAME[Math.min(5, Math.floor((d / h) * 6))]);
      }
    }
  }
  // 1-px dark outline around the new flame pixels (keeps the crisp outlined pixel-art look).
  const isFlame = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const p = at(x, y); return data[p + 3] && FLAME.some((c) => c[0] === data[p] && c[1] === data[p + 1] && c[2] === data[p + 2]); };
  const edges = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!data[at(x, y) + 3] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isFlame(x + dx, y + dy))) edges.push([x, y]);
  for (const [x, y] of edges) paint(x, y, OUTLINE);
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(OUT + f);
}
copyFileSync(SRC + 'jobs.json', OUT + 'jobs.json');
console.log('kitsune tail fire', files.length, 'frames');
