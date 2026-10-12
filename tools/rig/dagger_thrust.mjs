// Weapon-class attack (RO-style WeaponAction: a dagger stabs, it does not palm-strike), first class: dagger (keris).
// Builds animate_with_skeleton_v3 requests for the V3 body holding a keris in each hand, one per direction:
// - reference: the idle body with the keris composited in both hands by the runtime rules (grips.json, hand anchors,
//   hand overlay over the hilt), so the generator sees fists already closed on the daggers;
// - poses: the existing 8-frame thrust (tools/rig/action_skeleton.mjs) extended to all 8 directions — E/SE/NE are the
//   horizontal mirror of W/SW/NW with the character's left/right swapped.
// Output: docs/design/character-v3/weapon-class/dagger/<dir>-request.json, <dir>-reference.png, <dir>-poses.json
// Run: node tools/rig/dagger_thrust.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sharp } from './body-eight-lib.mjs';

const ROOT = new URL('../../', import.meta.url);
const p = (rel) => fileURLToPath(new URL(rel, ROOT));
const OUT = 'docs/design/character-v3/weapon-class/dagger-v2/';
await mkdir(p(OUT), { recursive: true });

// Idle joints measured on body-eight-02 (action_skeleton.mjs); LEFT/RIGHT are the character's own sides.
const IDLE = {
  'north-west': { NECK: [62, 49], 'LEFT SHOULDER': [51, 54], 'RIGHT SHOULDER': [75, 54], 'LEFT ELBOW': [49, 66], 'RIGHT ELBOW': [76, 64], 'LEFT ARM': [47, 77], 'RIGHT ARM': [78, 74], 'LEFT HIP': [52, 75], 'RIGHT HIP': [67, 76], 'LEFT KNEE': [54, 90], 'RIGHT KNEE': [70, 90], 'LEFT LEG': [54, 105], 'RIGHT LEG': [71, 102] },
  west: { NECK: [63, 49], 'LEFT SHOULDER': [62, 55], 'RIGHT SHOULDER': [65, 55], 'LEFT ELBOW': [64, 66], 'RIGHT ELBOW': [66, 65], 'LEFT ARM': [65, 78], 'RIGHT ARM': [67, 76], 'LEFT HIP': [61, 76], 'RIGHT HIP': [64, 76], 'LEFT KNEE': [62, 92], 'RIGHT KNEE': [64, 92], 'LEFT LEG': [61, 105], 'RIGHT LEG': [65, 104] },
  north: { NECK: [62, 49], 'LEFT SHOULDER': [50, 55], 'RIGHT SHOULDER': [74, 55], 'LEFT ELBOW': [47, 66], 'RIGHT ELBOW': [78, 66], 'LEFT ARM': [46, 78], 'RIGHT ARM': [79, 78], 'LEFT HIP': [55, 75], 'RIGHT HIP': [69, 75], 'LEFT KNEE': [52, 92], 'RIGHT KNEE': [71, 92], 'LEFT LEG': [51, 108], 'RIGHT LEG': [73, 108] },
  south: { NECK: [62, 49], 'RIGHT SHOULDER': [50, 55], 'LEFT SHOULDER': [74, 55], 'RIGHT ELBOW': [47, 66], 'LEFT ELBOW': [78, 66], 'RIGHT ARM': [46, 78], 'LEFT ARM': [79, 78], 'RIGHT HIP': [55, 75], 'LEFT HIP': [69, 75], 'RIGHT KNEE': [52, 92], 'LEFT KNEE': [71, 92], 'RIGHT LEG': [51, 108], 'LEFT LEG': [73, 108] },
  'south-west': { NECK: [63, 49], 'LEFT SHOULDER': [75, 53], 'RIGHT SHOULDER': [51, 54], 'LEFT ELBOW': [77, 66], 'RIGHT ELBOW': [48, 66], 'LEFT ARM': [77, 78], 'RIGHT ARM': [47, 78], 'LEFT HIP': [71, 76], 'RIGHT HIP': [54, 76], 'LEFT KNEE': [72, 90], 'RIGHT KNEE': [54, 90], 'LEFT LEG': [72, 105], 'RIGHT LEG': [55, 104] },
};
const FACE = {
  'north-west': { v: [-0.75, -0.45], far: 'RIGHT', strike: 'LEFT' }, west: { v: [-1, 0], far: 'RIGHT', strike: 'LEFT' },
  'south-west': { v: [-0.75, 0.45], far: 'LEFT', strike: 'RIGHT' }, north: { v: [0, -1], far: 'BOTH', strike: 'RIGHT' }, south: { v: [0, 1], far: 'NONE', strike: 'RIGHT' },
};
const swap = (k) => k.replace(/^LEFT/, 'TMP').replace(/^RIGHT/, 'LEFT').replace(/^TMP/, 'RIGHT');
const MIRROR_X = 126;
for (const [to, from] of [['east', 'west'], ['south-east', 'south-west'], ['north-east', 'north-west']]) {
  IDLE[to] = Object.fromEntries(Object.entries(IDLE[from]).map(([k, [x, y]]) => [swap(k), [MIRROR_X - x, y]]));
  const f = FACE[from];
  FACE[to] = { v: [-f.v[0], f.v[1]], far: f.far === 'BOTH' || f.far === 'NONE' ? f.far : swap(f.far), strike: swap(f.strike) };
}

