// Static asset export only: crop, nearest scale, source-head composition and measurements.
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {IDLE,FACE} from './v3_pose_lib.mjs';
const root='docs/design/equipment/class-2-imagegen-eight-01';
const fit='docs/design/equipment/class-2-imagegen-fit-01';
const lock=JSON.parse(await readFile(`${root}/source-lock.json`,'utf8'));
const skin=(p,i)=>p[i+3]>180&&p[i]>140&&p[i]>p[i+1]*1.18&&p[i+1]>p[i+2]*1.12;
const report={builtInImagegenCalls:6,pixelLabCredits:0,runtimePublished:false,sourceHeadsUnchanged:true,frames:[],warnings:[],outfits:[]};
const globalParts=[];
for(const [classIndex,id] of lock.ids.entries()){
 const raw=await readFile(`${root}/${id}/eight-raw.png`),meta=await sharp(raw).metadata();
 if(meta.width<512||meta.height<256)throw Error(`${id}: source grid too small`);
 const p=await sharp(raw).ensureAlpha().raw().toBuffer();
 const sheet=[];await mkdir(`${root}/${id}/idle`,{recursive:true});
 report.outfits.push({id,rawSha256:hash(raw),rawWidth:meta.width,rawHeight:meta.height,columns:4,rows:2});
 for(const [i,d] of lock.order.entries()){
  const base=lock.sources.find(s=>s.direction===d),col=i%4,row=Math.floor(i/4);
  const cx=Math.floor(col*meta.width/4),cy=Math.floor(row*meta.height/2);
  const cw=Math.floor((col+1)*meta.width/4)-cx,ch=Math.floor((row+1)*meta.height/2)-cy;
  const original=await readFile(`apps/client/public${base.url}`);
  if(hash(original)!==base.sha256)throw Error(`Original base changed:${d}`);
  let x0=cw,y0=ch,x1=-1,y1=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(p[((cy+y)*meta.width+cx+x)*4+3]>127){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<0||x0===0||x1===cw-1||y0===0||y1===ch-1)report.warnings.push({id,d,reason:'empty or source cell edge contact'});
  let nx=0,ny=0,n=0,skinTop=-1;
  for(let y=y0;y<Math.min(ch,y0+Math.ceil((y1-y0)*.13));y++){
   let count=0;for(let x=x0;x<=x1;x++)if(skin(p,((cy+y)*meta.width+cx+x)*4)){if(skinTop<0)skinTop=y;if(y<=skinTop+4){nx+=x;ny+=y;n++;}count++;}
   if(skinTop>=0&&y>skinTop+4)break;
  }
  if(!n)throw Error(`${id}/${d}: no visible neck stump`);
  nx/=n;ny/=n;
  const neckTop=base.opaqueBounds.y0;
  const scale=(base.opaqueBounds.y1-neckTop+1)/(y1-skinTop+1);
  const width=Math.round((x1-x0+1)*scale),height=Math.round((y1-y0+1)*scale);
  const left=Math.round(base.neckPivot.x-(nx-x0)*scale),top=Math.round(neckTop-(skinTop-y0)*scale);
  if(left<0||top<0||left+width>128||top+height>128)throw Error(`${id}/${d}: export overflow`);
  const path=`${root}/${id}/idle/${d}.png`;
  let body;
  if(d==='south'){await copyFile(`${fit}/south/${id}-body.png`,path);body=await readFile(path);}
  else{
   const crop=await sharp(raw).extract({left:cx+x0,top:cy+y0,width:x1-x0+1,height:y1-y0+1}).resize(width,height,{kernel:'nearest'}).png().toBuffer();
   body=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:crop,left,top}]).png().toBuffer();await writeFile(path,body);
  }
  const head=await readFile(`apps/client/public${base.headUrl}`);
  if(hash(head)!==base.headSha256)throw Error(`${d}: head source changed`);
  const composed=await sharp(body).composite([{input:head,left:0,top:0}]).png().toBuffer();
  await writeFile(`${root}/${id}/idle/${d}-with-head.png`,composed);
  sheet.push({input:await sharp(composed).resize(384,384,{kernel:'nearest'}).png().toBuffer(),left:(i%4)*384,top:Math.floor(i/4)*384});
  // Candidate hand measurements only. No anchor or occlusion metadata is published to runtime.
  const bp=await sharp(body).ensureAlpha().raw().toBuffer();
  const hands={};
  for(const [side,label] of [['left','LEFT ARM'],['right','RIGHT ARM']]){
   const target=IDLE[d][label];let best=null,dist=Infinity;
   for(let y=62;y<=91;y++)for(let x=Math.max(0,target[0]-15);x<=Math.min(127,target[0]+15);x++)if(skin(bp,(y*128+x)*4)){
    const ds=(x+.5-target[0])**2+(y+.5-target[1])**2;if(ds<dist){best={x:x+.5,y:y+.5};dist=ds;}
   }
   hands[side]={sourceTarget:{x:target[0],y:target[1]},nearestSkin:best,distance:best?Math.sqrt(dist):null,verified:false};
  }
  const mainSide=FACE[d].near.toLowerCase(),offSide=mainSide==='left'?'right':'left';
  report.frames.push({id,direction:d,url:`${id}/idle/${d}.png`,sha256:hash(body),size:128,reusedSouth:d==='south',sourceBounds:{x0,y0,x1,y1},sourceNeck:{x:nx,y:ny,top:skinTop},export:d==='south'?'unchanged previous SOUTH':{left,top,width,height,scale},bodyOrigin:base.bodyOrigin,neckPivot:base.neckPivot,headPivot:base.headPivot,headSha256:hash(head),hands,mainSide,offSide,handAnchorsVerified:false,visualApproved:false});
 }
 const full=await sharp({create:{width:1536,height:768,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(sheet).png().toBuffer();
 await writeFile(`${root}/${id}/eight-original-head-review-3x.png`,full);
 globalParts.push({input:await sharp(full).resize(1024,512,{kernel:'nearest'}).png().toBuffer(),left:0,top:classIndex*512});
}
await sharp({create:{width:1024,height:3072,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(globalParts).png().toFile(`${root}/all-six-eight-original-head-review-2x.png`);
await writeFile(`${root}/export-report.json`,JSON.stringify(report,null,2));
console.log(`Exported${report.frames.length} native128 static frames;${report.warnings.length} crop warnings; no runtime publication.`);
