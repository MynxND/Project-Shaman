import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/';
const bytes=await readFile(dir+'juggernaut-lower-rebuilt.png');
const raw=await sharp(bytes).ensureAlpha().raw().toBuffer(),hands=await sharp(dir+'juggernaut-hands-provider.png').ensureAlpha().raw().toBuffer(),source=await sharp('apps/client/public/assets/character-v3/body-eight-02/south.png').ensureAlpha().raw().toBuffer();
const hex=b=>'#'+Buffer.from(b).toString('hex'),pixels=[];
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
 const mask=(x>=32&&x<=48&&y>=68&&y<=93)||(x>=78&&x<=94&&y>=65&&y<=93);
 if(!mask)continue;const i=(y*128+x)*4;
 let next=hands.subarray(i,i+4);
 if((x>=38&&x<=47&&y>=75&&y<=84)||(x>=78&&x<=85&&y>=73&&y<=81))next=source.subarray(i,i+4);
 const old=raw.subarray(i,i+4);if(!old.equals(next))pixels.push([x,y,hex(old),hex(next)]);
}
const packet={image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Merge provider arm repair only inside declared custom hand mask, then restore exact original SOUTH contact rectangles. Lower reconstruction and approved torso/fur outside mask remain untouched.'}]};
await writeFile(dir+'merged-hand-patches.json',JSON.stringify(packet,null,2)+'\n');console.log(JSON.stringify(packet));
