import { readFile, access } from 'node:fs/promises';
import { sharp } from './body-eight-lib.mjs';
import { ORDER } from './v3_pose_lib.mjs';
import { SPECS, folder } from './weapon_attack_03.mjs';
for (const action of process.argv[2] ? [process.argv[2]] : Object.keys(SPECS)) {
  const cells = []; let count = 0;
  for (const [row, d] of ORDER.entries()) {
    for (let i = 0; i < 8; i++) {
      const path = folder(action) + `raw/${d}-${i}.png`;
      try { await access(path); cells.push({ input: await readFile(path), left: i * 128, top: row * 144 + 16 }); count++; } catch { /* missing cells stay empty, never copy another direction */ }
    }
    cells.push({ input: Buffer.from(`<svg width="1024" height="16"><text x="4" y="12" fill="#ece3bf" font-size="12">${action} / ${d} / frames 0–7</text></svg>`), left: 0, top: row * 144 });
  }
  await sharp({ create: { width: 1024, height: 1152, channels: 4, background: '#20312e' } }).composite(cells).png().toFile(folder(action) + 'raw-review.png');
  console.log(action, `${count}/64 frames`, folder(action) + 'raw-review.png');
}
