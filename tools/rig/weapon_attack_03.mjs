// Original body-only weapon poses. PixelLab supplies body pixels; existing item art stays attached in the client.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { add, mix, FACE, IDLE, ORDER, UPPER, p, writeRequest, posePreview } from './v3_pose_lib.mjs';
export const SPECS = {
  'attack-bow': { name: 'Ullr · ง้างและปล่อยธนู', hits: [4], action: 'extend one empty fist forward, pull other empty fist to cheek then behind ear, relax' },
  'attack-knife': { name: 'Mor Phhee · ฟันมีดเฉียง', hits: [3], action: 'empty fist from opposite shoulder sweeps diagonally to hip then returns; other hand guards chest' },
  'attack-axe-shield': { name: 'Juggernaut · ฟันขวานกันโล่', hits: [3], action: 'raise empty fist above shoulder then swing downward; other empty hand stays in front of chest' },
  'attack-axe-twohand': { name: 'Taiga · ฟันขวานสองมือ', hits: [4], action: 'both empty fists lift together overhead then swing down together and recover; bent knees' },
  // Magic weapons, one distinct cast per branch (ATTACK_MOTION_STUDY.md per-class table).
  'attack-cast-staff': { name: 'Achan · แทงไม้เท้าสองมือ', hits: [3], action: 'both empty fists together draw back to the hip then jab forward at chest height and return' },
  'attack-cast-rune': { name: 'Rune Seer · กระแทกไม้เท้าวาดรูน', hits: [4], action: 'one empty fist lifts high then drives straight down in front; other open palm pushes forward' },
  'attack-cast-wand': { name: 'Santet · สะบัดไม้กายสิทธิ์', hits: [3], action: 'empty fist cocks beside the ear then flicks forward at chest height; other fist yanks back to hip' },
  'attack-cast-fan': { name: 'Onmyoji · สะบัดพัดกวาด', hits: [3], action: 'empty fist from opposite shoulder sweeps wide across at shoulder height; two fingers raised at face' },
  'attack-cast-gohei': { name: 'Miko · โบกโกเฮชำระ', hits: [3], action: 'raised empty fist waves left, right, left in front of chest; other palm upright at chest' },
};
export const folder = a => `docs/design/character-v3/weapon-class/${a}-04/`;
export function pose(action, dir, k) {
  const j = structuredClone(IDLE[dir]), v = FACE[dir].v;
  const S = FACE[dir].near, O = S === 'RIGHT' ? 'LEFT' : 'RIGHT';
  const side = Math.sign(j[`${S} SHOULDER`][0] - j.NECK[0]) || -1;
  const effort = [0, .3, .6, .9, 1, .7, .3, 0][k];
  const sink = action === 'attack-axe-twohand' ? 5 : 3;
  for (const n of UPPER) j[n] = add(j[n], [v[0] * effort * 2, sink + v[1] * effort]);
  for (const s of ['LEFT', 'RIGHT']) {
    const sign = s === 'LEFT' ? -1 : 1;
    j[`${s} LEG`][0] += sign * (action === 'attack-axe-twohand' ? 4 : 2);
    j[`${s} KNEE`][0] += sign * 3; j[`${s} KNEE`][1] += sink / 2;
  }
  const neck = j.NECK, chest = add(neck, [0, 13]);
  const guard = add(chest, [side * 14, 7]);
  const high = add(neck, [side * 13, -9]);
  const low = add(chest, [v[0] * 15 + side * 9, 25 + v[1] * 5]);
  let hand, other, angle;
  if (action === 'attack-bow') {
    // Bow hand is S (camera-side); draw fist travels to the opposite side of the neck.
    const aim = [Math.abs(v[0]) < .3 ? side * 17 : v[0] * 23, v[1] * 7];
    hand = add(neck, add(aim, [0, 9]));
    const draw = [0, .2, .6, 1, 1, .85, .3, 0][k];
    other = mix(add(hand, [-v[0] * 3, 5]), add(neck, [-side * (k === 5 ? 12 : 7), 2]), draw);
    angle = 0;
  } else if (action === 'attack-knife') {
    const chamber = add(neck, [-side * 6, 7]), follow = add(chest, [side * 23, 22]);
    hand = [guard, chamber, mix(chamber, guard, .35), follow, low, mix(low, guard, .3), mix(low, guard, .8), guard][k];
    other = add(chest, [-side * 7, 0]);
    angle = [0, -side * .8, -side * .5, side * 1.9, side * 2.4, side * 1.5, side * .4, 0][k];
  } else if (action === 'attack-axe-shield') {
    hand = [guard, high, high, low, add(low, [0, 3]), mix(low, guard, .35), mix(low, guard, .8), guard][k];
    other = add(chest, [-side * 8 + v[0] * 5, 5]);
    angle = [side * .25, -side * .6, -side * .7, side * 2, side * 2.3, side * 1.5, side * .5, side * .25][k];
  } else if (action.startsWith('attack-cast-')) {
    // Forward on screen: the facing's horizontal side, or the camera-side arm when facing straight toward/away.
    const fwd = Math.abs(v[0]) < .3 ? side : Math.sign(v[0]);
    const reach = (x, y) => add(chest, [Math.abs(v[0]) < .3 ? fwd * x * .8 : v[0] * x, v[1] * x * .35 + y]);
    if (action === 'attack-cast-staff') {
      const ready = reach(8, 4), back = reach(-2, 8), jab = reach(20, -3);
      hand = [ready, back, mix(back, jab, .6), jab, add(jab, [0, 1]), mix(jab, ready, .5), mix(jab, ready, .85), ready][k];
      angle = fwd * [.5, .3, 1.1, 1.4, 1.4, 1, .7, .5][k];
      other = add(hand, [-Math.sin(angle) * 9, Math.cos(angle) * 9]);
    } else if (action === 'attack-cast-rune') {
      const rest = add(guard, [0, 4]), up = add(neck, [side * 10, -12]), plant = reach(12, 6);
      hand = [rest, mix(rest, up, .6), up, mix(up, plant, .6), plant, plant, mix(plant, rest, .5), rest][k];
      // The planted staff leans outward so its upper shaft clears the face.
      angle = fwd * [0, -.2, -.3, .25, .35, .35, .2, 0][k];
      other = mix(add(chest, [-side * 7, 4]), reach(16, -4), [0, 0, .3, .8, 1, 1, .5, 0][k]);
    } else if (action === 'attack-cast-wand') {
      const ready = reach(6, 2), cock = add(neck, [-fwd * 3 + side * 6, -6]), flick = reach(19, -4);
      hand = [ready, cock, mix(cock, flick, .55), flick, add(flick, [0, 3]), mix(flick, ready, .5), mix(flick, ready, .85), ready][k];
      angle = fwd * [.3, -.6, .6, 1.6, 1.8, 1, .5, .3][k];
      const hip = add(chest, [-fwd * 6, 16]);
      other = mix(add(chest, [-side * 7, 2]), hip, [0, 0, .2, .5, 1, .8, .3, 0][k]);
    } else if (action === 'attack-cast-fan') {
      const ready = reach(6, 4), chamber = add(neck, [-fwd * 9, 3]), sweep = reach(21, -6), follow = reach(14, 8);
      hand = [ready, chamber, mix(chamber, sweep, .5), sweep, follow, mix(follow, ready, .5), mix(follow, ready, .85), ready][k];
      angle = fwd * [.2, -1.2, .2, 1.4, 2, 1.2, .5, .2][k];
      other = mix(add(chest, [-side * 7, 2]), add(neck, [fwd * 5, 1]), [0, .6, 1, 1, 1, .8, .4, 0][k]);
    } else {
      // Sweep across the body (perpendicular to the facing): a side view reads it as a high-low wave.
      const across = [-v[1], v[0]], centre = reach(9, -5), left = add(add(centre, across, -10), [0, -3]), right = add(add(centre, across, 10), [0, -3]);
      hand = [centre, left, mix(left, right, .5), right, mix(right, left, .5), left, mix(left, centre, .6), centre][k];
      angle = [0, -.9, 0, .9, 0, -.9, -.3, 0][k];
      other = add(chest, [-side * 2, 3]);
    }
  } else {
    hand = [guard, mix(guard, high, .6), high, high, low, add(low, [0, 4]), mix(low, guard, .5), guard][k];
    angle = [side * .6, -side * .3, -side * .6, -side * .6, side * 2.2, side * 2.4, side, side * .6][k];
    // The second hand is on the same shaft, 9 native pixels below the top grip.
    other = add(hand, [-Math.sin(angle) * 9, Math.cos(angle) * 9]);
  }
  j[`${S} ARM`] = hand; j[`${O} ARM`] = other;
  for (const s of [S, O]) j[`${s} ELBOW`] = add(mix(j[`${s} SHOULDER`], j[`${s} ARM`], .5), [s === S ? side * 3 : -side * 3, 4]);
  return { joints: j, hand: S === 'RIGHT' ? 'main' : 'off', angle };
}
const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]) && args.length) {
  const actions = args[0] === 'all' ? Object.keys(SPECS) : [args[0]];
  const dirs = args[1]?.split(',') ?? ORDER;
  for (const a of actions) {
    const spec = SPECS[a]; if (!spec) throw Error('unknown action');
    const out = folder(a); await mkdir(p(out), { recursive: true });
    for (const d of dirs) {
      const frames = Array.from({ length: 8 }, (_, k) => pose(a, d, k));
      await writeRequest(out, d, await readFile(p(`apps/client/public/assets/character-v3/body-eight-02/${d}.png`)), frames.map(f => f.joints),
        'headless body ending at short neck stump, nothing above neck; empty closed fists, NO weapons, NO effects; off-white short-sleeved shirt, crossed brown straps, crimson sash, yellow paper talisman, amber gourd, charcoal knee shorts, white wraps, brown sandals; preserve costume and pixel palette', spec.action);
      await writeFile(p(`${out}${d}-attachments.json`), JSON.stringify(frames.map(f => ({ hand: f.hand, angle: f.angle })), null, 2));
    }
    await posePreview(out, dirs, (d, k) => pose(a, d, k).joints, spec.hits);
    console.log(a, dirs.join(','), 'requests prepared');
  }
}
