import assert from 'node:assert/strict';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/';
const source=await readFile('apps/client/public/assets/character-v3/body-eight-02/south.png');
assert.equal(hash(source),'c4c0ade151545e99ba6fa003d4f597142e004c6b8c214147a552df17ed5ab906');
const s=await sharp(source).ensureAlpha().raw().toBuffer(),report={sourceUnchanged:true,results:{}};
const inside=(x,y,r)=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3];
const contacts=[[38,75,47,84],[78,73,85,81]];
for(const id of ['achan','juggernaut']){
const bytes=await readFile(dir+id+'-raw.png'),m=await sharp(bytes).metadata();assert.equal(m.width,128);assert.equal(m.height,128);
const a=await sharp(bytes).ensureAlpha().raw().toBuffer(),b=await sharp('docs/design/equipment/class-2-first-pair-02/'+id+'-raw.png').ensureAlpha().raw().toBuffer();
let lowest=-1,changed=0,unallowed=0;
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
const i=(y*128+x)*4;if(a[i+3])lowest=y;
if(contacts.some(r=>inside(x,y,r)))assert.ok(a.subarray(i,i+4).equals(s.subarray(i,i+4)),id+' contact differs');
if(!a.subarray(i,i+4).equals(b.subarray(i,i+4))){changed++;const allowed=id==='achan'?contacts.some(r=>inside(x,y,r)):[[32,68,48,93],[78,65,94,93],[32,94,96,127]].some(r=>inside(x,y,r));if(!allowed)unallowed++;}
}
assert.equal(lowest,112,id+' feet baseline');assert.equal(unallowed,0,id+' outside-mask drift');
report.results[id]={sha256:hash(bytes),lowestOpaqueRow:lowest,contactRectanglesByteExact:true,changedPixels:changed,outsideAllowedMaskChangedPixels:unallowed,staticTechnicalChecksPassed:true,visualApproved:false,runtimeCompatible:false};
}
await writeFile(dir+'repair-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
