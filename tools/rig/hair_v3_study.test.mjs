import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root=new URL('../../',import.meta.url),out='docs/design/hair-v3/front-01/',req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp');
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),rgba=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer(),hash=b=>createHash('sha256').update(b).digest('hex');
test('Original guarded layer edits and targeted knot cleanup exactly match published native PNGs',async()=>{
 const review=await json(out+'review.json');assert.equal(review.styles.length,3);assert.equal(review.visualApproved,false);
 for(const s of review.styles)for(const l of s.layers){const b=await load('apps/client/public'+l.url),meta=await sharp(b).metadata();assert.equal(meta.width,128);assert.equal(meta.height,128);assert.equal(hash(b),l.sha256);const p=await rgba('apps/client/public'+l.url),request=await json(out+s.id+'-'+l.pass+'-request.json'),changes=JSON.parse(request.argv[3]),expected=Buffer.alloc(65536);if(s.id==='ritual-topknot'){const c=await json(out+'ritual-topknot-cleanup-request.json');changes.push(...JSON.parse(c.argv[3]));}for(const c of changes)for(const[x,y,old,next]of c.pixels){assert.equal(old,'#00000000');expected.set(Buffer.from(next.slice(1),'hex'),(y*128+x)*4);}assert.deepEqual(p,expected);}
});
test('Five-color opaque clusters preserve all protected original anatomy',async()=>{
 const review=await json(out+'review.json'),base=await rgba('docs/design/character-v2/hair-front-pipeline-02/base.png'),protect=await rgba('docs/design/character-v2/hair-front-pipeline-02/protection.png');
 for(const s of review.styles){const colors=new Set(),back=[],front=[];for(const l of s.layers){const p=await rgba('apps/client/public'+l.url);(l.pass==='back'?back:front).push(p);for(let n=0;n<p.length;n+=4){assert.ok(p[n+3]===0||p[n+3]===255);if(p[n+3])colors.add(p.subarray(n,n+3).toString('hex'));if(l.pass!=='back'&&protect[n+3])assert.equal(p[n+3],0);}}assert.equal(colors.size,5);const composite=Buffer.alloc(65536);for(const p of [...back,base,...front])for(let n=0;n<p.length;n+=4)if(p[n+3])p.copy(composite,n,n,n+4);for(let n=0;n<base.length;n+=4)if(protect[n+3])assert.deepEqual(composite.subarray(n,n+4),base.subarray(n,n+4));assert.equal(s.metrics.protectedOverlap,0);}
});
test('Historical assets frozen and actual live balance unchanged',async()=>{
 for(const[p,h]of Object.entries(await json(out+'frozen.json')))assert.equal(hash(await load(p)),h,p);
 const texts=await Promise.all(['balance-before.json','balance-after.json'].map(async p=>(await json(out+p)).result.content.find(c=>c.type==='text').text));assert.equal(texts[0].match(/generations_remaining: (\d+)/)[1],texts[1].match(/generations_remaining: (\d+)/)[1]);const cost=await json(out+'accounting.json');assert.equal(cost.creditsConsumed,0);assert.equal(cost.paidGenerationCalls,0);assert.equal(cost.freeExactEdits,7);assert.equal(cost.retries,0);
});
test('Silhouette is an actual native file and candid root diagnostics remain visible',async()=>{
 const r=await json(out+'review.json');assert.deepEqual(r.styles.map(s=>s.metrics.rootGaps),[0,0,0]);for(const s of r.styles){const flat=await rgba('apps/client/public'+s.flatUrl),colors=new Set();for(let p=0;p<flat.length;p+=4)if(flat[p+3])colors.add(flat.subarray(p,p+4).toString('hex'));assert.equal(colors.size,1);assert.equal(s.productionReady,false);}
});
