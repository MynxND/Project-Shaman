import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{json,rgba,hash}from'./body-eight-lib.mjs';
import{DEFAULT_HEAD,HAIRSTYLES,sanitizeHead,decodeHead,encodeHead}from'../../packages/shared/dist/index.js';
assert.equal(DEFAULT_HEAD.hairColor,'white');assert.equal(decodeHead('invalid.invalid.invalid').hairColor,'white');
for(const {id}of HAIRSTYLES)assert.equal(sanitizeHead({hair:id}).hairColor,'white');
assert.equal(decodeHead(encodeHead(sanitizeHead({hairColor:'red'}))).hairColor,'red');
const P='apps/client/public',report=await json('docs/design/ssr/white-hair-default-01/report.json'),pal=await json(P+'/assets/ssr/palettes.json');
let count=0;
for(const {set}of report.sets){
 const root=P+'/assets/ssr/candidates/'+set+'/',m=await json(root+'white-manifest.json');
 for(const f of m.files){
  const bytes=await readFile(P+f.url);assert.equal(hash(bytes),f.sha256);
  const original=await readFile(P+f.url.replace(/(\/|-)white(?=-|\.)/g,'$1silver'));assert.equal(hash(original),f.sourceSha256);
  const a=await rgba(original),b=await rgba(bytes),gold=await rgba(await readFile(P+f.url.replace(/(\/|-)white(?=-|\.)/g,'$1gold'))),black=await rgba(await readFile(P+f.url.replace(/(\/|-)white(?=-|\.)/g,'$1black')));
  for(let i=0;i<a.length;i+=4){assert.equal(a[i+3],b[i+3]);if(gold.subarray(i,i+4).equals(black.subarray(i,i+4)))assert.deepEqual(a.subarray(i,i+4),b.subarray(i,i+4));else assert(pal.hair.white.includes('#'+[...b.subarray(i,i+3)].map(n=>n.toString(16).padStart(2,'0')).join('')));}
  count++;
 }
}
console.log(`White default, existing colour preservation and ${count} lossless palette previews pass.`);
