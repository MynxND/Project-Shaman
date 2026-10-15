import assert from 'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{isBlocked,terrainHeight,elevationPassage,stepMovement,MAPS}from'../../packages/shared/dist/index.js';
const root='docs/design/maps/mountain-spirit-sanctuary/',map=JSON.parse(await readFile(root+'map.json')),review=JSON.parse(await readFile(root+'review.json')),manifest=JSON.parse(await readFile('apps/client/public/assets/umbral/manifest.json'));
assert(MAPS[map.id],'authorized live registration');assert.equal(map.portals.length,2);assert.deepEqual(MAPS[map.id],map);
const ids=new Set(map.objects.map(o=>o.id));assert.equal(ids.size,map.objects.length);for(const id of review.requiredObjects)assert(ids.has(id),id);
const failures=[];
for(const o of map.objects){assert(manifest.objects[o.asset],o.asset);if(!o.footprint)continue;const expected=terrainHeight(map,o.x,o.y);for(let y=o.y-o.footprint.h;y<=o.y;y+=.25)for(let x=o.x-o.footprint.w/2;x<=o.x+o.footprint.w/2;x+=.25)if(terrainHeight(map,x,y)!==expected||map.blockers.some(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h))failures.push(o.id);}
assert.equal(failures.length,0,'unsupported footprints: '+[...new Set(failures)]);
const W=map.width*2+1,H=map.height*2+1,seen=new Uint8Array(W*H),q=[Math.round(map.spawn.y*2)*W+Math.round(map.spawn.x*2)];seen[q[0]]=1;
for(let i=0;i<q.length;i++){const k=q[i],a={x:k%W/2,y:Math.floor(k/W)/2};for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=k%W+dx,y=Math.floor(k/W)+dy,n=y*W+x;if(x<0||y<0||x>=W||y>=H||seen[n])continue;const b={x:x/2,y:y/2};if(isBlocked(map,b.x,b.y)||!elevationPassage(map,a,b))continue;seen[n]=1;q.push(n);}}
for(const n of map.npcs){assert(manifest.npcs[n.sprite],n.id);const y=n.y+1;assert(seen[Math.round(y*2)*W+Math.round(n.x*2)],'NPC approach '+n.id);}
for(const l of review.locations)assert(seen[Math.round(l.y*2)*W+Math.round(l.x*2)],'unreachable '+l.id);
assert(!elevationPassage(map,{x:44,y:40},{x:44,y:44}),'cliff must reject shortcut');
assert.deepEqual(JSON.parse(await readFile('apps/client/src/components/maps/sanctuary-review-map.json')),map,'preview drift');
assert.deepEqual(JSON.parse(await readFile('apps/client/src/components/maps/sanctuary-review-plan.json')),review,'plan drift');
let p={...map.spawn};for(const target of [...review.route.slice(1),...review.route.slice(0,-1).reverse()]){let ticks=0;while(Math.hypot(p.x-target[0],p.y-target[1])>.1&&ticks++<2000){const dx=target[0]-p.x,dy=target[1]-p.y;p=stepMovement(p,{x:Math.abs(dx)>.06?Math.sign(dx):0,y:Math.abs(dy)>.06?Math.sign(dy):0,sequence:ticks},1/60,map).position;}assert(ticks<2000,'movement stuck '+target);}
const result={requiredObjects:review.requiredObjects.length,objects:map.objects.length,reachableLocations:review.locations.length,reachableSamples:q.length,failedPlacements:failures,mainClimbAndReturn:true,cliffShortcutRejected:true,registered:true};await writeFile(root+'validation.json',JSON.stringify(result,null,2));console.log('PASS',result);
