import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{json,rgba,hash}from'./body-eight-lib.mjs';import*as H from'./ssr-hair-standard.mjs';
const S=await import('../../packages/shared/dist/index.js'),P='apps/client/public',pal=await json(P+'/assets/ssr/palettes.json');
for(const set of ['swept-spikes-eight-01','curtain-gold-eight-01']){
 const root=P+'/assets/ssr/candidates/'+set+'/',m=await json(root+'manifest.json');
 assert.equal(m.files.filter(f=>f.id.startsWith('red-')).length,32);
 for(const f of m.details){const b=await readFile(P+f.url);assert.equal(hash(b),f.sha256);const px=await rgba(b);assert.equal(px.length,64*128*4);}
 let changes=0;
 for(const dir of S.SSR_DIRECTIONS){
  const red=await rgba(await readFile(root+'red-'+dir+'-head.png')),silver=await rgba(await readFile(root+'silver-'+dir+'-head.png'));
  const mirror={west:'east','south-west':'south-east','north-west':'north-east'},ref=await rgba(await readFile(P+'/assets/character-v3/head-eight-01/'+(mirror[dir]||dir)+'.png'));
  const info=H.analyseReference(ref,mirror[dir]||dir);
  for(let k=0;k<H.PX;k++){
   assert.equal(red[k*4+3],silver[k*4+3]);
   const original=mirror[dir]?(k/128|0)*128+127-k%128:k;
   if(info.skin[original]&&!info.brow[original]&&(k/128|0)>=info.eyeTop+1)assert.deepEqual(red.subarray(k*4,k*4+4),ref.subarray(original*4,original*4+4));
   if(!red.subarray(k*4,k*4+4).equals(silver.subarray(k*4,k*4+4))){changes++;assert(pal.hair.red.includes('#'+[...red.subarray(k*4,k*4+3)].map(n=>n.toString(16).padStart(2,'0')).join('')),'Only declared red ramp pixels may change');}
  }
 }
 assert(changes>100);console.log(set+': red palette, unchanged silhouette/face, detail hashes verified.');
}
