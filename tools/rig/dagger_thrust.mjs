// Weapon-class attack, dagger (keris): animate_with_skeleton_v3 requests for the V3 body holding a keris in each hand.
// RO-style WeaponAction (a dagger stabs, it does not palm-strike) with the stance from
// docs/design/combat/ATTACK_MOTION_STUDY.md: silat front stance, knees ~35° (hips 6 px lower), lead (left) foot forward,
// torso leaning in, both blades chambered at the hips, the free hand up as a guard; the hips turn one frame before the
// arm. Frames: 0 guard, 1 right chamber, 2 RIGHT STAB, 3 right retract, 4 left chamber (hips counter-rotate),
// 5 LEFT STAB, 6 left retract, 7 guard (= 0, loopable). The client may play one half (1-3 / 4-6) per hit at high speed.
// Reference: the idle body with the keris composited in both fists by the runtime rules (grips, anchors, hand overlay).
// Back views (v3, user review): a stab away from the camera read as arms raised overhead, so it goes out to the side at
// shoulder height instead, keeping the blade beside the silhouette.
// Run: node tools/rig/dagger_thrust.mjs [--only north,north-east] [--out docs/design/.../dagger-v2b/]
import { mkdir, readFile } from 'node:fs/promises';
import { sharp } from './body-eight-lib.mjs';
import { add, FACE, IDLE, mix, norm, ORDER, p, posePreview, UPPER, writeRequest } from './v3_pose_lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const OUT = arg('--out') ?? 'docs/design/character-v3/weapon-class/dagger-v2/';
const DIRS = arg('--only')?.split(',') ?? ORDER;
await mkdir(p(OUT), { recursive: true });

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
export function thrust(dir, k) {
  const v = FACE[dir].v, r = [-v[1], v[0]], straight = Math.abs(v[0]) < 0.3, away = v[1] < -0.3;
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
  // Toward the camera a straight stab vanishes: angle it ~20° to the striking side. Away from the camera: out to the
  // side at shoulder height (a raised arm reads as a salute), slightly forward.
  const out = Math.sign(r[0] * side) || side; // screen side of the striking arm
  const aim = away ? norm([out + v[0] * 0.35, 0.15]) : norm(straight ? add(v, r, 0.4 * side) : add(v, [0, 0.25]));
  const reachLen = away ? 15 : 17;
  const reach = add(sh, aim, reachLen), chamber = add(add(j[`${S} HIP`], v, -2), [0, -2]);
  const hand = phase === 'chamber' ? chamber : phase === 'stab' ? reach : mix(add(g[`${S} ARM`], v, lunge), reach, .35);
  j[`${S} ARM`] = hand; j[`${S} ELBOW`] = phase === 'stab' ? add(sh, aim, reachLen / 2) : add(mix(sh, hand, .5), [0, 3]);
  // Free hand: guard up at the chest on its own side.
  const guardHand = add(add(chest, v, 4), r, -2 * side);
  j[`${O} ARM`] = guardHand; j[`${O} ELBOW`] = add(mix(j[`${O} SHOULDER`], guardHand, .5), add([0, 3], r, -2 * side));
  return j;
}

// Reference: idle body + keris in both fists (south view, upright, grips.json) + hand overlay over the hilts.
const anchors = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/hand-anchors.json'), 'utf8'));
const grips = JSON.parse(await readFile(p('apps/client/public/assets/equipment/grips.json'), 'utf8')).grips;
const KERIS = { grip: 0.85, scale: 0.6 };
const kerisImg = await readFile(p('apps/client/public/assets/equipment/keris/south.png'));
const km = await sharp(kerisImg).metadata();
const kw = Math.round(km.width * KERIS.scale), kh = Math.round(km.height * KERIS.scale);
const keris = await sharp(kerisImg).resize(kw, kh, { kernel: 'nearest' }).png().toBuffer();
const gx = (grips.keris?.south ?? 0.5) * kw, gy = KERIS.grip * kh;
const fx = { south: 0, 'south-east': 1, east: 1, 'north-east': 1, north: 0, 'north-west': -1, west: -1, 'south-west': -1 };
const DESCRIPTION = 'headless body only, ends at a short neck stump with nothing above it; a wavy dark keris dagger gripped in each closed fist, blades pointing forward, knees bent in a low fighting stance; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman at the hip, small amber gourd, charcoal baggy knee shorts, white wraps, brown sandals; no effects, no slash trails';
for (const dir of DIRS) {
  const e = anchors.actions.idle[dir][0], body = await readFile(p(`apps/client/public/assets/character-v3/body-eight-02/${dir}.png`));
  const hands = await readFile(p(`apps/client/public/assets/character-v3/hand-overlay/idle-${dir}.png`));
  const at = (h) => ({ input: keris, left: Math.round(h.x - gx), top: Math.round(h.y - gy) });
  const back = [], front = [];
  for (const [h, sign] of [['main', 1], ['off', -1]]) if (e[h]) ((sign * fx[dir]) >= 0 ? front : back).push(at(e[h]));
  const handsFrame = await sharp(hands).extract({ left: 0, top: 0, width: 128, height: 128 }).png().toBuffer();
  const reference = await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([...back, { input: body, left: 0, top: 0 }, ...front, { input: handsFrame, left: 0, top: 0 }]).png().toBuffer();
  const away = FACE[dir].v[1] < -0.3;
  await writeRequest(OUT, dir, reference, Array.from({ length: 8 }, (_, k) => thrust(dir, k)),
    DESCRIPTION + (away ? '; seen from behind, both keris stay visible beside the body' : ''),
    away ? 'crouched stance, alternating side stabs, keris blades out beside the body' : 'crouched silat stance, alternating right then left keris stabs');
}
await posePreview(OUT, DIRS, thrust, [2, 5]);
console.log(`dagger thrust: ${DIRS.length} direction(s) → ${OUT} (requests + poses-preview.png; not submitted)`);
