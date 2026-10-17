import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharp,hash,bounds} from '../../../../tools/rig/body-eight-lib.mjs';
const root='docs/design/equipment/class-2-motion-proof-01/';
const manifest=JSON.parse(await readFile('apps/client/public/assets/character-v3/walk-eight-02/manifest.json','utf8'));
const direction=manifest.directions.find(d=>d.direction==='south');
const anchors=JSON.parse(await readFile('apps/client/public/assets/character-v3/hand-anchors.json','utf8'));
const report={scope:'SOUTH walk indices0/3/7 only, not consecutive frames or complete animation',classes:{},runtimeCompatible:false};
const sources=[];for(const n of [0,3,7]){const f=direction.frames[n],b=await readFile('apps/client/public'+f.url);assert.equal(hash(b),f.sha256);sources.push(b);}
const head=await readFile('apps/client/public'+direction.headUrl);assert.equal(hash(head),direction.headSha256);
const cells=[];
for(const [row,id] of ['achan','juggernaut'].entries()){
 const frames=[];report.classes[id]={frames:[],fullClip:false};
 for(const [col,n] of [0,3,7].entries()){
  const file=await readFile(`${root}${id}-${n}.png`),m=await sharp(file).metadata();assert.equal(m.width,128);assert.equal(m.height,128);
  const raw=await sharp(file).ensureAlpha().raw().toBuffer(),src=await sharp(sources[col]).ensureAlpha().raw().toBuffer();frames.push(raw);
  const f=direction.frames[n],x=f.neckPivot.x-direction.headPivot.x,y=f.neckPivot.y-direction.headPivot.y;
  const h=await sharp(head).extract({left:Math.max(0,-x),top:Math.max(0,-y),width:128-Math.abs(x),height:128-Math.abs(y)}).png().toBuffer();
  const composed=await sharp(file).composite([{input:h,left:Math.max(0,x),top:Math.max(0,y)}]).png().toBuffer();
  cells.push({input:sources[col],left:col*128,top:row*256});cells.push({input:composed,left:col*128,top:row*256+128});
  const contacts=Object.entries(anchors.actions.walk.south[n]).filter(([k,v])=>['main','off'].includes(k)&&v).map(([name,p])=>{const i=(Math.round(p.y)*128+Math.round(p.x))*4;let changed=0;for(let yy=Math.round(p.y)-2;yy<=Math.round(p.y)+2;yy++)for(let xx=Math.round(p.x)-2;xx<=Math.round(p.x)+2;xx++){const j=(yy*128+xx)*4;if(!raw.subarray(j,j+4).equals(src.subarray(j,j+4)))changed++;}return{name,sourceAnchor:p,sourcePixel:[...src.subarray(i,i+4)],candidatePixel:[...raw.subarray(i,i+4)],sourceAnchorAlreadyTransparent:src[i+3]===0,changedPixelsIn5x5:changed};});
  report.classes[id].frames.push({sourceIndex:n,sha256:hash(file),sourceBounds:bounds(src),candidateBounds:bounds(raw),groundDelta:bounds(raw).y1-bounds(src).y1,headOffset:{x,y},contacts,visualApproved:false});
 }
 report.classes[id].identicalOutputs=frames[0].equals(frames[1])||frames[1].equals(frames[2])||frames[0].equals(frames[2]);
}
const sheet=await sharp({create:{width:384,height:512,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
await sharp(sheet).resize(1152,1536,{kernel:'nearest'}).toFile(root+'comparison-3x.png');
await writeFile(root+'checks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
