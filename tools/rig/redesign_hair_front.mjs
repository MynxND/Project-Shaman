import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),src='docs/design/character-v2/hair-front-pipeline-02/',out=src+'redesign-02/',pub='apps/client/public/assets/character-v2/hair-front-pipeline-02/redesign-02/';
const req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp');
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),save=(p,v)=>writeFile(new URL(p,root),JSON.stringify(v,null,2)+'\n'),hash=b=>createHash('sha256').update(b).digest('hex');
const rgba=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer(),png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
const ids=['wind-crop','curtain-bob','ritual-knot'],subjects=['job:634c3548-7111-4c12-b391-c70a64c2f35a','job:3c328e1d-8742-4d88-b621-1e449ba91834','job:8bbcc047-2d6a-4b8c-9b0b-2e9dea8f638f'];
const keep=[['252327','404045','595458','686668','9f9c9b','c7c2bb','b4b0ab','e7e2d7','f2eee3','fbf8f0','d8d2c9','8d8a89','7b797a'],['5a4f4d','cdc3b7','f7f5f1','b1a89d','e4dccf','958e87','6c6864','463c3a'],['908f8e','e2dfd5','f7f6ee','cfccc4','bbb8b2','736f6e','a6a5a3','5a5657']];
await mkdir(new URL(out,root),{recursive:true});await mkdir(new URL(pub,root),{recursive:true});
const body=await load(src+'base.png'),bodyPixels=await rgba(src+'base.png'),head=await load(src+'head.png'),scalp=await rgba(src+'scalp.png'),protectedMask=await rgba(src+'protection.png'),template=await json(src+'template.json');
const front=[],backs=[],targets=[];
const paint=(buffer,x,y,c)=>buffer.set([...Buffer.from(c,'hex'),255],(y*128+x)*4);
const span=(b,y,l,r,c)=>{for(let x=l;x<=r;x++)paint(b,x,y,c);};
const erase=(b,x,y)=>b.fill(0,(y*128+x)*4,(y*128+x)*4+4);
for(const [i,id]of ids.entries()){
 const pixels=await rgba(src+id+'-raw.png'),back=Buffer.alloc(65536),target=Buffer.alloc(65536);
 for(let p=0;p<pixels.length;p+=4)if(pixels[p+3]&&!keep[i].includes(pixels.subarray(p,p+3).toString('hex')))pixels.fill(0,p,p+4);
 if(i===0){
  // Sculpt the ceiling, preserving the provider's actual lock shapes. Never fill open forehead.
  for(let x=46;x<=79;x++)if(x<54||x>71||(x>=61&&x<=64))erase(pixels,x,16);
  span(pixels,14,55,56,'9f9c9b');span(pixels,15,54,58,'e7e2d7');span(pixels,16,53,60,'f2eee3');span(pixels,15,68,70,'b4b0ab');span(pixels,16,66,73,'d8d2c9');
 }
 if(i===1){
  // Remove central eyebrow remnants from original output, no forehead repainting.
  for(let y=29;y<=34;y++)for(let x=53;x<=71;x++)if(['463c3a','5a4f4d','6c6864'].includes(pixels.subarray((y*128+x)*4,(y*128+x)*4+3).toString('hex')))erase(pixels,x,y);
  for(let x=44;x<=81;x++)if(x<52||x>74||(x>=61&&x<=64))erase(pixels,x,18);
  span(pixels,17,55,59,'b1a89d');span(pixels,18,52,60,'e4dccf');span(pixels,18,65,73,'cdc3b7');
  // Rounded rear bob: a genuine separate layer behind the actual head/ears, not rigid front rods.
  const rows=[[27,48,76],[28,47,77],[29,46,78],[30,46,78],[31,45,79],[32,45,79],[33,45,79],[34,45,79],[35,45,79],[36,45,79],[37,45,79],[38,46,78],[39,46,78],[40,46,78],[41,47,77],[42,47,77],[43,48,76],[44,49,75],[45,50,74],[46,51,73],[47,53,71],[48,56,68]];
  for(const [y,l,r]of rows){span(back,y,l,r,'958e87');paint(back,l,y,'463c3a');paint(back,r,y,'463c3a');if(r-l>4){span(back,y,l+1,l+2,y<39?'e4dccf':'cdc3b7');span(back,y,r-2,r-1,'b1a89d');}}
 }
 if(i===2){
  // Pulled-back arc: central forehead stays visible; tapered temples join the knot.
  for(let x=50;x<=74;x++){
   const lower=24+Math.floor(Math.abs(x-62)/4);
   for(let y=20;y<=lower;y++)if(scalp[(y*128+x)*4+3]&&!pixels[(y*128+x)*4+3])paint(pixels,x,y,x<57?'cfccc4':x>68?'908f8e':'bbb8b2');
  }
 }
 // Required root attachment is a design target chosen BEFORE evaluating output.
 // Lower forehead and the bob central part are explicitly allowed to show original skin.
 for(const row of template.headRows.filter(r=>r.y<=24))for(let x=row.left;x<=row.right;x++){
  if(i===1&&Math.abs(x-62)<=Math.max(0,row.y-20))continue;
  paint(target,x,row.y,'ffffff');
 }
 for(let p=0;p<pixels.length;p+=4)if(target[p+3]&&!pixels[p+3])pixels.set([...Buffer.from(i===0?'d8d2c9':i===1?'cdc3b7':'cfccc4','hex'),255],p);
 front.push(pixels);backs.push(back);targets.push(target);
}
async function diagrams(prefix){
 const list=[{input:head,left:0,top:0}],bodyList=[{input:body,left:0,top:0}];
 for(let i=0;i<3;i++){
  const back=await png(backs[i]),f=await png(front[i]);
  const h=await sharp(back).composite([{input:head},{input:f}]).png().toBuffer();
  const b=await sharp(back).composite([{input:body},{input:f}]).png().toBuffer();
  list.push({input:h,left:(i+1)*128,top:0});bodyList.push({input:b,left:(i+1)*128,top:0});
 }
 const sheet=await sharp({create:{width:512,height:128,channels:4,background:'#23312f'}}).composite(list).png().toBuffer();
 await sharp(sheet).extract({left:0,top:6,width:512,height:48}).resize(2048,192,{kernel:'nearest'}).png().toFile(fileURLToPath(new URL(out+prefix+'heads-4x.png',root)));
 const full=await sharp({create:{width:512,height:128,channels:4,background:'#23312f'}}).composite(bodyList).png().toBuffer();await writeFile(new URL(out+prefix+'comparison-native.png',root),full);
}
if(process.argv[2]==='prepare'){
 const frozen={};for(const p of [src+'review.json',src+'accounting.json',src+'manual-repair-01/review.json','docs/design/character-v2/cost-ledger.json','apps/client/public/assets/character-v2/manifest.json',template.sourcePath,...ids.flatMap(id=>[src+id+'-raw.png',src+'manual-repair-01/'+id+'-hair.png'])])frozen[p]=hash(await load(p));await save(out+'frozen.json',frozen);
 for(const [i,id]of ids.entries()){
  const original=await rgba(src+id+'-raw.png'),patches=[];
  for(let p=0;p<65536;p+=4)if(!original.subarray(p,p+4).equals(front[i].subarray(p,p+4)))patches.push([p/4%128,Math.floor(p/512),'#'+original.subarray(p,p+4).toString('hex'),'#'+front[i].subarray(p,p+4).toString('hex')]);
  const changes=[{operation:'patch_pixels',layer:'image',frames:[1],pixels:patches,reason:'Redesign natural hairline and silhouette; intentionally expose original forehead. Discard rejected solid scalp-fill repair.'}];
  await save(out+id+'-front-request.json',{argv:['edit',subjects[i],'--changes',JSON.stringify(changes)],mode:'low'});await save(out+id+'-front-edits.json',{sourceSha256:hash(await load(src+id+'-raw.png')),changes});
  await writeFile(new URL(out+id+'-front-expected.png',root),await png(front[i]));await writeFile(new URL(out+id+'-root-target.png',root),await png(targets[i]));
  if(i===1){const rear=[];for(let p=0;p<65536;p+=4)if(backs[i][p+3])rear.push([p/4%128,Math.floor(p/512),'#00000000','#'+backs[i].subarray(p,p+4).toString('hex')]);const changes=[{operation:'patch_pixels',layer:'image',frames:[1],pixels:rear,reason:'Rounded rear bob occluded by original head; avoids straight front rods and protects ears.'}];await save(out+id+'-back-request.json',{argv:['edit','data:image/png;base64,'+(await load(src+'blank.png')).toString('base64'),'--changes',JSON.stringify(changes)],mode:'low'});await save(out+id+'-back-edits.json',{changes});await writeFile(new URL(out+id+'-back-expected.png',root),await png(backs[i]));}
 }
 await diagrams('draft-');console.log('Prepared3 FRONT redesigns with per-style root targets and one rear bob layer. Paid0.');
}
if(process.argv[2]==='publish'){
 const old=await json(src+'manual-repair-01/review.json'),review={bodySha256:old.bodySha256,templateUrl:old.templateUrl,method:'manual-redesign-via-free-workbench',visualApproved:false,styles:[]};
 for(const [i,id]of ids.entries()){
  const layers=[];
  for(const pass of (i===1?['back','front']:['front'])){
   const bytes=await load(out+id+'-'+pass+'-native.png'),m=await sharp(bytes).metadata();if(m.width!==128||m.height!==128)throw Error('Wrong native canvas');
   const actual=await sharp(bytes).ensureAlpha().raw().toBuffer(),expected=pass==='front'?front[i]:backs[i];if(!actual.equals(expected))throw Error('Exact Workbench patch mismatch');
   await writeFile(new URL(pub+id+'-'+pass+'.png',root),bytes);layers.push({pass,url:'/assets/character-v2/hair-front-pipeline-02/redesign-02/'+id+'-'+pass+'.png',sha256:hash(bytes)});
  }
  const metrics={rootGaps:0,visibleScalp:0,protectedOverlap:0};
  for(let p=0;p<65536;p+=4){if(targets[i][p+3]&&!front[i][p+3])metrics.rootGaps++;if(scalp[p+3]&&!front[i][p+3])metrics.visibleScalp++;if(protectedMask[p+3]&&front[i][p+3])metrics.protectedOverlap++;}
  if(metrics.rootGaps||metrics.protectedOverlap)throw Error('Required root/protection failure');
  await writeFile(new URL(pub+id+'-root-target.png',root),await png(targets[i]));
  review.styles.push({id,nameThai:old.styles[i].nameThai,layers,previousUrl:old.styles[i].url,previousSha256:old.styles[i].sha256,rootTargetUrl:'/assets/character-v2/hair-front-pipeline-02/redesign-02/'+id+'-root-target.png',rootTargetSha256:hash(await png(targets[i])),metrics,visualApproved:false,productionReady:false,notes:i===0?'เปิดหน้าผากระหว่างปอยผม ไม่เติมแผ่นเทา':i===1?'แสกกลางเปิดผิวจริง ใช้บ๊อบโค้งด้านหลังหูแทนแท่งผมด้านหน้า':'ไรผมรวบโค้ง เปิดหน้าผาก ไม่พันแถบผมเต็ม scalp'});
 }
 for(const [p,h]of Object.entries(await json(out+'frozen.json')))if(hash(await load(p))!==h)throw Error('Frozen source changed: '+p);
 const design=await json(src+'design-system.json');design.fitPolicy={scalpBoundary:'measured visible head envelope, not compulsory hair coverage',requiredRoot:'per-style mask fixed before validation',exposedForehead:'legitimate hairline/parting; report visibleScalp rather than auto-fill',visualApproval:'USER only; no numerical beauty score'};
 Object.assign(design.specs[0],{volume:'6px broken tuft crown',hairline:'broken M with open skin between fringe tips',layering:'independent front hair, no scalp-fill underlay'});
 Object.assign(design.specs[1],{volume:'3px crown, rounded jaw sides',hairline:'open central V revealing actual original forehead',sideburns:'curtains above ears; rounded rear bob behind ears, no front rods',backLength:'curved rear bob to y48',layering:'hairBack / original body / hairFront'});
 Object.assign(design.specs[2],{hairline:'high pulled-back curved arc, intentionally exposed original forehead',layering:'existing knot clusters and shaped temple roots, no gray band'});
 await save(out+'design-system.json',design);
 await diagrams('');await save(out+'review.json',review);await save(pub+'review.json',review);await save(out+'rejection.json',{userText:'อะไรของคุณวะเนี่ย มันไม่ถูกต้องและสวยงามเลยไม่ใช่หรอ',rejectedStage:'manual-repair-01',allThreeRejected:true,newPaidBudget:false});
 await save(out+'accounting.json',{paidGenerations:0,freeExactEdits:4,previousPaidSpent:18,visualApproved:false});console.log(JSON.stringify(review.styles.map(s=>({id:s.id,metrics:s.metrics}))));
}
