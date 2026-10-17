import {readFile,writeFile,mkdir,access,copyFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01',old='docs/design/equipment/class-2-imagegen-armed-01';
const inventory=JSON.parse(await readFile(`${root}/inventory.json`)),prior=JSON.parse(await readFile(`${old}/export-report.json`)),base=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json'));
const report={pixelLabCredits:0,frames:[],clips:[],missing:[],issues:[],reference:'Exact armed idle artwork; native idle frames preserved'};
for(const f of prior.frames.filter(f=>f.action==='idle')){
 await mkdir(`${root}/${f.id}/idle`,{recursive:true});
 const bytes=await readFile(`${old}/${f.url}`);if(hash(bytes)!==f.sha256)throw Error('Original idle changed');
 await copyFile(`${old}/${f.url}`,`${root}/${f.url}`);
 await copyFile(`${old}/${f.url.replace('.png','-with-head.png')}`,`${root}/${f.url.replace('.png','-with-head.png')}`);
 report.frames.push({...f,idleByteExact:true});
}
const registrationVersion=4;
function torsoSpan(px,w,h,axis){
 let top=h,bottom=-1,neckXs=[];
 const band=Math.max(2,Math.round(w*.015));
 for(let y=0;y<h;y++)for(let x=Math.max(0,Math.round(axis)-band);x<=Math.min(w-1,Math.round(axis)+band);x++)if(px[(y*w+x)*4+3]>127)top=Math.min(top,y);
 for(let y=top;y<=Math.min(h-1,top+2);y++)for(let x=Math.max(0,Math.round(axis)-20);x<=Math.min(w-1,Math.round(axis)+20);x++)if(px[(y*w+x)*4+3]>127)neckXs.push(x);
 for(let y=top+Math.round(h*.35);y<h;y++)for(let x=Math.max(0,Math.round(axis-w*.22));x<=Math.min(w-1,Math.round(axis+w*.22));x++)if(px[(y*w+x)*4+3]>127)bottom=Math.max(bottom,y);
 return {top,bottom,x:neckXs.length?neckXs.reduce((n,x)=>n+x,0)/neckXs.length:axis,height:bottom-top+1};
}
let cached={frames:[],clips:[],issues:[]};try{cached=JSON.parse(await readFile(`${root}/export-report.json`));}catch{}
for(const j of inventory.jobs){
 if(!await access(j.output).then(()=>true,()=>false)){report.missing.push({id:j.id,action:j.action,direction:j.direction});continue;}
 const cleanup=j.output.replace('-raw.png','-alpha-cleanup.png'),source=await access(cleanup).then(()=>cleanup,()=>j.output);
 const bytes=await readFile(source),m=await sharp(bytes).metadata(),idle=prior.frames.find(f=>f.id===j.id&&f.action==='idle'&&f.direction===j.direction),b=base.frames.find(f=>f.direction===j.direction);
 j.exportSource=source;j.rawSha256=hash(await readFile(j.output));
 const corner=await sharp(bytes).extract({left:0,top:0,width:16,height:16}).ensureAlpha().raw().toBuffer();let opaqueBackdrop=0;
 for(let i=0;i<corner.length;i+=4)if(corner[i+3]>16&&Math.min(corner[i],corner[i+1],corner[i+2])>140&&Math.max(corner[i],corner[i+1],corner[i+2])-Math.min(corner[i],corner[i+1],corner[i+2])<12)opaqueBackdrop++;
 if(opaqueBackdrop>128){report.missing.push({id:j.id,action:j.action,direction:j.direction,reason:'Baked light background; awaiting alpha cleanup'});report.issues.push({id:j.id,action:j.action,direction:j.direction,reason:'Baked light background'});continue;}
 const same=f=>f.id===j.id&&f.action===j.action&&f.direction===j.direction;
 const cachedClip=cached.clips.find(same),cachedFrames=cached.frames.filter(same);
 if(cachedClip?.registrationVersion===registrationVersion&&cachedClip?.sourceSha256===hash(bytes)&&cachedFrames.length===8&&(await Promise.all(cachedFrames.map(f=>access(`${root}/${f.url}`).then(()=>true,()=>false)))).every(Boolean)){
  report.frames.push(...cachedFrames);report.clips.push(cachedClip);report.issues.push(...cached.issues.filter(same));j.status='generated';j.outputSha256=hash(bytes);j.dimensions={width:m.width,height:m.height};continue;
 }
 const registration=idle.sourceRegistration,{oldCellW,oldCellH}=registration;
 const ref=await sharp(j.reference).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const fw=Math.floor(m.width/4),fh=Math.floor(m.height/2),first=await sharp(bytes).extract({left:0,top:0,width:fw,height:fh}).ensureAlpha().raw().toBuffer();
 const referenceSpan=torsoSpan(ref.data,ref.info.width,ref.info.height,(idle.neck.x-registration.offsetX)/registration.scale),firstSpan=torsoSpan(first,fw,fh,fw/2);
 if(referenceSpan.height<30||firstSpan.height<30)throw Error('Cannot measure torso: '+j.output);
 // One measured registration per clip, not per-frame fitting or weapon-bounds scaling.
 const factor=referenceSpan.height/firstSpan.height;
 const scale=registration.scale*factor,offsetX=idle.neck.x-firstSpan.x*scale;
 const offsetY=registration.offsetY+referenceSpan.top*registration.scale-firstSpan.top*scale;
 const previews=[];await mkdir(`${root}/${j.id}/${j.action}`,{recursive:true});
 for(let k=0;k<8;k++){
  const col=k%4,row=Math.floor(k/4),left=Math.floor(col*m.width/4),top=Math.floor(row*m.height/2),width=Math.floor((col+1)*m.width/4)-left,height=Math.floor((row+1)*m.height/2)-top;
  const rgba=await sharp(bytes).extract({left,top,width,height}).ensureAlpha().raw().toBuffer(),isolated=isolateAtlasCell(rgba,width,height);
  const w=Math.round(width*scale),h=Math.round(height*scale);
  const scaled=await sharp(isolated.pixels,{raw:{width,height,channels:4}}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
  const px=await sharp(scaled).ensureAlpha().raw().toBuffer();let clipped=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>127&&(x+Math.round(offsetX)<0||x+Math.round(offsetX)>=128||y+Math.round(offsetY)<0||y+Math.round(offsetY)>=128))clipped++;
  const staging=await sharp({create:{width:384,height:384,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:scaled,left:128+Math.round(offsetX),top:128+Math.round(offsetY)}]).png().toBuffer();
  const body=await sharp(staging).extract({left:128,top:128,width:128,height:128}).png().toBuffer(),url=`${j.id}/${j.action}/${j.direction}-${k}.png`;
  await writeFile(`${root}/${url}`,body);
  const head=await readFile('apps/client/public'+b.headUrl);if(hash(head)!==b.headSha256)throw Error('Original head changed');
  const full=await sharp(body).composite([{input:head,left:idle.headTranslation.x,top:idle.headTranslation.y}]).png().toBuffer();
  await writeFile(`${root}/${url.replace('.png','-with-head.png')}`,full);previews.push({input:full,left:col*128,top:row*128});
  report.frames.push({id:j.id,action:j.action,direction:j.direction,index:k,url,sha256:hash(body),neck:idle.neck,bodyOrigin:idle.bodyOrigin,bakedWeapon:idle.bakedWeapon,sourceRegistration:{...registration,scale,offsetX,offsetY,registrationVersion},clippedPixels:clipped,visualApproved:false});
  if(clipped)report.issues.push({id:j.id,action:j.action,direction:j.direction,index:k,clippedPixels:clipped});
 }
 await sharp({create:{width:512,height:256,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(previews).png().toFile(`${root}/${j.id}/${j.action}-${j.direction}-head-sheet.png`);
 j.status='generated';j.outputSha256=hash(bytes);j.dimensions={width:m.width,height:m.height};report.clips.push({id:j.id,action:j.action,direction:j.direction,sourceCell:{width:m.width/4,height:m.height/2},idleReferenceCell:{width:oldCellW,height:oldCellH},sourceSha256:hash(bytes),registrationVersion,referenceSpan,firstSpan,factor,scale,offsetX,offsetY});
}
await writeFile(`${root}/inventory.json`,JSON.stringify(inventory,null,2));await writeFile(`${root}/export-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({clips:report.clips.length,motionFrames:report.frames.filter(f=>f.action!=='idle').length,preservedIdleFrames:48,missing:report.missing.length,clipping:report.issues.length,pixelLabCredits:0}));
