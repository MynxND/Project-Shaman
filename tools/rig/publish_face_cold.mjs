import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,json,save,hash} from './body-eight-lib.mjs';
import {ssrCompose,ssrRampIndex} from '../../packages/shared/dist/index.js';
const d='docs/design/ssr/face-cold-front-01/',root='/assets/ssr/candidates/face-cold-front-01/',p='apps/client/public',out=p+root;
await mkdir(out,{recursive:true});const spec=await json(d+'spec.json'),pal=(await json(p+'/assets/ssr/palettes.json')).hair.white;
const body=await json(p+'/assets/ssr/parts/body.medium-novice.json'),base=await json(p+'/assets/ssr/parts/headBase.skin.json');
const hairs=[['short',await json(p+'/assets/ssr/parts/hairFront.default.json')],['curtains',await json(p+'/assets/ssr/candidates/curtain-gold-eight-01/part.json')]];
const basePixels=await sharp(spec.source).ensureAlpha().raw().toBuffer();const files=[];let spent=0;
async function png(name,bytes){await writeFile(out+name+'.png',bytes);files.push({id:name,url:root+name+'.png',sha256:hash(bytes)});}
for(const style of [{id:'original'},...spec.styles]){
 let part=null;
 if(style.id!=='original'){
 const r=(await json(d+style.id+'-result.json')).result.structuredContent;if(r.status!=='completed'||r.charged_generations!==5)throw Error('Incomplete job or unexpected cost');spent+=r.charged_generations;
 const source=await readFile(d+style.id+'-cleaned.png'),data=await sharp(source).ensureAlpha().raw().toBuffer(),patch=Buffer.alloc(128*128*4);
 for(let y=31;y<=47;y++)for(let x=53;x<=72;x++){const from=(y*64+x-32)*4,to=(y*128+x)*4;if(basePixels[to+3]){if(data[from+3]!==255)throw Error('Missing face skin');data.copy(patch,to,from,from+4);}}
 const bytes=await sharp(patch,{raw:{width:128,height:128,channels:4}}).png().toBuffer();await png(style.id+'-patch',bytes);
 part={version:'ssr/1',id:'face.'+style.id,kind:'face',variant:style.id,canvas:{width:128,height:128},asymmetric:false,images:[{id:'face',url:root+style.id+'-patch.png',sha256:hash(bytes),width:128,height:128}],clips:{0:{action:'idle',direction:'south',intervalMs:1000,frames:[{layers:[{image:'face',x:0,y:0}],anchors:{neck:{x:62,y:49}}}]}}};await save(out+style.id+'-part.json',part);
 }
 for(const [hairId,hair] of hairs){const items=ssrCompose(body,[...(part?[{...base,clips:{...base.clips,0:{...base.clips[0],frames:base.clips[0].frames.map(f=>({...f,layers:f.layers.filter(l=>!l.palette)}))}}},part]:[base]),hair],'idle','south',0);for(const mode of ['head','body']){const layers=[];for(const it of items){if(mode==='head'&&it.kind==='body')continue;let bytes=await readFile(p+it.url);if(it.palette){const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i+3]){const k=ssrRampIndex(data[i]);if(k>=0){const c=pal[k];data[i]=parseInt(c.slice(1,3),16);data[i+1]=parseInt(c.slice(3,5),16);data[i+2]=parseInt(c.slice(5,7),16);}}bytes=await sharp(data,{raw:info}).png().toBuffer();}if(it.mirror)bytes=await sharp(bytes).flop().png().toBuffer();layers.push({input:bytes,left:it.x,top:it.y});}const image=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toBuffer();await png(style.id+'-'+hairId+'-'+mode,image);await png(style.id+'-'+hairId+'-'+mode+'-detail',await sharp(image).extract({left:32,top:0,width:64,height:128}).png().toBuffer());}}
}
if(spent>5)throw Error('Budget exceeded');await save(out+'manifest.json',{version:'face-style-front/1',styles:spec.styles,files,credits:{spent,cap:5,attempts:1,retries:0},visualApproved:false,directions:['south']});await save(d+'delivery.json',{spent,files});console.log({spent,files:files.length});







