import {readFile,writeFile,mkdir,access,copyFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
const root='docs/design/equipment/class-2-walk-repair-01',old='docs/design/equipment/class-2-imagegen-detail-01';
const [direction,input]=process.argv.slice(2);if(!['north','north-east','south-west'].includes(direction)||!input)throw Error('direction and new pair sheet required');
const m=await sharp(input).metadata(),w=Math.floor(m.width/2),h=m.height;
function landmarks(p,w,h){let sum=0,count=0;for(let y=Math.floor(h*.35);y<h*.6;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>127){sum+=x;count++;}const axis=sum/count,lo=Math.max(0,Math.floor(axis-w*.08)),hi=Math.min(w,Math.ceil(axis+w*.08));let top=h,bottom=-1,xs=[];for(let y=0;y<h;y++)for(let x=lo;x<hi;x++)if(p[(y*w+x)*4+3]>127)top=Math.min(top,y);for(let y=top;y<Math.min(h,top+3);y++)for(let x=lo;x<hi;x++)if(p[(y*w+x)*4+3]>127)xs.push(x);for(let y=top;y<h;y++)for(let x=Math.max(0,Math.floor(axis-w*.3));x<Math.min(w,Math.ceil(axis+w*.3));x++)if(p[(y*w+x)*4+3]>127)bottom=Math.max(bottom,y);return {top,bottom,x:xs.reduce((a,b)=>a+b,0)/xs.length};}
const first=await sharp(input).extract({left:0,top:0,width:w,height:h}).ensureAlpha().raw().toBuffer();
const baseline=await sharp(old+'/santet/walk/'+direction+'-0.png').ensureAlpha().raw().toBuffer();
const from=landmarks(first,w,h),to=landmarks(baseline,128,128),scale=(to.bottom-to.top)/(from.bottom-from.top),offsetX=to.x-from.x*scale,offsetY=to.top-from.top*scale;
if(!Number.isFinite(scale)||scale<=0||from.bottom-from.top<30)throw Error('Cannot register new sheet');
const pairs=[],registrations=[];await mkdir(root+'/new-pair/'+direction,{recursive:true});
for(let k=0;k<2;k++){
 const left=Math.floor(k*m.width/2),width=Math.floor((k+1)*m.width/2)-left,cell=await sharp(input).extract({left,top:0,width,height:h}).ensureAlpha().raw().toBuffer(),isolated=isolateAtlasCell(cell,width,h);
 const measured=landmarks(isolated.pixels,width,h),poseX=to.x-measured.x*scale,poseY=to.top-measured.top*scale;registrations.push({measured,scale,offsetX:poseX,offsetY:poseY});
 const scaled=await sharp(isolated.pixels,{raw:{width,height:h,channels:4}}).resize(Math.round(width*scale),Math.round(h*scale),{kernel:'nearest'}).png().toBuffer();
 const pad=await sharp({create:{width:384,height:384,channels:4,background:'#00000000'}}).composite([{input:scaled,left:128+Math.round(poseX),top:128+Math.round(poseY)}]).png().toBuffer();
 const native=await sharp(pad).extract({left:128,top:128,width:128,height:128}).png().toBuffer();await writeFile(root+'/new-pair/'+direction+'/'+(k?'right':'left')+'.png',native);pairs.push(await sharp(native).ensureAlpha().raw().toBuffer());
}
const records=[],layers=[];await mkdir(root+'/new-pair/'+direction+'/before',{recursive:true});
for(let i=0;i<8;i++){
 const before=root+'/new-pair/'+direction+'/before/'+i+'.png',path=root+'/santet/'+direction+'/'+i+'.png';if(!await access(before).then(()=>true,()=>false))await copyFile(path,before);
 const upper=await sharp(before).ensureAlpha().raw().toBuffer(),next=Buffer.from(upper),leg=pairs[i%2];
 const rect=direction==='north-east'?[79,88,97,106]:direction==='north'?[28,88,44,106]:[28,88,45,106];
 for(let y=88;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4;if(x>=rect[0]&&x<rect[2]&&y>=rect[1]&&y<rect[3]&&upper[p+3]>16)continue;leg.copy(next,p,p,p+4);}
 if(!upper.subarray(0,88*512).equals(next.subarray(0,88*512)))throw Error('Upper changed');
 const png=await sharp(next,{raw:{width:128,height:128,channels:4}}).png().toBuffer();await writeFile(path,png);records.push({direction,index:i,newPose:i%2?'right':'left',sha256:hash(png),upperPixelsUnchanged:true});layers.push({input:png,left:i*128,top:0});
}
const board=await sharp({create:{width:1024,height:128,channels:4,background:'#243a34'}}).composite(layers).png().toBuffer();await sharp(board).resize(2048,256,{kernel:'nearest'}).png().toFile(root+'/new-pair/'+direction+'-strip.png');
await writeFile(root+'/new-pair/'+direction+'/report.json',JSON.stringify({input,sourceSha256:hash(await readFile(input)),from,to,scale,registrations,sequence:['left','right','left','right','left','right','left','right'],records,pixelLabCredits:0,headOffsetsModified:false},null,2));
const registry=JSON.parse(await readFile(root+'/eight-direction-report.json'));for(const f of registry.frames){const r=records.find(r=>r.direction===f.direction&&r.index===f.index);if(r)f.sha256=r.sha256;}registry.newTwoPoseDirections=[...new Set([...(registry.newTwoPoseDirections??[]),direction])];await writeFile(root+'/eight-direction-report.json',JSON.stringify(registry,null,2));
console.log(direction+': NEW generated left/right pair exported, no neutral/old leg reuse.');
