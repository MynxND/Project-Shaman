import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
const dir='docs/design/equipment/class-2-eight-01/';
const source=await readFile('apps/client/public/assets/character-v3/body-eight-02/north-west.png');
const original=await readFile(dir+'juggernaut/north-west.png');
const a=await sharp(original).ensureAlpha().raw().toBuffer(),b=await sharp(source).ensureAlpha().raw().toBuffer();
const pixels=[];
for(let y=77;y<=85;y++)for(let x=45;x<=54;x++){
 const i=(y*128+x)*4,r=b[i],g=b[i+1],blue=b[i+2];
 if(b[i+3]&&r>130&&r>g*1.15&&g>blue*1.08&&!a.subarray(i,i+4).equals(b.subarray(i,i+4)))pixels.push([x,y,'#'+a.subarray(i,i+4).toString('hex'),'#'+b.subarray(i,i+4).toString('hex')]);
}
const packet={sourceSha256:hash(source),originalSha256:hash(original),region:[45,77,54,85],image:'data:image/png;base64,'+original.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Restore original male NW gripping-hand skin on separate costume derivative; no novice cuff, head, scale or outside region changes'}]};
await writeFile(dir+'juggernaut-nw-hand-patches.json',JSON.stringify(packet,null,2)+'\n');console.log('proposed pixels',pixels.length);
