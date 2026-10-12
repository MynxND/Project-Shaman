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
const FRONT = new Set(['south', 'south-east', 'south-west']);
const anchors = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/hand-anchors.json'), 'utf8'));
const src = await readFile(p('packages/shared/src/equipment.ts'), 'utf8');
const m = new RegExp(`'${id}': \\{ slot: 'weapon', kind: 'weapon', grip: ([\\d.]+)(?:, scale: ([\\d.]+))?(?:, offhand: \\{ art: '([a-z-]+)', grip: ([\\d.]+)(?:, scale: ([\\d.]+))? \\})? \\}`).exec(src);
if (!m) throw Error(`no EQUIPMENT_VISUALS weapon entry for ${id}`);
const visual = { grip: +m[1], scale: +(m[2] ?? 1), off: m[3] ? { art: m[3], grip: +m[4], scale: +(m[5] ?? 1) } : null };
const body = JSON.parse(await readFile(p('apps/client/public/assets/character-v3/body-eight-02/manifest.json'), 'utf8'));
const frameUrl = {
  idle: (dir) => body.frames.find((f) => f.direction === dir).url,
  walk: (dir, i) => `/assets/character-v3/walk-eight-02/${dir}-${i}.png`,
  attack: (dir, i) => `/assets/character-v3/actions-eight-02/attack/${dir}-${i}.png`,
};
const tipFor = (hand, neck) => {
  const sx = neck.x, sy = neck.y + 7, dx = hand.x - sx, dy = hand.y - sy, len = Math.hypot(dx, dy) || 1;
  const down = dy / len, reach = Math.min(1, Math.max(0, (0.75 - down) / 0.5)) * Math.min(1, len / 18);
  const ux = (dx / len) * reach, uy = -1 + (dy / len + 1) * reach, n = Math.hypot(ux, uy) || 1;
  return { x: hand.x + (ux / n) * 12, y: hand.y + (uy / n) * 12 };
};
const SCALE = 2;
async function placed(art, dir, hand, neck, grip, scale) {
  const img = sharp(await readFile(p(`apps/client/public/assets/equipment/${art}/${dir}.png`)));
  const meta = await img.metadata();
  const w = Math.max(1, Math.round(meta.width * scale * SCALE)), h = Math.max(1, Math.round(meta.height * scale * SCALE));
  const tip = tipFor(hand, neck), angle = Math.atan2(tip.y - hand.y, tip.x - hand.x) + Math.PI / 2;
  const rotated = await sharp(await img.resize(w, h, { kernel: 'nearest' }).png().toBuffer())
    .rotate(angle * 180 / Math.PI, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
  const vx = 0, vy = grip * h - h / 2, c = Math.cos(angle), s = Math.sin(angle);
  const gx = rotated.info.width / 2 + (vx * c - vy * s), gy = rotated.info.height / 2 + (vx * s + vy * c);
  return { input: rotated.data, left: Math.round(hand.x * SCALE - gx), top: Math.round(hand.y * SCALE - gy) };
}
const columns = [['idle', 0], ['walk', 0], ['walk', 4], ...Array.from({ length: 8 }, (_, i) => ['attack', i])];
const cell = 128 * SCALE, comps = [];
for (const [row, dir] of DIRS.entries()) for (const [col, [action, i]] of columns.entries()) {
  const entry = anchors.actions[action][dir][i], hand = anchors.weaponHand[dir], other = hand === 'main' ? 'off' : 'main';
  const layers = [];
  const front = FRONT.has(dir);
  const weapon = entry[hand] && await placed(id, dir, entry[hand], entry.neck, visual.grip, visual.scale);
  const offhand = visual.off && entry[other] && await placed(visual.off.art, dir, entry[other], entry.neck, visual.off.grip, visual.off.scale);
  const bodyImg = { input: await sharp(await readFile(p(`apps/client/public${frameUrl[action](dir, i)}`))).resize(cell, cell, { kernel: 'nearest' }).png().toBuffer(), left: 0, top: 0 };
  if (front) { if (offhand) layers.push(offhand); layers.push(bodyImg); if (weapon) layers.push(weapon); }
  else { if (weapon) layers.push(weapon); layers.push(bodyImg); if (offhand) layers.push(offhand); }
  const tile = await sharp({ create: { width: cell, height: cell, channels: 4, background: '#22302c' } })
    .composite(layers.map((l) => ({ ...l, left: Math.max(-cell, l.left), top: Math.max(-cell, l.top) }))).png().toBuffer();
  comps.push({ input: tile, left: col * cell, top: row * cell });
}
await sharp({ create: { width: columns.length * cell, height: DIRS.length * cell, channels: 4, background: '#1b2522' } }).composite(comps).png().toFile(out);
console.log(`preview ${out}`);