const add = (a, v, k = 1) => [a[0] + v[0] * k, a[1] + v[1] * k], mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// v2 (user review 2026-10-12: "crouch, then stab; dual keris alternate"; biomechanics study in
// docs/design/combat/ATTACK_MOTION_STUDY.md). Silat front stance: knees ~35° (hips 6 px lower), lead (left) foot forward
// along the facing, torso leaning in, both blades chambered at the hips, the free hand up as a guard. Kinetic chain: the
// hips turn one frame before the arm. Frames: 0 guard, 1 right chamber, 2 RIGHT STAB (contact), 3 right retract,
// 4 left chamber (hips counter-rotate), 5 LEFT STAB (contact), 6 left retract, 7 guard (= 0, loopable). At high attack
// speed the client can play one half (1-3 or 4-6) per hit, alternating hands.
const UPPER = ['NECK', 'LEFT SHOULDER', 'RIGHT SHOULDER', 'LEFT ELBOW', 'RIGHT ELBOW', 'LEFT ARM', 'RIGHT ARM', 'LEFT HIP', 'RIGHT HIP'];
const norm = (x) => { const l = Math.hypot(x[0], x[1]) || 1; return [x[0] / l, x[1] / l]; };
function guardPose(dir) {
  const idle = IDLE[dir], v = FACE[dir].v, r = [-v[1], v[0]]; // r points to the character's right side
  const j = Object.fromEntries(Object.entries(idle).map(([n, x]) => [n, [...x]]));
  for (const n of UPPER) j[n] = add(j[n], [v[0] * 2, v[1] * 2 + 6]); // sink 6 px, lean 2 px toward the target
  j['LEFT KNEE'] = add(add(idle['LEFT KNEE'], v, 3), r, -1.5); j['RIGHT KNEE'] = add(add(idle['RIGHT KNEE'], v, 1), r, 1.5);
  j['LEFT KNEE'][1] += 3; j['RIGHT KNEE'][1] += 3;
  j['LEFT LEG'] = add(idle['LEFT LEG'], v, 4); j['RIGHT LEG'] = add(idle['RIGHT LEG'], v, -2);
  for (const S of ['LEFT', 'RIGHT']) { // blades chambered at the hips, tips forward
    const hand = add(add(j[`${S} HIP`], v, 5), [0, -3]);
    j[`${S} ARM`] = hand; j[`${S} ELBOW`] = add(mix(j[`${S} SHOULDER`], hand, .5), [0, 3]);
  }
  return j;
}
function thrust(dir, k) {
  const v = FACE[dir].v, r = [-v[1], v[0]], straight = Math.abs(v[0]) < 0.3;
  const j = guardPose(dir), g = guardPose(dir);
  const S = k >= 4 ? 'LEFT' : 'RIGHT', O = S === 'LEFT' ? 'RIGHT' : 'LEFT', side = S === 'RIGHT' ? 1 : -1;
  const phase = k === 0 || k === 7 ? 'guard' : [null, 'chamber', 'stab', 'retract', 'chamber', 'stab', 'retract'][k];
  if (phase === 'guard') return j;
  const turn = phase === 'chamber' ? -2 : phase === 'stab' ? 3 : 1; // striking shoulder back, then driven forward
  const lunge = phase === 'stab' ? 3 : phase === 'retract' ? 1 : 0;
  for (const n of UPPER) j[n] = add(j[n], [v[0] * lunge, v[1] * lunge + (phase === 'stab' ? 1 : 0)]);
  j[`${S} SHOULDER`] = add(j[`${S} SHOULDER`], v, turn); j[`${O} SHOULDER`] = add(j[`${O} SHOULDER`], v, -turn / 2);
  if (phase === 'stab') j['RIGHT LEG'] = add(j['RIGHT LEG'], v, 1); // the rear foot pushes
  const sh = j[`${S} SHOULDER`], chest = add(mix(j['LEFT SHOULDER'], j['RIGHT SHOULDER'], .5), [0, 7]);
  // Toward/away from the camera a straight stab vanishes: angle it ~20° to the striking side.
  const aim = norm(straight ? add(v, r, 0.4 * side) : add(v, [0, 0.25]));
  const reach = add(sh, aim, 17), chamber = add(add(j[`${S} HIP`], v, -2), [0, -2]);
  const hand = phase === 'chamber' ? chamber : phase === 'stab' ? reach : mix(add(g[`${S} ARM`], v, lunge), reach, .35);
  j[`${S} ARM`] = hand; j[`${S} ELBOW`] = phase === 'stab' ? add(sh, aim, 8.5) : add(mix(sh, hand, .5), [0, 3]);
  // Free hand: guard up at the chest on its own side.
  const guardHand = add(add(chest, v, 4), r, -2 * side);
  j[`${O} ARM`] = guardHand; j[`${O} ELBOW`] = add(mix(j[`${O} SHOULDER`], guardHand, .5), add([0, 3], r, -2 * side));
  return j;
}
const headPts = (n, v) => ({ NOSE: add(n, [v[0] * 3, -8 + v[1] * 2]), 'LEFT EYE': add(n, [v[0] * 2 - 1, -10]), 'RIGHT EYE': add(n, [v[0] * 2 + 1, -10]), 'LEFT EAR': add(n, [-4, -9]), 'RIGHT EAR': add(n, [4, -9]) });
const kp = (dir, j) => Object.entries({ ...j, ...headPts(j.NECK, FACE[dir].v) }).map(([label, [x, y]]) => ({
  label, x: +(x / 128).toFixed(4), y: +(y / 128).toFixed(4),
  z_index: (FACE[dir].far === 'BOTH' || label.startsWith(FACE[dir].far)) && /ARM|ELBOW|SHOULDER/.test(label) ? 0 : /ARM|ELBOW/.test(label) ? 3 : 1,
}));

