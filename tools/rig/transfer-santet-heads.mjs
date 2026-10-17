import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {frameKey,validateHeadOffsets,applyHeadOffsets} from './armed-head-offsets.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01',pub='apps/client/public';
const bytes=await readFile(root+'/export-report.json'),report=JSON.parse(bytes),fingerprint=hash(bytes);
const path=pub+'/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json';
const original=await readFile(path),manifest=JSON.parse(original);
const savedBytes=await readFile(root+'/user-head-offsets.json');
const saved=validateHeadOffsets(JSON.parse(savedBytes),report,fingerprint),offsets=new Map(saved.offsets.map(p=>[p.key,p]));
const proposals=JSON.parse(await readFile(root+'/head-fit/proposals.json'));
if(proposals.sourceFingerprint!==fingerprint)throw Error('Stale proposals');
const fit=new Map(proposals.proposals.map(p=>[p.key,p]));
const source=report.frames.filter(f=>f.id==='santet');
const sourceOffsets=source.map(f=>offsets.get(frameKey(f))??{key:frameKey(f),sha256:f.sha256,dx:0,dy:0,status:'accepted'});
const sourceMap=new Map(sourceOffsets.map(p=>[p.key,p]));
const stamp=Date.now();await mkdir(root+'/head-history',{recursive:true});
await writeFile(root+'/head-history/santet-reference-'+stamp+'.json',JSON.stringify({version:1,sourceFingerprint:fingerprint,offsets:sourceOffsets,note:'User reports Santet finished; unset frames retain zero. Saved source values preserved exactly.'},null,2));
await writeFile(root+'/head-history/offsets-before-transfer-'+stamp+'.json',savedBytes);
const records=[];
for(const f of report.frames){
 if(f.id==='santet'||f.action==='idle')continue;
 const key=frameKey(f),sourceKey=['santet',f.action,f.direction,f.index].join('/');
 const s=sourceMap.get(sourceKey),sp=fit.get(sourceKey),tp=fit.get(key);
 if(!s||!sp||!tp||![sp.dx,sp.dy,tp.dx,tp.dy].every(Number.isInteger))throw Error('Missing measured registration '+key);
 // Preserve the user correction relative to Santet's measured collar motion,
 // then add each target costume's own measured collar motion.
 const dx=Math.max(-24,Math.min(24,tp.dx+s.dx-sp.dx));
 const dy=Math.max(-24,Math.min(24,tp.dy+s.dy-sp.dy));
 const existing=offsets.get(key),preserve=existing?.status==='manual';
 if(!preserve&&sp.accepted&&tp.accepted)offsets.set(key,{key,sha256:f.sha256,dx,dy,status:'accepted'});
 records.push({key,sourceKey,dx,dy,preservedManual:preserve,needsReview:!sp.accepted||!tp.accepted,sourceDelta:{dx:s.dx,dy:s.dy},targetMotion:{dx:tp.dx,dy:tp.dy}});
}
const packet=validateHeadOffsets({...saved,offsets:[...offsets.values()]},report,fingerprint);
applyHeadOffsets(manifest,report,packet);
for(const p of saved.offsets.filter(p=>p.key.startsWith('santet/')))if(JSON.stringify(offsets.get(p.key))!==JSON.stringify(p))throw Error('Santet changed');
await writeFile(root+'/head-history/manifest-'+stamp+'.json',original);
await writeFile(root+'/user-head-offsets.json',JSON.stringify(packet,null,2));
await writeFile(path,JSON.stringify(manifest,null,2));
const audit={sourceFingerprint:fingerprint,reference:'user-finished Santet; absent offsets stay zero',sourceFrames:source.length,sourceExplicitOffsets:sourceOffsets.filter(p=>saved.offsets.some(v=>v.key===p.key)).length,targetFrames:records.length,needsReview:records.filter(p=>p.needsReview).length,records,visualApproved:false,pixelLabCredits:0};
await mkdir(root+'/head-fit/santet-transfer',{recursive:true});await writeFile(root+'/head-fit/santet-transfer/report.json',JSON.stringify(audit,null,2));
const base=JSON.parse(await readFile(pub+'/assets/character-v3/body-eight-02/manifest.json'));
for(const id of [...new Set(records.map(p=>p.key.split('/')[0]))])for(const action of ['walk','attack','cast']){
 const frames=report.frames.filter(f=>f.id===id&&f.action===action),layers=[];
 for(let n=0;n<frames.length;n++){
  const f=frames[n],p=offsets.get(frameKey(f))??{dx:0,dy:0},b=base.frames.find(b=>b.direction===f.direction),d=manifest.outfits.find(o=>o.branch===id).directions[f.direction];
  const x=f.neck.x-b.neckPivot.x+d.headOffset.x-(b.neckPivot.x-b.headPivot.x)+p.dx,y=f.neck.y-b.neckPivot.y+d.headOffset.y-(b.neckPivot.y-b.headPivot.y)+p.dy;
  const padded=await sharp({create:{width:176,height:176,channels:4,background:'#00000000'}}).composite([{input:pub+b.headUrl,left:24+x,top:24+y}]).png().toBuffer();
  const head=await sharp(padded).extract({left:24,top:24,width:128,height:128}).png().toBuffer();
  const tile=await sharp(root+'/'+f.url).composite([{input:head}]).resize(192,192,{kernel:'nearest'}).png().toBuffer();
  layers.push({input:tile,left:(n%8)*192,top:Math.floor(n/8)*192});
 }
 await sharp({create:{width:1536,height:1536,channels:4,background:'#243a34'}}).composite(layers).png().toFile(root+'/head-fit/santet-transfer/'+id+'-'+action+'.png');
}
console.log(JSON.stringify({targetFrames:audit.targetFrames,needsReview:audit.needsReview,santetPreserved:true}));

