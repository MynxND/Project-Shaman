import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {MAPS} from '../../packages/shared/dist/maps/index.js';
import {isBlocked,terrainVertices} from '../../packages/shared/dist/world.js';
import {MONSTERS} from '../../packages/shared/dist/combat.js';
import {materialAt} from './leveling-preview-model.mjs';
const review=JSON.parse(await readFile('docs/design/maps/leveling-first-four/maps.json'));
const art=JSON.parse(await readFile('apps/client/public/assets/umbral/manifest.json'));
function routes(map){
 const w=map.width*2+1,h=map.height*2+1,seen=new Int32Array(w*h).fill(-1),start=Math.round(map.spawn.y*2)*w+Math.round(map.spawn.x*2),queue=[start];seen[start]=0;
 for(let i=0;i<queue.length;i++){const k=queue[i],x=k%w,y=Math.floor(k/w);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||seen[n]>=0||[.25,.5,.75,1].some(t=>isBlocked(map,(x+dx*t)/2,(y+dy*t)/2)))continue;seen[n]=seen[k]+1;queue.push(n);}}
 return {queue,w,seen};
}
const results=[];
for(const id of ['whispering-spiritwood','lantern-paddy','moon-mangrove','monsoon-marsh']){
 const m=MAPS[id],draft=review.maps.find(m=>m.id===id),r=routes(m);assert(!isBlocked(m,m.spawn.x,m.spawn.y));
 for(const o of m.objects)assert(art.objects[o.asset],'asset '+o.id);
 const targets=[...m.portals.flatMap(p=>[{id:p.id,x:p.area.x+p.area.w/2,y:p.area.y+p.area.h/2},{id:p.id+'-arrival',...p.arrival}]),...draft.graph.nodes,...draft.locations.map(l=>({id:l.id,...l.entrance}))];
 const reachable=targets.map(t=>{const k=r.queue.find(k=>Math.hypot(k%r.w/2-t.x,Math.floor(k/r.w)/2-t.y)<.55);assert(k!==undefined,'unreachable '+id+':'+t.id);return{id:t.id,length:r.seen[k]/2};});
 for(const p of m.portals){const back=MAPS[p.to.mapId]?.portals?.find(q=>q.id===p.to.portalId);assert(back,'missing destination '+p.id);assert.equal(back.to.mapId,id);assert.equal(back.to.portalId,p.id);assert(!isBlocked(m,p.arrival.x,p.arrival.y));assert(!(p.arrival.x>=p.area.x&&p.arrival.x<=p.area.x+p.area.w&&p.arrival.y>=p.area.y&&p.arrival.y<=p.area.y+p.area.h),'arrival bounce');}
 for(const region of m.spawnRegions){let valid=0;for(let y=region.area.y;y<region.area.y+region.area.h;y+=.5)for(let x=region.area.x;x<region.area.x+region.area.w;x+=.5)if(!isBlocked(m,x,y)&&!(m.safeZones??[]).some(s=>x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h))valid++;assert(valid>region.monsters.reduce((n,m)=>n+m.count,0),'spawn capacity '+region.id);for(const s of region.monsters)assert(MONSTERS[s.kind],'combat kind '+s.kind);}
 if(id!=='whispering-spiritwood'){for(let y=.25;y<m.height;y+=1)for(let x=.25;x<m.width;x+=1)if(materialAt(m,x,y)==='water')assert(isBlocked(m,x,y),'walkable water '+id);const v=terrainVertices(m);assert(v.includes('water'));}
 results.push({id,requiredTargets:reachable,failedPlacements:[],waterBlocked:id!=='whispering-spiritwood',portals:m.portals.map(p=>p.id)});
}
await writeFile('docs/design/maps/spiritwood-refinement-02/navigation.json',JSON.stringify(results,null,2));
console.log('PASS all four maps: required locations/entrances, reciprocal portals, safe arrivals, water collision, monster capacity and art.');
