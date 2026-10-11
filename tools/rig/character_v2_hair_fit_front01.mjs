import assert from 'node:assert/strict';
import { writeFile,mkdir,copyFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { stage,runtime,load,json,png,nearest,inspectHair,assertFrozen,manifestPath } from './character_v2_hair_fit.mjs';
import { decodePng,hash,makeMasks } from './prepare_character_v2_hair.mjs';
import { compose } from './character_v2_long_hair.mjs';
const root = new URL('../../', import.meta.url);
export { stage } from './character_v2_hair_fit.mjs';
export const styles=[{id:'classic-adventurer-01',nameThai:'01 นักผจญภัยคลาสสิก',name:'Classic Adventurer',bounds:[46,17,79,44]},{id:'thai-shaman-apprentice-02',nameThai:'02 ศิษย์ชาแมนไทย',name:'Thai Shaman Apprentice',bounds:[46,17,79,49]},{id:'ritual-topknot-03',nameThai:'03 มวยผมพิธี',name:'Ritual Topknot',bounds:[47,14,78,44]}];
export const palette=[[83,85,90],[118,121,122],[155,160,157],[192,198,185],[220,224,208],[240,239,221],[251,249,233]];
const save=(path,value)=>writeFile(new URL(path,root),JSON.stringify(value,null,2)+'\n');
export function author(style,body) {
  const front=Buffer.alloc(65536),back=Buffer.alloc(65536),masks=makeMasks(body);
  const paint=(pixels,row,left,right,color,clipped=false)=>{
    for(let column=left;column<=right;column++) {
      assert.ok(column>=style.bounds[0]&&row>=style.bounds[1]&&column<=style.bounds[2]&&row<=style.bounds[3],'Head-fit guide');
      const pixel=row*128+column,offset=pixel*4;
      if(clipped&&!pixels[offset+3]) continue;
      if(pixels===front&&(masks.ears[pixel]||masks.neck[pixel]||(masks.face[pixel]&&!(row<=34&&column>=52&&column<=72)))) continue;
      pixels.set([...palette[color],255],offset);
    }
  };
  const rows=(pixels,first,spans,color,clipped=false)=>spans.forEach(([left,right],index)=>paint(pixels,first+index,left,right,color,clipped));
  const silhouette=style.id===styles[0].id?[[57,60],[55,63],[53,68],[52,70],[51,72],[50,73],[49,74],[49,75],[48,76],[48,76],[48,76],[48,76],[49,76],[49,76],[49,75]]:style.id===styles[1].id?[[61,65],[57,68],[54,70],[52,72],[51,74],[50,75],[49,76],[48,77],[48,78],[47,78],[47,78],[48,78],[48,77],[49,77],[49,76]]:[[58,68],[55,71],[53,73],[51,74],[50,75],[49,76],[49,76],[48,77],[48,77],[48,77],[48,77],[49,76],[49,76]];
  const first=style.id===styles[2].id?19:17;
  rows(front,first,silhouette,0);
  silhouette.forEach(([left,right],index)=>paint(front,first+index,left+1,right-1,index<8?4:3,true));
  rows(back,25,[[50,74],[49,75],[49,75],[48,76],[48,76],[48,76],[48,76],[49,75],[49,75],[49,75],[49,75],[49,75],[49,75],[49,75],[49,75],[50,74],[50,74],[50,74],[50,74],[51,73]],0);
  for(let row=26;row<=43;row++) paint(back,row,51,73,row<32?3:2,true);
  if(style.id===styles[0].id) {
    rows(front,18,[[56,59],[54,62],[53,63],[52,61],[51,59],[50,56],[50,53]],5,true);
    rows(front,19,[[56,59],[54,61],[54,60]],6,true);
    rows(front,20,[[65,67],[63,69],[61,69],[59,68],[57,66],[55,63],[54,60],[53,57]],5,true);
    rows(front,22,[[69,71],[68,72],[66,73],[64,73],[63,72],[62,71],[60,70],[59,67],[58,64]],4,true);
    rows(front,25,[[74,75],[73,75],[72,75],[71,74],[70,73],[69,72],[69,71]],2,true);
    rows(front,27,[[51,52],[52,53],[53,54],[54,55],[55,56]],2,true);
    rows(front,26,[[58,59],[57,58],[56,57],[55,56],[54,55]],3,true);
    rows(front,28,[[64,65],[63,64],[62,63],[61,62]],2,true);
    for(const [row,left,right,color] of [[32,52,59,0],[32,62,65,0],[32,69,72,0],[33,54,58,0],[33,63,64,0],[33,70,71,0],[34,56,57,0],[32,53,58,4],[33,55,57,3],[32,63,64,3],[32,70,71,2]]) paint(front,row,left,right,color);
    rows(back,27,[[47,49],[47,49],[47,49],[48,50],[48,50],[49,50]],0);rows(back,27,[[76,78],[76,78],[76,78],[75,77],[75,77],[75,76]],0);
    rows(back,28,[[48,48],[48,49],[48,49],[49,49]],2,true);rows(back,28,[[77,77],[77,77],[76,76],[76,76]],1,true);
    rows(back,42,[[49,51],[50,52],[51,52]],0);rows(back,42,[[73,75],[72,74],[72,73]],0);
    paint(back,43,51,51,3,true);paint(back,43,73,73,2,true);
  } else if(style.id===styles[1].id) {
    rows(front,18,[[58,63],[55,64],[53,64],[52,63],[51,61],[50,59],[50,56],[50,53]],5,true);rows(front,20,[[55,61],[53,60],[52,57]],6,true);
    rows(front,19,[[67,68],[67,70],[68,71],[69,73],[70,74],[71,75],[72,76],[73,76],[74,76],[75,76],[75,76],[74,75],[73,75]],4,true);
    rows(front,23,[[63,64],[61,62],[59,60],[57,58],[55,56],[54,55],[53,54]],3,true);
    rows(front,22,[[65,66],[64,65],[63,64],[62,63],[61,62],[60,61],[59,60],[58,59],[57,58],[56,57]],2,true);rows(front,27,[[50,52],[50,53],[51,54],[52,55],[53,56]],4,true);
    for(const [row,left,right,color] of [[32,52,57,0],[33,53,56,0],[34,54,55,0],[32,53,56,4],[33,54,55,3],[32,69,72,0],[33,70,72,0],[34,71,72,0],[32,70,71,3],[33,71,71,2]]) paint(front,row,left,right,color);
    rows(back,25,[[47,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[46,49],[47,50],[47,50],[48,51],[48,52],[49,53],[50,54],[51,54],[52,54],[53,55],[54,56],[55,57]],0);
    rows(back,25,[[76,78],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[76,79],[75,78],[75,78],[74,77],[73,77],[72,76],[71,75],[71,74],[71,73],[70,72],[69,71],[68,70]],0);
    for(let row=27;row<=40;row++){paint(back,row,47,48,row<33?4:3,true);paint(back,row,77,78,2,true);}
    rows(back,40,[[48,49],[49,50],[49,51],[50,52],[51,53],[52,53],[53,53],[54,54],[55,55]],3,true);rows(back,40,[[76,77],[75,76],[74,76],[73,75],[72,74],[72,73],[72,72],[71,71],[70,70]],2,true);
  } else {
    rows(front,14,[[61,65],[59,67],[58,68],[58,68],[59,67]],0);rows(front,15,[[61,64],[60,66],[59,66],[60,65]],4,true);rows(front,15,[[61,63],[60,63],[60,62]],6,true);
    rows(front,19,[[59,65],[56,64],[54,62],[53,60],[52,57],[51,54],[50,52]],5,true);rows(front,20,[[58,62],[55,59],[54,56]],6,true);
    rows(front,21,[[64,67],[62,67],[60,66],[58,65],[56,63],[55,60],[54,57]],4,true);
    rows(front,21,[[67,71],[67,72],[68,73],[69,74],[70,75],[71,75],[72,75],[73,75],[73,75],[72,74]],2,true);
    rows(front,27,[[51,52],[52,53],[54,55],[56,58],[59,62]],2,true);
    rows(front,28,[[62,64],[65,67],[68,70]],4,true);
    rows(back,28,[[48,49],[48,49],[48,50],[49,50],[49,51]],0);rows(back,28,[[76,77],[76,77],[75,77],[75,76],[74,76]],0);
    rows(back,42,[[49,51],[50,52],[51,52]],0);rows(back,42,[[73,75],[72,74],[72,73]],0);paint(back,43,51,51,3,true);paint(back,43,73,73,2,true);
  }
  return {front,back};
}
export function inspect(style,body,back,front,template) {
  const art={itemId:style.id,palette:Object.fromEntries(palette.map((color,index)=>[index,color]))};
  const result=inspectHair(art,back,front,body,template);
  for(const pass of Object.values(result.metrics.passes)) assert.ok(pass.left>=style.bounds[0]&&pass.top>=style.bounds[1]&&pass.right<=style.bounds[2]&&pass.bottom<=style.bounds[3],'Style compact bounds');
  return result;
}
function rowSource(pixels){
  const rows=[];
  for(let row=0;row<128;row++) for(let column=0;column<128;column++) {
    const offset=(row*128+column)*4;if(!pixels[offset+3]) continue;
    const color=palette.findIndex(candidate=>candidate.every((value,index)=>value===pixels[offset+index])),left=column;
    while(column+1<128&&pixels[(row*128+column+1)*4+3]&&palette[color].every((value,index)=>value===pixels[(row*128+column+1)*4+index])) column++;
    rows.push([row,left,column,color]);
  }
  return rows;
}
export async function draft(){
  await assertFrozen();
  const body=await decodePng(await load('docs/design/character-v2/body-front-02/raw.png')),template=await json(stage+'head-template.json');
  template.landmarks={status:'manual-provisional-not-approved',confidence:'Visible alpha rows exact; semantic eye/ear/neck annotations conservative, medium confidence.',eyes:[{left:52,top:35,right:59,bottom:41},{left:64,top:35,right:72,bottom:41}],ears:[{left:47,top:35,right:51,bottom:43},{left:73,top:35,right:77,bottom:43}],neck:{left:57,top:49,right:68,bottom:52},centerX:62,footBaseline:112};
  template.styleBounds=styles.map(({id,bounds})=>({id,bounds}));
  await save(stage+'head-template.json',template);
  const composites=[body],reviews=[];
  for(const style of styles){
    const {front,back}=author(style,body),{composite,hairOnly,metrics}=inspect(style,body,back,front,template);composites.push(composite);
    const sources={};
    for(const [name,pixels] of [['hair-front',front],['hair-back',back],['working-on-template',composite],['hair-only',hairOnly]]){const bytes=await png(pixels);await writeFile(new URL(stage+style.id+'-'+name+'.png',root),bytes);sources[name]=hash(bytes);}
    await save(stage+style.id+'-rows.json',{method:'manual',palette,canvas:template.canvas,template:'head-template.json',hairBack:rowSource(back),hairFront:rowSource(front),bodyCopiedIntoHair:false});
    reviews.push({...style,method:'manual',jobId:null,generationAttempts:0,creditsSpent:0,visualApproved:false,metrics,sources});
  }
  const native=Buffer.alloc(512*128*4),heads=Buffer.alloc(160*44*4);
  for(const [index,pixels] of composites.entries()){
    for(let row=0;row<128;row++)pixels.copy(native,(row*512+index*128)*4,row*512,(row+1)*512);
    for(let row=0;row<44;row++)pixels.copy(heads,(row*160+index*40)*4,((row+10)*128+43)*4,((row+10)*128+83)*4);
  }
  await writeFile(new URL(stage+'row-comparison-native.png',root),await png(native,512,128));
  await writeFile(new URL(stage+'row-comparison-nearest4x.png',root),await png(nearest(native,512,128,4),2048,512));
  await writeFile(new URL(stage+'row-heads-nearest4x.png',root),await png(nearest(heads,160,44,4),640,176));
  await save(stage+'review.json',{method:'manual',bodySha256:template.bodySha256,poseId:template.poseId,canvas:template.canvas,timeline:[null],styles:reviews,bodyApproved:true,hairVisualApproved:false,userVisualAccepted:false,fullMilestone:false,productionReady:false,generationAttempts:0,paidSubmissions:0,creditsSpent:0,ledgerUnchanged:true});
  await assertFrozen();console.log(JSON.stringify(reviews.map(({id,metrics})=>({id,metrics})),null,2));
}
export async function publish(){
  await assertFrozen();const before=await json(stage+'manifest-before.json'),manifest=await json(manifestPath);
  assert.deepEqual(manifest.poses,before.poses);
  assert.deepEqual(manifest.budget,before.budget);
  assert.deepEqual(manifest.assets.filter(asset=>asset.layer!=='hair'),before.assets.filter(asset=>asset.layer!=='hair'));
  assert.deepEqual(manifest.approvals,before.approvals);
  const review=await json(stage+'review.json'),body=manifest.assets.find(asset=>asset.layer==='body'&&asset.direction==='south');
  const previousHair=manifest.assets.filter(asset=>asset.layer==='hair');
  const concurrent=Boolean(manifest.hairFitReview);
  assert.ok(previousHair.every(asset=>!styles.some(style=>style.id===asset.itemId)),'Already published: refuse duplicate publication');
  await writeFile(new URL(stage+'publication-before.json',root),await load(manifestPath),{flag:'wx'});
  const preservedHashes=Object.fromEntries(await Promise.all(previousHair.flatMap(asset=>[asset.provenance.sourcePath,'apps/client/public'+asset.url]).map(async path=>[path,hash(await load(path))])));
  await save(stage+'publication-preserved-hashes.json',preservedHashes);
  manifest.archivedHairDrafts=[...(manifest.archivedHairDrafts??[]),{stage:concurrent?'concurrent-head-fit-draft':'hair-long-redesign-02',selectable:false,visualApproved:false,reason:concurrent?'Concurrent local preliminary draft preserved; replaced by the independently authored row-based review set. No USER approval claimed.':'USER rejects all current oversized/disconnected hair. Preserved unchanged.',pose:structuredClone(manifest.poses.find(pose=>pose.id===body.poseId)),assets:previousHair,review:concurrent?manifest.hairFitReview:manifest.hairRedesignReview}];
  manifest.assets=manifest.assets.filter(asset=>asset.layer!=='hair');await mkdir(new URL(runtime,root),{recursive:true});
  for(const style of review.styles)for(const [pass,name]of [['hairBack','hair-back'],['hairFront','hair-front']]){
    const sourcePath=stage+style.id+'-'+name+'.png',url='/assets/character-v2/hair-fit-front-01/'+style.id+'-'+name+'.png';assert.equal(hash(await load(sourcePath)),style.sources[name]);
    await copyFile(new URL(sourcePath,root),new URL('apps/client/public'+url,root));
    manifest.assets.push({id:style.id+'-idle-south-'+pass,itemId:style.id,layer:'hair',pass,poseId:body.poseId,direction:'south',state:'idle',canvas:body.canvas,timeline:[null],frameCount:1,url,provenance:{kind:'new-v2',sourcePath,sha256:style.sources[name],method:'manual',jobId:null},visualApproved:false});
  }
  manifest.hairFitReview={stage:'hair-fit-front-01',method:'manual',generationAttempts:0,creditsSpent:0,hairVisualApproved:false,fullMilestone:false,templateUrl:'/assets/character-v2/hair-fit-front-01/head-template.json',styles:styles.map(({id,nameThai})=>({id,nameThai})),reviewPath:stage+'review.json'};
  await copyFile(new URL(stage+'head-template.json',root),new URL(runtime+'head-template.json',root));await save(manifestPath,manifest);await assertFrozen();
  for(const [path,expected] of Object.entries(preservedHashes)) assert.equal(hash(await load(path)),expected,path);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv[2]==='--draft')await draft();else if(process.argv[2]==='--publish')await publish();else throw new Error('--draft or --publish only');}