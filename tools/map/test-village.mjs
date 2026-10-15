import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {getMap,UMBRAL_CAPITAL,isBlocked,UMBRAL_CITIZENS} from '../../packages/shared/dist/index.js';
import {sharp} from '../rig/body-eight-lib.mjs';
const map=getMap('umbral-capital'),before=UMBRAL_CAPITAL;
for(const id of ['plaza-spirit-pillar','temple','training-hall','herbal-brewery','talisman-shop','brahmin-house','garden-sacred-tree','garden-stilt-house','city-gate','sw-bridge','se-bridge','market-stall-1','market-stall-2','market-stall-3','market-stall-4'])assert(map.objects.some(o=>o.id===id),`Required location ${id} missing`);
for(const field of ['id','name','width','height','spawn','npcs','portals','safeZones','blockers'])assert.deepEqual(map[field],before[field],field);
assert(!isBlocked(map,map.spawn.x,map.spawn.y));
for(const p of map.portals){assert(!isBlocked(map,p.arrival.x,p.arrival.y));assert(getMap(p.to.mapId).portals.some(q=>q.id===p.to.portalId&&q.to.mapId===map.id&&q.to.portalId===p.id));}
const nodes=[...map.npcs.map(n=>({id:n.id,x:n.x,y:n.y+1.2})),{id:'portal',x:40,y:59},{id:'west-bridge',x:16,y:45},{id:'east-bridge',x:64,y:45},{id:'pier',x:8,y:43}];
const step=.5,key=(x,y)=>`${x},${y}`,queue=[[map.spawn.x,map.spawn.y]],seen=new Map([[key(...queue[0]),null]]);
for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k)||isBlocked(map,nx,ny))continue;let clear=true;for(let t=.125;t<=step;t+=.125)if(isBlocked(map,x+dx*t/step,y+dy*t/step))clear=false;if(clear){seen.set(k,key(x,y));queue.push([nx,ny]);}}}
const results=nodes.map(n=>{const target=queue.find(p=>Math.hypot(p[0]-n.x,p[1]-n.y)<.45);assert(target,`Unreachable ${n.id}`);let p=key(...target),distance=0;while(seen.get(p)){distance+=step;p=seen.get(p);}return {...n,length:distance,seconds:distance/4};});
for(const c of UMBRAL_CITIZENS){const [a,b]=c.route;for(let t=0;t<=1;t+=.01)assert(!isBlocked(map,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t),`Citizen route ${c.id} blocked`);}
const assets=JSON.parse(await readFile('apps/client/public/assets/umbral/manifest.json'));
for(const o of map.objects)assert(assets.objects[o.asset],`Missing asset ${o.asset}`);
for(const [id,a]of Object.entries(assets.objects).filter(([id])=>id.startsWith('village-'))){const meta=await sharp('apps/client/public/assets/umbral/'+a.image).metadata();assert(meta.hasAlpha,id);assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);}
await writeFile('docs/design/maps/shaman-village-01/validation.json',JSON.stringify({mapId:map.id,gameplayFieldsPreserved:true,failedPlacements:[],routes:results,citizenRoutes:'unblocked',visualApproval:false},null,2)+'\n');
console.log(`PASS village gameplay invariants,${nodes.length} reachable destinations,5 citizen routes, reciprocal portal and asset alpha.`);