// Reference image: idle body + keris in both hands (south view, upright, grips.json) + hand overlay.
const anchors = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/hand-anchors.json'), 'utf8'));
const grips = JSON.parse(await readFile(p('apps/client/public/assets/equipment/grips.json'), 'utf8')).grips;
const KERIS = { grip: 0.85, scale: 0.6 };
const kerisImg = await readFile(p('apps/client/public/assets/equipment/keris/south.png'));
const km = await sharp(kerisImg).metadata();
const kw = Math.round(km.width * KERIS.scale), kh = Math.round(km.height * KERIS.scale);
const keris = await sharp(kerisImg).resize(kw, kh, { kernel: 'nearest' }).png().toBuffer();
const gx = (grips.keris?.south ?? 0.5) * kw, gy = KERIS.grip * kh;
const fx = { south: 0, 'south-east': 1, east: 1, 'north-east': 1, north: 0, 'north-west': -1, west: -1, 'south-west': -1 };
for (const dir of Object.keys(IDLE)) {
  const e = anchors.actions.idle[dir][0], body = await readFile(p(`apps/client/public/assets/character-v3/body-eight-02/${dir}.png`));
  const hands = await sharp(await readFile(p(`apps/client/public/assets/character-v3/hand-overlay/idle-${dir}.png`))).png().toBuffer();
  const at = (h) => ({ input: keris, left: Math.round(h.x - gx), top: Math.round(h.y - gy) });
  const back = [], front = [];
  for (const [h, sign] of [['main', 1], ['off', -1]]) if (e[h]) ((sign * fx[dir]) >= 0 ? front : back).push(at(e[h]));
  const reference = await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([...back, { input: body, left: 0, top: 0 }, ...front, { input: hands, left: 0, top: 0 }]).png().toBuffer();
  await writeFile(p(`${OUT}${dir}-reference.png`), reference);
  const poses = Array.from({ length: 8 }, (_, k) => thrust(dir, k));
  await writeFile(p(`${OUT}${dir}-poses.json`), JSON.stringify(poses.map((j) => Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v.map((x) => Math.round(x * 10) / 10)])))));
  await writeFile(p(`${OUT}${dir}-request.json`), JSON.stringify({
    description: 'headless body only, ends at a short neck stump with nothing above it; a wavy dark keris dagger gripped in each closed fist, blades pointing forward, knees bent in a low fighting stance; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman at the hip, small amber gourd, charcoal baggy knee shorts, white wraps, brown sandals; no effects, no slash trails',
    // `action` is limited to 100 characters by PixelLab.
    action: 'crouched silat stance, alternating right then left keris stabs', direction: dir, view: 'low top-down',
    first_frame_base64: reference.toString('base64'), first_frame_keypoints: kp(dir, IDLE[dir]), keypoints: poses.map((j) => kp(dir, j)),
    template_id: 'mannequin', no_background: true,
  }));
}
// Stick-figure preview: every pose drawn over the dimmed reference body, to review the motion before any generation.
const ORDER = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const BONES = [['NECK', 'LEFT SHOULDER'], ['NECK', 'RIGHT SHOULDER'], ['LEFT SHOULDER', 'LEFT ELBOW'], ['LEFT ELBOW', 'LEFT ARM'], ['RIGHT SHOULDER', 'RIGHT ELBOW'], ['RIGHT ELBOW', 'RIGHT ARM'],
  ['LEFT SHOULDER', 'LEFT HIP'], ['RIGHT SHOULDER', 'RIGHT HIP'], ['LEFT HIP', 'RIGHT HIP'], ['LEFT HIP', 'LEFT KNEE'], ['LEFT KNEE', 'LEFT LEG'], ['RIGHT HIP', 'RIGHT KNEE'], ['RIGHT KNEE', 'RIGHT LEG']];
