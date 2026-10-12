// Shared pieces for V3 weapon-class attack generation (animate_with_skeleton_v3): idle joints and facing data for all
// 8 directions, skeleton maths, keypoint export, request writing and the stick-figure preview sheet.
// Used by tools/rig/dagger_thrust.mjs and tools/rig/cast_point.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sharp } from './body-eight-lib.mjs';

export const ROOT = new URL('../../', import.meta.url);
export const p = (rel) => fileURLToPath(new URL(rel, ROOT));
export const ORDER = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];

// Idle joints measured on body-eight-02 (action_skeleton.mjs); LEFT/RIGHT are the character's own sides.
export const IDLE = {
  'north-west': { NECK: [62, 49], 'LEFT SHOULDER': [51, 54], 'RIGHT SHOULDER': [75, 54], 'LEFT ELBOW': [49, 66], 'RIGHT ELBOW': [76, 64], 'LEFT ARM': [47, 77], 'RIGHT ARM': [78, 74], 'LEFT HIP': [52, 75], 'RIGHT HIP': [67, 76], 'LEFT KNEE': [54, 90], 'RIGHT KNEE': [70, 90], 'LEFT LEG': [54, 105], 'RIGHT LEG': [71, 102] },
  west: { NECK: [63, 49], 'LEFT SHOULDER': [62, 55], 'RIGHT SHOULDER': [65, 55], 'LEFT ELBOW': [64, 66], 'RIGHT ELBOW': [66, 65], 'LEFT ARM': [65, 78], 'RIGHT ARM': [67, 76], 'LEFT HIP': [61, 76], 'RIGHT HIP': [64, 76], 'LEFT KNEE': [62, 92], 'RIGHT KNEE': [64, 92], 'LEFT LEG': [61, 105], 'RIGHT LEG': [65, 104] },
  north: { NECK: [62, 49], 'LEFT SHOULDER': [50, 55], 'RIGHT SHOULDER': [74, 55], 'LEFT ELBOW': [47, 66], 'RIGHT ELBOW': [78, 66], 'LEFT ARM': [46, 78], 'RIGHT ARM': [79, 78], 'LEFT HIP': [55, 75], 'RIGHT HIP': [69, 75], 'LEFT KNEE': [52, 92], 'RIGHT KNEE': [71, 92], 'LEFT LEG': [51, 108], 'RIGHT LEG': [73, 108] },
  south: { NECK: [62, 49], 'RIGHT SHOULDER': [50, 55], 'LEFT SHOULDER': [74, 55], 'RIGHT ELBOW': [47, 66], 'LEFT ELBOW': [78, 66], 'RIGHT ARM': [46, 78], 'LEFT ARM': [79, 78], 'RIGHT HIP': [55, 75], 'LEFT HIP': [69, 75], 'RIGHT KNEE': [52, 92], 'LEFT KNEE': [71, 92], 'RIGHT LEG': [51, 108], 'LEFT LEG': [73, 108] },
  'south-west': { NECK: [63, 49], 'LEFT SHOULDER': [75, 53], 'RIGHT SHOULDER': [51, 54], 'LEFT ELBOW': [77, 66], 'RIGHT ELBOW': [48, 66], 'LEFT ARM': [77, 78], 'RIGHT ARM': [47, 78], 'LEFT HIP': [71, 76], 'RIGHT HIP': [54, 76], 'LEFT KNEE': [72, 90], 'RIGHT KNEE': [54, 90], 'LEFT LEG': [72, 105], 'RIGHT LEG': [55, 104] },
};
// v: screen facing vector; far: arm drawn behind the torso; near: the arm on the camera side (the one that reads best).
export const FACE = {
  'north-west': { v: [-0.75, -0.45], far: 'RIGHT', near: 'LEFT' }, west: { v: [-1, 0], far: 'RIGHT', near: 'LEFT' },
  'south-west': { v: [-0.75, 0.45], far: 'LEFT', near: 'RIGHT' }, north: { v: [0, -1], far: 'BOTH', near: 'RIGHT' }, south: { v: [0, 1], far: 'NONE', near: 'RIGHT' },
};
const swap = (k) => k.replace(/^LEFT/, 'TMP').replace(/^RIGHT/, 'LEFT').replace(/^TMP/, 'RIGHT');
// E/SE/NE are the horizontal mirror of W/SW/NW with the character's left/right swapped.
for (const [to, from] of [['east', 'west'], ['south-east', 'south-west'], ['north-east', 'north-west']]) {
  IDLE[to] = Object.fromEntries(Object.entries(IDLE[from]).map(([k, [x, y]]) => [swap(k), [126 - x, y]]));
  const f = FACE[from];
  FACE[to] = { v: [-f.v[0], f.v[1]], far: f.far === 'BOTH' || f.far === 'NONE' ? f.far : swap(f.far), near: swap(f.near) };
}

