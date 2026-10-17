// Package four newly authored contact/passing key poses into eight timing slots.
// Original upper-body/head/hand-grip pixels and all source files stay exact.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sharp,hash} from './body-eight-lib.mjs';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
const out=resolve('docs/design/walk-regeneration-2026-10-14');
const plan=JSON.parse(await readFile(resolve(out,'plan.json')));
const oldRoot=resolve('docs/design/equipment/class-2-imagegen-detail-01');
const bytes=await readFile(resolve(oldRoot,'export-report.json')),source=JSON.parse(bytes);
if(hash(bytes)!==plan.sourceFingerprint)throw Error('Source report changed');
const clips=[],assets=[];
for(const job of plan.jobs){
 const dir=resolve(out,job.id,job.direction),raw=resolve(dir,'four-phase-raw.png');
 if(!await access(raw).then(()=>true,()=>false))continue;
 const input=await readFile(raw),meta=await sharp(input).metadata();
 const originals=source.frames.filter(f=>f.id===job.id&&f.action==='walk'&&f.direction===job.direction).sort((a,b)=>a.index-b.index);
 const originalMeta=await sharp(resolve(oldRoot,job.id,'walk-'+job.direction+'-raw.png')).metadata();
 const reg=originals[0].sourceRegistration;
 const phases=[];
 for(let phase=0;phase<4;phase++){
  const x0=Math.floor(phase%2*meta.width/2),y0=Math.floor(Math.floor(phase/2)*meta.height/2);
  const w=Math.floor((phase%2+1)*meta.width/2)-x0,h=Math.floor((Math.floor(phase/2)+1)*meta.height/2)-y0;
  const cell=await sharp(input).extract({left:x0,top:y0,width:w,height:h}).ensureAlpha().raw().toBuffer();
  const clean=isolateAtlasCell(cell,w,h);
  const scaled=await sharp(clean.pixels,{raw:{width:w,height:h,channels:4}}).resize(Math.round(originalMeta.width/4*reg.scale),Math.round(originalMeta.height/2*reg.scale),{kernel:'nearest'}).png().toBuffer();
  const padded=await sharp({create:{width:384,height:384,channels:4,background:'#00000000'}}).composite([{input:scaled,left:128+Math.round(reg.offsetX),top:128+Math.round(reg.offsetY)}]).png().toBuffer();
  phases.push(await sharp(padded).extract({left:128,top:128,width:128,height:128}).ensureAlpha().raw().toBuffer());
 }
 const frames=[],board=[];
 for(let i=0;i<8;i++){
  const f=originals[i],oldBytes=await readFile(resolve(oldRoot,f.url));if(hash(oldBytes)!==f.sha256)throw Error('Source frame changed');
  const old=await sharp(oldBytes).ensureAlpha().raw().toBuffer(),next=Buffer.from(old),phase=Math.floor(i/2);
  // No per-frame body fitting/warping. One existing clip registration is used.
  // Replace the full lower band; lower staff/hem changes require visual review.
  for(let y=88;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4;phases[phase].copy(next,p,p,p+4);}
  if(!next.subarray(0,88*128*4).equals(old.subarray(0,88*128*4)))throw Error('Upper pixels changed');
  const png=await sharp(next,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
  const file=resolve(dir,i+'.png');await writeFile(file,png);
  const asset=assets.length;assets.push({path:file,sha256:hash(png)});
  // Measure the actual lower-band alpha baseline, including any lower weapon.
  let low=-1;for(let y=88;y<128;y++)for(let x=0;x<128;x++)if(next[(y*128+x)*4+3]>127)low=Math.max(low,y);
  frames.push({index:i,phase,asset,url:'/head-walk-regeneration-image/'+job.id+'/'+job.direction+'/'+i+'?sha='+hash(png),sha256:hash(png),
    parentSha256:f.sha256,neck:f.neck,upperUnchanged:true,lowerBottom:low,visualApproved:false});
  board.push({input:oldBytes,left:i*128,top:0},{input:png,left:i*128,top:128});
 }
 const boardPng=await sharp({create:{width:1024,height:256,channels:4,background:'#243a34'}}).composite(board).png().toBuffer();
 await sharp(boardPng).resize(2048,512,{kernel:'nearest'}).png().toFile(resolve(dir,'before-after.png'));
 const baselineRange=Math.max(...frames.map(f=>f.lowerBottom))-Math.min(...frames.map(f=>f.lowerBottom));
 clips.push({key:job.key,id:job.id,direction:job.direction,frames,rawSha256:hash(input),visualApproved:false,baselineRange,
  gaitStatus:'candidate: four new contact/passing poses, each held two slots; not eight authored phases',
  warnings:['Missing intermediate swing/recoil art remains; loop/foot sliding still need review.','Lower hem/staff band and seams require inspection; grip/upper/neck stay byte-exact.',`Lower alpha baseline varies ${baselineRange}px (includes weapon); foot contact must be checked visually.`]});
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify({version:1,planned:plan.jobs.length,generated:clips.length,clips,assets,visualApproved:false,runtimePublished:false},null,2));
console.log('Packaged '+clips.length+'/'+plan.jobs.length+' regenerated four-phase candidates');
