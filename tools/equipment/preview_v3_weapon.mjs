// Review sheet for a job weapon on the Character V3 body, with the client's maths (v3-weapon.ts + EquipmentLayers):
// weapon view for the facing, grip fraction on the hand anchor, leaning shoulder -> hand as the arm extends, in front of
// the body for south-facing views and behind otherwise. Rows: 8 facings. Columns: idle, walk 0/4, attack 0..7.
// Run: node tools/equipment/preview_v3_weapon.mjs <weapon-id> [out.png]
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sharp } from '../rig/body-eight-lib.mjs';

const ROOT = new URL('../../', import.meta.url);
const p = (rel) => fileURLToPath(new URL(rel, ROOT));
const [, , id, outArg] = process.argv;
if (!id) throw Error('usage: preview_v3_weapon.mjs <weapon-id> [out.png]');
const out = outArg ?? p(`docs/design/equipment/reviews/${id}-v3.png`);
const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const anchors = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/hand-anchors.json'), 'utf8'));
const src = await readFile(p('packages/shared/src/equipment.ts'), 'utf8');
// The item's one-line EQUIPMENT_VISUALS entry: main fields, then the optional offhand object.
const line = src.split(/\r?\n/).find((l) => l.trim().startsWith(`'${id}': { slot: 'weapon'`));
if (!line) throw Error(`no EQUIPMENT_VISUALS weapon entry for ${id}`);
const offText = /offhand: \{([^}]*)\}/.exec(line)?.[1] ?? null, mainText = line.replace(/offhand: \{[^}]*\}/, '');
const num = (text, key, fallback) => { const v = new RegExp(`${key}: ([\\d.]+)`).exec(text); return v ? +v[1] : fallback; };
const visual = {
  grip: num(mainText, 'grip', 0.5), scale: num(mainText, 'scale', 1), upright: /upright: true/.test(mainText), southOnly: /southOnly: true/.test(mainText), swing: /swing: true/.test(mainText), bolt: /bolt: true/.test(mainText),
  off: offText ? { art: /art: '([a-z-]+)'/.exec(offText)[1], grip: num(offText, 'grip', 0.5), scale: num(offText, 'scale', 1) } : null,
  offUpright: !!offText && /upright: true/.test(offText),
};
const body = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/body-eight-02/manifest.json'), 'utf8'));
const frameUrl = {
  idle: (dir) => body.frames.find((f) => f.direction === dir).url,
  walk: (dir, i) => `/assets/character-v3/walk-eight-02/${dir}-${i}.png`,
  attack: (dir, i) => `/assets/character-v3/actions-eight-02/attack/${dir}-${i}.png`,
  'attack-cast': (dir, i) => `/assets/character-v3/actions-eight-02/attack-cast/${dir}-${i}.png`,
  'attack-dagger': (dir, i) => `/assets/character-v3/actions-eight-02/attack-dagger/${dir}-${i}.png`,
};
const tipFor = (hand, neck) => {
  const sx = neck.x, sy = neck.y + 7, dx = hand.x - sx, dy = hand.y - sy, len = Math.hypot(dx, dy) || 1;
  const down = dy / len, reach = Math.min(1, Math.max(0, (0.75 - down) / 0.5)) * Math.min(1, len / 18);
  const ux = (dx / len) * reach, uy = -1 + (dy / len + 1) * reach, n = Math.hypot(ux, uy) || 1;
  return { x: hand.x + (ux / n) * 12, y: hand.y + (uy / n) * 12 };
};
const SCALE = 2;
const grips = JSON.parse(await readFile(p('apps/client/public/assets/equipment/grips.json'), 'utf8')).grips;
const STRIKE = { east: 1.15, 'south-east': 0.9, 'north-east': 0.9, west: -1.15, 'south-west': -0.9, 'north-west': -0.9 };
// V3 rules (ModularRig.ts): upright; swing weapons tilt to the facing's strike angle while the arm is out in an attack.
async function placed(art, dir, hand, neck, grip, scale, strike = false) {
  const img = sharp(await readFile(p(`apps/client/public/assets/equipment/${art}/${visual.southOnly ? 'south' : dir}.png`)));
  const meta = await img.metadata();
  const w = Math.max(1, Math.round(meta.width * scale * SCALE)), h = Math.max(1, Math.round(meta.height * scale * SCALE));
  const angle = strike ? STRIKE[dir] ?? 0 : 0;
  const rotated = await sharp(await img.resize(w, h, { kernel: 'nearest' }).png().toBuffer())
    .rotate(angle * 180 / Math.PI, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
  const view = visual.southOnly ? 'south' : dir, vx = ((grips[art]?.[view] ?? 0.5) - 0.5) * w, vy = grip * h - h / 2, c = Math.cos(angle), s = Math.sin(angle);
  const gx = rotated.info.width / 2 + (vx * c - vy * s), gy = rotated.info.height / 2 + (vx * s + vy * c);
  return { input: rotated.data, left: Math.round(hand.x * SCALE - gx), top: Math.round(hand.y * SCALE - gy) };
}
// The attack column uses the weapon class's own animation, like the client (CharacterRig.attackStyle).
const attackSet = visual.bolt ? 'attack-cast' : id === 'keris' ? 'attack-dagger' : 'attack';
const columns = [['idle', 0], ['walk', 0], ['walk', 4], ...Array.from({ length: 8 }, (_, i) => [attackSet, i])];
const cell = 128 * SCALE, comps = [];
for (const [row, dir] of DIRS.entries()) for (const [col, [action, i]] of columns.entries()) {
  const entry = anchors.actions[action][dir][i], hand = visual.bolt ? anchors.castHand[dir] : visual.swing ? anchors.weaponHand[dir] : 'main', other = hand === 'main' ? 'off' : 'main';
  const hideWeapon = action === 'attack-dagger';
  const layers = [];
  const fx = { south: 0, 'south-east': 1, east: 1, 'north-east': 1, north: 0, 'north-west': -1, west: -1, 'south-west': -1 }[dir];
  const front = (hand === 'main' ? fx : -fx) >= 0, offFront = (hand === 'main' ? -fx : fx) >= 0, g = entry[hand];
  const strike = (visual.swing || visual.bolt) && (action === 'attack' || action === 'attack-cast') && !!g && g.y - entry.neck.y < 20;
  const weapon = !hideWeapon && g && await placed(id, dir, g, entry.neck, visual.grip, visual.scale, strike);
  const offhand = !hideWeapon && visual.off && entry[other] && await placed(visual.off.art, dir, entry[other], entry.neck, visual.off.grip, visual.off.scale, strike && !visual.offUpright);
  const hands = { input: await sharp(await readFile(p(`apps/client/public/assets/character-v3/hand-overlay/${action}-${dir}.png`))).extract({ left: i * 128, top: 0, width: 128, height: 128 }).resize(cell, cell, { kernel: 'nearest' }).png().toBuffer(), left: 0, top: 0 };
  const bodyImg = { input: await sharp(await readFile(p(`apps/client/public${frameUrl[action](dir, i)}`))).resize(cell, cell, { kernel: 'nearest' }).png().toBuffer(), left: 0, top: 0 };
  if (weapon && !front) layers.push(weapon);
  if (offhand && !offFront) layers.push(offhand);
  layers.push(bodyImg);
  if (weapon && front) layers.push(weapon);
  if (offhand && offFront) layers.push(offhand);
  if (front) layers.push(hands);
  const tile = await sharp({ create: { width: cell, height: cell, channels: 4, background: '#22302c' } })
    .composite(layers.map((l) => ({ ...l, left: Math.max(-cell, l.left), top: Math.max(-cell, l.top) }))).png().toBuffer();
  comps.push({ input: tile, left: col * cell, top: row * cell });
}
await sharp({ create: { width: columns.length * cell, height: DIRS.length * cell, channels: 4, background: '#1b2522' } }).composite(comps).png().toFile(out);
console.log(`preview ${out}`);
