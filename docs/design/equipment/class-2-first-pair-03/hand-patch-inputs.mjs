import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const root='docs/design/equipment/class-2-first-pair-03/';
const source=await readFile('apps/client/public/assets/character-v3/body-eight-02/south.png');
const regions=[[38,75,47,84],[78,73,85,81]];
const hex=p=>'#'+Buffer.from(p).toString('hex');
const s=await sharp(source).ensureAlpha().raw().toBuffer();
const packet={regions,results:{}};
for(const id of ['achan','juggernaut']){
 const path=id==='achan'?'docs/design/equipment/class-2-first-pair-02/achan-raw.png':root+'juggernaut-lower-raw.png';
 const bytes=await readFile(path),raw=await sharp(bytes).ensureAlpha().raw().toBuffer();const pixels=[];
 for(const[x0,y0,x1,y1]of regions)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
 const i=(y*128+x)*4,a=raw.subarray(i,i+4),b=s.subarray(i,i+4);if(!a.equals(b))pixels.push([x,y,hex(a),hex(b)]);
 }
 packet.results[id]={image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Restore the measured original SOUTH hand contact rectangles at existing main/off grips. Preserve every pixel outside explicit hand rectangles; no tattoos on forearms, torso, fur or armor changed.'}]};
}
await writeFile(root+'hand-patches.json',JSON.stringify(packet,null,2)+'\n');console.log(JSON.stringify(packet));
