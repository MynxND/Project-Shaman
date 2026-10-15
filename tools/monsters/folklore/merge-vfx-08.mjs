import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const [initialPath,rerunPath,outputPath]=process.argv.slice(2);
assert(initialPath&&rerunPath&&outputPath,'Pass initial238-case export,28-case framing rerun and output path');
const initial=JSON.parse(await fs.readFile(initialPath,'utf8')),rerun=JSON.parse(await fs.readFile(rerunPath,'utf8'));
assert.equal(initial.results.length,238);assert.equal(rerun.results.length,28);
assert(initial.results.every(r=>r.ok)&&rerun.results.every(r=>r.ok));
const key=r=>[r.kind,r.facing,r.outcome].join(':');
const replacement=new Map(rerun.results.map(r=>[key(r),r]));assert.equal(replacement.size,28);
for(const r of rerun.results){
 assert(r.outcome==='hit'&&['south','north'].includes(r.facing));
 assert(r.image&&r.impactImage);
 for(const slot of ['image','impactImage'])assert.equal(Buffer.from(r[slot].split(',')[1],'base64').readUInt32BE(20),520,'Framing replay must use actual520px-high PNGs');
 const before=initial.results.find(b=>key(b)===key(r));assert(before);
 for(const field of ['range','flightMs','frame','facingSeen'])assert.equal(r[field],before[field],field);
}
const provenance={initialDate:initial.date,initialCases:238,initialPassed:238,framingDate:rerun.date,framingCases:28,framingPassed:28,reason:'Initial360px-high scene crop cut long-range vertical caster/effect tips. Replayed all14 north/south hits with520px crop; gameplay and art unchanged.',results:rerun.results.map(({image,impactImage,...r})=>r)};
await fs.writeFile('docs/design/monsters/folklore-01/vfx-08/framing-rerun.json',JSON.stringify(provenance,null,2)+'\n');
await fs.writeFile(outputPath,JSON.stringify({...initial,framingReview:{...provenance,results:undefined},results:initial.results.map(r=>replacement.get(key(r))??r)}));
console.log('Merged28 validated north/south hit replays;238 unique covered cases retained');
