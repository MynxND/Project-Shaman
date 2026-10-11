// Free line pass for Onmyoji circle archetypes (same as the approved master circle): pale fill → transparent, the
// remaining lines remapped to a bright pale-gold ramp so runtime element tints read on dark ground.
// raw/<id>/seed.png → raw/<id>-lines/seed.png. Usage: node tools/sprites/circle_lines.mjs <id> ...
import { mkdirSync } from 'node:fs';
import { sharp } from '../rig/body-eight-lib.mjs';
const R = `docs/design/skills/${process.env.VFX_SET ?? 'japan-v1'}/raw/`; // nation set via VFX_SET
// --neutral: white-grey ramp instead of warm gold, so cool tints (purple, ice blue) come through true (Norway).
const RAMP = process.argv.includes('--neutral') ? [[150, 150, 160], [190, 190, 200], [225, 225, 232], [250, 250, 255]] : [[176, 140, 80], [214, 182, 112], [240, 214, 150], [255, 240, 200]];
for (const id of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const { data, info } = await sharp(R + id + '/seed.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const mx = Math.max(data[i], data[i + 1], data[i + 2]), mn = Math.min(data[i], data[i + 1], data[i + 2]);
    if (mx > 215 && mx - mn < 40) { data[i + 3] = 0; continue; }
    const c = RAMP[Math.min(3, Math.floor(((data[i] + data[i + 1] + data[i + 2]) / 3 / 255) * 4.5))];
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
  }
  mkdirSync(R + id + '-lines', { recursive: true });
  await sharp(data, { raw: info }).png().toFile(R + id + '-lines/seed.png');
  console.log('lines', id);
}