const colour = (a, b) => (a + b).includes('LEFT') && !(a + b).includes('RIGHT') ? '#5ab8ff' : (a + b).includes('RIGHT') && !(a + b).includes('LEFT') ? '#ff6a4a' : '#f2e2b8';
const Z = 3, comps = [];
for (const [row, dir] of ORDER.entries()) {
  const ref = await sharp(await readFile(p(`${OUT}${dir}-reference.png`))).resize(128 * Z, 128 * Z, { kernel: 'nearest' }).modulate({ brightness: 0.45 }).png().toBuffer();
  for (let k = 0; k < 8; k++) {
    const j = thrust(dir, k);
    const lines = BONES.map(([a, b]) => `<line x1="${j[a][0] * Z}" y1="${j[a][1] * Z}" x2="${j[b][0] * Z}" y2="${j[b][1] * Z}" stroke="${colour(a, b)}" stroke-width="4" stroke-linecap="round"/>`).join('');
    const tag = k === 2 || k === 5 ? '<text x="8" y="26" font-size="22" fill="#ffd34a">HIT</text>' : '';
    const svg = `<svg width="${128 * Z}" height="${128 * Z}" xmlns="http://www.w3.org/2000/svg">${lines}${tag}<text x="8" y="${128 * Z - 8}" font-size="18" fill="#ffffff">${dir} ${k}</text></svg>`;
    comps.push({ input: ref, left: k * 128 * Z, top: row * 128 * Z }, { input: Buffer.from(svg), left: k * 128 * Z, top: row * 128 * Z });
  }
}
const sheet = await sharp({ create: { width: 8 * 128 * Z, height: 8 * 128 * Z, channels: 4, background: '#1b2522' } }).composite(comps).png().toBuffer();
await sharp(sheet).resize(8 * 128 * Z / 2).png().toFile(p(`${OUT}poses-preview.png`));
console.log(`dagger thrust v2: ${Object.keys(IDLE).length} directions, requests + poses-preview.png (not submitted)`);
