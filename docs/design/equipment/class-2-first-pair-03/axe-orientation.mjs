import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/';
const bytes=await readFile('apps/client/public/assets/equipment/axe-juggernaut/south.png'),m=await sharp(bytes).metadata(),raw=await sharp(bytes).ensureAlpha().raw().toBuffer();
const pixels=[];for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){const i=(y*m.width+x)*4,j=(y*m.width+m.width-1-x)*4,a=raw.subarray(i,i+4),b=raw.subarray(j,j+4);if(!a.equals(b))pixels.push([x,y,'#'+a.toString('hex'),'#'+b.toString('hex')]);}
const packet={image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'User corrected SOUTH axe blade: the existing screen-left hand requires blade facing outward screen-left. Exact horizontal reflection, preserve original art and transform gripX to1-original.'}]};
await writeFile(dir+'axe-orientation-patches.json',JSON.stringify(packet,null,2)+'\n');await writeFile(dir+'axe-orientation-metadata.json',JSON.stringify({sourceSha256:hash(bytes),originalGripX:.371,correctedGripX:1-.371,scope:'offline SOUTH candidate only; source/runtime unchanged'},null,2)+'\n');console.log(JSON.stringify(packet));
