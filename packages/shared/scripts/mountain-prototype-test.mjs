import assert from 'node:assert/strict';
import { MOUNTAIN_SANCTUARY_PROTOTYPE as map, MOUNTAIN_PROTOTYPE_ROUTE as route, MOUNTAIN_PROTOTYPE_SIDE_ROUTES as sides, terrainHeight, elevationPassage, stepMovement, isBlocked, acceptStopAt, UMBRAL_CAPITAL, getMap } from '../dist/index.js';

assert.equal(getMap('mountain-sanctuary-prototype'), UMBRAL_CAPITAL, 'prototype cannot be selected as a gameplay room');
assert.equal(terrainHeight(map,14,28),0);
assert.equal(terrainHeight(map,14,16),1);
assert.equal(terrainHeight(map,16,6),2);
for(const t of map.elevation.transitions) {
  const a=t.axis==='y'?{x:t.x+t.w/2,y:t.y-.1}:{x:t.x-.1,y:t.y+t.h/2},b=t.axis==='y'?{x:a.x,y:t.y+t.h+.1}:{x:t.x+t.w+.1,y:a.y};
  assert(elevationPassage(map,a,b),t.id+' descent');
  assert(elevationPassage(map,b,a),t.id+' ascent');
  const mid={x:t.x+t.w/2,y:t.y+t.h/2};
  assert(!elevationPassage(map,t.axis==='y'?{x:t.x-.1,y:mid.y}:{x:mid.x,y:t.y-.1},mid),t.id+' closed side');
  assert.equal(terrainHeight(map,mid.x,mid.y), (t.start+t.end)/2, 'landing height');
}
assert(!elevationPassage(map,{x:14,y:20},{x:14,y:22}),'lower cliff is impassable');
assert(!elevationPassage(map,{x:14,y:10},{x:14,y:13}),'upper cliff is impassable');
assert(isBlocked(map,23.5,24),'river blocks walking');
assert(!isBlocked(map,23.5,26),'bridge opens river');
assert.deepEqual(acceptStopAt({x:14,y:20.3},{x:14,y:20.7},map),{x:14,y:20.3},'stop correction cannot cross cliff');
function walk(points) {
  let position={x:points[0][0],y:points[0][1]},steps=0;
  for(const [x,y] of points.slice(1)) {
    for(let i=0;Math.hypot(x-position.x,y-position.y)>.025;i++) {
      assert(i<2000,`route blocked near ${JSON.stringify(position)} toward ${x},${y}`);
      const dx=x-position.x,dy=y-position.y,d=Math.hypot(dx,dy);
      position=stepMovement(position,{x:dx/d,y:dy/d,sequence:steps++},Math.min(.01,d/4),map).position;
      assert(!isBlocked(map,position.x,position.y));
    }
  }
  return position;
}
const summit=walk(route),foot=walk([...route].reverse());
for(const side of sides){walk(side);walk([...side].reverse());}
assert.equal(terrainHeight(map,summit.x,summit.y),2);
assert.equal(terrainHeight(map,foot.x,foot.y),0);
// Legacy map semantics are unchanged when polygon regions are absent.
assert.equal(terrainHeight(UMBRAL_CAPITAL,40,36),0);
console.log('PASS polygon Z0/Z1/Z2; two-way route; transition side walls and landings; cliff/stop rejection; river/bridge; isolated room registration');
