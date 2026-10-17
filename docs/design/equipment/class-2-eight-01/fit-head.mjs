import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
const root='docs/design/equipment/class-2-eight-01/';
const revision=process.env.HEAD_FIT_REVISION==='user'?'user':process.env.HEAD_FIT_REVISION==='02'?'02':'';
const manifest=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json','utf8'));
let config;
if(revision==='user'){
 const saved=JSON.parse(await readFile(root+'user-head-offsets.json','utf8'));
 const facings=['south','south-east','east','north-east','north','north-west','west','south-west'];
 assert.equal(saved.version,1);assert.equal(saved.offsets.length,8);
 saved.offsets.forEach((v,i)=>{assert.equal(v.direction,facings[i]);assert.ok(Number.isInteger(v.x)&&Number.isInteger(v.y)&&Math.abs(v.x)<=24&&Math.abs(v.y)<=24);});
 config={scope:'Exact user-saved static head offsets, reviewed without changing user values; not runtime or animation certification',targets:Object.fromEntries(saved.offsets.map(v=>{const f=manifest.frames.find(f=>f.direction===v.direction);return[v.direction,[f.headPivot.x+v.x,f.headPivot.y+v.y]];}))};
}else config=JSON.parse(await readFile(root+`juggernaut-head-fit${revision}.json`,'utf8'));
const previous=JSON.parse(await readFile(root+'checks.json','utf8'));
const cells=[],details=[],report={scope:config.scope,results:{},paidGenerations:0,visualApproved:false,runtimeCompatible:false};
for(const [index,[direction,target]] of Object.entries(config.targets).entries()){
 const frame=manifest.frames.find(f=>f.direction===direction);
 const body=await readFile(root+`juggernaut/${direction}.png`),head=await readFile('apps/client/public'+frame.headUrl);
 assert.equal(hash(body),previous.classes.juggernaut[direction].sha256);
 assert.equal(hash(head),frame.headSha256);
 const x=target[0]-frame.headPivot.x,y=target[1]-frame.headPivot.y;
 const shifted=await sharp(head).extract({left:Math.max(0,-x),top:Math.max(0,-y),width:128-Math.abs(x),height:128-Math.abs(y)}).png().toBuffer();
 const output=await sharp(body).composite([{input:shifted,left:Math.max(0,x),top:Math.max(0,y)}]).png().toBuffer();
 cells.push({input:output,left:(index%4)*128,top:Math.floor(index/4)*128});
 details.push({input:await sharp(output).extract({left:44,top:36,width:40,height:28}).png().toBuffer(),left:(index%4)*40,top:Math.floor(index/4)*28});
 report.results[direction]={target,headOffset:{x,y},priorOffset:previous.classes.juggernaut[direction].sourceHeadOffset,bodySha256:hash(body),headSha256:hash(head)};
}
const sheet=await sharp({create:{width:512,height:256,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
const detail=await sharp({create:{width:160,height:56,channels:4,background:'#263b35'}}).composite(details).png().toBuffer();
await sharp(detail).resize(1280,448,{kernel:'nearest'}).toFile(root+`juggernaut-neck${revision}-8x.png`);
await sharp(sheet).resize(1536,768,{kernel:'nearest'}).toFile(root+`juggernaut-head-fit${revision}-3x.png`);
const before=await readFile(root+(revision?'juggernaut-head-fit-3x.png':'juggernaut-head-diagnostic-3x.png')),after=await readFile(root+`juggernaut-head-fit${revision}-3x.png`);
await sharp({create:{width:1536,height:1536,channels:4,background:'#263b35'}}).composite([{input:before,left:0,top:0},{input:after,left:0,top:768}]).png().toFile(root+`juggernaut-head-before-after${revision}.png`);
await writeFile(root+`juggernaut-head-fit${revision}-checks.json`,JSON.stringify(report,null,2)+'\n');
console.log('PASS: eight static head offsets applied; all original head/body hashes unchanged.');
