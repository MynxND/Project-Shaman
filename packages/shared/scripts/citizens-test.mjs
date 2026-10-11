import assert from 'node:assert/strict';
import { UMBRAL_CITIZENS, UMBRAL_CAPITAL as map, createCitizenMotion, stepCitizen, isBlocked, exchangeGold, newProfile } from '../dist/index.js';

for (const def of UMBRAL_CITIZENS) {
  let state = createCitizenMotion(def);
  const endpoints = new Set();
  let moved = false, paused = false;
  for (let i=0; i<6000; i++) {
    const before = state;
    state = stepCitizen(def,state,1/30,map);
    assert.ok(!isBlocked(map,state.x,state.y),`${def.id}: route avoids buildings, service NPCs and water`);
    assert.ok(Math.hypot(state.x-before.x,state.y-before.y) <= def.speed/30+1e-8,'speed bound');
    assert.equal(state.y,def.route[0].y,'stays on authored lane');
    moved ||= state.moving; paused ||= !state.moving;
    for (let n=0;n<2;n++) if (Math.hypot(state.x-def.route[n].x,state.y-def.route[n].y)<0.01) endpoints.add(n);
  }
  assert.ok(moved && paused && endpoints.size===2,`${def.id}: walks both ways, pauses, loops`);
  const delayed = stepCitizen(def,{...createCitizenMotion(def),wait:0},20,map);
  assert.ok(Math.abs(delayed.x-createCitizenMotion(def).x)<=def.speed*0.1+1e-8,'delayed ticks bounded');
}
const p=newProfile(map.spawn);
const buy=exchangeGold(p,'buy',2); assert.ok(buy.ok);
assert.equal(buy.profile.silver,p.silver-200); assert.equal(buy.profile.gold,2);
const sell=exchangeGold(buy.profile,'sell',1); assert.ok(sell.ok);
assert.equal(sell.profile.gold,1); assert.equal(sell.profile.silver,p.silver-110);
assert.equal(exchangeGold(p,'sell',1).ok,false);
assert.equal(exchangeGold(p,'buy',-1).ok,false);
assert.equal(p.gold,0,'no mutation of input');
console.log('citizens: five safe looping routes, pauses and bounded movement; NPC Gold exchange atomic');
