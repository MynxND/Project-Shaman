// Route safety and preservation checks for the northwest garden correction.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { UMBRAL_CAPITAL as map, isBlocked } from '../dist/index.js';

const before = fs.readFileSync(new URL('../../../docs/design/umbral-v2/backup/umbral-capital.before-garden-fix.ts.txt', import.meta.url), 'utf8');
const after = fs.readFileSync(new URL('../src/maps/umbral-capital.ts', import.meta.url), 'utf8');
// District blocks survive byte for byte, except the garden itself and failed landscape dressing.
for (const name of ['PLAZA', 'TEMPLE', 'TRAINING', 'MARKET', 'NORTH_EAST', 'SOUTH_WEST', 'SOUTH_EAST', 'GATE', 'WALLS']) {
  const block = new RegExp(`const ${name}: MapObject\\[\\] = \\[([\\s\\S]*?)\\n\\];`);
  assert.equal(after.match(block)?.[0], before.match(block)?.[0], `${name} preserves buildings, lights and objects`);
}
const route = [[33,23],[28,21],[24,19.3],[21,18.4],[18.5,17.1],[15.4,16.9],[12,18]];
for (let i=1; i<route.length; i++) {
  const [ax,ay]=route[i-1], [bx,by]=route[i];
  const length=Math.hypot(bx-ax,by-ay);
  for (let d=0; d<=length; d+=0.1) {
    const x=ax+(bx-ax)*d/length, y=ay+(by-ay)*d/length;
    for (const offset of [-0.45,0,0.45])
      assert.equal(isBlocked(map,x-(by-ay)*offset/length,y+(bx-ax)*offset/length),false,'garden route has 0.9-unit walkable corridor');
  }
}
for (const [x,y] of [[11,23.6],[24.9,17.2],[25.8,20.8],[16,17]])
  assert.equal(isBlocked(map,x,y),false,'house, tree, offering and pond access');
for (const [x,y] of [[15,13],[23.6,16],[25.8,18.7]])
  assert.equal(isBlocked(map,x,y),true,'pond, sacred trunk and shrine retain collision');
assert.deepEqual(map.spawn,{x:40,y:36});
assert.ok(!map.objects.some(o=>['shade-tree','stone-bed','reed-planter'].includes(o.asset)),'failed saplings and planters removed');
console.log('sacred garden: preserved city blocks, clear route and interaction approaches; water/trunk/shrine blocked');
