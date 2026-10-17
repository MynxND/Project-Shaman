import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/',bytes=await readFile(dir+'juggernaut-raw.png');
const raw=await sharp(bytes).ensureAlpha().raw().toBuffer(),pixels=[];
for(const[x0,y0,x1,y1]of [[32,83,48,93],[80,83,88,93]])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
const i=(y*128+x)*4,p=raw.subarray(i,i+4);if(p[3])pixels.push([x,y,'#'+p.toString('hex'),'#00000000']);
}
const packet={image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Enlarged visual review found provider left old low fists underneath restored contact hands. Remove duplicate lower limb pixels in inspected rectangles, preserve the restored hand contacts above row83 and torso/cloak outside rectangles.'}]};
await writeFile(dir+'duplicate-hand-patches.json',JSON.stringify(packet,null,2)+'\n');console.log(JSON.stringify(packet));
