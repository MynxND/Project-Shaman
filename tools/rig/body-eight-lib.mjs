import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const sharp=createRequire(createRequire(new URL('../../apps/client/package.json',import.meta.url)).resolve('next'))('sharp');
// BODY_SET selects the costume set (one headless body x8 per outfit); defaults to the first prototype.
export const set=process.env.BODY_SET||'body-eight-01';
export const dir=`docs/design/character-v3/${set}/`,pub=`apps/client/public/assets/character-v3/${set}/`;
export const order=['south','south-east','east','north-east','north','north-west','west','south-west'];
export const json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
export const save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const rgba=b=>sharp(b).ensureAlpha().raw().toBuffer();
export function bounds(p){let x0=128,y0=128,x1=-1,y1=-1;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return{x0,y0,x1,y1};}
export async function atlas(images){const a=Buffer.alloc(1024*128*4);for(const[i,b]of images.entries()){const p=await rgba(b);for(let y=0;y<128;y++)p.copy(a,(y*1024+i*128)*4,y*128*4,(y+1)*128*4);}return sharp(a,{raw:{width:1024,height:128,channels:4}}).png().toBuffer();}
