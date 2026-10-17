import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
import {cleanGaitResidue} from './gait-residue.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01',out='docs/design/equipment/class-2-walk-repair-01';
const input=process.argv[2];if(!input)throw Error('Pass generated source sheet path');
const direction=process.argv[3]??'south';
if(!['south','south-east','east','north-east','north','north-west','west','south-west'].includes(direction))throw Error('Unknown facing');
const report=JSON.parse(await readFile(root+'/export-report.json'));
const frames=report.frames.filter(f=>f.id==='santet'&&f.action==='walk'&&f.direction===direction).sort((a,b)=>a.index-b.index);
const m=await sharp(input).metadata(),reg=frames[0].sourceRegistration;
const original=await sharp(root+'/santet/walk-'+direction+'-raw.png').metadata();
// Normalize whole sheet to original source canvas, then keep the existing uniform registration.
const sheet=await sharp(input).resize(original.width,original.height,{kernel:'nearest'}).png().toBuffer();
const layers=[],evidence=[];await mkdir(out+'/santet/'+direction,{recursive:true});
for(let index=0;index<8;index++){
 const f=frames[index],col=index%4,row=Math.floor(index/4),left=Math.floor(col*original.width/4),top=Math.floor(row*original.height/2),width=Math.floor((col+1)*original.width/4)-left,height=Math.floor((row+1)*original.height/2)-top;
 const cell=await sharp(sheet).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
 const isolated=isolateAtlasCell(cell,width,height);
 const scaled=await sharp(isolated.pixels,{raw:{width,height,channels:4}}).resize(Math.round(width*reg.scale),Math.round(height*reg.scale),{kernel:'nearest'}).png().toBuffer();
 const padded=await sharp({create:{width:384,height:384,channels:4,background:'#00000000'}}).composite([{input:scaled,left:128+Math.round(reg.offsetX),top:128+Math.round(reg.offsetY)}]).png().toBuffer();
 const generated=await sharp(padded).extract({left:128,top:128,width:128,height:128}).ensureAlpha().raw().toBuffer();
 const oldBytes=await readFile(root+'/'+f.url),old=await sharp(oldBytes).ensureAlpha().raw().toBuffer(),next=Buffer.from(old);
 // Bounded legs-only replacement. Upper body/neck/weapon and every other pixel stay exact.
 const roi=direction==='south'?{left:44,top:95,right:90,bottom:124}:direction==='east'?{left:0,top:88,right:128,bottom:128}:{left:38,top:94,right:97,bottom:126};
 // Retain the lower staff where it crosses the legs; upper pixels remain exact.
 const weaponRects={'south-east':[28,94,49,106],east:[54,88,69,104],'north-east':[79,94,97,106],north:[28,94,44,106],'north-west':[28,94,44,106],west:[38,94,57,106],'south-west':[28,94,45,106]};
 // Protect existing opaque pixels, never the empty rectangle around the staff:
 // keeping old transparent gaps would punch holes through the newly posed leg.
 const weapon=weaponRects[direction];const protectedWeapon=(x,y)=>weapon&&x>=weapon[0]&&x<weapon[2]&&y>=weapon[1]&&y<weapon[3]&&old[(y*128+x)*4+3]>16;
 for(let y=roi.top;y<roi.bottom;y++)for(let x=roi.left;x<roi.right;x++){if(protectedWeapon(x,y))continue;const p=(y*128+x)*4;generated.copy(next,p,p,p+4);}
 const cleanup=cleanGaitResidue(next,{directional:direction!=='south',weaponRect:weapon}),cleaned=new Set(cleanup.indices);cleanup.pixels.copy(next);
 const png=await sharp(next,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
 await writeFile(out+'/santet/'+direction+'/'+index+'.png',png);
 let outsideChanged=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(!cleaned.has(y*128+x)&&(x<roi.left||x>=roi.right||y<roi.top||y>=roi.bottom||protectedWeapon(x,y))){const p=(y*128+x)*4;for(let c=0;c<4;c++)if(old[p+c]!==next[p+c])outsideChanged++;}
 if(outsideChanged)throw Error('Protected pixels changed');
 let lostLegPixels=0;const legBounds={x0:128,y0:128,x1:-1,y1:-1};
 for(let y=88;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4;if(generated[p+3]>127){legBounds.x0=Math.min(legBounds.x0,x);legBounds.x1=Math.max(legBounds.x1,x);legBounds.y0=Math.min(legBounds.y0,y);legBounds.y1=Math.max(legBounds.y1,y);if(!protectedWeapon(x,y)&&!cleaned.has(y*128+x)&&!generated.subarray(p,p+4).equals(next.subarray(p,p+4)))lostLegPixels++;}}
 if(direction==='east'&&lostLegPixels)throw Error('Generated EAST leg was clipped by composition');
 evidence.push({index,sourceSha256:f.sha256,candidateSha256:hash(png),protectedPixelsUnchanged:true,roi,protectedWeaponRect:weapon,atlasFragmentsRemoved:isolated.removed,oldFootResidueRemoved:cleanup.removed,generatedLowerBounds:legBounds,lostLegPixels});
 layers.push({input:oldBytes,left:index*128,top:0},{input:png,left:index*128,top:128});
}
const board=await sharp({create:{width:1024,height:256,channels:4,background:'#243a34'}}).composite(layers).png().toBuffer(); await sharp(board).resize(2048,512,{kernel:'nearest'}).png().toFile(out+'/santet-'+direction+'-before-after.png');
await writeFile(out+'/export-'+direction+'.json',JSON.stringify({input,direction,inputDimensions:{width:m.width,height:m.height},sourceFingerprint:hash(await readFile(root+'/export-report.json')),scope:'Santet legs-only candidate; no gameplay publication or offset migration',frames:evidence,visualApproved:direction==='south'},null,2));
console.log('8 candidate frames exported; upper-body/neck/weapon pixels preserved exactly.');

