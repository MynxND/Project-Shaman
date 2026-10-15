import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
import{resolve}from'node:path';
import{stripTypeScriptTypes}from'node:module';
import{MAPS,isBlocked,stepMovement}from'../../packages/shared/dist/index.js';
import{materialAt}from'./leveling-preview-model.mjs';
const data=JSON.parse(await readFile('apps/client/src/components/maps/ireland-review-data.json')),kit=JSON.parse(await readFile('apps/client/public/assets/umbral/ireland-01/manifest.json')),source=await readFile('apps/client/public/assets/umbral/ireland-01/source.png');
const rasterCode=stripTypeScriptTypes(await readFile('apps/client/src/game/world/native-terrain.ts','utf8'));
const{rasterNativeTerrain}=await import('data:text/javascript;base64,'+Buffer.from(rasterCode).toString('base64'));
assert.equal(Object.keys(data).length,3);assert.equal(createHash('sha256').update(source).digest('hex'),kit.sourceSha256);for(const f of Object.values(kit.frames))assert(f.x>=0&&f.y>=0&&f.x+f.w<=kit.dimensions[0]&&f.y+f.h<=kit.dimensions[1]);
const shared=pathToFileURL(resolve('packages/shared/dist/index.js')).href;
const rasterUri='data:text/javascript;base64,'+Buffer.from(rasterCode).toString('base64');
const ecologyCode=stripTypeScriptTypes((await readFile('apps/client/src/game/world/edge-ecology-model.ts','utf8')).replace("'@shaman/shared'",JSON.stringify(shared)).replace("'./native-terrain'",JSON.stringify(rasterUri)));
const{planEdgeEcology}=await import('data:text/javascript;base64,'+Buffer.from(ecologyCode).toString('base64'));
const results=[];
for(const[id,{map:m,plan:p}]of Object.entries(data)){
 assert.equal(MAPS[id],undefined);assert.deepEqual(m,JSON.parse(await readFile(`docs/design/maps/${id}/map.json`)));assert.deepEqual(p,JSON.parse(await readFile(`docs/design/maps/${id}/plan.json`)));assert.equal(m.portals.length,0);assert.equal(m.spawnRegions.length,0);assert.equal(m.npcs.length,0);
 assert(m.terrain.paint.some(p=>p.terrain==='water'&&p.shape==='polygon'&&p.points.length>20),'authored curved cove');
 for(let y=.25;y<m.height;y+=.5)for(let x=.25;x<m.width;x+=.5)if(materialAt(m,x,y)==='water')assert(isBlocked(m,x,y),id+' unblocked wet cell');
 if(id==='golden-spiritwood'){for(const[x,y]of[[39,46],[45,43],[51,40]]){assert(!isBlocked(m,x,y));assert.notEqual(materialAt(m,x,y),'water');}for(const[x,y]of[[44,35],[44,52]])assert.equal(materialAt(m,x,y),'water');}
 const coverage=rasterNativeTerrain(m);for(let y=0;y<coverage.height;y+=23)for(let x=0;x<coverage.width;x+=23)assert.equal(coverage.water[y*coverage.width+x]>0,materialAt(m,(x+.5)/16,(y+.5)/16)==='water');
 const ids=new Set(m.objects.map(o=>o.id));assert.equal(ids.size,m.objects.length);for(const key of p.requiredObjects)assert(ids.has(key),key);
 const wet=[];for(const o of m.objects){assert(kit.frames[o.asset],o.asset);if(o.footprint)for(let y=o.y-o.footprint.h;y<=o.y;y+=.25)for(let x=o.x-o.footprint.w/2;x<=o.x+o.footprint.w/2;x+=.25)if(materialAt(m,x,y)==='water')wet.push(o.id);}
 assert.equal(wet.length,0,id+' wet footprint '+[...new Set(wet)]);
 const W=m.width*2+1,H=m.height*2+1,seen=new Uint8Array(W*H),q=[m.spawn.y*2*W+m.spawn.x*2];seen[q[0]]=1;for(let i=0;i<q.length;i++){const k=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=k%W+dx,y=Math.floor(k/W)+dy,n=y*W+x;if(x<0||y<0||x>=W||y>=H||seen[n]||isBlocked(m,x/2,y/2))continue;seen[n]=1;q.push(n);}}for(const l of p.locations)assert(seen[Math.round(l.y*2)*W+Math.round(l.x*2)],id+' unreachable '+l.id);
 const walk=(edge)=>{let pos={x:edge[0][0],y:edge[0][1]};for(const target of [...edge.slice(1),...edge.slice(0,-1).reverse()]){let ticks=0;while(Math.hypot(pos.x-target[0],pos.y-target[1])>.14&&ticks++<2000){const dx=target[0]-pos.x,dy=target[1]-pos.y;pos=stepMovement(pos,{x:Math.abs(dx)>.07?Math.sign(dx):0,y:Math.abs(dy)>.07?Math.sign(dy):0,sequence:ticks},1/60,m).position;}assert(ticks<2000,id+' stuck '+target+' at '+JSON.stringify(pos));}};
 walk(p.route);for(const edge of p.sideTours)walk(edge);
 const before=JSON.stringify(m),ecology=planEdgeEcology(m);assert.deepEqual(ecology,planEdgeEcology(m));assert.equal(JSON.stringify(m),before);assert(ecology.items.length>0&&ecology.items.length<=150);for(const d of ecology.items)assert(!isBlocked(m,d.x,d.y));
 const result={id,ecologyDecorations:ecology.items.length,liveRegistered:false,objects:m.objects.length,requiredObjects:p.requiredObjects.length,locations:p.locations.length,reachableSamples:q.length,mainAndSideRoundTrips:true,waterBlocked:true,failedPlacements:[]};results.push(result);await writeFile(`docs/design/maps/${id}/validation.json`,JSON.stringify(result,null,2));console.log('PASS',result);
}
await writeFile('docs/design/maps/ireland-three/validation.json',JSON.stringify(results,null,2));
