// Recheck recorded real transport receipts without rerunning or inventing a combat session.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const path='docs/design/bosses/shuten-doji/combat-review/evidence/network.json';
const r=JSON.parse(readFileSync(path,'utf8'));let timedHits=0;
assert.equal(r.cases.length,22);assert.equal(r.ai.length,3);assert.deepEqual(r.failures,[]);
for(const c of r.cases){
 assert(c.stayedInArena,'a dodge must not escape the arena to disable damage');
 if(c.mode==='walk-dodge')assert.equal(c.damage,0,c.skill+' actual walking damage');
 else if(c.skill!=='demon-legion')assert(c.damage>0,c.skill+' marked-area positive damage control');
 for(const e of c.hits){
  if(!e.source?.includes('shuten-doji'))continue;
  const eligible=c.cues.filter(h=>!['sake','portal','faces'].includes(h.effect)&&e.observedServerAt+100>=h.startsAt&&e.observedServerAt-100<=h.endsAt);
  assert(eligible.length,c.skill+' damage has no live authoritative hazard near receipt');timedHits++;
 }
}
for(const phase of [1,2,3])assert(r.ai.find(a=>a.phase===phase)?.samples.some(s=>s.phase===phase&&s.mode==='active'),'normal AI really entered active phase '+phase);
assert(r.ai.find(a=>a.phase===3).samples.some(s=>s.headSkill==='cursed-head'&&s.skill==='headless-rampage'),'normal head/body overlap');
r.receiptValidation={timedHits,latestSchemaClockToleranceMs:100,meaning:'received damage has an active server hazard; snapshot clock can lag event transport, not a frame-perfect GPU/hit measurement'};
writeFileSync(path,JSON.stringify(r,null,2));console.log('PASS 22 real-room controls/dodges, 3 normal-AI phases,',timedHits,'damage receipts within live hazard windows');
