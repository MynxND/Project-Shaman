import assert from 'node:assert/strict';
import { MOUNTAIN_SANCTUARY_DRAFT as map, MOUNTAIN_DRAFT_ROUTE as route, MOUNTAIN_DRAFT_SIDE_ROUTES as sides,terrainHeight,stepMovement,isBlocked,getMap,UMBRAL_CAPITAL } from '../dist/index.js';
assert.equal(getMap(map.id),UMBRAL_CAPITAL);
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

for(const id of ['summit-temple','training-hall','teacher-home','west-shrine','east-shrine'])assert(map.objects.some(o=>o.id===id),id);
console.log('PASS full-map two-way main and lateral routes, hierarchy, buildings, isolated registration');
