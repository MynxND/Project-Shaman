import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MAPS} from '../../packages/shared/dist/maps/index.js';
import {MONSTERS} from '../../packages/shared/dist/combat.js';
const atlas=JSON.parse(await readFile('docs/design/maps/world-30/atlas.json'));
const details=JSON.parse(await readFile('apps/client/src/components/maps/world-art-details.json'));
assert.equal(Object.keys(details).length,35);
for(const m of atlas.maps){const d=details[m.id];assert(d?.climate&&d.landmark&&d.activities,m.id);const connected=atlas.links.filter(l=>l.from===m.id||l.to===m.id);assert.equal(d.connections.length,connected.length);if(MAPS[m.id]){const residents=[...new Set((MAPS[m.id].spawnRegions??[]).flatMap(r=>r.monsters.map(s=>MONSTERS[s.kind].name.th)))];assert.deepEqual(d.residents,residents);assert.deepEqual(d.npcs,(MAPS[m.id].npcs??[]).map(n=>n.name.th));}else{assert.equal(d.residents.length,0);assert(d.activities.startsWith('ข้อเสนอ'));}}
console.log('PASS35 sourced details/connection endpoints, actual residents/NPCs and planned separation.');
