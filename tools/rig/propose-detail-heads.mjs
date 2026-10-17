import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {trackNeck} from '../../docs/design/equipment/class-2-imagegen-armed-01/head-tracking.mjs';
import {frameKey} from './armed-head-offsets.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01';
const bytes=await readFile(root+'/export-report.json'),report=JSON.parse(bytes);
const cache=new Map();
async function pixels(f){if(!cache.has(f.url))cache.set(f.url,await sharp(root+'/'+f.url).ensureAlpha().raw().toBuffer());return cache.get(f.url);}
const proposals=[];
for(const f of report.frames){
 if(f.action==='idle')continue;
 const idle=report.frames.find(i=>i.id===f.id&&i.action==='idle'&&i.direction===f.direction);
 const p=trackNeck(await pixels(idle),await pixels(f),idle.neck,f.neck);
 proposals.push({key:frameKey(f),sha256:f.sha256,dx:Number.isFinite(p.x)?p.x-f.neck.x:null,dy:Number.isFinite(p.y)?p.y-f.neck.y:null,...p});
}
const out={version:1,sourceFingerprint:hash(bytes),method:'three-patch-size median and reverse matching; idle reference; proposals only',accepted:proposals.filter(p=>p.accepted).length,total:proposals.length,proposals};
await mkdir(root+'/head-fit',{recursive:true});await writeFile(root+'/head-fit/proposals.json',JSON.stringify(out,null,2));
// Magnified body-only location evidence: green original cross, yellow proposed cross.
for(const id of [...new Set(report.frames.map(f=>f.id))]){
 const frames=report.frames.filter(f=>f.id===id&&f.action==='walk'),layers=[];
 for(let n=0;n<frames.length;n++){
  const f=frames[n],p=proposals.find(p=>p.key===frameKey(f));
  const cross=(x,y,c)=>`<path d="M${x-3} ${y}h6 M${x} ${y-3}v6" stroke="${c}" stroke-width=".5"/>`;
  const svg=Buffer.from(`<svg width="128" height="128">${cross(f.neck.x,f.neck.y,'#00ff99')}${p.dx!==null?cross(f.neck.x+p.dx,f.neck.y+p.dy,'#ffbb00'):''}</svg>`);
  const tile=await sharp(root+'/'+f.url).composite([{input:svg}]).resize(256,256,{kernel:'nearest'}).png().toBuffer();
  layers.push({input:tile,left:(n%8)*256,top:Math.floor(n/8)*256});
 }
 await sharp({create:{width:2048,height:2048,channels:4,background:'#243a34'}}).composite(layers).png().toFile(root+'/head-fit/'+id+'-walk-proposals.png');
}
console.log(JSON.stringify({total:out.total,conservativeCandidates:out.accepted,applied:0}));
