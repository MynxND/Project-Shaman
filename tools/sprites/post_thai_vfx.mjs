// Generic free post-pass for Thai release frames (no generation). PixelLab animations tend to wash highlights to flat
// white, which the art bible forbids; this maps near-white pixels onto the Thailand theme (crimson + purple) by
// luminance, keeping their alpha. Also reports the centre of the crimson rings (anchor for ground effects).
// Input raw/<skill>/frame-NN.png → output raw/<skill>-post/frame-NN.png (+ jobs.json).
// --fill-cores: dark pixels enclosed by a bright glow (e.g. the dark dot in a soul flame, which reads as an eye) become
// the bright core colour.
// --clear-white: large flat white blobs (a "space for the character" drawn as a white silhouette) become transparent.
// --seed-detail: washed-out pixels take the seed pixel at the same place (restores detail lost in the animation).
// --shields-to-fur: wood/iron shield discs on spirit wolves become pale fur. --drop-flecks: tiny white specks become transparent.
// Usage: node tools/sprites/post_thai_vfx.mjs <skill> [--fill-cores] [--clear-white] [--seed-detail]
const SET = process.env.VFX_SET ?? 'thailand-v1'; // nation asset set, e.g. VFX_SET=indonesia-v1
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';

const skill = process.argv[2]; if (!skill) throw Error('skill id required');
const SRC = `docs/design/skills/${SET}/raw/${skill}/`, OUT = `docs/design/skills/${SET}/raw/${skill}-post/`;
mkdirSync(OUT, { recursive: true });
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
// Pale end of each nation's theme (never pure white): Japan washi off-white, Thailand lilac/rose-violet, Indonesia bone-white incense smoke, Russia snow/ice.
const PALE = ({ 'norway-v1': ['#a8b8c4', '#c4d2dc', '#dae6ee', '#eaf2f6'], 'japan-v1': ['#b8ae98', '#cfc5ad', '#e2d8c0', '#eee5cf'], 'indonesia-v1': ['#8e8a7e', '#aaa496', '#c4bca8', '#d8cfb8'], 'russia-v1': ['#9fb6c4', '#bcd0dc', '#d4e2ea', '#e6eff4'] }[SET] ?? ['#9a6ab8', '#b88ad0', '#d2a8e4', '#e4c2f0']).map(hex);
let ringBox = null;
for (const f of readdirSync(SRC).filter((x) => /^frame-\d+\.png$/.test(x)).sort()) {
  const { data, info } = await sharp(SRC + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (process.argv.includes('--seed-detail')) {
    // Washed-out pixels (bright, unsaturated) take the seed's pixel at the same spot where the seed has one: keeps the
    // drawing's detail while the animation still moves everything else.
    const seed = (await sharp(SRC + 'seed.png').ensureAlpha().raw().toBuffer()).valueOf();
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3] || !seed[p + 3]) continue;
      const mx = Math.max(data[p], data[p + 1], data[p + 2]), mn = Math.min(data[p], data[p + 1], data[p + 2]);
      if (mx > 185 && mx - mn < 50) seed.copy(data, p, p, p + 3);
    }
  }
  if (process.argv.includes('--retint')) {
    // Off-theme saturated reds/oranges become poison green and bright yellows antique gold (Indonesia theme), by luminance.
    const GREEN = ['#1e3a12', '#2f5a18', '#4a7d22', '#6aa232', '#94c84a'].map(hex), GOLD = ['#6e5222', '#9a7432', '#c09a4a', '#d6b46c'].map(hex);
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
      if (sat < 0.55 || mx < 90) continue;
      let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const ramp = h >= 345 || h < 35 ? GREEN : h >= 35 && h < 70 ? GOLD : null;
      if (ramp) { const c = ramp[Math.min(ramp.length - 1, Math.floor(L * ramp.length * 1.3))]; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; }
    }
  }
  if (process.argv.includes('--to-crimson')) {
    // Off-palette blues/purples and bright washed whites (read as lightning) become the blood-red/ember ramp by luminance.
    const CR = ['#3a0c10', '#6a141a', '#a01f24', '#d23a2e', '#f07a3a'].map(hex);
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0; if (mx !== mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; }
      const blue = mx - mn > 30 && h >= 170 && h <= 320, white = mx > 190 && mx - mn < 60, yellow = mx > 200 && h >= 40 && h < 70;
      if (!blue && !white && !yellow) continue;
      const c = CR[Math.min(CR.length - 1, Math.floor(((r + g + b) / 3 / 255) * CR.length))];
      data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2];
    }
  }
  if (process.argv.includes('--to-ice')) {
    // Saturated electric blues (neon look) become the muted ice ramp by luminance (Russia tank palette).
    const ICE = ['#2c4a5e', '#3e6f8e', '#7fb8d6', '#bfe3f2', '#e6eff4'].map(hex);
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      if (!(b > 150 && b - r > 60)) continue;
      const c = ICE[Math.min(ICE.length - 1, Math.floor(((r + g + b) / 3 / 255) * ICE.length))];
      data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2];
    }
  }
  if (process.argv.includes('--mist-bottom')) {
    // Red splashes in the lower part of the frame read as blood: turn them into a dusky grey-red mist (arc above untouched).
    // Only connected red blobs lying wholly in the bottom 30% change; anything reaching higher (the arc) keeps its colour.
    const MIST = ['#3a2a2c', '#5a4648', '#7a6466', '#9a8486'].map(hex), Wd = info.width, Hd = info.height;
    const red = (k) => { const p = k * 4; const r = data[p], g = data[p + 1], b = data[p + 2]; return data[p + 3] && r === Math.max(r, g, b) && r - Math.min(g, b) >= 40; };
    // The arc's horizontal band is measured at mid height (only the arc is there); red in the bottom 30% outside that band (+12 px, never wider than the landing point ±16 px) is splash.
    const y0 = Math.floor(Hd * 0.7); let ax0 = Wd, ax1 = -1;
    const ym = Math.floor(Hd * 0.5); // only the arc reaches this high
    for (let y = ym - 4; y < ym + 4; y++) for (let x = 0; x < Wd; x++) if (data[(y * Wd + x) * 4 + 3]) { ax0 = Math.min(ax0, x); ax1 = Math.max(ax1, x); }
    for (let y = y0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
      const k = y * Wd + x; if (!red(k) || (x >= Math.max(ax0 - 12, Wd / 2 - 16) && x <= Math.min(ax1 + 12, Wd / 2 + 14))) continue;
      const p = k * 4, m = MIST[Math.min(MIST.length - 1, Math.floor(((data[p] + data[p + 1] + data[p + 2]) / 3 / 255) * MIST.length * 1.6))];
      data[p] = m[0]; data[p + 1] = m[1]; data[p + 2] = m[2];
    }
  }
  if (process.argv.includes('--violet-flash')) {
    // A strike flash that washes the whole creature pale (reads as a white silhouette) → ghost-fire violet ramp by luminance.
    const VI = ['#5a2a9a', '#7a3ec8', '#9a5ae6', '#b98af2', '#d4b4fa'].map(hex);
    // Only frames where most of the creature is washed pale (the flash itself); normal frames keep their ivory bones.
    let opaque = 0, pale = 0; for (let k = 0; k < info.width * info.height; k++) { const p = k * 4; if (!data[p + 3]) continue; opaque++; const mn = Math.min(data[p], data[p + 1], data[p + 2]), mx = Math.max(data[p], data[p + 1], data[p + 2]); if (mn > 165 && mx - mn < 70) pale++; }
    if (opaque && pale / opaque > 0.3) for (let k = 0; k < info.width * info.height; k++) { const p = k * 4; if (!data[p + 3]) continue; const mn = Math.min(data[p], data[p + 1], data[p + 2]), mx = Math.max(data[p], data[p + 1], data[p + 2]); if (mn > 165 && mx - mn < 70) { const c = VI[Math.min(4, Math.floor((mn - 165) / 18))]; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; } }
  }
  if (process.argv.includes('--lilac-core')) {
    // Washed white cores of purple ghost-fire → pale lilac ramp (never pure white), before the nation pale ramp runs.
    const LI = ['#b89ae0', '#ccb2ee', '#dccaf6', '#ead9fb'].map(hex);
    for (let k = 0; k < info.width * info.height; k++) { const p = k * 4; if (!data[p + 3]) continue; const mn = Math.min(data[p], data[p + 1], data[p + 2]), mx = Math.max(data[p], data[p + 1], data[p + 2]); if (mx > 205 && mx - mn < 60) { const c = LI[Math.min(3, Math.floor((mn - 200) / 14))] ?? LI[0]; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; } }
  }
  if (process.argv.includes('--clear-edge-white')) {
    // A seed that came back with an opaque white background: near-white pixels connected to the canvas edge → transparent.
    const Wd = info.width, Hd = info.height, seen = new Uint8Array(Wd * Hd), q = [];
    const pale = (k) => { const p = k * 4; return data[p + 3] && Math.min(data[p], data[p + 1], data[p + 2]) > 228; };
    for (let x = 0; x < Wd; x++) for (const y of [0, Hd - 1]) { const k = y * Wd + x; if (pale(k)) { seen[k] = 1; q.push(k); } }
    for (let y = 0; y < Hd; y++) for (const x of [0, Wd - 1]) { const k = y * Wd + x; if (!seen[k] && pale(k)) { seen[k] = 1; q.push(k); } }
    for (let i = 0; i < q.length; i++) { const c = q[i], x = c % Wd; data[c * 4 + 3] = 0; for (const nb of [c - 1, c + 1, c - Wd, c + Wd]) if (nb >= 0 && nb < Wd * Hd && Math.abs((nb % Wd) - x) <= 1 && !seen[nb] && pale(nb)) { seen[nb] = 1; q.push(nb); } }
  }
  if (process.argv.includes('--cyan-to-green')) {
    // Electric cyan flashes (read as lightning, off the Indonesia theme) become the poison-green ramp by luminance.
    const PG = ['#1e3a12', '#2f5a18', '#4a7d22', '#6aa232', '#94c84a'].map(hex);
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      if (!(g > 150 && b > 150 && r < 140 && Math.min(g, b) - r > 50)) continue;
      const c = PG[Math.min(PG.length - 1, Math.floor(((r + g + b) / 3 / 255) * PG.length * 1.2))]; data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2];
    }
  }
  if (process.argv.includes('--fox-to-flame')) {
    // Cream fox bodies (with faces) inside fox-fire read cute: large cream blobs touching flame pixels become flame
    // (by luminance), then dark eye/outline specks enclosed by flame become flame too. Small paper talismans stay.
    const FL = ['#7a1a10', '#b8321a', '#e0602a', '#f39a3c', '#f8c860'].map(hex), Wd = info.width, Hd = info.height;
    const cream = (k) => { const p = k * 4; const r = data[p], g = data[p + 1], b = data[p + 2]; return data[p + 3] && r > 185 && g > 160 && b > 120 && r - b < 90 && Math.max(r, g, b) - Math.min(r, g, b) < 95; };
    const flame = (k) => { const p = k * 4; const r = data[p], g = data[p + 1], b = data[p + 2]; return data[p + 3] && r > 170 && r - b > 90 && g < 200; };
    const seen = new Uint8Array(Wd * Hd);
    for (let k = 0; k < Wd * Hd; k++) {
      if (seen[k] || !cream(k)) continue;
      const comp = [k]; seen[k] = 1;
      for (let i = 0; i < comp.length; i++) { const c = comp[i], x = c % Wd; for (const n of [c - 1, c + 1, c - Wd, c + Wd]) if (n >= 0 && n < Wd * Hd && Math.abs((n % Wd) - x) <= 1 && !seen[n] && cream(n)) { seen[n] = 1; comp.push(n); } }
      if (comp.length < 18) continue;
      let near = 0; for (const c of comp) for (const n of [c - 2, c + 2, c - 2 * Wd, c + 2 * Wd]) if (n >= 0 && n < Wd * Hd && flame(n)) near++;
      if (near < 4) continue;
      for (const c of comp) { const p = c * 4, L = (data[p] + data[p + 1] + data[p + 2]) / 3 / 255, f = FL[Math.min(FL.length - 1, 2 + Math.floor((L - 0.7) * 8))] ?? FL[2]; data[p] = f[0]; data[p + 1] = f[1]; data[p + 2] = f[2]; }
    }
    for (let pass = 0; pass < 2; pass++) for (let k = Wd; k < Wd * (Hd - 1); k++) {
      const p = k * 4; if (!data[p + 3] || (data[p] + data[p + 1] + data[p + 2]) / 3 > 90) continue;
      if ([k - 1, k + 1, k - Wd, k + Wd].filter(flame).length >= 3) { const f = FL[2]; data[p] = f[0]; data[p + 1] = f[1]; data[p + 2] = f[2]; }
    }
  }
  if (process.argv.includes('--clean-pillar')) {
    // Paper shapes inside a vertical light pillar (a crane reads like a star): foreign pixels in the pillar's inner
    // columns take that column's typical pillar colour. Columns count as pillar where most upper rows are warm light.
    const Wd = info.width, Hd = info.height, top = Math.floor(Hd * 0.7);
    const warm = (p) => data[p + 3] && data[p] > 200 && data[p + 1] > 140 && data[p + 2] < 170;
    const cols = [];
    for (let x = 0; x < Wd; x++) { let n = 0; for (let y = 0; y < top; y++) if (warm((y * Wd + x) * 4)) n++; if (n > top * 0.6) cols.push(x); }
    if (cols.length > 8) {
      const x0 = cols[0] + 3, x1 = cols[cols.length - 1] - 3;
      for (let x = x0; x <= x1; x++) {
        const pool = []; for (let y = 0; y < top; y++) { const p = (y * Wd + x) * 4; if (warm(p)) pool.push([data[p], data[p + 1], data[p + 2]]); }
        if (!pool.length) continue;
        pool.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2])); const med = pool[pool.length >> 1];
        for (let y = 0; y < Math.floor(Hd * 0.9); y++) { const p = (y * Wd + x) * 4; if (data[p + 3] && !warm(p)) { data[p] = med[0]; data[p + 1] = med[1]; data[p + 2] = med[2]; } else if (data[p + 3] && data[p] - data[p + 2] > 150 && data[p + 1] < 120) { data[p] = med[0]; data[p + 1] = med[1]; data[p + 2] = med[2]; } }
      }
    }
  }
  if (process.argv.includes('--shields-to-fur')) {
    // Round wood/iron shields PixelLab drew on the spirit wolves' sides become the wolves' pale fur (luminance kept).
    // Large connected blobs of brown wood or dark iron count; the war horn at the far left stays.
    const FUR = ['#5e6c78', '#8492a0', '#aab8c4', '#cdd8e0', '#e6eff4'].map(hex), Wd = info.width, Hd = info.height;
    const shield = (k) => { const p = k * 4; if (!data[p + 3]) return false; const r = data[p], g = data[p + 1], b = data[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const brown = r === mx && r > g && g > b && mx > 40 && mx < 200 && mx - mn > 25 && r - g < 90; const iron = mx < 150 && mx - mn < 30; return brown || iron; };
    const seen = new Uint8Array(Wd * Hd);
    for (let k = 0; k < Wd * Hd; k++) {
      if (seen[k] || !shield(k)) continue;
      const comp = [k]; seen[k] = 1;
      for (let i = 0; i < comp.length; i++) { const c = comp[i], x = c % Wd; for (const n of [c - 1, c + 1, c - Wd, c + Wd]) if (n >= 0 && n < Wd * Hd && Math.abs((n % Wd) - x) <= 1 && !seen[n] && shield(n)) { seen[n] = 1; comp.push(n); } }
      const cx = comp.reduce((s, c) => s + (c % Wd), 0) / comp.length;
      if (comp.length < 50 || cx < Wd * 0.22) continue;
      for (const c of comp) { const p = c * 4, L = (data[p] + data[p + 1] + data[p + 2]) / 3 / 255, f = L > 0.3 ? FUR[3] : FUR[2]; // two flat tones so no disc, rim or cross survives
        data[p] = f[0]; data[p + 1] = f[1]; data[p + 2] = f[2]; }
    }
  }
  if (process.argv.includes('--drop-flecks')) {
    // Small isolated near-white specks (stray sparks that read as lightning) become transparent.
    const Wd = info.width, Hd = info.height, pale = (k) => { const p = k * 4; const mx = Math.max(data[p], data[p + 1], data[p + 2]), mn = Math.min(data[p], data[p + 1], data[p + 2]); return data[p + 3] && mx > 160 && !(data[p] === mx && data[p] - Math.min(data[p + 1], data[p + 2]) > 60); };
    const seen = new Uint8Array(Wd * Hd);
    for (let k = 0; k < Wd * Hd; k++) {
      if (seen[k] || !pale(k)) continue;
      const comp = [k]; seen[k] = 1;
      for (let i = 0; i < comp.length; i++) { const c = comp[i], x = c % Wd; for (const n of [c - 1, c + 1, c - Wd, c + Wd]) if (n >= 0 && n < Wd * Hd && Math.abs((n % Wd) - x) <= 1 && !seen[n] && pale(n)) { seen[n] = 1; comp.push(n); } }
      if (comp.length <= 60) for (const c of comp) data[c * 4 + 3] = 0;
    }
  }
  if (process.argv.includes('--clear-white')) {
    // Large flat near-white blobs are PixelLab's "empty space for the character" drawn as a white silhouette: clear them.
    const Wd = info.width, Hd = info.height, white = (k) => { const p = k * 4; const mx = Math.max(data[p], data[p + 1], data[p + 2]), mn = Math.min(data[p], data[p + 1], data[p + 2]); return data[p + 3] && mx > 200 && mx - mn < 45; };
    const seen = new Uint8Array(Wd * Hd);
    for (let k = 0; k < Wd * Hd; k++) {
      if (seen[k] || !white(k)) continue;
      const comp = [k]; seen[k] = 1;
      for (let i = 0; i < comp.length; i++) { const c = comp[i], x = c % Wd; for (const n of [c - 1, c + 1, c - Wd, c + Wd]) if (n >= 0 && n < Wd * Hd && Math.abs((n % Wd) - x) <= 1 && !seen[n] && white(n)) { seen[n] = 1; comp.push(n); } }
      if (comp.length <= 40) continue;
      // Only the blob over the centre is the character space; other washed-out shapes (cloth) become old parchment.
      const cx = comp.reduce((s, c) => s + (c % Wd), 0) / comp.length, cy = comp.reduce((s, c) => s + ((c / Wd) | 0), 0) / comp.length;
      const central = Math.abs(cx - Wd / 2) < Wd * 0.18 && Math.abs(cy - Hd * 0.55) < Hd * 0.25;
      const keep = SET === 'russia-v1' ? [0xe6, 0xef, 0xf4] : [0xd8, 0xc4, 0x9e]; // Russia: snow; others: old parchment cloth
      for (const c of comp) { if (central) data[c * 4 + 3] = 0; else { data[c * 4] = keep[0]; data[c * 4 + 1] = keep[1]; data[c * 4 + 2] = keep[2]; } }
    }
  }
  for (let k = 0; k < info.width * info.height; k++) {
    const i = k * 4; if (!data[i + 3]) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx > 215 && mx - mn < 40) { const c = PALE[Math.max(0, Math.min(PALE.length - 1, Math.floor(((r + g + b) / 3 - 200) / 12)))]; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; }
    // Ring centre from the first frame's strong crimson pixels.
    if (f === 'frame-00.png' && r > 150 && g < 70 && b < 90) { const x = k % info.width, y = (k / info.width) | 0; ringBox ??= { x0: x, x1: x, y0: y, y1: y }; ringBox.x0 = Math.min(ringBox.x0, x); ringBox.x1 = Math.max(ringBox.x1, x); ringBox.y0 = Math.min(ringBox.y0, y); ringBox.y1 = Math.max(ringBox.y1, y); }
  }
  if (process.argv.includes('--fill-cores')) {
    const L = (k) => (data[k * 4] + data[k * 4 + 1] + data[k * 4 + 2]) / 3, Wd = info.width;
    for (let pass = 0; pass < 4; pass++) { const fill = [];
    for (let k = 0; k < Wd * info.height; k++) {
      if (!data[k * 4 + 3] || L(k) > 110) continue;
      const x = k % Wd, bright = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => [1, 2].some((d) => { const xx = x + dx * d, yy = ((k / Wd) | 0) + dy * d; return xx >= 0 && xx < Wd && yy >= 0 && yy < info.height && L(yy * Wd + xx) > 150; })).length;
      if (bright >= 3) fill.push(k);
    }
    for (const k of fill) { const c = PALE[3]; data[k * 4] = c[0]; data[k * 4 + 1] = c[1]; data[k * 4 + 2] = c[2]; } }
  }
  await sharp(data, { raw: info }).png().toFile(OUT + f);
}
copyFileSync(SRC + 'jobs.json', OUT + 'jobs.json');
console.log(skill, 'post done; crimson ring centre', ringBox && { x: Math.round((ringBox.x0 + ringBox.x1) / 2), y: Math.round((ringBox.y0 + ringBox.y1) / 2) });
