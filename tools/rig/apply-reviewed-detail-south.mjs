import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {hash} from './body-eight-lib.mjs';
import {validateHeadOffsets,applyHeadOffsets} from './armed-head-offsets.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01';
const bytes=await readFile(root+'/export-report.json'),report=JSON.parse(bytes),fingerprint=hash(bytes);
const fits=JSON.parse(await readFile(root+'/head-fit/proposals.json'));
if(fits.sourceFingerprint!==fingerprint)throw Error('Stale proposals');
let old={version:1,sourceFingerprint:fingerprint,offsets:[]};
try{old=validateHeadOffsets(JSON.parse(await readFile(root+'/user-head-offsets.json')),report,fingerprint);}catch(e){if(e.code!=='ENOENT')throw e;}
const offsets=new Map(old.offsets.map(v=>[v.key,v]));
// Explicit visual review scope: the six SOUTH before/after contact sheets.
// Other directions are proposals only. Preserve any existing human edits.
const reviewed=fits.proposals.filter(p=>p.key.split('/')[2]==='south'&&Number.isInteger(p.dx)&&Number.isInteger(p.dy));
for(const p of reviewed)if(!offsets.has(p.key))offsets.set(p.key,{key:p.key,sha256:p.sha256,dx:p.dx,dy:p.dy,status:'accepted'});
const packet=validateHeadOffsets({...old,offsets:[...offsets.values()]},report,fingerprint);
const path='apps/client/public/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json';
const original=await readFile(path),manifest=JSON.parse(original);applyHeadOffsets(manifest,report,packet);
await mkdir(root+'/head-history',{recursive:true});await writeFile(root+'/head-history/manifest-'+Date.now()+'.json',original);
await writeFile(path,JSON.stringify(manifest,null,2));await writeFile(root+'/user-head-offsets.json',JSON.stringify(packet,null,2));
await writeFile(root+'/head-fit/review-status.json',JSON.stringify({reviewer:'Codex visual inspection of SOUTH contact sheets; not user art approval',reviewedSouthFrames:reviewed.length,savedFrames:packet.offsets.length,otherDirections:'proposals only',pixelLabCredits:0,sourceFingerprint:fingerprint},null,2));
console.log(JSON.stringify({reviewedSouthFrames:reviewed.length,saved:packet.offsets.length}));
