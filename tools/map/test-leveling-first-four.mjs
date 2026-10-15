import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{WHISPERING_SPIRITWOOD}from'../../packages/shared/dist/maps/whispering-spiritwood.js';
import{blocked,findRoute,materialAt,fogAllowed,inRect}from'./leveling-preview-model.mjs';
const root='docs/design/maps/leveling-first-four/',d=JSON.parse(await readFile(root+'maps.json')),v=JSON.parse(await readFile(root+'validation.json'));
assert.equal(d.maps.length,4);assert.equal(new Set(d.maps.map(m=>m.id)).size,4);assert.equal(d.runtimePublished,false);
assert.deepEqual(d.maps[0].objects,WHISPERING_SPIRITWOOD.objects);assert.deepEqual(d.maps[0].terrain,WHISPERING_SPIRITWOOD.terrain);assert.deepEqual(d.maps[0].spawnRegions,WHISPERING_SPIRITWOOD.spawnRegions);
assert.equal(createHash('sha256').update(await readFile(v.sourceFile)).digest('hex'),v.sourceSha256);
let destinations=0;
for(const m of d.maps){assert(!blocked(m,m.spawn.x,m.spawn.y));assert.equal(v.checks.find(c=>c.id===m.id).failedPlacements.length,0);
 for(const n of [...m.graph.nodes,...m.locations.map(l=>({id:l.id,...l.entrance}))]){const r=findRoute(m,m.spawn,n);assert(r,'Unreachable '+m.id+'/'+n.id);for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4);for(let j=0;j<=steps;j++)assert(!blocked(m,a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps));}destinations++;}
 for(const l of m.locations)assert(m.objects.some(o=>o.id===l.id),'Required object absent '+l.id);
 if(!m.sourcePreserved)for(const o of m.objects.filter(o=>o.footprint)){const f=o.footprint;for(let x=o.x-f.w/2;x<=o.x+f.w/2;x+=.25)for(let y=o.y-f.h;y<=o.y;y+=.25)assert.notEqual(materialAt(m,x,y),'water','Unsupported footprint '+m.id+'/'+o.id);}
 for(const zone of m.fog){assert(zone.alpha<=.18);for(const n of m.graph.nodes)assert.equal(fogAllowed(m,zone,n.x,n.y),false,'Node masked');for(const s of m.safeZones??[])assert.equal(fogAllowed(m,zone,s.x+s.w/2,s.y+s.h/2),false,'Safe zone masked');}
 for(const r of m.spawnRegions){let count=0;for(let x=r.area.x+.5;x<r.area.x+r.area.w;x++)for(let y=r.area.y+.5;y<r.area.y+r.area.h;y++)if(!blocked(m,x,y)&&!(m.safeZones??[]).some(s=>inRect({x,y},s)))count++;assert(count>=r.monsters.reduce((n,a)=>n+a.count,0),'Spawn capacity '+r.id);}
}
const coast=d.maps[2];assert.equal(materialAt(coast,2,2),'water');assert(blocked(coast,2,2));for(const x of[28,32,52,54])assert(!blocked(coast,x,40),'Bridge must cross water');assert.equal(d.maps[1].fog.length,0);
// Continuous updates must arrive exactly at corners, avoiding residual offsets
// which previously stopped the inspector along a bridge boundary.
for(const m of d.maps)for(const n of m.graph.nodes){let p={...m.spawn};for(const target of findRoute(m,p,n).points.slice(1)){for(let t=0;t<10000;t++){const dx=target[0]-p.x,dy=target[1]-p.y,length=Math.hypot(dx,dy);if(length===0)break;const step=Math.min(.064,length),x=step===length?target[0]:p.x+dx/length*step,y=step===length?target[1]:p.y+dy/length*step;assert(!blocked(m,x,y),'Continuous route '+m.id+'/'+n.id);p={x,y};}}assert.equal(p.x,n.x);assert.equal(p.y,n.y);}
assert.equal(Object.keys(d.monsters).length,7);for(const [id,m]of Object.entries(d.monsters))assert.equal(createHash('sha256').update(await readFile(root+'monsters/'+id+'/seed.png')).digest('hex'),m.sha256);
console.log(`PASS:4 maps,${destinations} reachable destinations, required IDs, bridge/water collision, spawn capacity, fog safe masks,7 sprite hashes; original map geometry/art unchanged.`);
