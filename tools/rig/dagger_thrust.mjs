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
const OUT = 'docs/design/character-v3/weapon-class/dagger/';
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
// 0 ready, 1-2 draw the keris back to the hip, 3-4 step in and stab straight out along the facing, 5 hold, 6-7 recover.
function thrust(dir, k) {
  const idle = IDLE[dir], face = FACE[dir], S = face.strike, O = S === 'LEFT' ? 'RIGHT' : 'LEFT', v = face.v;
  const j = Object.fromEntries(Object.entries(idle).map(([n, x]) => [n, [...x]]));
  const w = [0, .6, 1, .4, 0, 0, .3, 0][k], t = [0, 0, 0, .6, 1, 1, .5, 0][k], lunge = t * 2.5;
  for (const n of ['NECK', 'LEFT SHOULDER', 'RIGHT SHOULDER', 'LEFT ELBOW', 'RIGHT ELBOW', 'LEFT ARM', 'RIGHT ARM', 'LEFT HIP', 'RIGHT HIP']) j[n] = add(j[n], [v[0] * lunge, v[1] * lunge + w]);
  const sh = j[`${S} SHOULDER`], hip = j[`${S} HIP`], chest = add(mix(j['LEFT SHOULDER'], j['RIGHT SHOULDER'], .5), [0, 8]);
  const straight = Math.abs(v[0]) < 0.3;
  const back = straight ? add(hip, [0, -3]) : add(hip, v, -4);
  const reach = straight ? add(chest, [sh[0] < j.NECK[0] ? -3 : 3, v[1] > 0 ? 4 : -2]) : add(sh, [v[0], v[1] + 0.3], 18);
  const elbow = straight ? add(mix(sh, reach, .5), [sh[0] < j.NECK[0] ? -3 : 3, 2]) : add(sh, [v[0], v[1] + 0.3], 9);
  j[`${S} ARM`] = mix(mix(idle[`${S} ARM`], back, w), reach, t);
  j[`${S} ELBOW`] = mix(mix(idle[`${S} ELBOW`], add(hip, [-v[0] * 5, -5]), w), elbow, t);
  // Off hand: the second keris held low and ready in front of the chest.
  const guard = add(chest, v, 2);
  j[`${O} ARM`] = mix(idle[`${O} ARM`], guard, Math.max(w, t) * .6);
  j[`${O} ELBOW`] = mix(idle[`${O} ELBOW`], add(j[`${O} SHOULDER`], [0, 9]), Math.max(w, t) * .4);
  j[`${O} LEG`] = add(idle[`${O} LEG`], v, 3 * t); j[`${O} KNEE`] = add(idle[`${O} KNEE`], v, 2 * t);
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
    description: 'headless body only, ends at a short neck stump with nothing above it; a wavy dark keris dagger gripped in each closed fist, blades pointing forward; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman at the hip, small amber gourd, charcoal baggy knee shorts, white wraps, brown sandals; no effects, no slash trails',
    action: `quick forward stab with the ${FACE[dir].strike.toLowerCase()} hand keris, the other keris held ready`, direction: dir, view: 'low top-down',
    first_frame_base64: reference.toString('base64'), first_frame_keypoints: kp(dir, IDLE[dir]), keypoints: poses.map((j) => kp(dir, j)),
    template_id: 'mannequin', no_background: true,
  }));
}
console.log(`dagger thrust requests: ${Object.keys(IDLE).length} directions`);
