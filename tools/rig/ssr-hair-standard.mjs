// Hair Layer Standard v1 (docs/design/ssr/HAIR_STANDARD.md) — the ONLY rules used to turn a reference head and a hair
// generation into SSR layers, shared by ssr-convert (build) and ssr-validate (checks). All buffers: 128×128 RGBA.
export const N = 128, PX = N * N;
const at = (b, k) => k * 4;
export const opaque = (b, k) => b[at(b, k) + 3] > 0;
export const warm = (b, k) => opaque(b, k) && b[at(b, k)] - b[at(b, k) + 2] >= 45;       // skin, lips, warm outlines
export const cool = (b, k) => opaque(b, k) && b[at(b, k)] - b[at(b, k) + 2] < 45;        // hair, eye whites, grey lines
// Ornament red (cords, ribbons): strongly saturated red only — warm skin tones and brown outlines never qualify.
export const red = (b, k) => { const i = at(b, k); return opaque(b, k) && b[i] > 140 && b[i] - Math.max(b[i + 1], b[i + 2]) > 90; };
export const lum = (b, k) => { const i = at(b, k); return 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]; };
const nb4 = (k) => { const x = k % N, o = []; if (x > 0) o.push(k - 1); if (x < N - 1) o.push(k + 1); if (k >= N) o.push(k - N); if (k < PX - N) o.push(k + N); return o; };

/** 4-connected components of a boolean mask. */
export function components(mask) {
  const seen = new Uint8Array(PX), out = [];
  for (let k = 0; k < PX; k++) {
    if (!mask[k] || seen[k]) continue;
    const comp = [k], st = [k]; seen[k] = 1;
    while (st.length) { const c = st.pop(); for (const n of nb4(c)) if (mask[n] && !seen[n]) { seen[n] = 1; st.push(n); comp.push(n); } }
    out.push(comp);
  }
  return out;
}

