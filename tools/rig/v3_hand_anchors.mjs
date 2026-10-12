// Hand anchors for the Character V3 body (body-eight-02 idle, walk-eight-02, actions-eight-02 attack/cast), so held
// weapons can ride the hands. The rig has no hand joints, so hands are found per frame: the body frames are headless
// and pixel art uses a fixed palette, so the skin palette is read from the neck stump of the idle frames and every
// skin island away from the neck and legs is a hand/forearm candidate. The character's right hand (main hand) is the
// candidate furthest toward the facing's right side; the left hand (off hand: shield, second keris) the opposite one.
// Frames where detection is wrong are fixed in docs/design/character-v3/hand-anchors-overrides.json.
// Output: apps/client/public/assets/character-v3/hand-anchors.json + docs/design/character-v3/hand-anchors-review.png
// Run: node tools/rig/v3_hand_anchors.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sharp } from './body-eight-lib.mjs';
import { FACE as POSE_FACE } from './v3_pose_lib.mjs';

const ROOT = new URL('../../', import.meta.url);
const PUB = new URL('apps/client/public', ROOT);
const at = (u) => new URL(u.replace(/^\//, ''), PUB.href + '/');
const json = async (u) => JSON.parse(await readFile(u, 'utf8'));
const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const FACE = { south: [0, 1], 'south-east': [1, 1], east: [1, 0], 'north-east': [1, -1], north: [0, -1], 'north-west': [-1, -1], west: [-1, 0], 'south-west': [-1, 1] };

const raw = async (u) => { const { data } = await sharp(await readFile(at(u))).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return data; };
const hex = (d, i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];

// Frame lists: { action, dir, index, url, neck, origin }.
const body = await json(at('/assets/character-v3/body-eight-02/manifest.json'));
const sets = [['idle', body.frames.map((f) => ({ dir: f.direction, frames: [{ url: f.url, neckPivot: f.neckPivot, bodyOrigin: f.bodyOrigin }] }))]];
for (const [action, path] of [['walk', '/assets/character-v3/walk-eight-02/manifest.json'], ['attack', '/assets/character-v3/actions-eight-02/attack/manifest.json'], ['cast', '/assets/character-v3/actions-eight-02/cast/manifest.json'],
  // Weapon-class attacks (publish_weapon_action.mjs): keris stabs and the magic-weapon point-and-cast.
  ['attack-dagger', '/assets/character-v3/actions-eight-02/attack-dagger/manifest.json'], ['attack-cast', '/assets/character-v3/actions-eight-02/attack-cast/manifest.json']]) {
  const m = await json(at(path));
  sets.push([action, m.directions.map((d) => ({ dir: d.direction, frames: d.frames }))]);
}
const origin = Object.fromEntries(body.frames.map((f) => [f.direction, f.bodyOrigin]));

// Skin palette: warm colours in the neck stump of every frame of every set (each animation was generated separately
// and may shade skin a little differently), minus colours that also occur in the sash band.
const skin = new Set(), sash = new Set();
const allFrames = sets.flatMap(([, dirs]) => dirs.flatMap((d) => d.frames.map((f) => ({ url: f.url, neckPivot: f.neckPivot }))));
for (const f of allFrames) {
  const d = await raw(f.url), n = f.neckPivot;
  for (let y = n.y; y <= n.y + 4; y++) for (let x = n.x - 4; x <= n.x + 4; x++) {
    const i = (y * 128 + x) * 4; if (d[i + 3] < 200) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r > 150 && r - g > 20 && g > b) skin.add(hex(d, i));
  }
}
// Sash band from the idle frames only (in action frames the hands pass in front of the sash).
for (const f of body.frames) {
  const d = await raw(f.url), n = f.neckPivot;
  for (let y = n.y + 22; y <= n.y + 32; y++) for (let x = n.x - 6; x <= n.x + 6; x++) { const i = (y * 128 + x) * 4; if (d[i + 3] >= 200) sash.add(hex(d, i)); }
}
for (const c of [...skin]) if (sash.has(c)) skin.delete(c);

function islands(d, neck, feetY) {
  const seen = new Uint8Array(128 * 128), out = [];
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const k = y * 128 + x; if (seen[k] || d[k * 4 + 3] < 200 || !skin.has(hex(d, k * 4))) continue;
    const px = [], stack = [k]; seen[k] = 1;
    while (stack.length) {
      const c = stack.pop(), cx = c % 128, cy = (c - cx) / 128; px.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy, nk = ny * 128 + nx;
        if (nx < 0 || ny < 0 || nx > 127 || ny > 127 || seen[nk] || d[nk * 4 + 3] < 200 || !skin.has(hex(d, nk * 4))) continue;
        seen[nk] = 1; stack.push(nk);
      }
    }
    if (px.length < 4) continue;
    // The hand is the island's tip: the pixels furthest from the shoulder line (an island can be forearm + hand).
    const sh = { x: neck.x, y: neck.y + 7 };
    const dist = (p) => Math.hypot(p[0] - sh.x, p[1] - sh.y);
    const far = Math.max(...px.map(dist)), tip = px.filter((p) => dist(p) >= far - 3);
    const cx = tip.reduce((s, p) => s + p[0], 0) / tip.length, cy = tip.reduce((s, p) => s + p[1], 0) / tip.length;
    if (Math.hypot(cx - neck.x, cy - neck.y) < 14 || cy > feetY - 24) continue; // neck stump and upper arms, legs
    out.push({ x: +cx.toFixed(1), y: +cy.toFixed(1), n: px.length });
  }
  return out;
}

