// Free derived Thai effects (no generation), built from already-approved PixelLab frames:
// - soul-harvest-wisp: the caster-side clay jar of Soul Drain (Thai version) (left 56 px of each frame), used by Soul Harvest and Soul
//   Harvester as the "soul absorbed" cue at the caster.
// - phayon-repair: Medium Soul Heal frames recoloured onto the Thailand crimson/purple theme (luminance ramp).
// Output: raw/<id>/frame-NN.png + jobs.json (provenance), then pack with pack_thai_vfx.mjs.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';

const RAW = 'docs/design/skills/thailand-v1/raw/';
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));

// 1. Soul Harvest wisp: crop the vortex end of the published Soul Drain frames.
{
  const src = RAW + 'soul-drain-thai-post/', out = RAW + 'soul-harvest-wisp/';
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(src).filter((x) => /^frame-\d+\.png$/.test(x))) {
    const { data, info } = await sharp(src + f).extract({ left: 0, top: 0, width: 56, height: 64 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Fade the cut beam out over the right 22 px (stepped alpha keeps pixels crisp).
    for (let k = 0; k < 56 * 64; k++) { const x = k % 56; if (x >= 34) data[k * 4 + 3] = Math.round(data[k * 4 + 3] * Math.max(0, 1 - Math.ceil((x - 33) / 4) / 6)); }
    await sharp(data, { raw: info }).png().toFile(out + f);
  }
  writeFileSync(out + 'jobs.json', JSON.stringify({ derivedFrom: 'soul-drain-thai-post', crop: { x: 0, y: 0, w: 56, h: 64 }, seedJob: 'b217f1f5-8430-44f3-8acc-f165beb6f1ec', animationJob: 'bbdbea05-6c52-40b4-a144-6670979aa532' }, null, 2));
}

// 2. Phayon Repair: Soul Heal (Medium, jade) → Thai theme. Jade/gold become purple → rose by luminance.
{
  const sheet = 'apps/client/public/assets/skills/medium-v1/soul-heal-v2.png', out = RAW + 'phayon-repair/';
  mkdirSync(out, { recursive: true });
  const meta = await sharp(sheet).metadata(), fw = 160, n = Math.round(meta.width / fw);
  const RAMP = ['#2a0c30', '#4a1450', '#6c1e6e', '#8e2c86', '#b0409a', '#cc5a8e', '#e07c9a', '#f0a6c0', '#f8c8dc'].map(hex);
  for (let i = 0; i < n; i++) {
    const { data, info } = await sharp(sheet).extract({ left: i * fw, top: 0, width: fw, height: meta.height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let k = 0; k < info.width * info.height; k++) {
      const p = k * 4; if (!data[p + 3]) continue;
      const L = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255, c = RAMP[Math.min(RAMP.length - 1, Math.floor(L * RAMP.length))];
      data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2];
    }
    await sharp(data, { raw: info }).png().toFile(out + `frame-${String(i).padStart(2, '0')}.png`);
  }
  writeFileSync(out + 'jobs.json', JSON.stringify({ derivedFrom: 'medium-v1/soul-heal-v2.png', recolour: 'Thailand crimson/purple luminance ramp', seedJob: '62afa3cc-1f7c-4cc7-be5c-cde91e9f059f', animationJob: 'ab9f2ae9-5b81-4d27-a9ea-68532a817bf7' }, null, 2));
}
console.log('derived: soul-harvest-wisp, phayon-repair');
