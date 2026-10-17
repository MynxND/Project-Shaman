import assert from 'node:assert/strict';
import {getMap,terrainHeight,elevationPassage,isBlocked,stepMovement,acceptStopAt} from '../dist/index.js';
const m=getMap('umbral-elevation-lab'),b=getMap('umbral-elevation-baseline'),flat=getMap('umbral-capital');
for(const o of flat.objects)assert.deepEqual(m.objects.find(a=>a.id===o.id),o);
assert.deepEqual(m.npcs,flat.npcs);assert.deepEqual(m.spawn,flat.spawn);
for(const n of m.npcs)assert.equal(terrainHeight(m,n.x,n.y),terrainHeight(b,n.x,n.y),'NPC terrace '+n.id);
for(const o of flat.objects.filter(o=>/house|temple|hall|gate|shop/.test(o.asset)))assert.equal(terrainHeight(m,o.x,o.y),terrainHeight(b,o.x,o.y),'building terrace '+o.id);
for(const t of m.elevation.transitions){
  const a=t.axis==='y'?{x:t.x+t.w/2,y:t.y-.1}:{x:t.x-.1,y:t.y+t.h/2},z=t.axis==='y'?{x:a.x,y:t.y+t.h+.1}:{x:t.x+t.w+.1,y:a.y};
  assert(elevationPassage(m,a,z)&&elevationPassage(m,z,a),t.id+' landings');
  for(let p=0;p<=1;p+=.025){const x=t.axis==='x'?t.x+t.w*p:t.x+t.w/2,y=t.axis==='y'?t.y+t.h*p:t.y+t.h/2;assert(!isBlocked(m,x,y),t.id+' footprint');}
}
let edges=0;const ridgeYs=new Set();
for(let x=6.5;x<75;x++)for(let y=7;y<55;y++){
  const a={x,y:y-.01},z={x,y:y+.01};
  if(Math.abs(terrainHeight(m,x,a.y)-terrainHeight(m,x,z.y))<.9)continue;
  edges++;ridgeYs.add(y);assert(!elevationPassage(m,a,z)&&!elevationPassage(m,z,a),'ridge passage');assert.deepEqual(acceptStopAt(a,z,m),a);
}
assert(ridgeYs.size>5,'natural boundary must have several authored contour depths');
let p={x:42.25,y:50};for(let i=0;i<760;i++)p=stepMovement(p,{x:0,y:-1,sequence:i},.01,m).position;assert(p.y<20);assert.equal(terrainHeight(m,p.x,p.y),2);
for(let i=0;i<760;i++)p=stepMovement(p,{x:0,y:1,sequence:i},.01,m).position;assert(p.y>49);assert.equal(terrainHeight(m,p.x,p.y),0);
console.log('PASS mountain art: unchanged originals/NPC/building levels; all S1-S6 clear; '+edges+' irregular cliff segments block both ways; continuous ascent/descent');
