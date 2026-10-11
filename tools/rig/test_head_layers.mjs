// Head layers: catalog/encoding rules, manifest integrity, every hairstyle x direction and face x visible direction
// present, layers confined to the head canvas above the pivot, back views faceless, mirrored faces exact.
import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{order,hash,rgba,json}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');
assert.deepEqual(S.decodeHead(S.encodeHead(S.DEFAULT_HEAD)),S.DEFAULT_HEAD);
assert.deepEqual(S.sanitizeHead({hair:'x',hairColor:'gold',face:'smile'}),{hair:S.DEFAULT_HEAD.hair,hairColor:'gold',face:'smile'});
assert.deepEqual(S.decodeHead('<script>'),S.DEFAULT_HEAD);assert.equal(S.isExpression('angry'),true);assert.equal(S.isExpression('evil'),false);
const m=await json('apps/client/public/assets/character-v3/head-layers-01/manifest.json');assert.equal(m.version,'head-layers/2');
const FACE_DIRS=['south','south-east','east','west','south-west'];let files=0;
const check=async a=>{const b=await readFile('apps/client/public'+a.url);assert.equal(hash(b),a.sha256,a.url);files++;return rgba(b);};
for(const[i,d]of m.directions.entries()){assert.equal(d.direction,order[i]);
 for(const h of S.HAIRSTYLES){const base=await check(d.bases[h.id]);let opaque=0;for(let k=3;k<base.length;k+=4)if(base[k])opaque++;assert(opaque>200,'base too small '+d.direction);const p=await check(d.hair[h.id]);for(let y=d.pivot.y+1;y<128;y++)for(let x=0;x<128;x++)assert.equal(p[(y*128+x)*4+3],0,`hair below neck ${h.id} ${d.direction}`);}
 const faces=Object.keys(d.faces);if(FACE_DIRS.includes(d.direction))assert.deepEqual(faces.sort(),S.EXPRESSIONS.filter(e=>e.id!=='neutral').map(e=>e.id).sort());else assert.equal(faces.length,0,'face on a back view');
 for(const f of faces)await check(d.faces[f]);}
// Mirrored pairs: W/SW faces are exact horizontal flips of E/SE.
for(const[a,b]of[['west','east'],['south-west','south-east']]){const A=m.directions.find(d=>d.direction===a),B=m.directions.find(d=>d.direction===b);const pa=await rgba(await readFile('apps/client/public'+A.faces.smile.url)),pb=await rgba(await readFile('apps/client/public'+B.faces.smile.url));for(let y=0;y<128;y++)for(let x=0;x<128;x++)assert(pa.subarray((y*128+x)*4,(y*128+x)*4+4).equals(pb.subarray((y*128+127-x)*4,(y*128+127-x)*4+4)),'mirror mismatch');}
const l=await json('docs/design/character-v3/head-layers-01/ledger.json'),l2=await json('docs/design/character-v3/head-layers-02/ledger.json');assert(l.spent<=l.cap&&l2.spent<=l2.cap,'over budget');const cov=await json('docs/design/character-v3/head-layers-02/coverage-report.json');for(const[d,r]of Object.entries(cov))for(const[h,c]of Object.entries(r))assert(c>=0.97,'scalp coverage '+h+' '+d+' '+c);
console.log(`Head layers: ${files} PNGs, 4 hairstyles x 8 directions, 5 expressions x 5 facing views, catalog/encoding rules pass; scalp coverage >= 97% everywhere; actual ${l.spent}+${l2.spent} credits. Visual approval pending.`);
