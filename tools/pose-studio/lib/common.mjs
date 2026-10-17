// Shared paths, image helpers and the character registry for Pose Studio.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

export const sharp=createRequire(createRequire(new URL('../../../apps/client/package.json',import.meta.url)).resolve('next'))('sharp');
export const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
export const studioDir=resolve(root,'docs/design/pose-studio');
export const jobsDir=resolve(studioDir,'jobs');
export const approvedDir=resolve(studioDir,'approved');
export const COMFY_URL=process.env.COMFY_URL||'http://127.0.0.1:8188';
export const PORT=Number(process.env.POSE_STUDIO_PORT||8790);
export const SIZE=128;

export const DIRECTIONS=['south','south-east','east','north-east','north','north-west','west','south-west'];
// Screen-space facing in the elevated three-quarter camera; the video model needs words, not compass names.
export const FACING={
  'south':'facing the camera (toward the viewer, slightly from above)',
  'south-east':'turned three-quarters toward the viewer and to the right side of the screen',
  'east':'in side profile facing the right side of the screen',
  'north-east':'turned three-quarters away from the viewer, toward the upper right of the screen',
  'north':'with the back to the camera, facing away from the viewer',
  'north-west':'turned three-quarters away from the viewer, toward the upper left of the screen',
  'west':'in side profile facing the left side of the screen',
  'south-west':'turned three-quarters toward the viewer and to the left side of the screen',
};

const detail='docs/design/equipment/class-2-imagegen-detail-01';
export const CHARACTERS=[
  {id:'santet',name:'Santet (อินโดนีเซีย)',look:'Indonesian dark shaman in layered ritual robes with long sleeves'},
  {id:'keris',name:'Keris (อินโดนีเซีย)',look:'Indonesian keris warrior holding a wavy keris dagger'},
  {id:'onmyoji',name:'Onmyoji (ญี่ปุ่น)',look:'Japanese onmyoji mystic in court robes'},
  {id:'miko',name:'Miko ชาย (ญี่ปุ่น)',look:'Japanese male shrine priest in white and red vestments'},
  {id:'rune-seer',name:'Rune Seer (นอร์เวย์)',look:'Norse rune seer with a fur mantle and staff'},
  {id:'ullr-hunter',name:'Ullr Hunter (นอร์เวย์)',look:'Norse winter hunter with a bow'},
].map(c=>({...c,set:'class-2-detail-01',idleDir:`${detail}/${c.id}/idle`}));
export const character=id=>{const c=CHARACTERS.find(c=>c.id===id);if(!c)throw new Error(`unknown character ${id}; expected one of ${CHARACTERS.map(c=>c.id).join(', ')}`);return c;};
export const idlePaths=(c,dir)=>({body:resolve(root,c.idleDir,`${dir}.png`),withHead:resolve(root,c.idleDir,`${dir}-with-head.png`)});

export const hash=b=>createHash('sha256').update(b).digest('hex');
export const readJson=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
export const writeJson=async(p,v)=>{await mkdir(dirname(p),{recursive:true});await writeFile(p,JSON.stringify(v,null,2)+'\n');};
export const rel=p=>p.replace(root,'').replace(/^[\\/]/,'').replaceAll('\\','/');

// Raw RGBA image object used by all pixel code: {w,h,d:Buffer}.
export async function load(input){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});return{w:info.width,h:info.height,d:data};}
export const blank=(w,h)=>({w,h,d:Buffer.alloc(w*h*4)});
export const clone=img=>({w:img.w,h:img.h,d:Buffer.from(img.d)});
export const png=img=>sharp(img.d,{raw:{width:img.w,height:img.h,channels:4}}).png().toBuffer();
export async function savePng(p,img){await mkdir(dirname(p),{recursive:true});const b=await png(img);await writeFile(p,b);return b;}
export function bounds(img){let x0=img.w,y0=img.h,x1=-1,y1=-1;for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++)if(img.d[(y*img.w+x)*4+3]>127){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}return x1<0?null:{x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1};}
export function opaqueCount(img){let n=0;for(let i=3;i<img.d.length;i+=4)if(img.d[i]>127)n++;return n;}
