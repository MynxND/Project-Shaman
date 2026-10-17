import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
const root='docs/design/equipment/class-2-eight-01/';
const manifest=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json','utf8'));
const facings=['south','south-east','east','north-east','north','north-west','west','south-west'];
const report={scope:'Raw eight-direction costume proof; existing-head composition uses source anchors only, not fitted or runtime certified',classes:{}};
for(const id of ['achan','juggernaut']){
 const rawCells=[],headCells=[];report.classes[id]={};
 for(const [index,facing] of facings.entries()){
  const bytes=await readFile(`${root}${id}/${facing}.png`),m=await sharp(bytes).metadata();
  assert.equal(m.width,128);assert.equal(m.height,128);
  const frame=manifest.frames.find(f=>f.direction===facing);
  const source=await readFile('apps/client/public'+frame.url),head=await readFile('apps/client/public'+frame.headUrl);
  assert.equal(hash(source),frame.sha256);assert.equal(hash(head),frame.headSha256);
  const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer();
  let top=128,bottom=-1,left=128,right=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
  assert.ok(bottom>=0,'Empty sprite');
  const dx=frame.neckPivot.x-frame.headPivot.x,dy=frame.neckPivot.y-frame.headPivot.y;
  const shifted=await sharp(head).extract({left:Math.max(0,-dx),top:Math.max(0,-dy),width:128-Math.abs(dx),height:128-Math.abs(dy)}).png().toBuffer();
  const composite=await sharp(bytes).composite([{input:shifted,left:Math.max(0,dx),top:Math.max(0,dy)}]).png().toBuffer();
  rawCells.push({input:bytes,left:(index%4)*128,top:Math.floor(index/4)*128});
  headCells.push({input:composite,left:(index%4)*128,top:Math.floor(index/4)*128});
  report.classes[id][facing]={sha256:hash(bytes),dimensions:[m.width,m.height],bounds:{left,top,right,bottom},sourceGroundRow:frame.opaqueBounds.y1,groundDelta:bottom-frame.opaqueBounds.y1,sourceHeadOffset:{x:dx,y:dy},neckAlignment:'requires visual review; original anchor is not a generated-neck measurement',visualApproved:false,runtimeCompatible:false};
 }
 for(const [name,cells] of [['raw',rawCells],['head-diagnostic',headCells]]){
  const sheet=await sharp({create:{width:512,height:256,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
  await sharp(sheet).resize(1536,768,{kernel:'nearest'}).toFile(`${root}${id}-${name}-3x.png`);
 }
 const original=await readFile(`docs/design/equipment/class-2-first-pair-03/${id}-raw.png`);
 const south=await readFile(`${root}${id}/south.png`);
 report.classes[id].south.sourceByteExact=hash(original)===hash(south);
 const a=await sharp(original).ensureAlpha().raw().toBuffer(),b=await sharp(south).ensureAlpha().raw().toBuffer();
 report.classes[id].south.sourcePixelsExact=a.equals(b);
}
await writeFile(root+'checks.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
