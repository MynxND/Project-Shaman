// Publish complete production sets, preserving raw art and original base/head/equipment files.
import { mkdir, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { sharp, hash, bounds } from './body-eight-lib.mjs';
import { FACE, ORDER } from './v3_pose_lib.mjs';
const ROOT='docs/design/equipment/class-2-production-01', PAIR='docs/design/equipment/class-2-eight-01', PUB='apps/client/public/assets/character-v3/class-outfits';
const json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const idle=await json('apps/client/public/assets/character-v3/body-eight-02/manifest.json');
const carry=await json(`${PAIR}/candidate-carry.json`), user=await json(`${PAIR}/user-head-offsets.json`);
const gripOverrides=await json(`${ROOT}/grip-overrides.json`);
const report={frames:[],sourceHashes:[],paidGenerations:0,unresolvedContacts:[],note:'Points come from authored skeletons, with bounded nearest visible skin measurement for hands. Hidden fists retain authored points. No automatic head-offset fitting or pixel redrawing. Eight cast art poses sample the existing12-step server presentation timeline.'};
const skin=(p,i)=>p[i+3]>200&&p[i]>130&&p[i]>p[i+1]*1.15&&p[i+1]>p[i+2]*1.08;
function hand(p,target){
 let best=null,dist=Infinity;
 for(let y=Math.max(0,Math.floor(target.y)-5);y<=Math.min(127,Math.ceil(target.y)+5);y++)for(let x=Math.max(0,Math.floor(target.x)-5);x<=Math.min(127,Math.ceil(target.x)+5);x++){
  if(!skin(p,(y*128+x)*4))continue;
  const d=(x-target.x)**2+(y-target.y)**2;if(d<dist){best={x:x+.5,y:y+.5};dist=d;}
 }
 return {point:best??target,measured:!!best,distance:best?Math.sqrt(dist):null};
}
const outfits=[];
for(const id of ['achan','juggernaut']){
 const o={id,branch:id==='achan'?'achan-saiyasat':'juggernaut',attackAction:id==='achan'?'attack-cast-staff':'attack-axe-shield',directions:{}};
 for(const direction of ORDER){
  const base=idle.frames.find(f=>f.direction===direction), c=carry[id][direction];
  const source=id==='achan'&&['north','north-east','north-west'].includes(direction)?`${PAIR}/achan-tattoo/${direction}.png`:id==='juggernaut'&&direction==='north-west'?`${PAIR}/juggernaut-hand/${direction}.png`:`${PAIR}/${id}/${direction}.png`;
  const offset=id==='juggernaut'?user.offsets.find(p=>p.direction===direction):{x:base.neckPivot.x-base.headPivot.x,y:base.neckPivot.y-base.headPivot.y};
  const staticBounds=bounds(await sharp(await readFile(source)).ensureAlpha().raw().toBuffer());
  const d={headOffset:{x:offset.x,y:offset.y},bodyOrigin:{x:base.bodyOrigin.x,y:staticBounds.y1},tilt:c.tilt,walk:[],attack:[],cast:[]};o.directions[direction]=d;
  for(const action of ['idle','walk','attack','cast']){
   const request=action==='idle'?null:await json(`${ROOT}/${id}/${action}/${direction}-request.json`);
   if(action!=='idle'){
    const completed=await json(`${ROOT}/${id}/${action}/${direction}-complete.json`);
    if(completed.frames!==8)throw Error('Incomplete production clip');report.paidGenerations+=completed.cost;
   }
   const folder=`${PUB}/${id}/${action}`;await mkdir(folder,{recursive:true});
   for(let index=0;index<(action==='idle'?1:8);index++){
    const repaired=`${ROOT}/${id}/${action}/repaired/${direction}-${index}.png`;
    const input=action==='idle'?source:await access(repaired).then(()=>true,()=>false)?repaired:`${ROOT}/${id}/${action}/raw/${direction}-${index}.png`;
    const bytes=await readFile(input),meta=await sharp(bytes).metadata();
    if(meta.width!==128||meta.height!==128)throw Error(`Non-native sprite ${input}`);
    const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer(),b=bounds(pixels);
    if(b.x1<0||b.x0===0||b.x1===127||b.y0===0||b.y1===127)throw Error(`Empty or clipped sprite ${input}`);
    const points=request?.keypoints[index],initial=request?.first_frame_keypoints;
    const pt=label=>{const p=points.find(p=>p.label===label);return {x:p.x*128,y:p.y*128};};
    const side=FACE[direction].near,other=side==='LEFT'?'RIGHT':'LEFT';
    const override=gripOverrides[id]?.[action]?.[direction]?.[index];
    const main=hand(pixels,override?.main ?? (points?pt(`${side} ARM`):{x:c.main[0],y:c.main[1]})),off=hand(pixels,override?.off ?? (points?pt(`${other} ARM`):{x:c.off[0],y:c.off[1]}));
    const neck=points?{x:Math.round(base.neckPivot.x+pt('NECK').x-initial.find(p=>p.label==='NECK').x*128),y:Math.round(base.neckPivot.y+pt('NECK').y-initial.find(p=>p.label==='NECK').y*128)}:base.neckPivot;
    const file=`${direction}${action==='idle'?'':`-${index}`}.png`,relative=`${id}/${action}/${file}`;
    await copyFile(input,`${PUB}/${relative}`);
    const overlay=Buffer.alloc(128*128*4);
    // Shaft contact only: redraw existing near-hand skin, never a floating fist over a shield face.
    const front=direction==='south'||direction==='north'||['east','north-east','west','north-west'].includes(direction);
    if(front&&main.measured)for(let y=Math.floor(main.point.y)-1;y<=Math.floor(main.point.y)+1;y++)for(let x=Math.floor(main.point.x)-1;x<=Math.floor(main.point.x)+1;x++){
     if(x<0||x>=128||y<0||y>=128)continue;const k=(y*128+x)*4;if(skin(pixels,k))pixels.copy(overlay,k,k,k+4);
    }
    const hands=`${id}/${action}/hands-${file}`;await sharp(overlay,{raw:{width:128,height:128,channels:4}}).png().toFile(`${PUB}/${hands}`);
    const p={url:`/assets/character-v3/class-outfits/${relative}`,sha256:hash(bytes),neck,main:main.point,off:off.point,hands:`/assets/character-v3/class-outfits/${hands}`};
    if(action==='cast'){
     const peak=request.keypoints[3].find(p=>p.label===`${side} ARM`),channelSide=Math.sign(peak.x*128-neck.x)||Math.sign(c.main[0]-base.neckPivot.x)||1;
     const weight=[0,.35,.7,1,1,.65,.3,0][index],rest=d.tilt*Math.PI/180;
     p.carryTilt=rest+(channelSide-rest)*weight;
     p.headSafe=index>0&&index<7; // Still in front of the torso; below the independent head while channeling.
    }
    if(action==='attack'){
     const attachments=await json(`docs/design/character-v3/weapon-class/${o.attackAction}-04/${direction}-attachments.json`);
     p.rotation=attachments[index].angle;
    }
    if(action==='idle')d.idle=p;else d[action].push(p);
    const evidence={id,action,direction,index,sha256:p.sha256,bounds:b,main,off};report.frames.push(evidence);
    if(!main.measured)report.unresolvedContacts.push({id,action,direction,index,kind:'main',point:main.point});
   }
  }
  for(const [p,expected] of [[base.url,base.sha256],[base.headUrl,base.headSha256]]){
   const bytes=await readFile(`apps/client/public${p}`),sha256=hash(bytes);if(sha256!==expected)throw Error(`Protected original source changed: ${p}`);report.sourceHashes.push({url:p,sha256});
  }
 }
 outfits.push(o);
}
await mkdir(PUB,{recursive:true});await copyFile('docs/design/equipment/class-2-first-pair-03/axe-south-outward.png',`${PUB}/axe-south-outward.png`);
await writeFile(`${ROOT}/publication-report.json`,JSON.stringify(report,null,2));
await writeFile(`${PUB}/manifest.json`,JSON.stringify({version:'class-outfits/1',size:128,complete:true,outfits},null,2));
console.log(`Published${report.frames.length} native frames; ${report.paidGenerations} generations; ${report.unresolvedContacts.length} hands without nearby visible skin (occlusion requires review)`);
