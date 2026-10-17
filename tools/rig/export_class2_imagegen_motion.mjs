// Export native motion candidates; constant scale/registration per clip and facing.
// No retouch, runtime publication, source changes, paid calls or duplicated still animation.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-motion-01',idleRoot='docs/design/equipment/class-2-imagegen-eight-01';
const lock=JSON.parse(await readFile(`${root}/source-lock.json`,'utf8'));
const base=JSON.parse(await readFile('apps/client/public/assets/character-v3/body-eight-02/manifest.json','utf8'));
const anchors=JSON.parse(await readFile('apps/client/public/assets/character-v3/hand-anchors.json','utf8'));
const report={version:'class-outfit-motion-candidates/1',pixelLabCredits:0,runtimeCompatible:false,published:false,frames:[],clips:[],missing:[],issues:[]};
const isSkin=(p,i)=>p[i+3]>180&&p[i]>140&&p[i]>p[i+1]*1.18&&p[i+1]>p[i+2]*1.12;
function inspect(p,w,h){
 // Select the main connected subject for cropping. Stray fragments outside this
 // rectangle are excluded by crop only; no pixels inside it are repainted/erased.
 const seen=new Uint8Array(w*h),components=[];
 for(let start=0;start<w*h;start++)if(!seen[start]&&p[start*4+3]>127){
  const q=[start];seen[start]=1;const b={x0:w,y0:h,x1:-1,y1:-1,area:0};
  for(let j=0;j<q.length;j++){const n=q[j],x=n%w,y=Math.floor(n/w);b.area++;b.x0=Math.min(b.x0,x);b.y0=Math.min(b.y0,y);b.x1=Math.max(b.x1,x);b.y1=Math.max(b.y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const nn=yy*w+xx;if(!seen[nn]&&p[nn*4+3]>127){seen[nn]=1;q.push(nn);}}
  }components.push(b);
 }
 components.sort((a,b)=>b.area-a.area);
 const primary=components[0]??{x0:w,y0:h,x1:-1,y1:-1,area:0};
 const {x0,y0,x1,y1}=primary;
 let nx=0,ny=0,n=0,skinTop=-1;
 for(let y=Math.max(0,y0);y<Math.min(h,y0+(y1-y0)*.35);y++){
  for(let x=Math.floor(w*.33);x<Math.ceil(w*.67);x++)if(isSkin(p,(y*w+x)*4)){
   if(skinTop<0)skinTop=y;
   if(y<=skinTop+3){nx+=x;ny+=y;n++;}
  }
  if(skinTop>=0&&y>skinTop+3)break;
 }
 return {x0,y0,x1,y1,neck:n?{x:nx/n,y:ny/n,top:skinTop}:null,primaryArea:primary.area,otherComponents:components.slice(1)};
}
function nearestHand(p,target){
 if(!target)return {point:null,distance:null,verified:false};
 let point=null,dist=Infinity;
 for(let y=Math.max(52,Math.floor(target.y)-10);y<=Math.min(112,Math.ceil(target.y)+10);y++)for(let x=Math.max(0,Math.floor(target.x)-10);x<=Math.min(127,Math.ceil(target.x)+10);x++)if(isSkin(p,(y*128+x)*4)){
  const ds=(x+.5-target.x)**2+(y+.5-target.y)**2;if(ds<dist){dist=ds;point={x:x+.5,y:y+.5};}
 }
 return {point,distance:point?Math.sqrt(dist):null,verified:false};
}
for(const [id,attack]of Object.entries(lock.ids))for(const action of ['walk','attack','cast']){
 const sourceAction=action==='attack'?attack:action,path=`${root}/${id}/${action}-raw.png`;
 if(!await access(path).then(()=>true,()=>false)){report.missing.push({id,action});continue;}
 const raw=await readFile(path),m=await sharp(raw).metadata(),cells=[];
 await mkdir(`${root}/${id}/${action}`,{recursive:true});
 for(const [row,d]of lock.order.entries()){
  const src=lock.clips[sourceAction].frames.filter(f=>f.direction===d),b=base.frames.find(f=>f.direction===d);
  const initial=anchors.actions[sourceAction]?.[d]?.[src[0].sourceIndex]??anchors.actions.idle[d][0];
  const chunks=[];
  for(let k=0;k<8;k++){
   const left=Math.floor(k*m.width/8),top=Math.floor(row*m.height/8),width=Math.floor((k+1)*m.width/8)-left,height=Math.floor((row+1)*m.height/8)-top;
   const img=await sharp(raw).extract({left,top,width,height}).png().toBuffer();
   const pixels=await sharp(img).ensureAlpha().raw().toBuffer();chunks.push({img,pixels,width,height,measure:inspect(pixels,width,height)});
  }
  const first=chunks[0].measure;
  if(!first.neck){report.issues.push({id,action,d,reason:'No calibration neck'});continue;}
  const scale=(b.opaqueBounds.y1-b.opaqueBounds.y0+1)/(first.y1-first.neck.top+1);
  const neckTarget=src[0].neckPivot;
  const offsetX=neckTarget.x-first.neck.x*scale,offsetY=b.opaqueBounds.y0-first.neck.top*scale;
  const hashes=[];
  for(let k=0;k<8;k++){
   const c=chunks[k],bounds=c.measure;
   if(bounds.x1<0){report.issues.push({id,action,d,k,reason:'Empty source cell'});continue;}
   const left=Math.round(offsetX+bounds.x0*scale),top=Math.round(offsetY+bounds.y0*scale);
   const width=Math.round((bounds.x1-bounds.x0+1)*scale),height=Math.round((bounds.y1-bounds.y0+1)*scale);
   if(left<0||top<0||left+width>128||top+height>128){report.issues.push({id,action,d,k,reason:'Canvas overflow',left,top,width,height});continue;}
   if(bounds.x0===0||bounds.y0===0||bounds.x1===c.width-1||bounds.y1===c.height-1)report.issues.push({id,action,d,k,reason:'Source cell edge contact'});
   const crop=await sharp(c.img).extract({left:bounds.x0,top:bounds.y0,width:bounds.x1-bounds.x0+1,height:bounds.y1-bounds.y0+1}).resize(width,height,{kernel:'nearest'}).png().toBuffer();
   const body=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:crop,left,top}]).png().toBuffer();
   const file=`${id}/${action}/${d}-${k}.png`;await writeFile(`${root}/${file}`,body);
   // Estimate neck around the calibrated attachment area, excluding most raised hands.
   const bp=await sharp(body).ensureAlpha().raw().toBuffer(),expected=src[k].neckPivot;
   let sx=0,sy=0,n=0;
   for(let y=Math.max(0,expected.y-4);y<=expected.y+3;y++)for(let x=expected.x-4;x<=expected.x+4;x++)if(isSkin(bp,(y*128+x)*4)){sx+=x;sy+=y;n++;}
   const neck=n?{x:Math.round(sx/n),y:Math.round(sy/n)}:{...expected};
   const entry=anchors.actions[sourceAction]?.[d]?.[src[k].sourceIndex]??initial;
   const main=nearestHand(bp,entry.main),off=nearestHand(bp,entry.off);
   if(!n)report.issues.push({id,action,d,k,reason:'Neck uses original pose fallback'});
   if(!main.point)report.issues.push({id,action,d,k,reason:'Main hand not visible near original pose target'});
   const head=await readFile(`apps/client/public${b.headUrl}`);
   if(hash(head)!==b.headSha256)throw Error('Original head changed');
   const dx=neck.x-b.neckPivot.x,dy=neck.y-b.neckPivot.y;
   // Translate the intact full-canvas source head using source alpha crop, not a new face.
   const hp=await sharp(head).ensureAlpha().raw().toBuffer();let hx0=128,hy0=128,hx1=-1,hy1=-1;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(hp[(y*128+x)*4+3]){hx0=Math.min(hx0,x);hx1=Math.max(hx1,x);hy0=Math.min(hy0,y);hy1=Math.max(hy1,y);}
   const headCut=await sharp(head).extract({left:hx0,top:hy0,width:hx1-hx0+1,height:hy1-hy0+1}).png().toBuffer();
   const preview=await sharp(body).composite([{input:headCut,left:hx0+dx,top:hy0+dy}]).png().toBuffer();
   await writeFile(`${root}/${id}/${action}/${d}-${k}-with-head.png`,preview);
   cells.push({input:preview,left:k*128,top:row*128});hashes.push(hash(body));
   report.frames.push({id,action,direction:d,index:k,url:file,sha256:hash(body),neck,main,off,neckVerified:false,sourceAction,sourceIndex:src[k].sourceIndex,originalHeadSha256:hash(head),headTranslation:{x:dx,y:dy},scale,bodyOrigin:b.bodyOrigin,sourceBounds:bounds,bakedKeris:action==='attack'&&id==='keris'});
  }
  report.clips.push({id,action,direction:d,frames:hashes.length,distinctByteHashes:new Set(hashes).size,scale,offsetX,offsetY,registration:'constant for the full eight-frame clip',visualApproved:false});
 }
 await sharp({create:{width:1024,height:1024,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(cells).png().toFile(`${root}/${id}/${action}-head-sheet.png`);
}
await writeFile(`${root}/export-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({frames:report.frames.length,clips:report.clips.length,missing:report.missing.length,issues:report.issues.length,runtimePublished:false}));
