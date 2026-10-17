import {readFile,writeFile,mkdir,access,copyFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-walk-repair-01',old='docs/design/equipment/class-2-imagegen-detail-01';
const choices={north:{folder:old,left:1,middle:0,right:2},'north-east':{folder:root,left:1,middle:0,right:4},'south-west':{folder:old,left:2,middle:0,right:1}};
const phases=['left','left','middle','middle','right','right','middle','middle'];
const report={scope:'Santet north/north-east/south-west only; simplified left-neutral-right-neutral',phases,frames:[],pixelLabCredits:0,imagegenCalls:0,headOffsetsModified:false,gameplayPublished:false};
for(const [direction,c]of Object.entries(choices)){
 const ref=root+'/simple-reference/'+direction;await mkdir(ref,{recursive:true});
 // Freeze exact existing references before output changes, including NE's opposite-leg edit.
 for(const phase of ['left','middle','right']){
  const path=ref+'/'+phase+'.png';if(!await access(path).then(()=>true,()=>false)){
   const source=c.folder===old?old+'/santet/walk/'+direction+'-'+c[phase]+'.png':root+'/santet/'+direction+'/'+c[phase]+'.png';await copyFile(source,path);
  }
 }
 for(let i=0;i<8;i++){const path=ref+'/upper-'+i+'.png';if(!await access(path).then(()=>true,()=>false))await copyFile(root+'/santet/'+direction+'/'+i+'.png',path);}
 const refs={};for(const phase of ['left','middle','right'])refs[phase]=await sharp(ref+'/'+phase+'.png').ensureAlpha().raw().toBuffer();
 const layers=[];
 for(let i=0;i<8;i++){
  const original=await sharp(ref+'/upper-'+i+'.png').ensureAlpha().raw().toBuffer(),next=Buffer.from(original),leg=refs[phases[i]];
  // Full-width lower section: no small bounding rectangle can cut a stride.
  const rect=direction==='north-east'?[79,88,97,106]:direction==='north'?[28,88,44,106]:[28,88,45,106];
  const staff=(x,y)=>x>=rect[0]&&x<rect[2]&&y>=rect[1]&&y<rect[3]&&original[(y*128+x)*4+3]>16;
  for(let y=88;y<128;y++)for(let x=0;x<128;x++){if(staff(x,y))continue;const p=(y*128+x)*4;leg.copy(next,p,p,p+4);}
  for(let y=0;y<88;y++)if(!original.subarray(y*512,(y+1)*512).equals(next.subarray(y*512,(y+1)*512)))throw Error('Upper changed');
  const png=await sharp(next,{raw:{width:128,height:128,channels:4}}).png().toBuffer();await writeFile(root+'/santet/'+direction+'/'+i+'.png',png);
  report.frames.push({direction,index:i,phase:phases[i],reference:ref+'/'+phases[i]+'.png',referenceHash:hash(refs[phases[i]]),sha256:hash(png),upperPixelsUnchanged:true});
  layers.push({input:png,left:i*128,top:0});
 }
 const board=await sharp({create:{width:1024,height:128,channels:4,background:'#243a34'}}).composite(layers).png().toBuffer();await sharp(board).resize(2048,256,{kernel:'nearest'}).png().toFile(root+'/simple-'+direction+'.png');
}
await writeFile(root+'/simple-step-report.json',JSON.stringify(report,null,2));
const registry=JSON.parse(await readFile(root+'/eight-direction-report.json'));for(const f of registry.frames){const p=report.frames.find(p=>p.direction===f.direction&&p.index===f.index);if(p)f.sha256=p.sha256;}registry.simplifiedDirections=Object.keys(choices);await writeFile(root+'/eight-direction-report.json',JSON.stringify(registry,null,2));
console.log('24 frames: left,left,neutral,neutral,right,right,neutral,neutral. Existing artwork selected; no generation.');
