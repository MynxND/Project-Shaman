import{existsSync}from'node:fs';if(existsSync('docs/design/ssr/korean-wolf-front-02/approval.json'))throw Error('User-approved art is frozen; publish a new version.');
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{sharp,rgba,json,hash,save}from'./body-eight-lib.mjs';
import*as H from'./ssr-hair-standard.mjs';
const S=await import('../../packages/shared/dist/index.js');
const d='docs/design/ssr/korean-wolf-front-02/',pub='apps/client/public/assets/ssr/candidates/korean-wolf-front-02/',P='apps/client/public';await mkdir(pub,{recursive:true});
const result=await json(d+'result.json'),r=result.result.structuredContent;if(r?.status!=='completed')throw Error('Not complete; do not retry');
const response=await fetch(r.download_url);if(!response.ok)throw Error('Download failed');const raw=Buffer.from(await response.arrayBuffer());await writeFile(d+'raw.png',raw);const meta=await sharp(raw).metadata();if(meta.width!==64||meta.height!==64)throw Error('Wrong native canvas; inspect without retry');
const ref=await rgba(await readFile(P+'/assets/character-v3/head-eight-01/south.png')),gen=Buffer.from(ref),crop=await rgba(raw),mask=Uint8Array.from(await json(d+'native-mask.json'));let unmaskedChanged=0;const actualSource=await rgba(await readFile(d+'source.png'));
for(let y=0;y<64;y++)for(let x=0;x<64;x++){const k=y*128+x+32,i=(y*64+x)*4;if(!mask[k]&&!crop.subarray(i,i+4).equals(actualSource.subarray(i,i+4)))unmaskedChanged++;if(mask[k])crop.copy(gen,k*4,i,i+4);}
const palettes=await json(P+'/assets/ssr/palettes.json'),cuts=[14,24,36,52,70,90,120],step=L=>{let i=0;while(i<cuts.length&&L>=cuts[i])i++;return i;},info=H.analyseReference(ref,'south');
const{ramp,fixed,filled}=H.buildHair(gen,ref,info,step,mask),trimmed=H.volumeTrim(ramp,fixed,ref,mask);
// One grey brow seam from hole fill belongs to the hair ramp, never the untinted accent.
let rampCleanup=0;for(let k=0;k<H.PX;k++)if(fixed[k*4+3]&&!H.red(fixed,k)&&!H.warm(fixed,k)&&(k/128|0)<info.eyeTop-1){ramp[k*4]=step(H.lum(fixed,k))*32+16;ramp[k*4+3]=255;fixed.fill(0,k*4,k*4+4);rampCleanup++;}
// Keep every original ear, eye and lower-face skin pixel exposed exactly.
let protectedCleared=0;for(let k=0;k<H.PX;k++)if(info.skin[k]&&!info.brow[k]&&(k/128|0)>=info.eyeTop-1){if(ramp[k*4+3]||fixed[k*4+3])protectedCleared++;ramp.fill(0,k*4,k*4+4);fixed.fill(0,k*4,k*4+4);}
// Fixed silver tips are intentional dye, not part of the recolorable charcoal ramp.
const tipMask=Buffer.alloc(H.PX*4);let tipPixels=0;
for(let k=0;k<H.PX;k++){
 const x=k%128,y=k/128|0;
 if(ramp[k*4+3]&&H.cool(gen,k)&&H.lum(gen,k)>=130&&y>=31&&(x<=55||x>=69||y>=33)){
 gen.copy(fixed,k*4,k*4,k*4+4);ramp.fill(0,k*4,k*4+4);tipMask.fill(255,k*4,k*4+4);tipPixels++;
 }
}
const png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
await writeFile(d+'generated-native.png',await png(gen));await writeFile(pub+'silver-tip-mask.png',await png(tipMask));await save(d+'tip-colour.json',{tipPixels,threshold:130,scope:'Purposeful fixed silver dye at lock ends, charcoal root and crown ramp'});const rampPng=await png(ramp),fixedPng=await png(fixed);await writeFile(pub+'hair-ramp.png',rampPng);await writeFile(pub+'hair-fixed.png',fixedPng);
const record=(id,name,b)=>({id,url:'/assets/ssr/candidates/korean-wolf-front-02/'+name,sha256:hash(b),width:128,height:128});
const part={version:'ssr/1',id:'hairFront.korean-wolf-front-candidate',kind:'hairFront',variant:'korean-wolf-front-candidate',canvas:{width:128,height:128},asymmetric:true,images:[record('golden-ramp','hair-ramp.png',rampPng),record('golden-fixed','hair-fixed.png',fixedPng)],clips:{0:{action:'idle',direction:'south',intervalMs:1000,frames:[{layers:[{image:'golden-fixed',x:0,y:0},{image:'golden-ramp',x:0,y:0,palette:'hair'}],anchors:{neck:{x:62,y:49}}}]}},source:'Original FRONT-only inpaint on owned approved head; Hair Layer Standard filtering. Unapproved candidate, no other directions or gameplay publication.'};
await save(pub+'part.json',part);await save(d+'part.json',part);
const body=await json(P+'/assets/ssr/parts/body.medium-novice.json'),base=await json(P+'/assets/ssr/parts/headBase.skin.json'),current=await json(P+'/assets/ssr/candidates/korean-wolf-front-01/part.json');
async function recolor(b,pal){const p=await rgba(b),rgb=palettes.hair[pal].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));for(let i=0;i<p.length;i+=4)if(p[i+3]){const k=S.ssrRampIndex(p[i]);if(k>=0)[p[i],p[i+1],p[i+2]]=rgb[k];}return png(p);}
async function compose(part,palette,withBody){const items=S.ssrCompose(body,[base,part],'idle','south',0),layers=[];const neck=body.clips[0].frames[0].anchors.neck;for(const item of items){if(!withBody&&item.url===body.images.find(v=>v.id===body.clips[0].frames[0].layers[0].image)?.url)continue;let b=await readFile(P+item.url);if(item.palette)b=await recolor(b,palette);layers.push({input:b,left:item.x+(withBody?0:62-neck.x),top:item.y+(withBody?0:49-neck.y)});}return sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer();}
const files=[];for(const palette of ['gold','silver','black'])for(const[mode,p]of [['head',part],['body',part],['before',current]]){const name=palette+'-'+mode+'.png',b=await compose(p,palette,mode!=='head');await writeFile(pub+name,b);await writeFile(d+name,b);files.push({id:palette+'-'+mode,url:'/assets/ssr/candidates/korean-wolf-front-02/'+name,sha256:hash(b)});}
const layers=[];for(const[i,pal]of ['gold','silver','black'].entries())layers.push({input:await readFile(pub+pal+'-body.png'),left:i*128,top:0});const review=await sharp({create:{width:384,height:128,channels:4,background:'#20312e'}}).composite(layers).png().toBuffer();await sharp(review).resize(1536,512,{kernel:'nearest'}).toFile(d+'review-4x.png');
const used=async p=>Number((await json(p)).result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n').match(/generations_used:\s*([\d.]+)/)?.[1]),before=await used(d+'balance-before.json'),after=await used(d+'balance-after.json'),accountDelta=after-before,spent=Number(r.charged_generations);if(spent!==5)throw Error('Unexpected usage; investigate');
await save(d+'ledger.json',{cap:5,spent,reserved:0,attempts:1,retries:0,beforeUsed:before,afterUsed:after,accountDelta,unattributedAccountDelta:accountDelta-spent,jobId:r.job_id,actualBasis:'Provider completed-job charged_generations; shared account delta recorded separately',status:'completed'});
const details=[];for(const f of files){const bytes=await sharp(await readFile(P+f.url)).extract({left:32,top:0,width:64,height:128}).png().toBuffer(),id=f.id+'-detail',url='/assets/ssr/candidates/korean-wolf-front-02/'+id+'.png';await writeFile(P+url,bytes);details.push({id,url,sha256:hash(bytes)});}
const manifest={details,version:'hair-front-review/1',name:'แสกกลางเกาหลี · Wolf Cut รุ่นยาว ดำอมเทา ปลายเงิน',visualApproved:false,directions:['south'],files,headPivot:{x:62,y:49},credits:{spent,cap:5},unmaskedChanged,filled,trimmed,rampCleanup,tipPixels,protectedCleared,scope:'FRONT design only; approve before 8-view generation. No gameplay changes.'};await save(pub+'manifest.json',manifest);await save(d+'manifest.json',manifest);console.log({spent,unmaskedChanged,filled,trimmed});

