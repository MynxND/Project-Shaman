import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const root=new URL('../../',import.meta.url),stage='docs/design/character-v2/hair-front-pipeline-02/';
const load=p=>readFile(new URL(p,root));const json=async p=>JSON.parse(await load(p));const hash=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(new URL('apps/client/package.json',root));const sharp=createRequire(require.resolve('next'))('sharp');
const rgba=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer();
test('Actual head/scalp pixels and reference context derive exactly from approved V2',async()=>{
 const t=await json(stage+'template.json'),body=await rgba(t.sourcePath),head=await rgba(stage+'head.png'),scalp=await rgba(stage+'scalp.png');
 assert.equal(hash(await load(t.sourcePath)),t.bodySha256);assert.deepEqual(t.spriteOrigin,{x:61,y:112});assert.equal(t.semanticLandmarksProvisional,true);
 let count=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4,selected=y>=20&&y<=49&&x>=44&&x<=80&&body[p+3];if(selected)assert.ok(head.subarray(p,p+4).equals(body.subarray(p,p+4)));else assert.equal(head[p+3],0);if(scalp[p+3]){count++;assert.ok(selected&&y<=31);}}
 assert.equal(count,270);
 for(const row of t.headRows){let xs=[];for(let x=0;x<128;x++)if(head[(row.y*128+x)*4+3])xs.push(x);assert.equal(row.left,Math.min(...xs));assert.equal(row.right,Math.max(...xs));assert.equal(row.opaque,xs.length);}
});
test('Fourteen distinct designs, three single attempts, no production adoption or frozen-file changes',async()=>{
 const design=await json(stage+'design-system.json');assert.equal(design.specs.length,14);assert.equal(new Set(design.specs.map(s=>s.silhouette)).size,14);
 for(const s of design.specs)for(const key of ['volume','hairline','fringe','sideburns','backLength','layering','silhouette','accessories'])assert.ok(s[key]);
 const review=await json(stage+'review.json'),account=await json(stage+'accounting.json');assert.equal(review.styles.length,3);assert.equal(account.attempts.length,3);assert.equal(account.chargedGenerations,18);assert.equal(account.pending,0);assert.equal(account.retries,0);
 const masks=[];for(const s of review.styles){const request=await json(stage+s.id+'-request.json');assert.equal(request.context_image.base64,(await load(stage+'head.png')).toString('base64'));assert.equal(request.image_base64,(await load(stage+'blank.png')).toString('base64'));assert.equal(request.output_method,'New layer with changes');assert.equal(request.no_background,true);assert.equal(s.visualApproved,false);assert.equal(s.productionReady,false);assert.equal(s.isolationRejected,true);assert.equal(hash(await load(stage+s.id+'-raw.png')),s.sha256);assert.ok((await load(stage+s.id+'-raw.png')).equals(await load('apps/client/public'+s.url)));masks.push(hash(await load(stage+s.id+'-mask.png')));}
 assert.equal(new Set(masks).size,3);
 for(const [p,h]of Object.entries(await json(stage+'frozen.json')))assert.equal(hash(await load(p)),h);
});
test('Returned layer diagnostics expose contamination and fit failures instead of hiding pixels',async()=>{
 const protection=await rgba(stage+'protection.png'),scalp=await rgba(stage+'scalp.png'),review=await json(stage+'review.json');
 for(const s of review.styles){const pixels=await rgba(stage+s.id+'-raw.png');let overlap=0,gaps=0,warm=0;for(let p=0;p<pixels.length;p+=4){if(pixels[p+3]&&protection[p+3])overlap++;if(scalp[p+3]&&!pixels[p+3])gaps++;if(pixels[p+3]&&pixels[p]>pixels[p+1]+20&&pixels[p+1]>pixels[p+2]+12)warm++;}assert.equal(overlap,s.metrics.protectedOverlap);assert.equal(gaps,s.metrics.scalpGaps);assert.equal(warm,s.metrics.warmSkinLike);assert.ok(warm>0);}
 assert.equal(review.styles[2].metrics.scalpGaps,146);
});
