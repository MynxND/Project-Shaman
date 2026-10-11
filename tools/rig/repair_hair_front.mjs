import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),src='docs/design/character-v2/hair-front-pipeline-02/',out=src+'manual-repair-01/',pub='apps/client/public/assets/character-v2/hair-front-pipeline-02/manual-repair-01/';
const req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp');
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),save=(p,v)=>writeFile(new URL(p,root),JSON.stringify(v,null,2)+'\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
const decode=async p=>sharp(await load(p)).ensureAlpha().raw().toBuffer();
const png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
const ids=['wind-crop','curtain-bob','ritual-knot'];
const workbenchIds=['d092b2d1-6404-4645-866e-225e61d40a43','3ae7c7a2-e092-43d5-aa3a-23e9af00dea9','84911cb7-1009-4dbd-a7d1-c1f08b3b73fd'];
const keep=[['252327','404045','595458','686668','9f9c9b','c7c2bb','b4b0ab','e7e2d7','f2eee3','fbf8f0','d8d2c9','8d8a89','7b797a'],['5a4f4d','cdc3b7','f7f5f1','b1a89d','e4dccf','958e87','6c6864','463c3a'],['908f8e','e2dfd5','f7f6ee','cfccc4','bbb8b2','736f6e','a6a5a3','5a5657']];
const ramps=[['595458','7b797a','9f9c9b','b4b0ab','d8d2c9','e7e2d7','f2eee3'],['463c3a','6c6864','958e87','b1a89d','cdc3b7','e4dccf','f7f5f1'],['5a5657','736f6e','908f8e','a6a5a3','bbb8b2','cfccc4','e2dfd5']];
await mkdir(new URL(out,root),{recursive:true});await mkdir(new URL(pub,root),{recursive:true});
const protection=await decode(src+'protection.png'),scalp=await decode(src+'scalp.png');
const template=await json(src+'template.json');

if(process.argv[2]==='prepare'){
 const frozen={};for(const id of ids)for(const suffix of ['-raw.png','-result.json','-submit.json'])frozen[src+id+suffix]=hash(await load(src+id+suffix));
 for(const p of [src+'review.json',src+'accounting.json','docs/design/character-v2/cost-ledger.json','apps/client/public/assets/character-v2/manifest.json',template.sourcePath])frozen[p]=hash(await load(p));
 await save(out+'frozen.json',frozen);
 for(const [i,id]of ids.entries()){
  const original=await decode(src+id+'-raw.png'),pixels=Buffer.from(original),ramp=ramps[i];
  let removed=0;
  for(let p=0;p<pixels.length;p+=4)if(pixels[p+3]&&!keep[i].includes(pixels.subarray(p,p+3).toString('hex'))){pixels.fill(0,p,p+4);removed++;}
  const paint=(x,y,color)=>{const p=(y*128+x)*4;if(protection[p+3])throw Error('Protected geometry');pixels.set([...Buffer.from(color,'hex'),255],p);};
  const erase=(x,y)=>pixels.fill(0,(y*128+x)*4,(y*128+x)*4+4);
  const span=(y,l,r,c)=>{for(let x=l;x<=r;x++)paint(x,y,c);};
  if(i===0){
   // Break the provider's straight clipped ceiling into three authored swept tufts.
   for(let x=46;x<=79;x++)if(x<53||x>73)erase(x,16);
   span(14,54,56,ramp[2]);span(15,53,59,ramp[5]);span(15,67,71,ramp[3]);span(16,52,61,ramp[6]);span(16,64,73,ramp[4]);
  }
  if(i===1){
   // Explicit central brow remnants; preserve the actual side curtain locks.
   for(let y=30;y<=34;y++)for(let x=53;x<=71;x++)if((y>=32||x<=58||x>=66)&&['463c3a','5a4f4d','6c6864'].includes(pixels.subarray((y*128+x)*4,(y*128+x)*4+3).toString('hex')))erase(x,y);
   for(let x=44;x<=81;x++)if(x<51||x>75)erase(x,18);
   span(16,55,59,ramp[3]);span(17,52,61,ramp[5]);span(17,65,72,ramp[3]);span(18,50,61,ramp[6]);span(18,65,75,ramp[4]);
   // Original source ear regions remain open; two narrow locks frame the jaw.
   for(let y=33;y<=46;y++){const shift=y>42?1:0;span(y,44+shift,46+shift,ramp[1]);paint(45+shift,y,ramp[y<40?5:4]);span(y,78-shift,80-shift,ramp[1]);paint(79-shift,y,ramp[3]);}
   span(47,46,47,ramp[2]);span(48,47,47,ramp[1]);span(47,77,78,ramp[2]);span(48,77,77,ramp[1]);
  }
  // Replace only missing required scalp pixels with explicitly authored hair tones.
  // No skin copies or global threshold classifier; scalp rows come from exact base alpha.
  let filled=0;for(const row of template.headRows.filter(r=>r.y<=31))for(let x=row.left;x<=row.right;x++){
   const p=(row.y*128+x)*4;if(pixels[p+3])continue;
   const edge=Math.min(x-row.left,row.right-x),sweep=x-row.left+Math.floor((row.y-20)/2),tone=edge===0?2:sweep<9?5:sweep<17?4:3;
   paint(x,row.y,ramp[tone]);filled++;
  }
  if(i===2){
   // Sweep newly filled lower cap into the existing knot using broad diagonal bands.
   for(let y=25;y<=31;y++)for(let x=50;x<=74;x++)if(scalp[(y*128+x)*4+3]){
    const sweep=x-50+Math.floor((y-25)*1.5),tone=sweep<5?3:sweep<10?6:sweep<14?5:sweep<20?4:sweep<25?3:2;paint(x,y,ramp[tone]);
   }
   span(32,51,55,ramp[1]);span(32,58,65,ramp[2]);span(32,70,73,ramp[0]);span(33,60,63,ramp[1]);
  }
  const patches=[];for(let p=0;p<pixels.length;p+=4)if(!pixels.subarray(p,p+4).equals(original.subarray(p,p+4)))patches.push([p/4%128,Math.floor(p/4/128),'#'+original.subarray(p,p+4).toString('hex'),'#'+pixels.subarray(p,p+4).toString('hex')]);
  await writeFile(new URL(out+id+'-expected.png',root),await png(pixels));
  const changes=[{operation:'patch_pixels',layer:'image',frames:[1],pixels:patches,reason:'Reviewed palette isolation, silhouette ceiling repair and exact scalp cover. Manual derivative; raw source retained.'}];
  await save(out+id+'-workbench-request.json',{argv:['edit',workbenchIds[i],'--changes',JSON.stringify(changes)],mode:'low'});
  await save(out+id+'-edits.json',{sourceSha256:hash(await load(src+id+'-raw.png')),paletteKeep:keep[i],changes,removedPalettePixels:removed,filledScalpPixels:filled,paidCalls:0,visualApproved:false});
 }
 console.log('Prepared3 guarded manual pixel patches; no paid generation.');
}

if(process.argv[2]==='publish'){
 const rawReview=await json(src+'review.json'),review=structuredClone(rawReview);review.method='manual-derivative-via-free-pixellab-workbench';review.additionalGenerations=0;
 const body=await load(src+'base.png'),head=await load(src+'head.png');const comps=[{input:body,left:0,top:0}],heads=[{input:head,left:0,top:0}],hairOnly=[];
 for(const [i,id]of ids.entries()){
  const response=(await json(out+id+'-workbench-result.json')).result;
  if(response.isError)throw Error('Workbench failed');
  // Inline block is a labelled preview sheet, not the native downloadable asset.
  const bytes=await load(out+id+'-workbench-native.png'),meta=await sharp(bytes).metadata();
  if(meta.width!==128||meta.height!==128)throw Error('Native128 required, never resize a preview sheet');
  const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer(),expected=await decode(out+id+'-expected.png');
  if(!pixels.equals(expected))throw Error('Workbench output must exactly match guarded edit decision');
  const metrics={visible:0,colors:0,scalpGaps:0,protectedOverlap:0,semitransparent:0,warmSkinLike:0};const colors=new Set();
  for(let p=0;p<pixels.length;p+=4){if(scalp[p+3]&&!pixels[p+3])metrics.scalpGaps++;if(!pixels[p+3])continue;metrics.visible++;colors.add(pixels.subarray(p,p+3).toString('hex'));if(protection[p+3])metrics.protectedOverlap++;if(pixels[p+3]!==255)metrics.semitransparent++;if(pixels[p]>pixels[p+1]+20&&pixels[p+1]>pixels[p+2]+12)metrics.warmSkinLike++;}
  metrics.colors=colors.size;if(metrics.scalpGaps||metrics.protectedOverlap||metrics.semitransparent||metrics.warmSkinLike)throw Error('Manual fit/isolation check failed');
  await writeFile(new URL(out+id+'-hair.png',root),bytes);await writeFile(new URL(pub+id+'-hair.png',root),bytes);
  const composite=await sharp(body).composite([{input:bytes}]).png().toBuffer(),headComp=await sharp(head).composite([{input:bytes}]).png().toBuffer();
  await writeFile(new URL(out+id+'-composite.png',root),composite);
  comps.push({input:composite,left:(i+1)*128,top:0});heads.push({input:headComp,left:(i+1)*128,top:0});hairOnly.push({input:bytes,left:i*128,top:0});
  Object.assign(review.styles[i],{url:'/assets/character-v2/hair-front-pipeline-02/manual-repair-01/'+id+'-hair.png',sha256:hash(bytes),rawUrl:rawReview.styles[i].url,rawSha256:rawReview.styles[i].sha256,metrics,isolationRejected:false,status:'manual-repair / visual-review-required',visualApproved:false,productionReady:false,visualFindings:i===0?'แก้ด้วยมือ: เอาผิว/รอยคิ้วปะปนออก ปรับยอดให้เป็นปอยแทนขอบตัดตรง ยังรอตรวจความสวยงาม':i===1?'แก้ด้วยมือ: เอาผิว/รอยคล้ายคิ้วออก ต่อปอยข้างถึงแนวกรามโดยไม่ทับหู ยังรอตรวจรอยต่อและทรงบ๊อบ':'แก้ด้วยมือ: เติม scalp ด้วยสีผมและปอยหวีเข้ามวย เอาสีผิวออก ยังรอตรวจรูปทรงและแสงเงา'});
 }
 for(const [p,h]of Object.entries(await json(out+'frozen.json')))if(hash(await load(p))!==h)throw Error('Original evidence changed: '+p);
 for(const [name,width,list]of [['comparison',512,comps],['heads',512,heads],['hair-only',384,hairOnly]]){
  const sheet=await sharp({create:{width,height:128,channels:4,background:'#23312f'}}).composite(list).png().toBuffer();
  await writeFile(new URL(out+name+'-native.png',root),sheet);
  const cropped=name==='comparison'?sharp(sheet):sharp(sheet).extract({left:0,top:6,width,height:48});
  await cropped.resize(width*4,(name==='comparison'?128:48)*4,{kernel:'nearest'}).png().toFile(fileURLToPath(new URL(out+name+'-4x.png',root)));
 }
 await save(out+'review.json',review);await save(pub+'review.json',review);
 await save(out+'accounting.json',{method:review.method,paidCalls:0,additionalGenerations:0,originalPaidStageSpent:18,retries:0,visualApproved:false});
 console.log(JSON.stringify(review.styles.map(s=>({id:s.id,metrics:s.metrics}))));
}
