// Packages PixelLab weapon views (docs/design/equipment/raw/<id>/<facing>.png) for the runtime, like build_items.py
// but with sharp (no Python imaging needed): crop each view to its opaque box + 1 px, write
// apps/client/public/assets/equipment/<id>/<facing>.png, merge the view sizes into the equipment manifest and make the
// 64 px inventory icon from the south view. Run: node tools/equipment/build_weapons.mjs [id ...]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sharp } from '../rig/body-eight-lib.mjs';

const ROOT = new URL('../../', import.meta.url);
const p = (rel) => fileURLToPath(new URL(rel, ROOT));
const FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const spec = JSON.parse(await readFile(p('docs/design/equipment/items.json'), 'utf8'));
const manifestPath = p('apps/client/public/assets/equipment/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const only = process.argv.slice(2);

for (const [id, it] of Object.entries(spec.items)) {
  if (it.slot !== 'weapon' && it.slot !== 'offhand') continue;
  if (only.length && !only.includes(id)) continue;
  if (!FACINGS.every((f) => existsSync(p(`docs/design/equipment/raw/${id}/${f}.png`)))) { console.log(`skip ${id}: raw views missing`); continue; }
  await mkdir(p(`apps/client/public/assets/equipment/${id}`), { recursive: true });
  const views = {};
  for (const f of FACINGS) {
    const src = sharp(await readFile(p(`docs/design/equipment/raw/${id}/${f}.png`))).ensureAlpha();
    const { data, info } = await src.clone().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const left = Math.max(0, x0 - 1), top = Math.max(0, y0 - 1), width = Math.min(info.width, x1 + 2) - left, height = Math.min(info.height, y1 + 2) - top;
    await src.extract({ left, top, width, height }).png().toFile(p(`apps/client/public/assets/equipment/${id}/${f}.png`));
    views[f] = { image: `${id}/${f}.png`, width, height, pivot: { x: width / 2, y: height / 2 } };
  }
  const south = p(`apps/client/public/assets/equipment/${id}/south.png`);
  const fit = await sharp(south).resize(60, 60, { fit: 'inside', kernel: 'nearest' }).png().toBuffer();
  const meta = await sharp(fit).metadata();
  await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fit, left: Math.floor((64 - meta.width) / 2), top: Math.floor((64 - meta.height) / 2) }]).png()
    .toFile(p(`apps/client/public/assets/ui/items/${id}.png`));
  manifest.items[id] = { slot: it.slot, views };
  console.log(`built ${id}`);
}
// New items are spliced into the existing text so build_items.py's entries keep their exact formatting; rebuilding an
// item that is already listed rewrites the whole file.
const original = (await readFile(manifestPath, 'utf8')).replace(/\r\n/g, '\n');
const before = JSON.parse(original);
const added = Object.keys(manifest.items).filter((id) => !(id in before.items));
const changed = Object.keys(manifest.items).some((id) => id in before.items && JSON.stringify(before.items[id]) !== JSON.stringify(manifest.items[id]));
if (changed) await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
else if (added.length) {
  const end = original.lastIndexOf('\n  }\n}');
  const blocks = added.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(manifest.items[id], null, 2).replace(/\n/g, '\n    ')}`).join(',\n');
  await writeFile(manifestPath, `${original.slice(0, end)},\n${blocks}${original.slice(end)}`);
}
