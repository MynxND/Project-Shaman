// Cuts a PixelLab icon sheet (4×4 grid of 64×64 cells, row-major, order in prompts.json) into per-skill icons:
// apps/client/public/assets/skills/${SET}/icons/<skill>.png, and records them in the Thai manifest (`icons`).
// Usage: node tools/sprites/slice_thai_icons.mjs <sheet-id>
const SET = process.env.VFX_SET ?? 'thailand-v1'; // nation asset set, e.g. VFX_SET=indonesia-v1
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';

const sheet = process.argv[2]; if (!sheet) throw Error('sheet id required');
const spec = JSON.parse(readFileSync(`docs/design/skills/${SET}/prompts.json`, 'utf8')).skills[sheet];
const src = `docs/design/skills/${SET}/raw/${sheet}/seed.png`, OUT = `apps/client/public/assets/skills/${SET}/`;
const job = JSON.parse(readFileSync(`docs/design/skills/${SET}/raw/${sheet}/jobs.json`, 'utf8').replace(/^﻿/, '')).seedJob;
mkdirSync(OUT + 'icons', { recursive: true });
const mf = OUT + 'manifest.json', manifest = JSON.parse(readFileSync(mf, 'utf8'));
manifest.icons ??= {};
for (const [n, id] of spec.order.entries()) {
  await sharp(src).extract({ left: (n % 4) * 64, top: Math.floor(n / 4) * 64, width: 64, height: 64 }).png().toFile(`${OUT}icons/${id}.png`);
  manifest.icons[id] = { image: `icons/${id}.png`, sheet, cell: n, seedJob: job, packedAt: Date.now() };
}
writeFileSync(mf, JSON.stringify(manifest, null, 2) + '\n');
console.log(sheet, 'icons:', spec.order.length);
