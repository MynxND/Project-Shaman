import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {KOSCHEI_SKILLS,MAIYARAP_SKILLS} from '../../packages/shared/dist/index.js';
const summary={uncertaintyMs:150,bosses:{},timedHits:0};
for(const boss of ['koschei','maiyarap']){
 const p='docs/design/bosses/'+boss+'/evidence/',main=JSON.parse(readFileSync(p+'network.json')),ext=JSON.parse(readFileSync(p+'network-extended.json'));
 assert.equal(main.failures.length,0);assert.equal(ext.failures.length,0);assert.equal(main.cases.length,20);assert(main.counterplay.countered);assert.deepEqual(main.ai.map(a=>a.phase),[1,2,3]);
 const rows=[];
 for(const c of main.cases.filter(c=>c.mode==='positive')){
  const dodge=main.cases.find(d=>d.skill===c.skill&&d.mode==='walk-dodge');assert(c.damage>0);assert.equal(dodge.damage,0);assert(c.stayedInCourt&&dodge.stayedInCourt);
  for(const hit of c.hits.filter(h=>h.target.kind==='player')){
   assert(c.cues.some(h=>hit.at>=h.startsAt-150&&hit.at<=h.endsAt+150),boss+' '+c.skill+' damage outside reported contact window');summary.timedHits++;
  }
  rows.push({skill:c.skill,phase:c.phase??(boss==='koschei'?KOSCHEI_SKILLS:MAIYARAP_SKILLS)[c.skill].phase,positive:c.damage,dodge:dodge.damage,stayedInCourt:true,timing:'within server window ±150ms receipt uncertainty'});
 }
 const ultimate=ext.cases.filter(c=>['outside-refuge','walk-to-refuge'].includes(c.mode));assert.equal(ultimate.length,2);assert.equal(ultimate.find(c=>c.mode==='walk-to-refuge').damage,0);
 summary.bosses[boss]={rows,ultimate,counterplayMs:main.counterplay.elapsed,ai:main.ai.map(a=>({phase:a.phase,alive:a.alive,skills:a.skills})),extendedCases:ext.cases.length};
}
writeFileSync('docs/design/bosses/telegraph-combat-review/results.json',JSON.stringify(summary,null,2));
console.log('PASS40 live-room stand/walk cases,4 ultimate failure/refuge controls,2 solo ritual counters,6 normal AI phase samples; '+summary.timedHits+' damage receipts within contact windows ±150ms');