/** Reference head analysis: old hair = cool 4-connected masses ≥ 25 px; everything else is the locked face/ears/neck. */
/** Directions that show a face; their eye line must always be found (never treated as a back view). */
export const FACE_VIEWS = ['south', 'south-west', 'west', 'east', 'south-east'];
export function analyseReference(ref, direction) {
  let top = N, bottom = 0;
  for (let k = 0; k < PX; k++) if (opaque(ref, k)) { top = Math.min(top, k / N | 0); bottom = Math.max(bottom, k / N | 0); }
  // Interior = enclosed left and right by warm skin within 6 px on the same row (face, not ears/edges).
  const enclosed = (k) => { const x = k % N, y = k / N | 0; let l = false, r = false; for (let t = 1; t <= 6; t++) { if (x - t >= 0 && warm(ref, y * N + x - t)) l = true; if (x + t < N && warm(ref, y * N + x + t)) r = true; } return l && r; };
  let skinTop = N; for (let k = 0; k < PX; k++) if (warm(ref, k)) { skinTop = Math.min(skinTop, k / N | 0); }
  // Eye line from the eye whites (pale, neutral, enclosed by skin). Face views fall back to the head proportion so face
  // protection never switches off (SE whites peak at 170).
  let eyeTop = N;
  if (FACE_VIEWS.includes(direction)) {
    // Eyes sit in the lower half of the head; pale fringe tips on the forehead above that are not eyes.
    const eyeFrom = Math.max(skinTop + 2, top + Math.round((bottom - top) * 0.55));
    for (let k = eyeFrom * N; k < PX && eyeTop === N; k++) { const i = k * 4; if (opaque(ref, k) && !warm(ref, k) && enclosed(k) && Math.min(ref[i], ref[i + 1], ref[i + 2]) > 140) eyeTop = (k / N | 0) - 1; }
    if (eyeTop === N || eyeTop > top + Math.round((bottom - top) * 0.75)) eyeTop = top + Math.round((bottom - top) * 0.62);
  }
  // Old hair = cool 4-connected masses >= 25 px outside the guarded eye rows, except masses holding an eye white (big
  // anime eyes are 25+ px cool blobs). Old locks hanging into the face band ARE hair (left behind they showed grey).
  const eyeWhite = (k) => { const i = k * 4; return opaque(ref, k) && !warm(ref, k) && enclosed(k) && Math.min(ref[i], ref[i + 1], ref[i + 2]) > 140 && (k / N | 0) >= top + Math.round((bottom - top) * 0.55); };
  const hair = new Uint8Array(PX);
  // Guard only the eye rows (from 1 row above the eye line down, skin-enclosed): a fringe tip touching an eye must still
  // count as hair (guarding whole eye-touching masses left a silver strip under recoloured fringes).
  const eyeGuard = (k) => eyeTop < N && (k / N | 0) >= eyeTop - 1 && enclosed(k);
  for (const c of components(Array.from({ length: PX }, (_, k) => cool(ref, k) && !eyeGuard(k)))) if (c.length >= 25 && !c.some(eyeWhite)) for (const k of c) hair[k] = 1;
  // Hair outline left on the head edge: cool, non-enclosed pixels touching old hair above the eye line are hair too
  // (kept in the base they stayed lavender under recoloured hair).
  for (let pass = 0; pass < 2; pass++) for (let k = 0; k < PX; k++) { if (hair[k] || !cool(ref, k) || enclosed(k) || (eyeTop < N && (k / N | 0) > eyeTop + 1)) continue; if (nb4(k).some((n) => hair[n])) hair[k] = 1; }
  // Stray hair tips: cool pixels with no skin within 3 px are hair, not face.
  for (let k = 0; k < PX; k++) { if (hair[k] || !cool(ref, k)) continue; const x = k % N, y = k / N | 0; let near = false; for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && warm(ref, yy * N + xx)) { near = true; break; } } if (!near) hair[k] = 1; }
  const skin = new Uint8Array(PX); for (let k = 0; k < PX; k++) skin[k] = opaque(ref, k) && !hair[k] ? 1 : 0;
  const interior = new Uint8Array(PX); for (let k = 0; k < PX; k++) interior[k] = skin[k] && enclosed(k) ? 1 : 0;
  // Brows: cool skin-enclosed pixels above the eyes (or in the top half of the face when no eye line); they follow the
  // hair palette like Ragnarok heads, so no grey band sits between recoloured hair and skin.
  const brow = new Uint8Array(PX), browLimit = eyeTop < N ? eyeTop + 1 : top + Math.round((bottom - top) * 0.6);
  for (let k = 0; k < PX; k++) if (skin[k] && cool(ref, k) && enclosed(k) && (k / N | 0) <= browLimit && !eyeWhite(k) && lum(ref, k) < 150) brow[k] = 1;
  return { hair, skin, interior, top, bottom, eyeTop, brow };
}

/**
 * Builds the hair layers of one style/direction from a generation drawn on the reference head.
 * Rules: H1 hair = cool pixels; H2 no hair over interior face skin from the brow line (eyeTop−1) down; H3 drop fragments
 * < 6 px and any piece lying wholly at/below the brow band that does not reach above it (stray brows, eye lines);
 * H4 red cord/ornament pixels touching hair, above the brow band only (never irises/lips), go to the untinted accent layer;
 * H5b inside the style's own mask, its forehead skin (above the eyes, inside the reference silhouette) is kept; H5 every other generated pixel is
 * discarded (skin and features always come from the reference); H6 holes enclosed by head pixels are filled.
 */
