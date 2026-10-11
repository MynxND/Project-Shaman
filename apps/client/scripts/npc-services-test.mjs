import assert from 'node:assert/strict';
import { UMBRAL_CAPITAL as map, newProfile, QUESTS } from '../../../packages/shared/dist/index.js';
import { parseNpcRequest, runNpcRequest } from '../../server/dist/rooms/npc-services.js';
const at = id => { const n=map.npcs.find(n=>n.id===id); return {x:n.x,y:n.y+0.6}; };
let p=newProfile(map.spawn);
const call = (npc,action,extra={}) => {
  const request=parseNpcRequest({npc,action,...extra}); assert.ok(request);
  const result=runNpcRequest(map,p,at(npc),request,0,1);
  if(result.ok)p=result.profile;
  return result;
};
assert.equal(parseNpcRequest({npc:'herbalist',action:'buy',itemId:'potion-red',qty:NaN}),null);
assert.equal(parseNpcRequest({npc:'herbalist',action:'buy',itemId:'potion-red',qty:1.5}),null);
assert.equal(runNpcRequest(map,p,map.spawn,{npc:'herbalist',action:'buy',itemId:'potion-red',qty:1},0,1).error,'too-far');
assert.equal(call('guard','heal').error,'bad-request');
assert.equal(call('herbalist','buy',{itemId:'spirit-sash',qty:1}).error,'not-sold-here');
const quantity=()=>p.stacks.find(s=>s.itemId==='potion-red').quantity;
const old=quantity();assert.ok(call('herbalist','buy',{itemId:'potion-red',qty:1}).ok);assert.equal(quantity(),old+1);
assert.ok(call('herbalist','sell',{uid:p.stacks.find(s=>s.itemId==='potion-red').uid,qty:1}).ok);assert.equal(quantity(),old);
const gear=p.stacks.find(s=>s.itemId==='shaman-sash').uid;
assert.ok(call('storage','deposit',{uid:gear}).ok);assert.ok(p.storage.some(s=>s.uid===gear));
assert.ok(call('storage','withdraw',{uid:gear}).ok);assert.ok(p.stacks.some(s=>s.uid===gear));
assert.ok(call('talisman','buy',{itemId:'dark-ore',qty:1}).ok);
assert.ok(call('smith','refine',{uid:gear}).ok);assert.equal(p.refine[gear],1);
assert.ok(call('keeper','heal').ok);assert.equal(p.hp,p.hpMax);assert.equal(p.sp,p.spMax);
assert.ok(call('keeper','save').ok);assert.deepEqual(p.savePoint,at('keeper'));
assert.ok(call('instructor','learn',{skillId:'soul-heal'}).ok);assert.equal(p.skills['soul-heal'],1);
assert.ok(call('trader','exchange',{side:'buy',qty:1}).ok);assert.equal(p.gold,1);
assert.ok(call('trader','exchange',{side:'sell',qty:1}).ok);assert.equal(p.gold,0);
assert.ok(call('elder','accept',{questId:'first-steps'}).ok);
assert.equal(call('elder','accept',{questId:'first-steps'}).error,'quest-active');
assert.ok(call('teleporter','teleport',{dest:'save'}).moveTo);
assert.ok(call('teleporter','teleport',{dest:'market'}).moveTo);
assert.equal(call('teleporter','teleport',{dest:'invalid'}).error,'unknown-destination');
const independent=newProfile(map.spawn);assert.equal(independent.hp,newProfile(map.spawn).hp);assert.ok(independent.hp<independent.hpMax);assert.equal(independent.refine[gear],undefined);
console.log('NPC services: role/range/stock validation, buy/sell, storage, refine, heal/save, learning, exchange, quest acceptance, teleport and profile isolation passed');

// Job advancement at the trainer (job-progression.ts): needs Job Lv 10 + the apprentice trial; then the branch tree opens.
{ assert.equal(parseNpcRequest({npc:'instructor',action:'advance',branch:42}),null);
  let r=call('instructor','advance',{branch:'ullr-hunter'}); assert.deepEqual(r,{ok:false,error:'job-level-low'});
  assert.equal(call('herbalist','advance',{branch:'ullr-hunter'}).ok,false,'only trainers advance jobs');
  p={...p,jobLevel:10,quests:{...p.quests,'job-apprentice-trial':{step:2,done:true}}};
  r=call('instructor','advance',{branch:'ullr-hunter'}); assert.ok(r.ok,JSON.stringify(r)); assert.equal(p.jobTier,2); assert.equal(p.branch,'ullr-hunter'); assert.equal(p.jobLevel,1);
  p={...p,skillPoints:1}; r=call('instructor','learn',{skillId:'twin-shot'}); assert.ok(r.ok); assert.equal(p.skills['twin-shot'],1);
  assert.equal(call('instructor','learn',{skillId:'frost-bolt'}).error??'', 'skill-locked'); }
console.log('npc job advancement: trainer-only, level/quest gates, branch pick, tree unlock passed');
