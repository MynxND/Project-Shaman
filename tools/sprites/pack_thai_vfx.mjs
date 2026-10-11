// Packs downloaded Thai release frames (docs/design/skills/${SET}/raw/<skill>/frame-NN.png) into one horizontal
// sheet in apps/client/public/assets/skills/${SET}/ and records size/frames/anchor in manifest.json.
// Anchor = horizontal centre, lowest opaque row over all frames (the effect stands on the target's feet).
// Zones (--center): anchor = centre of the opaque bounds, so the ward sits centred on the caster.
// --as <skillId>: publish a revision (raw folder <skill>) under the game skill id.
// --anchor-x/--anchor-y N: measured anchor (e.g. a circle centre), overriding the automatic one.
// Usage: node tools/sprites/pack_thai_vfx.mjs <skill> [--center] [--as <skillId>] [--anchor-x N] [--anchor-y N]
const SET = process.env.VFX_SET ?? 'thailand-v1'; // nation asset set, e.g. VFX_SET=indonesia-v1
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';
const skill = process.argv[2]; if (!skill) throw Error('skill id required');
const argNum = (k) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : undefined; };
const asIdx = process.argv.indexOf("--as"), id = asIdx > 0 ? process.argv[asIdx + 1] : skill;
const raw = `docs/design/skills/${SET}/raw/${skill}/`, out = `apps/client/public/assets/skills/${SET}/`;
const files = readdirSync(raw).filter((f) => /^frame-\d+\.png$/.test(f)).sort();
if (!files.length) throw Error('no frames');
const { width, height } = await sharp(raw + files[0]).metadata();
let bottom = 0, top = height;
for (const f of files) { const { data } = await sharp(raw + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); for (let k = 0; k < width * height; k++) if (data[k * 4 + 3]) { bottom = Math.max(bottom, (k / width) | 0); top = Math.min(top, (k / width) | 0); } }
await sharp({ create: { width: width * files.length, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(files.map((f, i) => ({ input: raw + f, left: i * width, top: 0 }))).png().toFile(`${out}${id}.png`);
const mf = `${out}manifest.json`, manifest = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : { note: 'Thailand release VFX (PixelLab). Proposals until user review.', effects: {} };
const jobs = JSON.parse(readFileSync(raw + 'jobs.json', 'utf8').replace(/^﻿/, ''));
manifest.effects[id] = { revision: skill, image: `${id}.png`, width, height, frames: files.length, anchor: { x: argNum("--anchor-x") ?? width / 2, y: argNum("--anchor-y") ?? (process.argv.includes("--center") ? Math.round((top + bottom) / 2) : bottom + 1) }, seedJob: jobs.seedJob, animationJob: jobs.animationJob, packedAt: Date.now() };
writeFileSync(mf, JSON.stringify(manifest, null, 2) + '\n');
console.log(skill, width, height, files.length, "anchor", manifest.effects[id].anchor);