export function buildHair(gen, ref, info, rampOf, ownMask = null) {
  const brow = info.eyeTop - 1, band = info.eyeTop - 3;
  const cand = new Uint8Array(PX);
  for (let k = 0; k < PX; k++) if (cool(gen, k) && !((k / N | 0) >= brow && info.interior[k])) cand[k] = 1;
  for (const c of components(cand)) if (c.length < 6 || c.every((k) => (k / N | 0) >= band)) for (const k of c) cand[k] = 0;
  // Accents never sit on or beside reference skin (ears, face): those would be re-drawn ears or cheeks.
  const nearSkin = (k) => { const x = k % N, y = k / N | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && info.skin[yy * N + xx]) return true; } return false; };
  const accent = new Uint8Array(PX);
  for (let pass = 0; pass < 4; pass++) for (let k = 0; k < PX; k++) if (!cand[k] && !accent[k] && (k / N | 0) < band && red(gen, k) && !nearSkin(k) && nb4(k).some((n) => cand[n] || accent[n])) accent[k] = 1;
  const ramp = Buffer.alloc(PX * 4), fixed = Buffer.alloc(PX * 4);
  for (let k = 0; k < PX; k++) {
    if (cand[k]) { ramp[k * 4] = rampOf(lum(gen, k)) * 32 + 16; ramp[k * 4 + 3] = 255; }
    else if (accent[k]) gen.copy(fixed, k * 4, k * 4, k * 4 + 4);
  }
  // H5b: inside the style's own generation mask the generation is ONE coherent drawing made against the locked face
  // (fringe, forehead, brows). Keep its forehead skin there — only inside the reference head silhouette and above the
  // eye line, so no extra ears/faces can appear. Without this the reference brows showed through gaps in the fringe.
  if (ownMask) for (let k = 0; k < PX; k++) if (ownMask[k] && !cand[k] && !accent[k] && warm(gen, k) && opaque(ref, k) && (k / N | 0) < info.eyeTop - 1) gen.copy(fixed, k * 4, k * 4, k * 4 + 4);
  // H6: transparent pixels enclosed by (reference skin ∪ hair ∪ accent) are holes; fill from neighbours.
  const solid = (k) => info.skin[k] || ramp[k * 4 + 3] || fixed[k * 4 + 3];
  const outside = new Uint8Array(PX), st = [];
  for (let k = 0; k < PX; k++) { const x = k % N, y = k / N | 0; if ((x === 0 || y === 0 || x === N - 1 || y === N - 1) && !solid(k)) { outside[k] = 1; st.push(k); } }
  while (st.length) { const c = st.pop(); for (const n of nb4(c)) if (!outside[n] && !solid(n)) { outside[n] = 1; st.push(n); } }
  let filled = 0;
  for (let pass = 0; pass < 8; pass++) for (let k = 0; k < PX; k++) {
    if (solid(k) || outside[k]) continue;
    const votes = {}; let skinNb = null;
    let accNb = null;
    for (const n of nb4(k)) { if (ramp[n * 4 + 3]) votes[ramp[n * 4]] = (votes[ramp[n * 4]] ?? 0) + 1; else if (info.skin[n]) skinNb = n; else if (fixed[n * 4 + 3]) accNb = n; }
    const best = Object.entries(votes).sort((p, q) => q[1] - p[1])[0];
    if (best) { ramp[k * 4] = +best[0]; ramp[k * 4 + 3] = 255; filled++; }
    else if (skinNb !== null) { ref.copy(fixed, k * 4, skinNb * 4, skinNb * 4 + 4); filled++; }
    else if (accNb !== null) { fixed.copy(fixed, k * 4, accNb * 4, accNb * 4 + 4); filled++; }
  }
  return { ramp, fixed, filled };
}

/** Reference-skin base layer shared by every hairstyle in one direction (face, eyes, ears, neck; no scalp; no brows). */
export function skinBase(ref, info) {
  const o = Buffer.alloc(PX * 4); for (let k = 0; k < PX; k++) if (info.skin[k] && !info.brow[k]) ref.copy(o, k * 4, k * 4, k * 4 + 4); return o;
}
/** Brow layer as hair-ramp indices (recoloured with the hair palette). */
export function browRamp(ref, info, rampOf) {
  const o = Buffer.alloc(PX * 4); for (let k = 0; k < PX; k++) if (info.brow[k]) { o[k * 4] = rampOf(lum(ref, k)) * 32 + 16; o[k * 4 + 3] = 255; } return o;
}

