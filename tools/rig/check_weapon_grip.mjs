// Finds frames whose authored weapon-hand anchor has no skin pixels nearby (generator ignored the skeleton there).
import { readFile } from 'node:fs/promises';
import { rgba, json, order } from './body-eight-lib.mjs';

const anchors = (await json('apps/client/public/assets/character-v3/hand-anchors.json')).actions;
const skin = (p, q) => p[q + 3] >= 200 && p[q] > 150 && p[q] - p[q + 1] > 20 && p[q + 1] > p[q + 2];
const misses = [];
for (const [action, dirs] of Object.entries(anchors)) {
  if (!dirs[order[0]]?.[0]?.skeleton) continue;
  for (const d of order) for (const [k, a] of dirs[d].entries()) {
    const hand = a.weaponHand === 'off' ? a.off : a.main;
    const p = await rgba(await readFile(`apps/client/public/assets/character-v3/actions-eight-02/${action}/${d}-${k}.png`));
    let best = Infinity, at = null;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      if (!skin(p, (y * 128 + x) * 4)) continue;
      const dist = Math.hypot(x - hand.x, y - hand.y);
      if (dist < best) { best = dist; at = [x, y]; }
    }
    if (best > 6) misses.push(`${action} ${d}-${k} anchor ${Math.round(hand.x)},${Math.round(hand.y)} nearest skin ${best.toFixed(1)}px at ${at}`);
  }
}
console.log(misses.length ? misses.join('\n') : 'all weapon-hand anchors within 6px of skin');
