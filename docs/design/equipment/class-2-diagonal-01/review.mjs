import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
const dir='docs/design/equipment/class-2-diagonal-01/';
const manifest=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json','utf8'));
const cells=[],report={scope:'Offline static costume comparison, unchanged directional head; no gear or runtime integration',results:{}};
for(const [row,id] of ['achan','juggernaut'].entries()) {
 for(const [col,kind] of ['source','south','south-east'].entries()) {
  const facing=kind==='south'?'south':'south-east';
  const frame=manifest.frames.find(f=>f.direction===facing);
  const source=await readFile('apps/client/public'+frame.url);
  assert.equal(hash(source),frame.sha256,'Source body drift');
  const head=await readFile('apps/client/public'+frame.headUrl);
  assert.equal(hash(head),frame.headSha256,'Source head drift');
  const bytes=kind==='source'?source:await readFile(kind==='south'?`docs/design/equipment/class-2-first-pair-03/${id}-raw.png`:`${dir}${id}-south-east-raw.png`);
  const m=await sharp(bytes).metadata(); assert.equal(m.width,128);assert.equal(m.height,128);
  const raw=await sharp(bytes).ensureAlpha().raw().toBuffer();let lowest=-1,opaque=0;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(raw[(y*128+x)*4+3]){lowest=y;opaque++;}
  const dx=frame.neckPivot.x-frame.headPivot.x,dy=frame.neckPivot.y-frame.headPivot.y;
  const shifted=await sharp(head).extract({left:Math.max(0,-dx),top:Math.max(0,-dy),width:128-Math.abs(dx),height:128-Math.abs(dy)}).png().toBuffer();
  const composite=await sharp(bytes).composite([{input:shifted,left:Math.max(0,dx),top:Math.max(0,dy)}]).png().toBuffer();
  cells.push({input:composite,left:col*128,top:row*128});
  if(kind==='south-east') {
   await sharp(composite).resize(512,512,{kernel:'nearest'}).toFile(`${dir}${id}-south-east-review-4x.png`);
   report.results[id]={sha256:hash(bytes),width:m.width,height:m.height,opaquePixels:opaque,lowestOpaqueRow:lowest,sourceLowestOpaqueRow:frame.opaqueBounds.y1,groundDelta:lowest-frame.opaqueBounds.y1,sourceBodySha256:hash(source),headSha256:hash(head),headOffset:{x:dx,y:dy},visualApproved:false,runtimeCompatible:false};
  }
 }
}
const sheet=await sharp({create:{width:384,height:256,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
await sharp(sheet).resize(1152,768,{kernel:'nearest'}).toFile(dir+'comparison-3x.png');
await writeFile(dir+'checks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