const overrides = existsSync(new URL('docs/design/character-v3/hand-anchors-overrides.json', ROOT))
  ? await json(new URL('docs/design/character-v3/hand-anchors-overrides.json', ROOT)) : {};
const anchors = {}, review = [];
for (const [action, dirs] of sets) {
  anchors[action] = {};
  for (const { dir, frames } of dirs) {
    const [fx, fy] = FACE[dir], right = [-fy, fx];
    anchors[action][dir] = [];
    // Hands are tracked through the sequence: each frame takes the candidate nearest the previous frame's hand (the
    // first frame starts from this direction's idle hand), so a profile walk does not swap hands between frames.
    let prevMain = action === 'idle' ? null : anchors.idle?.[dir]?.[0]?.main ?? null;
    let prevOff = action === 'idle' ? null : anchors.idle?.[dir]?.[0]?.off ?? null;
    for (const [index, f] of frames.entries()) {
      const d = await raw(f.url), neck = f.neckPivot, cand = islands(d, neck, (f.bodyOrigin ?? origin[dir]).y);
      const side = (p) => (p.x - neck.x) * right[0] + (p.y - neck.y) * right[1];
      // Candidates far from the shoulders first (hands sit at the end of the arm, beyond the wrist wrap).
      const ranked = [...cand].sort((a, b) => Math.hypot(b.x - neck.x, b.y - neck.y) - Math.hypot(a.x - neck.x, a.y - neck.y)).slice(0, 4);
      const near = (to, list) => list.reduce((a, b) => (a && Math.hypot(a.x - to.x, a.y - to.y) <= Math.hypot(b.x - to.x, b.y - to.y) ? a : b), null);
      const closeEnough = (p, to) => p && to && Math.hypot(p.x - to.x, p.y - to.y) <= 14;
      let main = prevMain ? near(prevMain, ranked) : null;
      if (!closeEnough(main, prevMain)) main = ranked.length ? ranked.reduce((a, b) => (side(b) > side(a) ? b : a)) : null;
      const rest = ranked.filter((p) => p !== main);
      let off = prevOff ? near(prevOff, rest) : null;
      if (!closeEnough(off, prevOff)) off = rest.reduce((a, b) => (a && side(a) < side(b) ? a : b), null);
      if (main) prevMain = main;
      if (off) prevOff = off;
      const key = `${action}/${dir}/${index}`, fix = overrides[key] ?? {};
      const entry = { main: fix.main ?? (main && { x: main.x, y: main.y }), off: fix.off ?? (off && { x: off.x, y: off.y }), detected: !fix.main };
      anchors[action][dir].push(entry);
      review.push({ url: f.url, entry, key });
    }
  }
}

