import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MAPS} from '../../packages/shared/dist/maps/index.js';
const atlas=JSON.parse(await readFile('docs/design/maps/world-30/atlas.json'));
assert.equal(atlas.maps.length,34);assert.equal(new Set(atlas.maps.map(m=>m.id)).size,34);assert.equal(atlas.nations.length,12);
assert.equal(atlas.maps.filter(m=>MAPS[m.id]).length,18);
for(const n of atlas.nations){assert(n.sourceNation);assert.equal(n.sourceBranches.length,2);assert(n.maps.every(id=>atlas.maps.some(m=>m.id===id&&m.nation===n.id)));}
const seen=new Set(['umbral-capital']);for(let changed=true;changed;){changed=false;for(const e of atlas.links){assert(atlas.maps.some(m=>m.id===e.from));assert(atlas.maps.some(m=>m.id===e.to));if(seen.has(e.from)&&!seen.has(e.to)){seen.add(e.to);changed=true;}if(seen.has(e.to)&&!seen.has(e.from)){seen.add(e.from);changed=true;}}}
assert.equal(seen.size,34,'entire proposal connected');
const chain=[['whispering-spiritwood','paddy-gate'],['lantern-paddy','north-gate'],['moon-mangrove','east-gate'],['monsoon-marsh','mountain-gate'],['mountain-spirit-sanctuary','bamboo-gate'],['mist-bamboo','tea-gate']];
for(const [id,gate]of chain){const m=MAPS[id],p=m.portals.find(p=>p.id===gate);assert(p.area.x>=m.width-3,'east boundary '+id);const dest=MAPS[p.to.mapId],back=dest.portals.find(q=>q.id===p.to.portalId);assert(back.area.x<=2,'west boundary '+dest.id);}
console.log('PASS34 unique connected atlas nodes,12 source-bound nations,18 live/16 planned and east-to-west boundary chain.');