export const add = (a, v, k = 1) => [a[0] + v[0] * k, a[1] + v[1] * k];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const norm = (x) => { const l = Math.hypot(x[0], x[1]) || 1; return [x[0] / l, x[1] / l]; };
export const UPPER = ['NECK', 'LEFT SHOULDER', 'RIGHT SHOULDER', 'LEFT ELBOW', 'RIGHT ELBOW', 'LEFT ARM', 'RIGHT ARM', 'LEFT HIP', 'RIGHT HIP'];
export const copyIdle = (dir) => Object.fromEntries(Object.entries(IDLE[dir]).map(([n, x]) => [n, [...x]]));

const headPts = (n, v) => ({ NOSE: add(n, [v[0] * 3, -8 + v[1] * 2]), 'LEFT EYE': add(n, [v[0] * 2 - 1, -10]), 'RIGHT EYE': add(n, [v[0] * 2 + 1, -10]), 'LEFT EAR': add(n, [-4, -9]), 'RIGHT EAR': add(n, [4, -9]) });
export const kp = (dir, j) => Object.entries({ ...j, ...headPts(j.NECK, FACE[dir].v) }).map(([label, [x, y]]) => ({
  label, x: +(x / 128).toFixed(4), y: +(y / 128).toFixed(4),
  z_index: (FACE[dir].far === 'BOTH' || label.startsWith(FACE[dir].far)) && /ARM|ELBOW|SHOULDER/.test(label) ? 0 : /ARM|ELBOW/.test(label) ? 3 : 1,
}));

/** Writes <dir>-reference.png, <dir>-poses.json and the animate_with_skeleton_v3 <dir>-request.json. `action` ≤ 100 chars. */
export async function writeRequest(out, dir, reference, poses, description, action) {
  if (action.length > 100) throw Error(`action too long (${action.length})`);
  await writeFile(p(`${out}${dir}-reference.png`), reference);
  await writeFile(p(`${out}${dir}-poses.json`), JSON.stringify(poses.map((j) => Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v.map((x) => Math.round(x * 10) / 10)])))));
  await writeFile(p(`${out}${dir}-request.json`), JSON.stringify({
    description, action, direction: dir, view: 'low top-down',
    first_frame_base64: reference.toString('base64'), first_frame_keypoints: kp(dir, IDLE[dir]), keypoints: poses.map((j) => kp(dir, j)),
    template_id: 'mannequin', no_background: true,
  }));
}

/** Stick figures of every pose over the dimmed reference (review the motion before any generation). */
export async function posePreview(out, dirs, pose, hits = []) {
  const BONES = [['NECK', 'LEFT SHOULDER'], ['NECK', 'RIGHT SHOULDER'], ['LEFT SHOULDER', 'LEFT ELBOW'], ['LEFT ELBOW', 'LEFT ARM'], ['RIGHT SHOULDER', 'RIGHT ELBOW'], ['RIGHT ELBOW', 'RIGHT ARM'],
    ['LEFT SHOULDER', 'LEFT HIP'], ['RIGHT SHOULDER', 'RIGHT HIP'], ['LEFT HIP', 'RIGHT HIP'], ['LEFT HIP', 'LEFT KNEE'], ['LEFT KNEE', 'LEFT LEG'], ['RIGHT HIP', 'RIGHT KNEE'], ['RIGHT KNEE', 'RIGHT LEG']];
  const colour = (a, b) => (a + b).includes('LEFT') && !(a + b).includes('RIGHT') ? '#5ab8ff' : (a + b).includes('RIGHT') && !(a + b).includes('LEFT') ? '#ff6a4a' : '#f2e2b8';
  const Z = 3, comps = [];
  for (const [row, dir] of dirs.entries()) {
    const ref = await sharp(await readFile(p(`${out}${dir}-reference.png`))).resize(128 * Z, 128 * Z, { kernel: 'nearest' }).modulate({ brightness: 0.45 }).png().toBuffer();
    for (let k = 0; k < 8; k++) {
      const j = pose(dir, k);
      const lines = BONES.map(([a, b]) => `<line x1="${j[a][0] * Z}" y1="${j[a][1] * Z}" x2="${j[b][0] * Z}" y2="${j[b][1] * Z}" stroke="${colour(a, b)}" stroke-width="4" stroke-linecap="round"/>`).join('');
      const tag = hits.includes(k) ? '<text x="8" y="26" font-size="22" fill="#ffd34a">HIT</text>' : '';
      const svg = `<svg width="${128 * Z}" height="${128 * Z}" xmlns="http://www.w3.org/2000/svg">${lines}${tag}<text x="8" y="${128 * Z - 8}" font-size="18" fill="#ffffff">${dir} ${k}</text></svg>`;
      comps.push({ input: ref, left: k * 128 * Z, top: row * 128 * Z }, { input: Buffer.from(svg), left: k * 128 * Z, top: row * 128 * Z });
    }
  }
  const sheet = await sharp({ create: { width: 8 * 128 * Z, height: dirs.length * 128 * Z, channels: 4, background: '#1b2522' } }).composite(comps).png().toBuffer();
  await sharp(sheet).resize(8 * 128 * Z / 2).png().toFile(p(`${out}poses-preview.png`));
}
