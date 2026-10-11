// Full-character check of the layered head on the real body, the way V3Puppet draws it: per direction a column with the
// approved head-eight-01 (reference), then each hairstyle tinted, on idle and on walk frames 2 and 6.
import{readFile}from'node:fs/promises';import{order,sharp,json}from'./body-eight-lib.mjs';
const P='apps/client/public',out=process.argv[2]||'docs/design/character-v3/head-layers-01/head-on-body-review.png';
const body=await json(P+'/assets/character-v3/body-eight-02/manifest.json'),walk=await json(P+'/assets/character-v3/walk-eight-02/manifest.json'),L=await json(P+'/assets/character-v3/head-layers-01/manifest.json');
const HAIR=[['natural-short',0xc9c3e6],['side-sweep',0xe8c370],['spiky-up',0xc4504a],['high-topknot',0x4a4658]];
async function tint(file,t){const{data,info}=await sharp(await readFile(file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const r=t>>16,g=t>>8&255,b=t&255;for(let i=0;i<data.length;i+=4){data[i]=data[i]*r/255;data[i+1]=data[i+1]*g/255;data[i+2]=data[i+2]*b/255;}return sharp(data,{raw:info}).png().toBuffer();}
const cells=[],W=72,H=104;
for(const[c,d]of order.entries()){const still=body.frames[c],wd=walk.directions[c],layer=L.directions[c];
 const frames=[{url:still.url,neck:still.neckPivot},{url:wd.frames[1].url,neck:wd.frames[1].neckPivot},{url:wd.frames[5].url,neck:wd.frames[5].neckPivot}];
 for(const[k,f]of frames.entries()){
  const rows=[[{file:P+still.headUrl,pivot:still.headPivot}],...HAIR.map(([h,t])=>[{file:P+layer.bases[h].url,pivot:layer.pivot},{file:P+layer.hair[h].url,pivot:layer.pivot,tint:t},...(layer.accents?.[h]?[{file:P+layer.accents[h].url,pivot:layer.pivot}]:[])])];
  for(const[r,parts]of rows.entries()){const comp=[{input:await readFile(P+f.url)}];for(const p of parts)comp.push({input:p.tint?await tint(p.file,p.tint):await readFile(p.file),left:f.neck.x-p.pivot.x,top:f.neck.y-p.pivot.y});
   const img=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comp).png().toBuffer();
   cells.push({input:await sharp(img).extract({left:28,top:10,width:W,height:H}).png().toBuffer(),left:(c*3+k)*W,top:r*H});}}}
const b=await sharp({create:{width:24*W,height:5*H,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();
await sharp(b).resize(24*W*2,5*H*2,{kernel:'nearest'}).toFile(out);console.log(out);
