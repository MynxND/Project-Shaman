// Job lifecycle: create -> generate (ComfyUI H3) -> process -> QA -> human review.
import {readdir,readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {sharp,jobsDir,approvedDir,SIZE,character,DIRECTIONS,load,savePng,png,readJson,writeJson,hash,rel,bounds,blank} from './common.mjs';
import {ACTIONS,buildPrompt,keyframe} from './prepare.mjs';
import {buildGraph,alignLength} from './workflow.mjs';
import {uploadImage,runGraph,fetchOutput} from './comfy.mjs';
import {palette,downsample,cleanIslands,shift,register,extractHead,replaceHead,groundLock,pickFrames} from './process.mjs';
import {runQa} from './qa.mjs';
import {phaseFrames} from './gait.mjs';

const jobDir=id=>resolve(jobsDir,id);
const jobFile=id=>resolve(jobDir(id),'job.json');
const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);

export async function listJobs(){if(!existsSync(jobsDir))return[];const ids=(await readdir(jobsDir)).filter(d=>existsSync(jobFile(d)));const all=await Promise.all(ids.map(getJob));return all.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export const getJob=id=>{if(!/^[\w.-]+$/.test(id))throw new Error('bad job id');return readJson(jobFile(id));};
export const saveJob=job=>writeJson(jobFile(job.id),job);

export async function createJob(input){
  const c=character(input.character);
  if(!DIRECTIONS.includes(input.direction))throw new Error(`direction must be one of ${DIRECTIONS.join(', ')}`);
  const action=input.action||'custom',preset=ACTIONS[action];
  if(!preset&&!input.custom)throw new Error(`unknown action ${action}; use a preset (${Object.keys(ACTIONS).join(', ')}) or pass custom text`);
  const loop=input.loop??preset?.loop??false;
  const params={canvas:768,length:alignLength(input.length??preset?.length??39),frames:Math.max(4,Math.min(24,Number(input.frames??preset?.frames??8))),seed:Number(input.seed??Math.floor(Math.random()*2**31)),turbo:input.turbo??true,loop,groundLock:input.groundLock??action!=='death',fps:Number(input.fps??(action==='cast'?12:action==='walk'||action==='idle'?8:16))};
  params.headMode=input.headMode==='generated'?'generated':'original';
  if(params.headMode==='generated'&&input.groundLock===undefined)params.groundLock=false;
  if(input.phaseTimes)params.phaseTimes=input.phaseTimes;
  const prompt=input.prompt?.trim()||buildPrompt({character:c,direction:input.direction,action,custom:input.custom,loop});
  const id=`${stamp()}-${c.id}-${input.direction}-${action}`.replace(/[^\w.-]/g,'-');
  const job={id,character:c.id,direction:input.direction,action,custom:input.custom||null,prompt,params,status:'queued',progress:null,error:null,createdAt:new Date().toISOString(),requestedBy:input.requestedBy||'web',notes:input.notes||null,review:null,qa:null,selected:null};
  await mkdir(jobDir(id),{recursive:true});await writeFile(resolve(jobDir(id),'prompt.txt'),prompt+'\n');await saveJob(job);return job;
}

export async function generate(job,{onUpdate=()=>{},signal}={}){
  const c=character(job.character),dir=jobDir(job.id),p=job.params;
  const set=async patch=>{Object.assign(job,patch);await saveJob(job);onUpdate(job);};
  try{
    await set({status:'generating',progress:{phase:'อัปโหลดคีย์เฟรม'},error:null});
    const kf=await keyframe(c,job.direction,p.canvas);
    await writeFile(resolve(dir,'input-first.png'),kf.keyframePng);
    const first=await uploadImage(kf.keyframePng,`${job.id}-first.png`);
    const graph=buildGraph({prompt:job.prompt,firstImage:first,lastImage:p.loop?first:null,canvas:p.canvas,length:p.length,seed:p.seed,turbo:p.turbo,prefix:`pose-studio/${job.id}/f`});
    await writeJson(resolve(dir,'graph.json'),graph);
    const t0=Date.now();
    const res=await runGraph(graph,{signal,onProgress:pr=>{job.progress={phase:pr.steps?`สร้างวิดีโอ ขั้น ${pr.step}/${pr.steps}`:'โหลดโมเดล/ถอดรหัส',...pr,elapsed:Math.round((Date.now()-t0)/1000)};onUpdate(job);}});
    const images=Object.values(res.outputs).flatMap(o=>o.images||[]);
    if(!images.length)throw new Error('ComfyUI finished without frames');
    await set({progress:{phase:`ดาวน์โหลด ${images.length} เฟรม`},comfy:{promptId:res.promptId,frames:images.length,seconds:Math.round((Date.now()-t0)/1000)}});
    await rm(resolve(dir,'raw'),{recursive:true,force:true});await mkdir(resolve(dir,'raw'),{recursive:true});
    for(const[i,im]of images.entries())await writeFile(resolve(dir,'raw',`${String(i).padStart(3,'0')}.png`),await fetchOutput(im));
    await set({keyColor:kf.key});
    await processJob(job,{onUpdate});
  }catch(e){await set({status:e.message==='cancelled'?'cancelled':'failed',error:String(e.message||e),progress:null});}
  return job;
}

// Rebuild 128px frames from raw video frames (re-runnable without the GPU).
export async function processJob(job,{onUpdate=()=>{},selected}={}){
  const c=character(job.character),dir=jobDir(job.id),p=job.params;
  job.status='processing';job.progress={phase:'แปลงเป็น sprite 128px'};await saveJob(job);onUpdate(job);
  const kf=await keyframe(c,job.direction,p.canvas);
  const idle=kf.withHead,pal=palette(idle),{head,box}=extractHead(await load(kf.paths.withHead),kf.body),baseline=bounds(idle).y1;
  const rawNames=(await readdir(resolve(dir,'raw'))).filter(f=>f.endsWith('.png')).sort();
  const ds=[];for(const f of rawNames){const d=downsample(await load(resolve(dir,'raw',f)),{key:job.keyColor||kf.key,pal});d.islands=cleanIslands(d.img);ds.push(d);}
  const reg=register(ds[0].img,idle);
  const frames=[],meta=[];let prev={dx:0,dy:0};
  for(const[i,d]of ds.entries()){
    let img=shift(d.img,reg.dx,reg.dy),gdy=0;
    if(p.groundLock){const g=groundLock(img,baseline);img=g.img;gdy=g.dy;}
    const h=p.headMode==='generated'?{full:img,body:img,offset:{dx:0,dy:0},matchError:0}:replaceHead(img,head,box,prev);prev=h.offset;
    frames.push({...h,groundDy:gdy});meta.push({meanPaletteError:+d.meanPaletteError.toFixed(1),offPaletteShare:+d.offPaletteShare.toFixed(3),islands:d.islands,bg:d.bg});
  }
  await rm(resolve(dir,'native'),{recursive:true,force:true});await rm(resolve(dir,'body'),{recursive:true,force:true});
  for(const[i,f]of frames.entries()){const n=String(i).padStart(3,'0');await savePng(resolve(dir,'native',`${n}.png`),f.full);await savePng(resolve(dir,'body',`${n}.png`),f.body);}
  const sel=selected||job.selected||(p.phaseTimes?phaseFrames(p.phaseTimes,{sourceFps:24,frameCount:frames.length}):pickFrames(frames.length,p.frames,p.loop));
  const qa=runQa({idle,frames,selected:sel,meta,loop:p.loop});
  if(job.action==='walk'&&!p.phaseTimes&&!selected&&!job.selected){qa.checks.push({id:'gait-phases',label:'จังหวะก้าว',status:'warn',detail:'Legacy uniform sampling; eight gait timestamps are not authored. Not certified.'});qa.status=qa.status==='fail'?'fail':'warn';}
  await writeJson(resolve(dir,'frames.json'),{registration:reg,frames:frames.map((f,i)=>({index:i,headOffset:f.offset,headMatchError:f.matchError,groundDy:f.groundDy,...meta[i]}))});
  await exportSprite(job,frames,sel);
  await rawSheet(job,rawNames);
  Object.assign(job,{status:'review',progress:null,selected:sel,qa,registration:reg,frameCount:frames.length,processedAt:new Date().toISOString()});
  await saveJob(job);onUpdate(job);return job;
}

async function exportSprite(job,frames,sel){
  const dir=jobDir(job.id),out=resolve(dir,'sprite');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
  const files=[];for(const[k,i]of sel.entries()){const b=await png(frames[i].full);await writeFile(resolve(out,`${job.direction}-${k}.png`),b);files.push({file:`${job.direction}-${k}.png`,source:i,sha256:hash(b),headOffset:frames[i].offset});}
  const strip=blank(SIZE*sel.length,SIZE);for(const[k,i]of sel.entries())for(let y=0;y<SIZE;y++)frames[i].full.d.copy(strip.d,(y*strip.w+k*SIZE)*4,y*SIZE*4,(y+1)*SIZE*4);
  await savePng(resolve(out,'sheet.png'),strip);
  const scale=3,pages=[];for(const i of sel)pages.push(await sharp(frames[i].full.d,{raw:{width:SIZE,height:SIZE,channels:4}}).resize(SIZE*scale,SIZE*scale,{kernel:'nearest'}).flatten({background:'#2b3b3a'}).ensureAlpha().raw().toBuffer());
  await sharp(Buffer.concat(pages),{raw:{width:SIZE*scale,height:SIZE*scale*sel.length,channels:4,pageHeight:SIZE*scale}}).gif({delay:Array(sel.length).fill(Math.round(1000/job.params.fps)),loop:0}).toFile(resolve(out,'preview.gif'));
  await writeJson(resolve(out,'manifest.json'),{version:'pose-studio-clip/1',character:job.character,direction:job.direction,action:job.action,fps:job.params.fps,loop:job.params.loop,frameSize:SIZE,headSource:job.params.headMode==='generated'?'generated full character; separate-head runtime unsupported':'original idle head pixels re-stamped per frame',frames:files,visualApproved:false});
}

async function rawSheet(job,names){
  const dir=jobDir(job.id),cell=160,cols=Math.min(10,names.length),rows=Math.ceil(names.length/cols);
  const comps=await Promise.all(names.map(async(n,i)=>({input:await sharp(resolve(dir,'raw',n)).resize(cell,cell,{kernel:'nearest'}).png().toBuffer(),left:(i%cols)*cell,top:Math.floor(i/cols)*cell})));
  await sharp({create:{width:cols*cell,height:rows*cell,channels:3,background:'#101818'}}).composite(comps).png().toFile(resolve(dir,'raw-sheet.png'));
}

export async function setSelection(id,sel){const job=await getJob(id);const n=job.frameCount;if(!Array.isArray(sel)||sel.length<4||sel.some(i=>!Number.isInteger(i)||i<0||i>=n))throw new Error(`selection must be at least 4 frame indexes in 0..${n-1}`);return processJob(job,{selected:sel});}

export async function review(id,{decision,note,by}){
  const job=await getJob(id);if(!['approved','rejected'].includes(decision))throw new Error('decision must be approved or rejected');
  if(decision==='approved'&&job.status!=='review'&&job.status!=='approved')throw new Error(`job is ${job.status}; only reviewed jobs can be approved`);
  job.status=decision;job.review={decision,note:note||null,by:by||'user',at:new Date().toISOString()};
  if(decision==='approved'){const target=resolve(approvedDir,job.character,job.action,job.direction);await rm(target,{recursive:true,force:true});await cp(resolve(jobDir(id),'sprite'),target,{recursive:true});const m=await readJson(resolve(target,'manifest.json'));m.visualApproved=true;m.job=job.id;m.approvedAt=job.review.at;m.prompt=job.prompt;await writeJson(resolve(target,'manifest.json'),m);job.approvedPath=rel(target);}
  await saveJob(job);return job;
}

export async function removeJob(id){const job=await getJob(id);if(['generating','processing'].includes(job.status))throw new Error('job is running');await rm(jobDir(id),{recursive:true,force:true});return{removed:id};}
