// Free post-pass for the shikigami and great-form attack animations (no generation): pads the canvas so effects are not
// clipped and maps washed pure-white effect pixels (slash streaks, water spray) onto each creature's element ramp —
// never pure white. Kodama: harsh yellow leaf glow → moss green. Nurikabe (both forms): the red seal on its ofuda (unverified seal-script / a plain red disc that reads
// as a national flag) becomes an abstract mark: paper colour inside, a thin vermilion ring and a short ink stroke.
// raw/<name>-master/frame-NN.png → raw/<name>-attack-post/frame-NN.png (+ jobs.json).
// Usage: node tools/sprites/shikigami_post.mjs <name> ...   (shikigami-kodama … great-mizuchi)
import { mkdirSync, readdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const RAMP = {
  kitsune: ['#f2742a', '#f9a83c', '#fdd76a'], kodama: ['#9fbf7a', '#c4dc9a', '#e2eec4'], nurikabe: ['#b8a888', '#d4c6a4', '#e8dcc0'],
  kamaitachi: ['#9ea8b8', '#c6ccd8', '#e2e6ee'], mizuchi: ['#6fb6dc', '#9fd4ee', '#cfeaf6'],
};
const PAD = 16, INK = hex('#2a1e18'), SEAL = hex('#c8402a');
for (const name of process.argv.slice(2)) {
  const SRC = `docs/design/skills/japan-v1/raw/${name}-master/`, OUT = `docs/design/skills/japan-v1/raw/${name}-attack-post/`;
  mkdirSync(OUT, { recursive: true });
  const creature = name.replace(/^(shikigami|great)-/, '');
  const ramp = RAMP[creature].map(hex);
  // Frames past the face-consistent part are cut (great Kodama's mouth turns into a frown in frames 8–10).
  const maxFrames = { 'great-kodama': 8 }[name] ?? Infinity;
  for (const f of readdirSync(OUT).filter((x) => /^frame-\d+\.png$/.test(x))) unlinkSync(OUT + f);
  for (const f of readdirSync(SRC).filter((x) => /^frame-\d+\.png$/.test(x)).sort().slice(0, maxFrames)) {
    const { data, info } = await sharp(SRC + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, at = (x, y) => (y * W + x) * 4;
    for (let i = 0; i < data.length; i += 4) {
      if (!data[i + 3]) continue;
      const mn = Math.min(data[i], data[i + 1], data[i + 2]);
      if (mn > 235) { const c = ramp[2]; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; }
      else if (mn > 215 && Math.max(data[i], data[i + 1], data[i + 2]) - mn < 25) { const c = ramp[1]; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; }
    }
    if (creature === 'kodama') {
      // Harsh saturated yellow leaf glow → moss green ramp by luminance (wood theme).
      const MOSS = ['#4a7d22', '#6aa232', '#94c84a', '#bfe07a'].map(hex);
      for (let i = 0; i < data.length; i += 4) { if (!data[i + 3]) continue; const r = data[i], g = data[i + 1], b = data[i + 2]; if (r > 190 && g > 180 && b < 110) { const c = MOSS[Math.min(3, Math.floor(((r + g) / 2 - 180) / 20))] ?? MOSS[3]; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; } }
    }
    if (creature === 'nurikabe') {
      // Red seal blobs sitting on light paper/cloth (most neighbours light): repaint with the paper colour, then draw an
      // abstract ring + ink stroke in their box. Red cracks/eyes elsewhere are untouched (not on paper).
      const red = (x, y) => { const p = at(x, y); return data[p + 3] && data[p] > 140 && data[p + 1] < 100 && data[p + 2] < 100; };
      const light = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const p = at(x, y); return data[p + 3] && data[p] > 170 && Math.min(data[p], data[p + 1], data[p + 2]) > 110; };
      const seen = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (seen[y * W + x] || !red(x, y)) continue;
        const comp = [[x, y]]; seen[y * W + x] = 1;
        for (let i = 0; i < comp.length; i++) { const [cx, cy] = comp[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny * W + nx] && red(nx, ny)) { seen[ny * W + nx] = 1; comp.push([nx, ny]); } } }
        const xs = comp.map((c) => c[0]), ys = comp.map((c) => c[1]);
        const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
        let lightCount = 0, total = 0, sum = [0, 0, 0];
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { if (red(xx, yy)) continue; total++; if (light(xx, yy)) { lightCount++; const p = at(xx, yy); sum[0] += data[p]; sum[1] += data[p + 1]; sum[2] += data[p + 2]; } }
        if (comp.length < 8 || !total || lightCount / total < 0.5) continue;
        const paper = sum.map((v) => Math.round(v / lightCount));
        for (const [cx, cy] of comp) { const p = at(cx, cy); data[p] = paper[0]; data[p + 1] = paper[1]; data[p + 2] = paper[2]; }
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, r = Math.max(2, Math.min(x1 - x0, y1 - y0) / 2 - 1);
        const paint = (px, py, c) => { if (px >= 0 && py >= 0 && px < W && py < H && data[at(px, py) + 3]) { const p = at(px, py); data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; } };
        for (let a = 0; a < 64; a++) paint(Math.round(mx + Math.cos(a / 64 * Math.PI * 2) * r), Math.round(my + Math.sin(a / 64 * Math.PI * 2) * r), SEAL);
        for (let d = -Math.floor(r * 0.6); d <= Math.floor(r * 0.6); d++) paint(Math.round(mx + Math.sin(d * 0.9)), Math.round(my + d), INK);
      }
    }
    await sharp(data, { raw: info }).extend({ top: PAD, bottom: 0, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(OUT + f);
  }
  copyFileSync(SRC + 'jobs.json', OUT + 'jobs.json');
  console.log('shikigami post', name);
}
