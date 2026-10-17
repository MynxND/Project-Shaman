// Verify real frame identities, attachment preservation and conservative scope.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const r=JSON.parse(await readFile('docs/design/walk-cycle-audit-2026-10-14/review.json'));
assert.equal(r.clips.length,64);assert.equal(r.assets.length,512);
assert.equal(new Set(r.clips.map(c=>c.key)).size,64);
const base=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json'));
for(const p of r.inputs)assert.equal(sha(await readFile(p.file)),p.sha256,'No manifest edits');
assert.equal(sha(await readFile('docs/design/equipment/class-2-imagegen-detail-01/user-head-offsets.json')),r.savedOffsetsRevision,'User saved offsets/orders preserved');
for(const a of r.assets)assert.equal(sha(await readFile(a.path)),a.sha256,'Source pixels unchanged');
for(const c of r.clips){
 assert.equal(c.before.length,8);assert.equal(c.after.length,8);assert.equal(c.frames.length,8);
 for(const index of c.after)assert(c.frames.some(f=>f.sourceIndex===index),'Every selected frame exists');
 const b=base.frames.find(b=>b.direction===c.direction);
 const m=JSON.parse(await readFile(r.inputs.find(i=>i.file.endsWith(c.scope==='production'?'manifest.json':'manifest-imagegen-detail-draft.json')).file));
 const outfit=m.outfits.find(o=>o.id===c.id||(o.id===c.id+'-detail'));
 for(const f of c.frames){const original=outfit.directions[c.direction].walk.find(p=>p.sha256===f.sha256);assert.deepEqual(f.neck,original.neck);assert.deepEqual(f.main,original.main);assert.deepEqual(f.off,original.off);
  assert.equal(f.headTranslation.y,original.neck.y+outfit.directions[c.direction].headOffset.y-2*b.neckPivot.y+b.headPivot.y);}
 if(c.change==='none')assert.deepEqual(c.after,c.before);
 else {assert.equal(c.scope,'detail-draft');assert(c.leadEvidence);assert.equal(new Set(c.after).size,3);for(let i=0;i<8;i+=2)assert.equal(c.after[i],c.after[i+1]);assert(c.residual.length>1);}
 assert.equal(c.visualApproved,false);
}
assert.equal(r.summary.reducedCandidates,18);assert.equal(r.summary.pureOrderingRepairs,0);
console.log('64 clips /512 byte-exact frames; 18 equal-held reduced candidates; saved offsets/orders and all runtime manifests unchanged.');
