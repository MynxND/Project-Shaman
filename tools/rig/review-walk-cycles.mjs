// Audit the actual published pair + six detail-draft timelines. No generation,
// pixel edits, head-offset writes or gameplay publication. Each candidate is a
// reduced four-phase contact/neutral study, not a certified complete walk cycle.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {sharp} from './body-eight-lib.mjs';
const root=resolve('docs/design/walk-cycle-audit-2026-10-14');
const pub=resolve('apps/client/public');
const digest=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await readFile(p));
const base=await read(resolve(pub,'assets/character-v3/body-eight-02/manifest.json'));
const exportPath='docs/design/equipment/class-2-imagegen-detail-01/export-report.json';
const exportBytes=await readFile(exportPath),source=JSON.parse(exportBytes);
const savedBytes=await readFile('docs/design/equipment/class-2-imagegen-detail-01/user-head-offsets.json');
const names={achan:'ไทย — อาจารย์รอยสัก',juggernaut:'รัสเซีย — Juggernaut',santet:'อินโดนีเซีย — Santet',keris:'อินโดนีเซีย — Keris',onmyoji:'ญี่ปุ่น — Onmyoji',miko:'ญี่ปุ่น — Miko ชาย','rune-seer':'นอร์เวย์ — Rune Seer','ullr-hunter':'นอร์เวย์ — Ullr'};
const dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
// Visual observations of the enlarged source rows. The first/second entries
// have distinguishable opposite screen-side leg advances; this screen-space
// evidence does not identify anatomical feet in occluded profile views.
const leads={santet:{south:[1,3],north:[1,2],'south-west':[1,5]},keris:{south:[1,3],north:[1,2],'south-west':[3,5]},
  onmyoji:{south:[1,3],north:[1,4],'south-west':[1,5]},miko:{south:[1,4],north:[1,3],'south-west':[1,5]},
  'rune-seer':{south:[1,4],north:[1,3],'south-west':[1,5]},'ullr-hunter':{south:[1,4],north:[1,3],'south-west':[1,5]}};
