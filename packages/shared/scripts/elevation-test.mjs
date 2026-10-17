import assert from'node:assert/strict';import{getMap,terrainHeight,elevationPassage,stepMovement,isBlocked,acceptStopAt}from'../dist/index.js';
const map=getMap('umbral-elevation-baseline'),flat=getMap('umbral-capital');
assert.equal(terrainHeight(map,40,50),0);assert.equal(terrainHeight(map,40,36),1);assert.equal(terrainHeight(map,40,19),2);
assert(!elevationPassage(map,{x:28,y:43},{x:28,y:45}));assert(!elevationPassage(map,{x:28,y:23},{x:28,y:25}));
for(const t of map.elevation.transitions){const a=t.axis==='y'?{x:t.x+t.w/2,y:t.y-.1}:{x:t.x-.1,y:t.y+t.h/2},b=t.axis==='y'?{x:a.x,y:t.y+t.h+.1}:{x:t.x+t.w+.1,y:a.y};assert(elevationPassage(map,a,b),t.id+' up');assert(elevationPassage(map,b,a),t.id+' down');const side=t.axis==='y'?{x:t.x-.1,y:t.y+t.h/2}:{x:t.x+t.w/2,y:t.y-.1},mid={x:t.x+t.w/2,y:t.y+t.h/2};assert(!elevationPassage(map,side,mid),t.id+' side');}
assert.deepEqual(acceptStopAt({x:28,y:43.8},{x:28,y:44.2},map),{x:28,y:43.8});
for(const o of flat.objects)assert.deepEqual(map.objects.find(v=>v.id===o.id),o);assert.deepEqual(map.npcs,flat.npcs);assert.deepEqual(map.spawn,flat.spawn);
// Actual movement path skirts the central monument/incense without changing their footprints.
let p={x:42.25,y:50};for(let i=0;i<760;i++)p=stepMovement(p,{x:0,y:-1,sequence:i},.01,map).position;assert(p.y<20,'continuous ascent to upper terrace');assert.equal(terrainHeight(map,p.x,p.y),2);
console.log('PASS S1-S6 bidirectional/endpoints/side walls; cliff sweep/stopAt; original objects/NPC/spawn; continuous ascent',p);


for(const t of map.elevation.transitions)for(let p=0;p<=1;p+=.025){const x=t.axis==='x'?t.x+t.w*p:t.x+t.w/2,y=t.axis==='y'?t.y+t.h*p:t.y+t.h/2;assert(!isBlocked(map,x,y),t.id+' existing footprint must leave center lane clear')}console.log('PASS all six transition center lanes preserve existing footprints');


