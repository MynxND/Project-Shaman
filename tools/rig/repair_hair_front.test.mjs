import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),src='docs/design/character-v2/hair-front-pipeline-02/',out=src+'manual-repair-01/';
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp');
const rgba=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer();
test('Free workbench native assets replay exact guarded manual patches, never preview sheets',async()=>{
 const review=await json(out+'review.json');assert.equal(review.additionalGenerations,0);assert.equal(review.styles.length,3);
 for(const s of review.styles){const original=await rgba(src+s.id+'-raw.png'),decision=await json(out+s.id+'-edits.json'),replay=Buffer.from(original);assert.equal(hash(await load(src+s.id+'-raw.png')),decision.sourceSha256);
  for(const change of decision.changes)for(const [x,y,expected,replacement]of change.pixels){const p=(y*128+x)*4;assert.equal('#'+replay.subarray(p,p+4).toString('hex'),expected);replay.set(Buffer.from(replacement.slice(1),'hex'),p);}
  assert.ok(replay.equals(await rgba(out+s.id+'-hair.png')));assert.ok(replay.equals(await rgba(out+s.id+'-workbench-native.png')));assert.equal(hash(await load(out+s.id+'-hair.png')),s.sha256);assert.ok((await load(out+s.id+'-hair.png')).equals(await load('apps/client/public'+s.url)));
  assert.equal(s.visualApproved,false);assert.equal(s.productionReady,false);assert.equal(s.isolationRejected,false);assert.ok(s.rawUrl&&s.rawSha256);
 }
});
test('No skin palette contamination or protected overlap; all measured scalp pixels covered without moving head',async()=>{
 const scalp=await rgba(src+'scalp.png'),protection=await rgba(src+'protection.png'),body=await rgba(src+'base.png'),review=await json(out+'review.json');
 for(const s of review.styles){const pixels=await rgba(out+s.id+'-hair.png'),decision=await json(out+s.id+'-edits.json'),composite=await rgba(out+s.id+'-composite.png');let visible=0;
  for(let p=0;p<pixels.length;p+=4){if(protection[p+3]){assert.equal(pixels[p+3],0);assert.ok(composite.subarray(p,p+4).equals(body.subarray(p,p+4)));}if(scalp[p+3])assert.equal(pixels[p+3],255);if(pixels[p+3]){visible++;assert.equal(pixels[p+3],255);assert.ok(decision.paletteKeep.includes(pixels.subarray(p,p+3).toString('hex')));}else assert.ok(pixels.subarray(p,p+4).equals(Buffer.alloc(4)));}
  assert.equal(visible,s.metrics.visible);assert.equal(s.metrics.scalpGaps,0);assert.equal(s.metrics.protectedOverlap,0);assert.equal(s.metrics.warmSkinLike,0);
 }
});
test('Original paid evidence, historical ledger, body and gameplay manifest remain byte exact',async()=>{
 for(const [p,h]of Object.entries(await json(out+'frozen.json')))assert.equal(hash(await load(p)),h,p);
 const a=await json(out+'accounting.json');assert.equal(a.paidCalls,0);assert.equal(a.additionalGenerations,0);assert.equal(a.originalPaidStageSpent,18);assert.equal(a.retries,0);
});
