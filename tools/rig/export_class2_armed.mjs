// Canvas export of newly generated body+weapon pixels. No separately composited weapon.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {BRANCH_WEAPONS} from '../../packages/shared/dist/index.js';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
const root='docs/design/equipment/class-2-imagegen-armed-01',oldMotion='docs/design/equipment/class-2-imagegen-motion-01',oldIdle='docs/design/equipment/class-2-imagegen-eight-01';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const inventory=await json(`${root}/inventory.json`),motions=await json(`${oldMotion}/export-report.json`),idles=await json(`${oldIdle}/export-report.json`),base=await json('apps/client/public/assets/character-v3/body-eight-02/manifest.json');
const report={pixelLabCredits:0,frames:[],missing:[],issues:[],sourceManifestHash:hash(await readFile('apps/client/public/assets/character-v3/class-outfits/manifest.json'))};
for(const job of inventory.jobs){
 const {id,action}=job;
 const cleanup=`${root}/${id}/${action}-fan-cleanup.png`;
 const path=await access(cleanup).then(()=>cleanup,()=>`${root}/${id}/${action}-raw.png`);
 if(!await access(path).then(()=>true,()=>false)){report.missing.push({id,action});continue;}
 const raw=await readFile(path),m=await sharp(raw).metadata(),idle=action==='idle',cols=idle?4:8,rows=idle?2:8;
 const previous=await sharp(idle?`${oldIdle}/${id}/eight-raw.png`:`${oldMotion}/${id}/${action}-raw.png`).metadata();
 job.status='generated';job.exportSource=path;job.rawSha256=hash(raw);job.rawWidth=m.width;job.rawHeight=m.height;
 await mkdir(`${root}/${id}/${action}`,{recursive:true});const previews=[];
 for(const [directionIndex,d]of base.frames.map(b=>b.direction).entries()){
  const b=base.frames.find(f=>f.direction===d),oldStatic=idles.frames.find(f=>f.id===id&&f.direction===d);
  const oldCellW=idle?previous.width/4:previous.width/8,oldCellH=idle?previous.height/2:previous.height/8;
  let scale,offsetX,offsetY;
  if(idle){scale=(b.opaqueBounds.y1-b.opaqueBounds.y0+1)/(oldStatic.sourceBounds.y1-oldStatic.sourceNeck.top+1);offsetX=b.neckPivot.x-oldStatic.sourceNeck.x*scale;offsetY=b.opaqueBounds.y0-oldStatic.sourceNeck.top*scale;}
  else{const c=motions.clips.find(f=>f.id===id&&f.action===action&&f.direction===d);({scale,offsetX,offsetY}=c);}
  for(let k=0;k<(idle?1:8);k++){
   const col=idle?directionIndex%4:k,row=idle?Math.floor(directionIndex/4):directionIndex;
   const x=Math.floor(col*m.width/cols),y=Math.floor(row*m.height/rows),width=Math.floor((col+1)*m.width/cols)-x,height=Math.floor((row+1)*m.height/rows)-y;
   const sourcePixels=await sharp(raw).extract({left:x,top:y,width,height}).ensureAlpha().raw().toBuffer();
   const isolation=isolateAtlasCell(sourcePixels,width,height);
   const cell=await sharp(isolation.pixels,{raw:{width,height,channels:4}}).png().toBuffer();
   const w=Math.round(oldCellW*scale),h=Math.round(oldCellH*scale),left=Math.round(offsetX),top=Math.round(offsetY);
   const scaled=await sharp(cell).resize(w,h,{kernel:'nearest'}).png().toBuffer();
   const pixels=await sharp(scaled).ensureAlpha().raw().toBuffer();let clipped=0;
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(pixels[(yy*w+xx)*4+3]>127&&(xx+left<0||xx+left>=128||yy+top<0||yy+top>=128))clipped++;
   if(clipped)report.issues.push({id,action,direction:d,index:k,reason:'Opaque pixels outside native canvas',pixels:clipped});
   // A padded staging canvas makes clipping explicit; source art is never resized to weapon bounds.
   const staging=await sharp({create:{width:384,height:384,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:scaled,left:left+128,top:top+128}]).png().toBuffer();
   const body=await sharp(staging).extract({left:128,top:128,width:128,height:128}).png().toBuffer();
   const file=`${id}/${action}/${d}${idle?'':'-'+k}.png`;await writeFile(`${root}/${file}`,body);
   const source=idle?null:motions.frames.find(f=>f.id===id&&f.action===action&&f.direction===d&&f.index===k);
   const neck=source?.neck??b.neckPivot,head=await readFile(`apps/client/public${b.headUrl}`);
   if(hash(head)!==b.headSha256)throw Error('Original head changed');
   const dx=neck.x-b.neckPivot.x,dy=neck.y-b.neckPivot.y;
   const headStaging=await sharp({create:{width:384,height:384,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:body,left:128,top:128},{input:head,left:128+dx,top:128+dy}]).png().toBuffer();
   const headCanvas=await sharp(headStaging).extract({left:128,top:128,width:128,height:128}).png().toBuffer();
   await writeFile(`${root}/${file.replace('.png','-with-head.png')}`,headCanvas);
   previews.push({input:headCanvas,left:(idle?directionIndex%4:k)*128,top:(idle?Math.floor(directionIndex/4):directionIndex)*128});
   report.frames.push({id,action,direction:d,index:k,url:file,sha256:hash(body),bakedWeapon:BRANCH_WEAPONS[id],neck,headTranslation:{x:dx,y:dy},bodyOrigin:b.bodyOrigin,sourceRegistration:{scale,offsetX,offsetY,oldCellW,oldCellH},weaponSeparatelyComposited:false,visualApproved:false,clippedPixels:clipped,atlasIsolation:{removedComponents:isolation.removed}});
  }
 }
 await sharp({create:{width:cols*128,height:rows*128,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(previews).png().toFile(`${root}/${id}/${action}-head-sheet.png`);
}
await writeFile(`${root}/inventory.json`,JSON.stringify(inventory,null,2));
await writeFile(`${root}/export-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({frames:report.frames.length,missingJobs:report.missing.length,canvasClippingFlags:report.issues.length,pixelLabCredits:0}));