/**
 * H7 back-view tips: a generation cut by the mask leaves a straight horizontal hair bottom. In back views turn every
 * straight run (>= 4 columns ending on the same row) into hanging strand tips that fall 1–5 px onto the back, tapering
 * from the bottom shade to the darkest step. Procedural, deterministic; reviewed visually.
 */
export function backTips(ramp) {
  const bottomOf = (x) => { for (let y = N - 1; y >= 0; y--) if (ramp[(y * N + x) * 4 + 3]) return y; return -1; };
  const bottoms = Array.from({ length: N }, (_, x) => bottomOf(x));
  const LEN = [2, 4, 5, 3, 1, 3, 5, 4, 2, 4, 3, 5]; let added = 0;
  for (let x = 0; x < N;) {
    const b = bottoms[x]; if (b < 0) { x++; continue; }
    let e = x; while (e + 1 < N && bottoms[e + 1] === b) e++;
    if (e - x + 1 >= 4) for (let c = x + 1; c < e; c++) {           // keep the run's outer columns as the silhouette edge
      const len = LEN[(c - x) % LEN.length], src = ramp[(b * N + c) * 4];
      for (let t = 1; t <= len && b + t < N; t++) {
        const k = ((b + t) * N + c) * 4, step = Math.max(0, Math.floor(src / 32) - Math.ceil((t / len) * 3));
        ramp[k] = (t === len ? 0 : step) * 32 + 16; ramp[k + 3] = 255; added++;
      }
    }
    x = e + 1;
  }
  return added;
}

// V1 volume cap (user-approved 2026-10-10, "head too big for the body"): hair may extend at most TOP px above and SIDE px
// beside the reference head silhouette (plus `keep`, e.g. a back view's nape extension). Cut edges are re-outlined with the
// darkest ramp step. Returns the number of removed pixels.
export const VOLUME = { top: 4, side: 3 };
export function volumeTrim(ramp, fixed, ref, keep = null, { top, side } = VOLUME) {
  const env = new Uint8Array(PX);
  for (let k = 0; k < PX; k++) {
    if (!opaque(ref, k)) continue;
    const x = k % N, y = (k / N) | 0;
    for (let dy = -top; dy <= 0; dy++) for (let dx = -side; dx <= side; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N) env[yy * N + xx] = 1; }
  }
  const before = Buffer.from(ramp); let removed = 0;
  for (let k = 0; k < PX; k++) {
    if (env[k] || keep?.[k]) continue;
    if (ramp[k * 4 + 3]) { ramp.fill(0, k * 4, k * 4 + 4); removed++; }
    if (fixed[k * 4 + 3]) fixed.fill(0, k * 4, k * 4 + 4);
  }
  for (let k = 0; k < PX; k++) {
    if (!ramp[k * 4 + 3]) continue;
    const x = k % N;
    if ([k - 1, k + 1, k - N, k + N].some(n => n >= 0 && n < PX && Math.abs(n % N - x) <= 1 && !ramp[n * 4 + 3] && before[n * 4 + 3])) ramp[k * 4] = 16;
  }
  return removed;
}

// Tone lock for regenerated views of an existing style: remap the ramp steps so their distribution (quantiles) matches the
// reference hair of the same direction. Keeps one style from looking lighter from behind than from the front.
export function matchTone(ramp, ref, info, rampOf) {
  const target = [], src = [];
  for (let k = 0; k < PX; k++) { if (info.hair[k]) target.push(rampOf(lum(ref, k))); if (ramp[k * 4 + 3]) src.push(ramp[k * 4] >> 5); }
  if (!target.length || !src.length) return;
  target.sort((a, b) => a - b); const counts = new Array(8).fill(0); for (const v of src) counts[v]++;
  const map = []; let acc = 0;
  for (let i = 0; i < 8; i++) { const mid = (acc + counts[i] / 2) / src.length; map[i] = target[Math.min(target.length - 1, Math.floor(mid * target.length))]; acc += counts[i]; }
  for (let k = 0; k < PX; k++) if (ramp[k * 4 + 3]) ramp[k * 4] = map[ramp[k * 4] >> 5] * 32 + 16;
}
