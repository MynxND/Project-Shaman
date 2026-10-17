import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {hash} from './body-eight-lib.mjs';
import {BRANCH_WEAPONS} from '../../packages/shared/dist/index.js';
import {validateHeadOffsets,applyHeadOffsets} from './armed-head-offsets.mjs';
const detail=process.argv.includes('--detail'),suffix=detail?'detail':'armed';
const root='docs/design/equipment/'+(detail?'class-2-imagegen-detail-01':'class-2-imagegen-armed-01'),pub='apps/client/public/assets/character-v3/class-outfits';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const report=await read(`${root}/export-report.json`);
if(report.missing.length||report.frames.length!==1200)throw Error('Armed art is incomplete; retain previous draft');
const normalBytes=await readFile(`${pub}/manifest.json`),normalHash=hash(normalBytes),manifest=JSON.parse(normalBytes);
const previous=await read(`${pub}/manifest-imagegen-draft.json`),staged=[];
manifest.draft=true;manifest.visualApproved=false;manifest.scope='User-requested generated body+held-weapon draft; separate weapons suppressed; carryReview development only';
for(const branch of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter']){
 const outfit=structuredClone(previous.outfits.find(o=>o.branch===branch));if(!outfit)throw Error(branch);
 outfit.id=branch+'-'+suffix;
 for(const [direction,d]of Object.entries(outfit.directions))for(const action of ['idle','walk','attack','cast']){
  const frames=action==='idle'?[d.idle]:d[action];
  for(const [index,p]of frames.entries()){
   const f=report.frames.find(f=>f.id===branch&&f.action===action&&f.direction===direction&&f.index===index);if(!f)throw Error('Missing frame');
   const file=`${direction}${action==='idle'?'':'-'+index}.png`,folder=`${pub}/${outfit.id}/${action}`;await mkdir(folder,{recursive:true});
   const bytes=await readFile(`${root}/${f.url}`);if(hash(bytes)!==f.sha256)throw Error('Source hash changed');
   await copyFile(`${root}/${f.url}`,`${folder}/${file}`);
   p.url=`/assets/character-v3/class-outfits/${outfit.id}/${action}/${file}`;p.sha256=f.sha256;p.neck=f.neck;p.bakedWeapon=BRANCH_WEAPONS[branch];delete p.hands;
   staged.push({branch,action,direction,index,url:p.url,sha256:p.sha256,bakedWeapon:p.bakedWeapon,clippedPixels:f.clippedPixels});
  }
 }manifest.outfits.push(outfit);
}
let headOffsetCount=0;
try{
 const saved=await read(`${root}/user-head-offsets.json`);
 const packet=validateHeadOffsets(saved,report,hash(await readFile(`${root}/export-report.json`)));
 headOffsetCount=applyHeadOffsets(manifest,report,packet);
}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(`${pub}/manifest-imagegen-${suffix}-draft.json`,JSON.stringify(manifest,null,2));
if(hash(await readFile(`${pub}/manifest.json`))!==normalHash)throw Error('Normal manifest changed');
await writeFile(`${root}/staging-report.json`,JSON.stringify({frames:staged,defaultManifestSha256:normalHash,defaultManifestUnchanged:true,pixelLabCredits:0,normalGameplayPublished:false,visualApproved:false},null,2));
console.log('1200 generated body+weapon frames staged; '+headOffsetCount+' saved head offsets retained; original gameplay manifest unchanged.');