// Walk and cast: the weapon stays steady in the idle hand and follows the body bob (neck pivot), like classic sprites;
// the arms swing too little at game scale to read, and the detector confuses hip gourds with hands there.
const neckOf = Object.fromEntries(sets.map(([action, dirs]) => [action, Object.fromEntries(dirs.map((d) => [d.dir, d.frames.map((f) => f.neckPivot)]))]));
const shift = (p, from, to) => p && { x: +(p.x + to.x - from.x).toFixed(1), y: +(p.y + to.y - from.y).toFixed(1) };
for (const action of ['walk', 'cast']) for (const dir of DIRS) {
  const idle = anchors.idle[dir][0], n0 = neckOf.idle[dir][0];
  anchors[action][dir] = neckOf[action][dir].map((n, i) => {
    const fix = overrides[`${action}/${dir}/${i}`] ?? {};
    return { main: fix.main ?? shift(idle.main, n0, n), off: fix.off ?? shift(idle.off, n0, n), detected: false };
  });
}
// Attack: the skeleton poses the generator was driven with (S, SW, W, NW; RIGHT/LEFT ARM = hand end), moved by the
// difference between the pose neck and the published neck pivot (publishing ground-locks the frames).
for (const dir of DIRS) {
  const file = new URL(`docs/design/character-v3/actions-eight-02/skeleton-attack-${dir}-poses.json`, ROOT);
  if (!existsSync(file)) continue;
  const poses = await json(file);
  anchors.attack[dir] = poses.map((p, i) => {
    const fix = overrides[`attack/${dir}/${i}`] ?? {}, n = neckOf.attack[dir][i], from = { x: p.NECK[0], y: p.NECK[1] };
    const pt = (k) => shift({ x: p[k][0], y: p[k][1] }, from, n);
    return { main: fix.main ?? pt('RIGHT ARM'), off: fix.off ?? pt('LEFT ARM'), detected: false, skeleton: true };
  });
}
// Weapon-class attacks were generated from our own skeleton poses: their hands are the pose RIGHT/LEFT ARM points moved
// by the same offset as the published neck pivot (ground lock), which is more reliable than skin detection there.
const POSE_SOURCES = {
  'attack-cast': () => 'docs/design/character-v3/weapon-class/cast-point/',
  'attack-dagger': (d) => (['north', 'north-east', 'north-west'].includes(d) ? 'docs/design/character-v3/weapon-class/dagger-v2b/' : 'docs/design/character-v3/weapon-class/dagger-v2/'),
};
for (const [action, src] of Object.entries(POSE_SOURCES)) for (const dir of DIRS) {
  if (!anchors[action]?.[dir]) continue;
  const poses = await json(new URL(`${src(dir)}${dir}-poses.json`, ROOT));
  anchors[action][dir] = poses.map((pose, i) => {
    const fix = overrides[`${action}/${dir}/${i}`] ?? {}, n = neckOf[action][dir][i], from = { x: pose.NECK[0], y: pose.NECK[1] };
    const pt = (k) => shift({ x: pose[k][0], y: pose[k][1] }, from, n);
    return { main: fix.main ?? pt('RIGHT ARM'), off: fix.off ?? pt('LEFT ARM'), detected: false, skeleton: true };
  });
}
// Weapon hand per direction: the hand that travels furthest in the attack (the generated strikes do not always use the
// right hand), so the weapon swings with the blow.
const weaponHand = {};
for (const dir of DIRS) {
  const travel = (h) => { const ps = anchors.attack[dir].map((e) => e[h]).filter(Boolean); let m = 0; for (const a of ps) for (const b of ps) m = Math.max(m, Math.hypot(a.x - b.x, a.y - b.y)); return m; };
  weaponHand[dir] = overrides[`weaponHand/${dir}`] ?? (travel('off') > travel('main') + 2 ? 'off' : 'main');
}
// Fill any missing hand from the same direction's idle anchor (offset by the neck movement).
for (const action of Object.keys(anchors)) for (const dir of DIRS) for (const [i, e] of (anchors[action][dir] ?? []).entries()) {
  const idle = anchors.idle[dir]?.[0];
  for (const h of ['main', 'off']) if (!e[h] && idle?.[h]) { e[h] = shift(idle[h], neckOf.idle[dir][0], neckOf[action][dir][i]); e[`${h}Guessed`] = true; }
}
// Each entry carries its frame's neck pivot (the client leans the weapon along shoulder -> hand).
for (const action of Object.keys(anchors)) for (const dir of DIRS) for (const [i, e] of (anchors[action][dir] ?? []).entries()) e.neck = neckOf[action][dir][i];
// Hand overlays ("fist over the weapon", like the gripping hand that RO paints over its weapon layer): for every frame,
// the skin pixels within HAND_R of both hand anchors, copied from the body frame onto a transparent 128 px frame. The
// client draws this above the weapon so the fingers close over the shaft. One strip per action and direction.
const HAND_R = 5;
const { mkdir } = await import('node:fs/promises');
await mkdir(new URL('apps/client/public/assets/character-v3/hand-overlay/', ROOT), { recursive: true });
for (const [action, dirs] of sets) for (const { dir, frames } of dirs) {
  const strip = Buffer.alloc(128 * frames.length * 128 * 4);
  for (const [i, f] of frames.entries()) {
    const d = await raw(f.url), e = anchors[action][dir][i];
    for (const h of [e.main, e.off]) {
      if (!h) continue;
      for (let y = Math.floor(h.y - HAND_R); y <= Math.ceil(h.y + HAND_R); y++) for (let x = Math.floor(h.x - HAND_R); x <= Math.ceil(h.x + HAND_R); x++) {
        if (x < 0 || y < 0 || x > 127 || y > 127 || Math.hypot(x - h.x, y - h.y) > HAND_R) continue;
        const k = (y * 128 + x) * 4;
        if (d[k + 3] < 200 || !skin.has(hex(d, k))) continue;
        const o = (y * 128 * frames.length + i * 128 + x) * 4;
        d.copy(strip, o, k, k + 4);
      }
    }
  }
  await sharp(strip, { raw: { width: 128 * frames.length, height: 128, channels: 4 } }).png()
    .toFile(fileURLToPath(new URL(`apps/client/public/assets/character-v3/hand-overlay/${action}-${dir}.png`, ROOT)));
}
// Review entries follow the final anchors.
for (const r of review) { const [action, dir, i] = r.key.split('/'); r.entry = anchors[action][dir][+i]; r.weapon = weaponHand[dir]; }