await mkdir(root,{recursive:true});
const clips=[],assets=[],inputs=[];
for(const [file,scope] of [['manifest.json','production'],['manifest-imagegen-detail-draft.json','detail-draft']]){
 const path=resolve(pub,'assets/character-v3/class-outfits',file),bytes=await readFile(path),manifest=JSON.parse(bytes);
 inputs.push({file:path,sha256:digest(bytes)});
 for(const outfit of manifest.outfits){
  if(scope==='detail-draft'&&!outfit.id.endsWith('-detail'))continue;
  const id=outfit.id.replace(/-detail$/,'');
  for(const direction of dirs){
   const d=outfit.directions[direction],b=base.frames.find(b=>b.direction===direction),frames=[];
   for(const [position,f] of d.walk.entries()){
    const path=resolve(pub,'.'+f.url),bytes=await readFile(path);
    if(digest(bytes)!==f.sha256)throw Error('Source hash mismatch '+f.url);
    const match=source.frames.find(s=>s.id===id&&s.action==='walk'&&s.direction===direction&&s.sha256===f.sha256);
    const sourceIndex=match?.index??position;
    const image=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(image.info.width!==128||image.info.height!==128)throw Error('Unexpected frame size');
    const crop=await sharp(bytes).extract({left:24,top:88,width:80,height:36}).png().toBuffer();
    const asset=assets.length;assets.push({path,sha256:f.sha256});
    frames.push({sourceIndex,position,asset,url:'/head-walk-review-image/'+asset,sha256:f.sha256,
      footRegionHash:digest(crop),neck:f.neck,main:f.main,off:f.off,
      headTranslation:{x:f.neck.x+d.headOffset.x-2*b.neckPivot.x+b.headPivot.x,
                       y:f.neck.y+d.headOffset.y-2*b.neckPivot.y+b.headPivot.y}});
   }
   const pair=leads[id]?.[direction],before=frames.map(f=>f.sourceIndex);
   let status,reason,after=before,change='none';
   if(pair){
    status='mixed_pose_and_timing';change='existing_frame_selection_and_holds';
    // Two contact/advance poses separated by the existing neutral-like source0.
    // Two slots per pose keep the halves equal in time; missing passing art is
    // explicitly unresolved. Never call this a simple permutation of eight art.
    after=[pair[0],pair[0],0,0,pair[1],pair[1],0,0];
    reason=`เห็นท่านำ/ยกขาคนละฝั่งที่ source ${pair[0]} และ ${pair[1]} แต่ท่าผ่านกลางไม่ครบหรือข้างเดิมซ้ำ ทดลองเลือก 3 ภาพจัด 4 ช่วงและ hold เท่ากัน ลดการก้าวซ้ำ ไม่ได้เติมท่าขาที่ขาด`;
   }else if(scope==='production'){
    status=['east','west'].includes(direction)?'occluded_leg_identity':'no_order_fault_found';
    reason=status==='no_order_fault_found'?'ลำดับเดิมมีการเปลี่ยนขานำในช่วงครึ่งรอบ ก้าวสั้น/ท่าบางช่วงใกล้กัน ยังไม่พบเหตุให้เปลี่ยนลำดับ; ไม่ถือเป็นอนุมัติ gait':'มุมด้านข้าง/ผ้าคลุมบังขาไกล การระบุขาข้ามเฟรมไม่แน่นอน คงลำดับเดิมและต้องตรวจ playback';
   }else if(['east','west'].includes(direction)){
    status='occluded_leg_identity';reason='เท้าซ้อนกันในมุม profile ต้องตามขาจากสะโพกจึงจะรู้ว่าเป็นคนละขา ไม่สลับเฟรมจากตำแหน่งซ้าย/ขวาบนจออย่างเดียว';
   }else{
    status='source_pose_defect';reason='ท่ายก/งอเท้าฝั่งที่เห็นซ้ำหลายเฟรม หรือไม่มีท่าคู่ตรงข้าม/ผ่านกลางที่ชัดพอ ผ้าและขาซ้อนทำให้บางช่วงไม่แน่นอน เรียงใหม่อย่างเดียวไม่พอ จึงคงเดิม';
   }
   clips.push({key:id+'/walk/'+direction,id,name:names[id],direction,scope,status,reason,change,
     before,after,leadEvidence:pair??null,frames,headUrl:'/head-image/'+direction,
     uniqueLowerRegions:new Set(frames.map(f=>f.footRegionHash)).size,
     residual:['ยังต้องตรวจการลงน้ำหนัก/เท้าไถลและการต่อ loop ใน playback',...(pair?['ท่าผ่านกลางหายหรือไม่สมดุล; candidate นี้เป็น reduced cycle ที่มีท่าค้าง ไม่ใช่ full walk8ท่า']:[])],
     visualApproved:false});
  }
 }
}
const report={version:1,scope:'eight existing male outfit sets × eight directions; not female or new 3D',
  sourceFingerprint:digest(exportBytes),savedOffsetsRevision:digest(savedBytes),inputs,assets,clips,
  summary:{clips:clips.length,frames:assets.length,reducedCandidates:clips.filter(c=>c.change!=='none').length,
    pureOrderingRepairs:0,sourcePngEdits:0,generations:0,headOffsetsModified:false,gameplayPublished:false},
  method:'visual inspection of every source row + actual-manifest frame/attachment provenance; pixel hashes are not anatomical classification',
  note:'No complete eight-phase walk was confidently repairable solely by permutation. Reduced candidates improve alternation using existing frames; source-pose defects remain.'};
await writeFile(resolve(root,'review.json'),JSON.stringify(report,null,2));
await writeFile(resolve(root,'findings.md'),'# Walk-cycle audit — 2026-10-14\n\n'+
  '64 clips /512 source frames:8existing male outfit sets ×8directions. No generation or source/head/gameplay mutation.\n\n'+
  '18 reduced four-phase candidates (three source images) use existing opposite advances and the source0 neutral-like pose with equal holds. They are selection/timing mitigations, not full gait fixes or simple eight-frame permutations. Pure-order complete repairs:0. Uncertain profile identities and missing intermediate/contact art stay explicit.\n\n'+
  '| Class | Direction | Finding | Existing source before → candidate |\n|---|---|---|---|\n'+
  clips.map(c=>`| ${c.id} | ${c.direction} | ${c.status} | ${c.before.join(',')} → ${c.after.join(',')} |`).join('\n')+
  '\n\n'+clips.map(c=>`- **${c.key}**: ${c.reason}`).join('\n')+'\n');
console.log(report.summary);
