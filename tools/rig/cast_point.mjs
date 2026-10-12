// Weapon-class attack, magic weapons (staffs, wand, fan, gohei): "point and cast" (user choice 2026-10-12). One body
// animation for every magic weapon: the V3 body with an EMPTY closed fist; the item's own art is attached at runtime on
// the hand anchors (v3-weapon.ts), so each staff keeps its look. Stance from docs/design/combat/ATTACK_MOTION_STUDY.md,
// lighter than the dagger's: knees ~20° (hips 3 px lower), lead foot forward. The casting hand is the arm on the camera
// side (so the weapon is seen); the other hand rises to the chest in a casting gesture.
// Frames: 0 guard, 1 draw the fist back by the shoulder, 2 thrust forward, 3 CAST (arm straight at shoulder height, the
// bolt leaves the tip), 4 hold, 5 half retract, 6 settle, 7 guard (= 0, loopable). Away from the camera the arm points
// out to the side at shoulder height so it stays readable.
// Run: node tools/rig/cast_point.mjs [--only dir,dir] [--out docs/design/.../cast-point/]
import { mkdir, readFile } from 'node:fs/promises';
import { add, FACE, IDLE, mix, norm, ORDER, p, posePreview, UPPER, writeRequest } from './v3_pose_lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const OUT = arg('--out') ?? 'docs/design/character-v3/weapon-class/cast-point/';
const DIRS = arg('--only')?.split(',') ?? ORDER;
await mkdir(p(OUT), { recursive: true });

function stance(dir) {
  const idle = IDLE[dir], v = FACE[dir].v, r = [-v[1], v[0]];
  const j = Object.fromEntries(Object.entries(idle).map(([n, x]) => [n, [...x]]));
  for (const n of UPPER) j[n] = add(j[n], [v[0] * 1, v[1] * 1 + 3]);
  j['LEFT KNEE'] = add(add(idle['LEFT KNEE'], v, 2), r, -1); j['RIGHT KNEE'] = add(idle['RIGHT KNEE'], r, 1);
  j['LEFT KNEE'][1] += 1.5; j['RIGHT KNEE'][1] += 1.5;
  j['LEFT LEG'] = add(idle['LEFT LEG'], v, 3); j['RIGHT LEG'] = add(idle['RIGHT LEG'], v, -1);
  return j;
}
export function cast(dir, k) {
  const v = FACE[dir].v, r = [-v[1], v[0]], away = v[1] < -0.3, straight = Math.abs(v[0]) < 0.3;
  const S = FACE[dir].near, O = S === 'LEFT' ? 'RIGHT' : 'LEFT', side = S === 'RIGHT' ? 1 : -1;
  const j = stance(dir), idle = IDLE[dir];
  const ext = [0, 0, 0.7, 1, 1, 0.5, 0.15, 0][k], draw = [0, 1, 0.3, 0, 0, 0, 0, 0][k], gesture = [0, 0.7, 1, 1, 1, 0.8, 0.4, 0][k];
  for (const n of UPPER) j[n] = add(j[n], [v[0] * ext * 2, v[1] * ext * 2]); // lean into the cast
  j[`${S} SHOULDER`] = add(j[`${S} SHOULDER`], v, ext * 2 - draw);
  const sh = j[`${S} SHOULDER`];
  const out = Math.sign(r[0] * side) || side;
  // Toward the camera the arm angles well out to the side (0.8) so the point reads; away from it, out sideways.
  const aim = away ? norm([out + v[0] * 0.35, 0.1]) : norm(straight ? add(v, r, 0.8 * side) : add(v, [0, 0.12]));
  const rest = add(idle[`${S} ARM`], [v[0], v[1] + 3]), back = add(add(sh, v, -4), [0, 6]), point = add(sh, aim, 18);
  const hand = ext > 0 ? mix(rest, point, ext) : mix(rest, back, draw);
  j[`${S} ARM`] = hand;
  j[`${S} ELBOW`] = ext > 0.6 ? add(sh, aim, 9) : add(mix(sh, hand, .5), [-r[0] * side * 2, 3]);
  // Casting hand gesture: the free hand rises to the chest, palm toward the target.
  const chest = add(mix(j['LEFT SHOULDER'], j['RIGHT SHOULDER'], .5), [0, 7]);
  const mudra = add(add(chest, v, 4), r, -2 * side);
  j[`${O} ARM`] = mix(add(idle[`${O} ARM`], [0, 3]), mudra, gesture);
  j[`${O} ELBOW`] = mix(add(idle[`${O} ELBOW`], [0, 3]), add(mix(j[`${O} SHOULDER`], mudra, .5), add([0, 3], r, -2 * side)), gesture);
  return j;
}

const DESCRIPTION = 'headless body only, ends at a short neck stump with nothing above it; empty hands, the casting hand closed in a fist as if gripping an invisible staff; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman at the hip, small amber gourd, charcoal baggy knee shorts, white wraps, brown sandals; no staff drawn, no effects';
for (const dir of DIRS) {
  const reference = await readFile(p(`apps/client/public/assets/character-v3/body-eight-02/${dir}.png`));
  const away = FACE[dir].v[1] < -0.3;
  await writeRequest(OUT, dir, reference, Array.from({ length: 8 }, (_, k) => cast(dir, k)),
    DESCRIPTION + (away ? '; seen from behind, the casting arm points out to the side' : ''),
    'spell cast: thrust the closed fist forward at shoulder height, other hand raised at the chest');
}
await posePreview(OUT, DIRS, cast, [3]);
console.log(`cast point: ${DIRS.length} direction(s) → ${OUT} (requests + poses-preview.png; not submitted)`);
