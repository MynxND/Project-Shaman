// One review sheet for a batch of Thai seeds (or any frame): each cell = image at 2× with its skill id.
// Usage: node tools/sprites/review_thai_seeds.mjs <out.png> <skill>[:file] ...   (file defaults to seed.png)
const SET = process.env.VFX_SET ?? 'thailand-v1'; // nation asset set, e.g. VFX_SET=indonesia-v1
import { existsSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';

const [out, ...items] = process.argv.slice(2);
const RAW = `docs/design/skills/${SET}/raw/`, S = 2, CW = 256 * S + 16, CH = 192 * S + 40, COLS = 3;
const cells = [];
for (const [n, item] of items.entries()) {
  const [skill, file = 'seed.png'] = item.split(':'), p = RAW + skill + '/' + file;
  const x = (n % COLS) * CW, y = Math.floor(n / COLS) * CH;
  const label = Buffer.from(`<svg width="${CW}" height="32"><text x="8" y="22" font-family="Tahoma" font-size="20" fill="#ece3bf">${n + 1}. ${skill}${existsSync(p) ? '' : ' — missing'}</text></svg>`);
  cells.push({ input: label, left: x, top: y });
  if (!existsSync(p)) continue;
  const m = await sharp(p).metadata();
  cells.push({ input: await sharp(p).resize(m.width * S, m.height * S, { kernel: 'nearest' }).png().toBuffer(), left: x + 8, top: y + 34 });
}
const rows = Math.ceil(items.length / COLS);
await sharp({ create: { width: CW * COLS, height: CH * rows, channels: 4, background: '#3c3a3a' } }).composite(cells).png().toFile(out);
console.log(out);
