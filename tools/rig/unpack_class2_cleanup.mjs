import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharp,hash,order} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-production-01';
const guards=JSON.parse(await readFile(`${root}/knife-cleanup-guards.json`,'utf8'));
const original=await readFile(`${root}/knife-cleanup-source.png`),output=await readFile(`${root}/knife-cleanup-output.png`);
assert.equal(hash(original),guards.atlasSha256);
const before=await sharp(original).ensureAlpha().raw().toBuffer(),after=await sharp(output).ensureAlpha().raw().toBuffer();
assert.equal(before.length,after.length);const allowed=new Map(guards.changes[0].pixels.map(([x,y,a,b])=>[(y*1024+x)*4,{a,b}]));
for(let i=0;i<before.length;i+=4){const v=allowed.get(i);if(v){assert.equal('#'+before.subarray(i,i+4).toString('hex'),v.a);assert.equal('#'+after.subarray(i,i+4).toString('hex'),v.b);}else assert.ok(before.subarray(i,i+4).equals(after.subarray(i,i+4)),'outside guarded cleanup changed');}
const dir=`${root}/juggernaut/attack/repaired`;await mkdir(dir,{recursive:true});const changed=[];
for(const[d,direction]of order.entries())for(let k=0;k<8;k++){
 const source=await readFile(`${root}/juggernaut/attack/raw/${direction}-${k}.png`);assert.equal(hash(source),guards.sources.find(s=>s.direction===direction&&s.frame===k).sha256);
 const bytes=await sharp(output).extract({left:k*128,top:d*128,width:128,height:128}).png().toBuffer();
 const a=await sharp(source).ensureAlpha().raw().toBuffer(),b=await sharp(bytes).ensureAlpha().raw().toBuffer();if(a.equals(b)){await writeFile(`${dir}/${direction}-${k}.png`,source);continue;}
 await writeFile(`${dir}/${direction}-${k}.png`,bytes);changed.push({direction,frame:k,sourceSha256:hash(source),sha256:hash(bytes)});
}
const receipt=JSON.parse(await readFile(`${root}/knife-cleanup-result.json`,'utf8'));
const workbenchId=/image_id:\s*([a-f0-9-]{36})/.exec(receipt.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'))[1];
await writeFile(`${root}/knife-cleanup-report.json`,JSON.stringify({workbenchId,paidGenerations:0,changedPixels:allowed.size,protectedPixelsUnchanged:true,frames:changed},null,2));
console.log(`Free cleanup: ${allowed.size} exact pixels, ${changed.length} derivatives; all other pixels/source PNGs unchanged`);
