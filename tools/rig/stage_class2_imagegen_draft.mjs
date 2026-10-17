// Stage complete FILE coverage for isolated development review, never the gameplay manifest.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-motion-01',idle='docs/design/equipment/class-2-imagegen-eight-01',pub='apps/client/public/assets/character-v3/class-outfits';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const motion=await json(`${root}/export-report.json`),equipment=await json(`${root}/equipment-review.json`),lock=await json(`${root}/source-lock.json`),base=await json('apps/client/public/assets/character-v3/body-eight-02/manifest.json');
const anchors=await json('apps/client/public/assets/character-v3/hand-anchors.json');
const original=await readFile(`${pub}/manifest.json`),manifest=JSON.parse(original);manifest.draft=true;manifest.visualApproved=false;manifest.scope='Development carryReview + outfitDraft only; file coverage is not production readiness';
const report={staged:0,defaultManifestBefore:hash(original),defaultManifestUnchanged:false,gamePublished:false,unverifiedHandFallbacks:[],knownIssues:motion.issues};
for(const [id,attackAction]of Object.entries(lock.ids)){
 const outfit={id,branch:id,attackAction,directions:{}};
 for(const facing of lock.order){
  const b=base.frames.find(f=>f.direction===facing),d={headOffset:{x:b.neckPivot.x-b.headPivot.x,y:b.neckPivot.y-b.headPivot.y},bodyOrigin:b.bodyOrigin,tilt:0,idle:null,walk:[],attack:[],cast:[]};outfit.directions[facing]=d;
  for(const action of ['idle','walk','attack','cast'])for(let k=0;k<(action==='idle'?1:8);k++){
   const f=action==='idle'?null:motion.frames.find(f=>f.id===id&&f.action===action&&f.direction===facing&&f.index===k);
   const e=equipment.frames.find(f=>f.id===id&&f.action===action&&f.direction===facing&&f.index===k);
   if(!e||(action!=='idle'&&!f))throw Error(`Missing ${id}/${action}/${facing}/${k}`);
   const source=action==='idle'?`${idle}/${id}/idle/${facing}.png`:`${root}/${f.url}`;
   const file=`${facing}${action==='idle'?'':'-'+k}.png`,folder=`${pub}/${id}/${action}`;
   await mkdir(folder,{recursive:true});const bytes=await readFile(source),m=await sharp(bytes).metadata();if(m.width!==128||m.height!==128)throw Error('Non-native');
   await copyFile(source,`${folder}/${file}`);
   const originalHands=anchors.actions[f?.sourceAction??'idle']?.[facing]?.[f?.sourceIndex??0];
   const point=(side)=>{
    const value=e[side]?.point??f?.[side]?.point??originalHands?.[side];
    if(!value)throw Error(`No anchor fallback ${id}/${action}/${facing}/${k}/${side}`);
    if(!e[side]?.point)report.unverifiedHandFallbacks.push({id,action,facing,k,side,bakedKeris:e.bakedKerisException});
    return Array.isArray(value)?{x:value[0],y:value[1]}:value;
   };
   const p={url:`/assets/character-v3/class-outfits/${id}/${action}/${file}`,sha256:hash(bytes),neck:f?.neck??b.neckPivot,main:point('main'),off:point('off'),hands:`/assets/character-v3/class-outfits/${id}/${action}/hands-${file}`,...(action==='cast'?{headSafe:k>0&&k<7}:{})};
   const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer(),mask=Buffer.alloc(pixels.length);
   for(const h of [p.main,p.off])for(let y=Math.max(0,Math.round(h.y)-1);y<=Math.min(127,Math.round(h.y)+1);y++)for(let x=Math.max(0,Math.round(h.x)-1);x<=Math.min(127,Math.round(h.x)+1);x++){
    const i=(y*128+x)*4;if(pixels[i+3]>180&&pixels[i]>140&&pixels[i]>pixels[i+1]*1.18&&pixels[i+1]>pixels[i+2]*1.12)pixels.copy(mask,i,i,i+4);
   }
   await sharp(mask,{raw:{width:128,height:128,channels:4}}).png().toFile(`${folder}/hands-${file}`);
   if(action==='idle')d.idle=p;else d[action].push(p);report.staged++;
  }
 }manifest.outfits.push(outfit);
}
await writeFile(`${pub}/manifest-imagegen-draft.json`,JSON.stringify(manifest,null,2));
report.defaultManifestUnchanged=hash(await readFile(`${pub}/manifest.json`))===report.defaultManifestBefore;
if(!report.defaultManifestUnchanged)throw Error('Default manifest changed');
await writeFile(`${root}/draft-staging-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({staged:report.staged,defaultManifestUnchanged:report.defaultManifestUnchanged,gamePublished:false}));