await writeFile(new URL('apps/client/public/assets/character-v3/hand-anchors.json', ROOT), JSON.stringify({
  version: 'hand-anchors/1', source: 'tools/rig/v3_hand_anchors.mjs (skin islands per frame + overrides)', frameSize: 128,
  note: 'main = character right hand (weapon), off = left hand (shield / second keris). Native 128 px frame pixels.',
  weaponHand,
  // Magic weapons: the casting hand of attack-cast (the camera-side arm the poses were authored with), used in every
  // action so the staff never changes hands.
  castHand: Object.fromEntries(Object.entries(POSE_FACE).map(([d, f]) => [d, f.near === 'RIGHT' ? 'main' : 'off'])),
  actions: anchors,
}, null, 1));

// Review sheet: 2x frames, main hand red, off hand blue, guessed hands hollow.
const cols = 16, scale = 2, cell = 128 * scale, rows = Math.ceil(review.length / cols);
const comps = [];
for (const [i, r] of review.entries()) {
  const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
  comps.push({ input: await sharp(await readFile(at(r.url))).resize(cell, cell, { kernel: 'nearest' }).png().toBuffer(), left: x, top: y });
  const dots = [['main', '#ff3030'], ['off', '#30a0ff']].sort(([h]) => (h === r.weapon ? 1 : -1)).filter(([h]) => r.entry[h]).map(([h, c]) => {
    const p = r.entry[h];
    return `<circle cx="${p.x * scale}" cy="${p.y * scale}" r="${h === r.weapon ? 7 : 4}" fill="${r.entry[`${h}Guessed`] ? 'none' : c}" stroke="${c}" stroke-width="2"/>`;
  }).join('');
  comps.push({ input: Buffer.from(`<svg width="${cell}" height="${cell}" xmlns="http://www.w3.org/2000/svg">${dots}<text x="4" y="14" font-size="12" fill="#fff">${r.key}</text></svg>`), left: x, top: y });
}
await sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: '#1f2b28' } }).composite(comps).png()
  .toFile(fileURLToPath(new URL('docs/design/character-v3/hand-anchors-review.png', ROOT)));
const total = review.length, missing = review.filter((r) => !r.entry.main).length;
console.log(`hand anchors: ${total} frames, skin palette ${skin.size} colours, main hand missing in ${missing}`);
