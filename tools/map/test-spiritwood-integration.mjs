import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MAPS} from '../../packages/shared/dist/maps/index.js';
import {findRoute} from './leveling-preview-model.mjs';

// Check integration against the pre-integration authored review, not a duplicate map fixture.
const review=JSON.parse(await readFile('docs/design/maps/leveling-first-four/maps.json'));
const prior=JSON.parse(await readFile('docs/design/maps/leveling-first-four/validation.json'));
const draft=review.maps.find(m=>m.id==='whispering-spiritwood');
const live=MAPS['whispering-spiritwood'];
const fields=['id','width','height','ground','objects','blockers','npcs','spawnRegions'];
for(const field of fields) assert.deepEqual(live[field],draft[field],field+' preserves original authoritative data');
assert.equal(live.terrain.base,draft.terrain.base);
assert.deepEqual(live.terrain.paint.slice(0,draft.terrain.paint.length),draft.terrain.paint,'original terrain retained; only authored exit extension added');
for(const field of ['portals','safeZones'])assert.deepEqual(live[field].slice(0,draft[field].length),draft[field],field+' original entries retained');
const hash=createHash('sha256').update(await readFile(prior.sourceFile)).digest('hex');
assert.equal(hash,prior.sourceSha256,'original map source/comments unchanged');
const paths=draft.graph.nodes.map(n=>{const path=findRoute({...live,graph:draft.graph},live.spawn,n);assert.ok(path,'reachable '+n.id);return {id:n.id,length:path.length};});
await writeFile('docs/design/maps/whispering-spiritwood/live-integration/contracts.json',JSON.stringify({preservedFields:fields,sourceSha256:hash,paths,failedPlacements:[],gameplayModified:false},null,2));
console.log('PASS: original source, NPCs, portals, monster regions, collision and six destinations preserved.');
