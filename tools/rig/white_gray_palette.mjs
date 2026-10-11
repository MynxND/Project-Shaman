import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {sharp,json,save,hash} from './body-eight-lib.mjs';
import {ssrCompose} from '../../packages/shared/dist/index.js';
const P='apps/client/public',R=P+'/assets/ssr/candidates/',D='docs/design/ssr/white-gray-01/';
await mkdir(D,{recursive:true});
const pal=await json(P+'/assets/ssr/palettes.json');
pal.hair.gray??=[...pal.hair.white];
pal.hair.white=['#92969f','#b3b8c1','#ced2d9','#e5e8ed','#f0f2f6','#f8f9fc','#fdfdff','#ffffff'];
await save(P+'/assets/ssr/palettes.json',pal);
// Preserve the former white preview files byte-for-byte as gray before rebuilding white.
for(const ent of await readdir(R,{withFileTypes:true})){
 if(!ent.isDirectory())continue;const dir=R+ent.name+'/';let m;try{m=await json(dir+'white-manifest.json')}catch{continue}
 const files=[];for(const f of m.files){const id=f.id.replace(/(^|-)white(?=-|$)/,'$1gray'),url=f.url.replace(f.id+'.png',id+'.png');let bytes;try{bytes=await readFile(P+url)}catch{bytes=await readFile(P+f.url);await writeFile(P+url,bytes)}files.push({...f,id,url,sha256:hash(bytes)});}
 await save(dir+'gray-manifest.json',{...m,defaultPalette:'gray',files});
}
// Face source previews remain immutable; new colour variants use exact hair-layer coverage.
const body=await json(P+'/assets/ssr/parts/body.medium-novice.json');
const hairs={short:await json(P+'/assets/ssr/parts/hairFront.default.json'),curtains:await json(R+'curtain-gold-eight-01/part.json')};
const rgb=s=>Buffer.from(s.slice(1),'hex'),old=pal.hair.gray.map(rgb);
for(const set of ['face-eight-03','face-styles-front-01','face-cold-front-02']){
 const dir=R+set+'/',m=await json(dir+'manifest.json'),files=[];
 for(const f of m.files){if(!f.url.endsWith('.png')||f.url.includes('patch'))continue;const hair=Object.keys(hairs).find(h=>f.url.includes('-'+h+'-'));if(!hair)continue;
 const direction=['south-east','south-west','north-east','north-west','south','north','east','west'].find(d=>f.url.includes('-'+d+'-'))||'south';
 const mask=Buffer.alloc(128*128);for(const it of ssrCompose(body,[hairs[hair]],'idle',direction,0)){if(!it.kind.startsWith('hair')||!it.palette)continue;let im=sharp(await readFile(P+it.url));if(it.mirror)im=im.flop();const {data,info}=await im.ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){const xx=x+it.x,yy=y+it.y;if(xx>=0&&xx<128&&yy>=0&&yy<128)mask[yy*128+xx]=1;}}
 const source=await readFile(P+f.url),{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const color of ['gray','white']){const out=Buffer.from(data);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const xx=x+(info.width===64?32:0),i=(y*info.width+x)*4;if(!mask[y*128+xx])continue;const k=old.findIndex(c=>c.equals(data.subarray(i,i+3)));if(k>=0)rgb(pal.hair[color][k]).copy(out,i);}
 const url=f.url.replace('.png','-'+color+'.png'),bytes=color==='gray'?source:await sharp(out,{raw:info}).png().toBuffer();await writeFile(P+url,bytes);files.push({id:url.split('/').pop().slice(0,-4),url,sha256:hash(bytes)});}
 }
 await save(dir+'colors-manifest.json',{version:'face-hair-colors/1',files,credits:0});
}
await save(D+'palette.json',{gray:pal.hair.gray,white:pal.hair.white,credits:0});
console.log('Preserved old white as gray; built masked face white/gray variants.');
