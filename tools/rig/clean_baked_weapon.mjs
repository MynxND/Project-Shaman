// Removes generator-baked weapon pixels from specific raw frames; the runtime item layer supplies the weapon.
// Raw originals stay untouched; cleaned copies go to <set>/clean/ and publish_weapon_action.mjs prefers them.
// Usage: node tools/rig/clean_baked_weapon.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { sharp, rgba, hash } from './body-eight-lib.mjs';

const W = 'docs/design/character-v3/weapon-class/';
// Erase predicates in native 128px frame coordinates, mapped from the review sheet.
const FIXES = [
  { set: 'attack-axe-twohand-04', file: 'north-west-2', erase: (x, y) => (y <= 47 && x >= 55) || (y >= 36 && y <= 40 && x >= 53) || (y <= 34 && x >= 49) || (y === 35 && x >= 54) || (y >= 48 && y <= 54 && x >= 69) || (y >= 46 && y <= 50 && x >= 64) },
  { set: 'attack-axe-twohand-04', file: 'north-west-3', erase: (x, y) => y >= 33 && y <= 49 && x >= 58 && !(y >= 48 && x <= 66) },
  // Grey folded fan beside the raised hand; only its unsaturated pixels go, the skin stays.
  { set: 'attack-cast-fan-04', file: 'east-6', erase: (x, y, r, g, b) => x >= 68 && y >= 40 && y <= 54 && Math.max(r, g, b) - Math.min(r, g, b) < 30 },
];

for (const f of FIXES) {
  const p = await rgba(await readFile(`${W}${f.set}/raw/${f.file}.png`));
  let removed = 0;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const q = (y * 128 + x) * 4;
    if (p[q + 3] && f.erase(x, y, p[q], p[q + 1], p[q + 2])) { p.fill(0, q, q + 4); removed++; }
  }
  await mkdir(`${W}${f.set}/clean/`, { recursive: true });
  const out = await sharp(p, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
  await writeFile(`${W}${f.set}/clean/${f.file}.png`, out);
  console.log(f.set, f.file, 'removed', removed, 'px', hash(out).slice(0, 12));
}
