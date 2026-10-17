// Packs the small images the game loads at start-up into a few atlas sheets (apps/client/src/game/packed-textures.ts).
//   node tools/rig/pack_textures.mjs            rebuild sheets + index from tools/rig/packed-textures-sources.json
//   node tools/rig/pack_textures.mjs --check    exit 1 if any packed source PNG changed since the last pack
//   node tools/rig/pack_textures.mjs --sources <file.txt>   replace the source list (one URL per line, from the dev
//        game's window.__shamanImageUrls) and rebuild
// Only PNGs up to 256x256 are packed; anything else keeps loading on its own. Art changed after packing is detected by
// --check (run by `pnpm build:prod`); re-run this script after editing packed art.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(join(process.cwd(), 'node_modules/.pnpm/node_modules/sharp/package.json'));
const sharp = require('sharp');
const PUBLIC = 'apps/client/public', OUT = `${PUBLIC}/assets/packed`, INDEX = 'apps/client/src/game-data/packed-textures.json';
const SOURCES = 'tools/rig/packed-textures-sources.json', LOCK = 'tools/rig/packed-textures-lock.json', SIZE = 2048, MAX = 256;
const sha = (b) => createHash('sha256').update(b).digest('hex');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };

if (process.argv.includes('--check')) {
  if (!existsSync(LOCK)) { console.log('pack: no lock (nothing packed)'); process.exit(0); }
  const lock = JSON.parse(readFileSync(LOCK, 'utf8')), stale = [];
  for (const [url, h] of Object.entries(lock.sources)) { const f = PUBLIC + url; if (!existsSync(f) || sha(readFileSync(f)) !== h) stale.push(url); }
  for (const [i, h] of lock.sheets.entries()) { const f = `${OUT}/sheet-${i}.png`; if (!existsSync(f) || sha(readFileSync(f)) !== h) stale.push(`sheet-${i}.png`); }
  if (stale.length) { console.error(`pack: ${stale.length} packed image(s) changed; run node tools/rig/pack_textures.mjs\n  ` + stale.slice(0, 10).join('\n  ')); process.exit(1); }
  console.log(`pack: ${Object.keys(lock.sources).length} packed images up to date`);
  process.exit(0);
}

const fromTxt = arg('--sources');
if (fromTxt) writeFileSync(SOURCES, JSON.stringify([...new Set(readFileSync(fromTxt, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s.startsWith('/assets/') && s.endsWith('.png')))].sort(), null, 1) + '\n');
const urls = JSON.parse(readFileSync(SOURCES, 'utf8'));

// Read every candidate; skip missing or large images.
const items = [];
for (const url of urls) {
  const file = PUBLIC + url.split('?')[0];
  if (!existsSync(file)) continue;
  const buf = readFileSync(file), meta = await sharp(buf).metadata();
  if (meta.width > MAX || meta.height > MAX) continue;
  items.push({ url, buf, w: meta.width, h: meta.height, hash: sha(buf) });
}
// Shelf packing, tallest first.
items.sort((a, b) => b.h - a.h || b.w - a.w);
const sheets = [];
let sheet = null, x = 0, y = 0, shelf = 0;
for (const it of items) {
  if (!sheet || x + it.w > SIZE) { x = 0; y += shelf; shelf = 0; }
  if (!sheet || y + it.h > SIZE) { sheet = []; sheets.push(sheet); x = 0; y = 0; shelf = 0; }
  it.at = [sheets.length - 1, x, y, it.w, it.h];
  sheet.push(it); x += it.w; shelf = Math.max(shelf, it.h);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const atlases = [], sheetHashes = [];
for (const [i, list] of sheets.entries()) {
  const height = Math.max(...list.map((it) => it.at[2] + it.h));
  const png = await sharp({ create: { width: SIZE, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(list.map((it) => ({ input: it.buf, left: it.at[1], top: it.at[2] }))).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${OUT}/sheet-${i}.png`, png);
  const h = sha(png);
  sheetHashes.push(h);
  atlases.push({ url: `/assets/packed/sheet-${i}.png?v=${h.slice(0, 12)}` });
}
// Every region must reproduce its source exactly (visible pixels; transparent colour is irrelevant). Images that do
// not (e.g. 16-bit or colour-managed sources) are left out and keep loading on their own.
const raws = await Promise.all(sheets.map((_l, i) => sharp(`${OUT}/sheet-${i}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
const exact = [];
for (const it of items) {
  const src = await sharp(it.buf).ensureAlpha().raw().toBuffer(), { data, info } = raws[it.at[0]];
  let ok = src.length === it.w * it.h * 4;
  for (let r = 0; ok && r < it.h; r++) for (let c = 0; c < it.w; c++) {
    const i = ((it.at[2] + r) * info.width + it.at[1] + c) * 4, j = (r * it.w + c) * 4;
    if (data[i + 3] !== src[j + 3] || (src[j + 3] && (data[i] !== src[j] || data[i + 1] !== src[j + 1] || data[i + 2] !== src[j + 2]))) { ok = false; break; }
  }
  if (ok) exact.push(it); else console.log(`pack: left out (not reproduced exactly) ${it.url}`);
}
items.length = 0; items.push(...exact);
const entries = Object.fromEntries(items.map((it) => [it.url, it.at]).sort(([a], [b]) => (a < b ? -1 : 1)));
writeFileSync(INDEX, JSON.stringify({ version: 'packed-textures/1', atlases, entries }) + '\n');
writeFileSync(LOCK, JSON.stringify({ sheets: sheetHashes, sources: Object.fromEntries(items.map((it) => [it.url, it.hash]).sort(([a], [b]) => (a < b ? -1 : 1))) }, null, 1) + '\n');
const bytes = sheets.reduce((n, _l, i) => n + readFileSync(`${OUT}/sheet-${i}.png`).length, 0);
console.log(`pack: ${items.length}/${urls.length} images into ${sheets.length} sheets (${(bytes / 1048576).toFixed(1)} MB)`);
