// Publishes a V3 weapon-class attack (docs/design/combat/ATTACK_MOTION_STUDY.md) like publish_action_eight.mjs: specks
// removed, frames ground-locked to the idle baseline, per-frame neck pivot from the neck stump, sheet + manifest
// (action-eight/1) under apps/client/public/assets/character-v3/actions-eight-02/<action>/.
//   attack-dagger: crouched alternating keris stabs (dagger-v2; back views from dagger-v2b), hit frames 2 and 5
//   attack-cast:   point-and-cast for magic weapons (cast-point; empty fist, weapon attached at runtime), hit frame 3
// Usage: node tools/rig/publish_weapon_action.mjs attack-dagger|attack-cast
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { json, save, order, sharp, rgba, hash } from './body-eight-lib.mjs';
import { IDLE } from './v3_pose_lib.mjs';

const action = process.argv[2];
const W = 'docs/design/character-v3/weapon-class/';
const SPECS = {
  'attack-dagger': { fps: 16, name: 'Keris · แทงสลับย่อตัว', hits: [2, 5], source: (d) => (['north', 'north-east', 'north-west'].includes(d) ? `${W}dagger-v2b/raw/` : `${W}dagger-v2/raw/`) },
  'attack-cast': { fps: 16, name: 'Magic weapon · ชี้คทาร่ายเวท', hits: [3], source: () => `${W}cast-point/raw/` },
};
const spec = SPECS[action];
if (!spec) throw Error('usage: attack-dagger|attack-cast');
const pub = `apps/client/public/assets/character-v3/actions-eight-02/${action}/`, bodyPub = 'apps/client/public/assets/character-v3/body-eight-02/';
const body = await json(bodyPub + 'manifest.json');
await mkdir(pub, { recursive: true });
const lowest = (p) => { for (let y = 127; y >= 0; y--) for (let x = 0; x < 128; x++) if (p[(y * 128 + x) * 4 + 3]) return y; throw Error('empty'); };
// The neck comes from the authored skeleton pose (the stump search catches blades held upright by the face), moved like
// the frame by the ground lock; the stump is only a sanity report.
// Neck stump searched in a narrow column around the idle neck, so raised hands beside the chest are ignored.
function stump(p, nx) {
  for (let y = 36; y < 66; y++) {
    const row = (yy) => { const xs = []; for (let x = nx - 7; x <= nx + 7; x++) if (p[(yy * 128 + x) * 4 + 3]) xs.push(x); return xs; };
    const xs = row(y);
    if (xs.length) { const all = [...xs, ...row(y + 1)]; return { top: y, cx: (Math.min(...all) + Math.max(...all)) / 2, width: Math.max(...xs) - Math.min(...xs) + 1 }; }
  }
  throw Error('No neck stump');
}
function despeck(p) {
  const seen = new Uint8Array(128 * 128);
  for (let i = 0; i < 128 * 128; i++) {
    if (seen[i] || !p[i * 4 + 3]) continue;
    const comp = [i], stack = [i]; seen[i] = 1;
    while (stack.length) { const c = stack.pop(), x = c % 128, y = (c - x) / 128; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, n = ny * 128 + nx; if (nx < 0 || ny < 0 || nx > 127 || ny > 127 || seen[n] || !p[n * 4 + 3]) continue; seen[n] = 1; stack.push(n); comp.push(n); } }
    if (comp.length < 8) for (const c of comp) p.fill(0, c * 4, c * 4 + 4);
  }
  return p;
}
const directions = [], cells = [], report = {};
for (const [i, d] of order.entries()) {
  const stillPixels = await rgba(await readFile(bodyPub + d + '.png')), still = body.frames[i], rest = stump(stillPixels, still.neckPivot.x), restY1 = lowest(stillPixels);
  const dx = still.neckPivot.x - rest.cx, dy = still.neckPivot.y - rest.top, frames = []; report[d] = [];
  const poses = await json(spec.source(d).replace(/raw\/$/, '') + d + '-poses.json');
  for (let k = 0; k < 8; k++) {
    const src = despeck(await rgba(await readFile(`${spec.source(d)}${d}-${k}.png`))), shift = restY1 - lowest(src), moved = Buffer.alloc(src.length);
    for (let y = 0; y < 128; y++) { const t = y + shift; if (t >= 0 && t < 128) src.copy(moved, t * 512, y * 512, (y + 1) * 512); }
    const b = await sharp(moved, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer(), s = stump(moved, still.neckPivot.x);
    const pose = poses[k].NECK, neckPivot = { x: Math.round(pose[0] + still.neckPivot.x - IDLE[d].NECK[0]), y: Math.round(pose[1] + still.neckPivot.y - IDLE[d].NECK[1] + shift) };
    if (Math.abs(neckPivot.y - (s.top + dy)) > 4) console.warn(`note: stump ${d}-${k} at y ${s.top + dy}, pose neck ${neckPivot.y}`);
    const url = `/assets/character-v3/actions-eight-02/${action}/${d}-${k}.png`;
    await writeFile('apps/client/public' + url, b);
    frames.push({ url, sha256: hash(b), neckPivot, bodyOrigin: { x: still.bodyOrigin.x, y: lowest(moved) } });
    report[d].push({ ...neckPivot, groundShift: shift }); cells.push({ input: b, left: k * 128, top: i * 128 });
  }
  directions.push({ direction: d, headUrl: still.headUrl, headSha256: still.headSha256, headPivot: still.headPivot, frames });
}
const sheet = await sharp({ create: { width: 8 * 128, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(cells).png().toBuffer();
await writeFile(pub + 'sheet.png', sheet);
const manifest = { version: 'action-eight/1', action, name: spec.name, bodySet: 'body-eight-02', fps: spec.fps, loop: false, hits: spec.hits, directions,
  sheet: { url: `/assets/character-v3/actions-eight-02/${action}/sheet.png`, sha256: hash(sheet), frameWidth: 128, frameHeight: 128 }, visualApproved: false };
await save(pub + 'manifest.json', manifest);
for (const d of order) console.log(d, report[d].map((q) => q.x + ',' + q.y).join(' '));
