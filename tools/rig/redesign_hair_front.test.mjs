import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),src='docs/design/character-v2/hair-front-pipeline-02/',out=src+'redesign-02/';
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp'),rgba=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer();
test('New root masks allow intentional hairline openings rather than painting all scalp',async()=>{
 const scalp=await rgba(src+'scalp.png'),protectedMask=await rgba(src+'protection.png'),r=await json(out+'review.json');
 for(const s of r.styles){const front=await rgba('apps/client/public'+s.layers.find(l=>l.pass==='front').url),target=await rgba(out+s.id+'-root-target.png');let required=0,uncovered=0,exposed=0,overlap=0;
  for(let p=0;p<65536;p+=4){if(target[p+3]){required++;assert.equal(scalp[p+3],255);if(!front[p+3])uncovered++;}if(scalp[p+3]&&!front[p+3])exposed++;if(protectedMask[p+3]&&front[p+3])overlap++;}
  assert.ok(required>0&&required<270);assert.equal(uncovered,0);assert.equal(overlap,0);assert.ok(exposed>0);assert.equal(s.metrics.visibleScalp,exposed);assert.equal(s.metrics.rootGaps,uncovered);
  // Removing a required root is an actual failure, independent of the allowed exposed skin.
  const p=target.findIndex((v,i)=>i%4===3&&v===255)-3;const damaged=Buffer.from(front);damaged[p+3]=0;assert.ok(target[p+3]&&!damaged[p+3]);
 }
});
test('Every published layer is an exact replay of free guarded Workbench edits',async()=>{
 const r=await json(out+'review.json');for(const s of r.styles)for(const layer of s.layers){const initial=layer.pass==='front'?await rgba(src+s.id+'-raw.png'):Buffer.alloc(65536);const replay=Buffer.from(initial),edits=await json(out+s.id+'-'+layer.pass+'-edits.json');
  for(const change of edits.changes)for(const [x,y,expected,replacement]of change.pixels){const p=(y*128+x)*4;assert.equal('#'+replay.subarray(p,p+4).toString('hex'),expected);replay.set(Buffer.from(replacement.slice(1),'hex'),p);}
  assert.ok(replay.equals(await rgba('apps/client/public'+layer.url)));assert.equal(hash(await load('apps/client/public'+layer.url)),layer.sha256);assert.ok(replay.equals(await rgba(out+s.id+'-'+layer.pass+'-native.png')));
 }
});
test('Rounded bob renders behind original eyes/ears/face and never changes source anatomy',async()=>{
 const r=await json(out+'review.json'),s=r.styles.find(s=>s.id==='curtain-bob');assert.deepEqual(s.layers.map(l=>l.pass),['back','front']);const body=await load(src+'base.png'),bodyPixels=await rgba(src+'base.png'),protect=await rgba(src+'protection.png');
 const back=await load('apps/client/public'+s.layers[0].url),front=await load('apps/client/public'+s.layers[1].url);
 const composite=await sharp(back).composite([{input:body},{input:front}]).ensureAlpha().raw().toBuffer();for(let p=0;p<65536;p+=4)if(protect[p+3])assert.ok(composite.subarray(p,p+4).equals(bodyPixels.subarray(p,p+4)));
 const rear=await rgba('apps/client/public'+s.layers[0].url);assert.ok(rear[(36*128+45)*4+3]);assert.equal(rear[(46*128+45)*4+3],0,'bob curves inward instead of a straight rod');
});
test('Rejection is explicit, paid cap and all original artwork/receipts stay frozen',async()=>{
 for(const [p,h]of Object.entries(await json(out+'frozen.json')))assert.equal(hash(await load(p)),h,p);
 assert.equal((await json(out+'rejection.json')).allThreeRejected,true);const r=await json(out+'review.json');assert.equal(r.styles.length,3);for(const s of r.styles){assert.equal(s.visualApproved,false);assert.equal(s.productionReady,false);}
 assert.equal((await json(out+'accounting.json')).paidGenerations,0);const design=await json(out+'design-system.json');assert.equal(design.specs.length,14);assert.equal(design.fitPolicy.visualApproval,'USER only; no numerical beauty score');
});
