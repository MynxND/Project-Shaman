import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{MAPS,MONSTERS,isBlocked,pointInRect,pickSpawnPoint}from'../../packages/shared/dist/index.js';
import{findRoute,materialAt}from'./leveling-preview-model.mjs';
const ids=['ashwind-volcano','ember-caldera','obsidian-estuary'],manifest=JSON.parse(await readFile('apps/client/public/assets/monsters/manifest.json')),npcs=JSON.parse(await readFile('apps/client/public/assets/umbral/manifest.json')).npcs,results=[];
for(const id of [...ids,'mountain-spirit-sanctuary']){
 const m=MAPS[id],before=JSON.parse(await readFile(`docs/design/maps/${id}/live03/before-map.json`));
 for(const key of ['objects','blockers','width','height'])assert.deepEqual(m[key],before[key],id+' original '+key);
 assert.deepEqual(m.terrain.paint.slice(0,before.terrain.paint.length),before.terrain.paint);
 if(id==='mountain-spirit-sanctuary'){assert.deepEqual(m.portals.slice(0,before.portals.length),before.portals);for(const key of ['npcs','safeZones','spawnRegions','elevation'])assert.deepEqual(m[key],before[key]);}
 for(const p of m.portals){const dest=MAPS[p.to.mapId],back=dest.portals.find(q=>q.id===p.to.portalId);assert(back);assert.equal(back.to.mapId,id);assert.equal(back.to.portalId,p.id);assert(!pointInRect(p.arrival,p.area));assert(!isBlocked(m,p.arrival.x,p.arrival.y));assert(findRoute(m,m.spawn,p.arrival));assert(findRoute(m,p.arrival,{x:p.area.x+p.area.w/2,y:p.area.y+p.area.h/2}));}
 if(!ids.includes(id))continue;
 assert.equal(m.npcs.length,3);assert.equal(m.spawnRegions.length,3);
 for(const n of m.npcs){assert(npcs[n.sprite]);assert.equal(isBlocked({...m,npcs:[]},n.x,n.y),false);assert.notEqual(materialAt(m,n.x,n.y),'water');assert(findRoute(m,m.spawn,{x:n.x,y:n.y+1.5}),n.id+' approach');}
 const campSamples=[];
 for(const region of m.spawnRegions){let count=0;for(let y=region.area.y+.25;y<region.area.y+region.area.h;y+=.5)for(let x=region.area.x+.25;x<region.area.x+region.area.w;x+=.5)if(!isBlocked(m,x,y)&&!m.safeZones.some(s=>pointInRect({x,y},s)))count++;assert(count>50,region.id+' viable camp');for(const s of region.monsters){assert(MONSTERS[s.kind]);assert(manifest.monsters[s.kind]);}let seed=15;for(let i=0;i<40;i++){const p=pickSpawnPoint(m,region,()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32));assert(p);assert.notEqual(materialAt(m,p.x,p.y),'water');}campSamples.push(count);}
 const r={id,objectsPreserved:true,geometryPreserved:true,reciprocalEdges:true,npcs:3,residents:9,campSamples,failedPlacements:[]};results.push(r);console.log('PASS',r);
}
await writeFile('docs/design/maps/indonesia-three/live-geometry.json',JSON.stringify(results,null,2));
