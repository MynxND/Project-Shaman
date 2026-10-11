import{existsSync}from'node:fs';if(existsSync('docs/design/ssr/eye-veil-front-03/approval.json'))throw Error('User-approved art is frozen; publish a new version.');
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{sharp,rgba,json,hash,save}from'./body-eight-lib.mjs';
import*as H from'./ssr-hair-standard.mjs';
const S=await import('../../packages/shared/dist/index.js');
const d='docs/design/ssr/eye-veil-front-03/',pub='apps/client/public/assets/ssr/candidates/eye-veil-front-03/',P='apps/client/public';await mkdir(pub,{recursive:true});
const ref=await rgba(await readFile(P+'/assets/character-v3/head-eight-01/south.png')),gen=Buffer.from(ref),palettes=await json(P+'/assets/ssr/palettes.json');
const ramp=await rgba(await readFile(P+'/assets/ssr/candidates/eye-veil-front-02/hair-ramp.png')),fixed=await rgba(await readFile(P+'/assets/ssr/candidates/eye-veil-front-02/hair-fixed.png'));
const unmaskedChanged=0,filled=0,trimmed=0,rampCleanup=0;
// Trim real hair-layer pixels along diagonal, staggered ends. Underlying original eyes are exposed.
const tips=[42,41,40,39,39,40,41,40,39,38,37,38,39,39,40,41,40,39,38,39,40,41,42,43];
let cleared=0;for(let x=51;x<=74;x++)for(let y=tips[x-51]+1;y<=45;y++){const k=y*128+x;if(ramp[k*4+3]||fixed[k*4+3])cleared++;ramp.fill(0,k*4,k*4+4);fixed.fill(0,k*4,k*4+4);}
await save(d+'cleanup.json',{cleared,additionalCredits:0,attempts:0,retries:0,reason:'User chooses partial fringe with both original eyes visible'});
const png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
await writeFile(d+'generated-native.png',await png(gen));const rampPng=await png(ramp),fixedPng=await png(fixed);await writeFile(pub+'hair-ramp.png',rampPng);await writeFile(pub+'hair-fixed.png',fixedPng);
const record=(id,name,b)=>({id,url:'/assets/ssr/candidates/eye-veil-front-03/'+name,sha256:hash(b),width:128,height:128});
const part={version:'ssr/1',id:'hairFront.eye-veil-front-candidate',kind:'hairFront',variant:'eye-veil-front-candidate',canvas:{width:128,height:128},asymmetric:true,images:[record('golden-ramp','hair-ramp.png',rampPng),record('golden-fixed','hair-fixed.png',fixedPng)],clips:{0:{action:'idle',direction:'south',intervalMs:1000,frames:[{layers:[{image:'golden-fixed',x:0,y:0},{image:'golden-ramp',x:0,y:0,palette:'hair'}],anchors:{neck:{x:62,y:49}}}]}},source:'Local partial-fringe derivative of owned FRONT02; original eyes visible; Hair Layer Standard filtering. Unapproved candidate, no other directions or gameplay publication.'};
await save(pub+'part.json',part);await save(d+'part.json',part);
const body=await json(P+'/assets/ssr/parts/body.medium-novice.json'),base=await json(P+'/assets/ssr/parts/headBase.skin.json'),current=await json(P+'/assets/ssr/candidates/eye-veil-front-02/part.json');
async function recolor(b,pal){const p=await rgba(b),rgb=palettes.hair[pal].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));for(let i=0;i<p.length;i+=4)if(p[i+3]){const k=S.ssrRampIndex(p[i]);if(k>=0)[p[i],p[i+1],p[i+2]]=rgb[k];}return png(p);}
async function compose(part,palette,withBody){const items=S.ssrCompose(body,[base,part],'idle','south',0),layers=[];const neck=body.clips[0].frames[0].anchors.neck;for(const item of items){if(!withBody&&item.url===body.images.find(v=>v.id===body.clips[0].frames[0].layers[0].image)?.url)continue;let b=await readFile(P+item.url);if(item.palette)b=await recolor(b,palette);layers.push({input:b,left:item.x+(withBody?0:62-neck.x),top:item.y+(withBody?0:49-neck.y)});}return sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer();}
const files=[];for(const palette of ['gold','silver','black'])for(const[mode,p]of [['head',part],['body',part],['before',current]]){const name=palette+'-'+mode+'.png',b=await compose(p,palette,mode!=='head');await writeFile(pub+name,b);await writeFile(d+name,b);files.push({id:palette+'-'+mode,url:'/assets/ssr/candidates/eye-veil-front-03/'+name,sha256:hash(b)});}
const layers=[];for(const[i,pal]of ['gold','silver','black'].entries())layers.push({input:await readFile(pub+pal+'-body.png'),left:i*128,top:0});const review=await sharp({create:{width:384,height:128,channels:4,background:'#20312e'}}).composite(layers).png().toBuffer();await sharp(review).resize(1536,512,{kernel:'nearest'}).toFile(d+'review-4x.png');
const spent=0;await save(d+'ledger.json',{cap:0,spent:0,attempts:0,retries:0,sourceGenerationCredits:5,status:'local pixel trim only'});
const details=[];for(const f of files){const bytes=await sharp(await readFile(P+f.url)).extract({left:32,top:0,width:64,height:128}).png().toBuffer(),id=f.id+'-detail',url='/assets/ssr/candidates/eye-veil-front-03/'+id+'.png';await writeFile(P+url,bytes);details.push({id,url,sha256:hash(bytes)});}
const manifest={details,version:'hair-front-review/1',name:'หน้าม้าบังบางส่วน · เห็นตาเดิมทั้งสองข้าง',visualApproved:false,directions:['south'],files,headPivot:{x:62,y:49},credits:{spent,cap:0},unmaskedChanged,filled,trimmed,rampCleanup,scope:'FRONT design only; partial fringe, approve before 8-view generation. No gameplay changes.'};await save(pub+'manifest.json',manifest);await save(d+'manifest.json',manifest);console.log({spent,unmaskedChanged,filled,trimmed});



