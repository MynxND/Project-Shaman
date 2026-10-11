// Prints ledger rows for a VFX set from recorded jobs (seed job, animation job, "charged:" line). Seeds report no
// charge in our saved responses, so they are listed as "seed ≈6" (icon sheets "sheet ≈9") (estimate from earlier ledgers).
// Usage: VFX_SET=japan-v1 node tools/sprites/ledger_rows.mjs <step label> <skill> ...
import { readFileSync, existsSync } from 'node:fs';
const SET = process.env.VFX_SET ?? 'thailand-v1';
const [label, ...skills] = process.argv.slice(2);
const date = new Date().toISOString().slice(0, 10);
for (const k of skills) {
  const d = `docs/design/skills/${SET}/raw/${k}/`;
  if (!existsSync(d + 'jobs.json')) { console.log(`| ${date} | ${label} ${k} | — | not run | — |`); continue; }
  const j = JSON.parse(readFileSync(d + 'jobs.json', 'utf8').replace(/^﻿/, ''));
  const resp = existsSync(d + 'animation.response.txt') ? readFileSync(d + 'animation.response.txt', 'latin1') : '';
  const charged = resp.match(/charged: (\d+) generation/)?.[1];
  console.log(`| ${date} | ${label} ${k} | ${j.seedJob}${j.animationJob ? ' / ' + j.animationJob : ''} | ${k.startsWith('icons-') ? 'sheet ≈9' : 'seed ≈6'}${charged ? ` + anim ${charged}` : ''} | ${charged ? 'animated' : 'seed'} |`);
}
