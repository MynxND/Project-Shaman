import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const root = new URL('../../', import.meta.url);
export const stage = 'docs/design/character-v2/hair-front-pipeline-02/';
const runtime = 'apps/client/public/assets/character-v2/hair-front-pipeline-02/';
const load = p => readFile(new URL(p, root));
const save = (p, v) => writeFile(new URL(p, root), JSON.stringify(v, null, 2)+'\n');
const hash = b => createHash('sha256').update(b).digest('hex');
const png = b => sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
const specs = [
 ['wind-crop','ผมสั้นเปิดลม','3px lifted crown','broken shallow M','three swept pointed tufts, end y34','tapered to y36','nape y44','three broad overlapping locks','low asymmetric wedge','thin circlet; no tall crown'],
 ['curtain-bob','บ๊อบแสกกลาง','2px crown, 4px lateral','central V','two curved curtains, eyes open','separate cheek-side locks outside ears','jaw bob y48','two large curved side sheets','wide rounded bell with open middle','small side pin; circlet behind fringe'],
 ['ritual-knot','มวยผมพิธี','10px central rise','receding curved arc','none; forehead exposed','close taper','compact nape y45','swept cap plus separate high knot','narrow tall central bulb','horizontal bone pin; no crown over knot'],
 ['brush-crest','สันผมตั้ง','7px vertical','flat short','upright teeth above forehead','cropped','nape y43','five upright clumps','rectangular brush crest','low headband only'],
 ['side-quiff','ปัดข้างยกสูง','6px one-sided','diagonal part','single lifted wave','one long, one short','nape y45','two interlocking waves','leaning comma','pin on short side'],
 ['split-horns','ปอยคู่ชี้สูง','8px twin peaks','M','short split fringe','tapered','nape y44','two separate peaked locks','two clear peaks with valley','central charm below valley'],
 ['round-curls','ลอนกลม','5px radial','scalloped','three round curls','rounded temple curls','nape y46','clustered rounded curls','soft cloud','small clips only'],
 ['flat-slick','หวีเรียบ','1px tight','wide clean arc','none','thin straight','nape y44','four swept bands','flat tight oval','circlet/crown clearance'],
 ['wolf-shag','รากไทร','4px crown','irregular','sparse separated points','long narrow to jaw','shoulder y55','three stepped tiers','ragged narrow triangle','small temple charm'],
 ['low-tail','หางม้าต่ำ','2px crown','central rounded','small two-part fringe','short','single tail y59','cap and one tapered tail','low teardrop behind neck','circlet above tie'],
 ['twin-buns','มวยคู่','two 6px lateral buns','rounded','short curved fringe','short wisps','nape y44','cap and two independent buns','wide three-lobe','center jewel; no side headgear'],
 ['long-straight','ยาวตรง','2px crown','center split','thin open curtains','long beyond jaw','waist y78','rear sheet and two front locks','long parallel columns','circlet, no bow'],
 ['braid-crown','เปียคาด','3px braided ring','scalloped arc','none','short tucked','one braid y62','crossing braid clusters over cap','oval ring with single off-center braid','pin under braid; avoid full crown'],
 ['fan-spikes','แฉกพัด','6px lateral spread','zigzag','three small points','spiked above ears','nape y46','five fan blades','wide angular fan','small central pin only'],
].map(([id,nameThai,volume,hairline,fringe,sideburns,backLength,layering,silhouette,accessories],i)=>({id,nameThai,volume,hairline,fringe,sideburns,backLength,layering,silhouette,accessories,status:i<3?'prototype-requested':'spec-only',visualApproved:false}));

if (process.argv[2]==='prepare') {
 try { await access(new URL(stage+'wind-crop-submit.json',root)); throw Error('Generation exists: preparation is immutable after submission'); } catch(e) { if(e.code!=='ENOENT')throw e; }
 await mkdir(new URL(stage,root),{recursive:true}); await mkdir(new URL(runtime,root),{recursive:true});
 const bytes=await load('docs/design/character-v2/body-front-02/raw.png');
 if(hash(bytes)!=='0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958')throw Error('Source identity mismatch');
 const body=await sharp(bytes).ensureAlpha().raw().toBuffer();
 const template=JSON.parse(await load('docs/design/character-v2/hair-fit-front-01/head-template.json'));
 // Re-measure actual visible head alpha. Semantic eye/ear regions stay explicit provisional annotations.
 template.headRows=[];
 const head=Buffer.alloc(body.length),silhouette=Buffer.alloc(body.length),scalp=Buffer.alloc(body.length),protection=Buffer.alloc(body.length);
 for(let y=20;y<=49;y++){
  const xs=[];for(let x=44;x<=80;x++){const p=(y*128+x)*4;if(body[p+3]){xs.push(x);body.copy(head,p,p,p+4);silhouette.set([255,255,255,255],p);if(y<=31)scalp.set([255,255,255,255],p);if(y>=35)protection.set([255,255,255,255],p);}}
  template.headRows.push({y,left:Math.min(...xs),right:Math.max(...xs),opaque:xs.length});
 }
 template.headAnchor={x:62,y:26,status:'provisional-visible-scalp-center'};
 template.spriteOrigin=template.canvas.origin;
 template.scalpBoundaryStatus='visible upper scalp y20..31; lower hairline y31 is conservative author annotation';
 template.faceProtection='all opaque head pixels y35..49 plus neck y49..52; forehead y32..34 only may be covered';
 for(let y=49;y<=52;y++)for(let x=57;x<=68;x++){const p=(y*128+x)*4;if(body[p+3])protection.set([255,255,255,255],p);}
 const files={'base.png':bytes,'head.png':await png(head),'head-silhouette.png':await png(silhouette),'scalp.png':await png(scalp),'protection.png':await png(protection),'blank.png':await png(Buffer.alloc(body.length))};
 for(const [name,b]of Object.entries(files)){await writeFile(new URL(stage+name,root),b);await writeFile(new URL(runtime+name,root),b);}
 await save(stage+'template.json',template); await save(runtime+'template.json',template);
 await save(stage+'design-system.json',{nativeResolution:[128,128],direction:'FRONT / south',palette:'silver ivory; cool gray shadows; upper-left lighting; match base cluster density',semanticGeometry:'provisional, visible pixels only',specs});
 await save(stage+'authorization.json',{source:'USER explicitly authorizes V2 neutral-male-02 and new maximum18 credits /3 attempts /no retry',cap:18,maxAttempts:3,retries:0,otherDirections:false,animation:false,visualApproved:false});
 await save(stage+'frozen.json',Object.fromEntries(await Promise.all(['docs/design/character-v2/cost-ledger.json','apps/client/public/assets/character-v2/manifest.json',template.sourcePath].map(async p=>[p,hash(await load(p))]))));
 const prompts=[];
 for(let i=0;i<3;i++){
  const s=specs[i],mask=Buffer.alloc(body.length);
  const allow=(x,y)=>{const p=(y*128+x)*4;if(!protection[p+3])mask.set([255,255,255,255],p);};
  // Exact scalp is mandatory; the surrounding permitted envelope differs per silhouette.
  for(const row of template.headRows.filter(r=>r.y<=31))for(let x=row.left;x<=row.right;x++)allow(x,row.y);
  const bounds=i===0?[46,16,79,44]:i===1?[44,18,81,49]:[48,10,76,45];
  for(let y=bounds[1];y<=bounds[3];y++)for(let x=bounds[0];x<=bounds[2];x++){
   if(y<=31 || (y<=34&&x>=52&&x<=72) || (i===1&&(x<47||x>77)) || (y>43&&(x<53||x>71)))allow(x,y);
  }
  // Pure black means preserve; alpha is ignored by PixelLab.
  for(let p=0;p<mask.length;p+=4)mask[p+3]=255;
  const maskPng=await png(mask);await writeFile(new URL(stage+s.id+'-mask.png',root),maskPng);
  const description=`FRONT only modular HAIR ONLY layer for the exact bald head in context. Output silver-ivory hair with transparent background, NO skin, NO scalp, NO eyes, ears, face, neck or body pixels, NO full character. Keep exact context skull geometry and placement: native128 canvas, head anchor62,26, visible scalp x49..75 y20..31. Cover entire scalp with hair; leave eyes and ears fully visible, fringe never below y34. ${s.id}: volume ${s.volume}; hairline ${s.hairline}; fringe ${s.fringe}; sideburns ${s.sideburns}; back ${s.backLength}; layers ${s.layering}; silhouette ${s.silhouette}. Restrained detailed classic fantasy MMORPG pixel art, crisp single-native-pixel edges, no antialiasing, upper-left broad ivory highlights, cool gray hair shadows, no red bow, no accessories. Context head is reference ONLY; source is transparent hair layer. Do not reproduce head pixels. Fit within white mask. This is front-view art, not a BACK direction.`;
  const request={image_base64:files['blank.png'].toString('base64'),context_image:{base64:files['head.png'].toString('base64'),usage_description:'Exact owned V2 head geometry; hair attachment reference only. Never reproduce skin/face.'},bounding_box:{x:0,y:0,width:128,height:128},mask_image_base64:maskPng.toString('base64'),description,no_background:true,output_method:'New layer with changes',crop_to_mask:true,seed:281+i};
  await save(stage+s.id+'-request.json',request);prompts.push({id:s.id,description,bounds});
 }
 await save(stage+'prompts.json',prompts);
 await save(runtime+'review.json',{bodySha256:hash(bytes),templateUrl:'/assets/character-v2/hair-front-pipeline-02/template.json',styles:specs.slice(0,3).map(s=>({id:s.id,nameThai:s.nameThai,status:'awaiting-generation',url:null,sha256:null})),visualApproved:false});
 console.log('Prepared exact128 head template,14 specs,3 isolated-layer requests. No generation submitted.');
}

if (process.argv[2]==='publish') {
 const review=JSON.parse(await load(runtime+'review.json'));
 const body=await sharp(await load(stage+'base.png')).ensureAlpha().raw().toBuffer();
 const scalp=await sharp(await load(stage+'scalp.png')).ensureAlpha().raw().toBuffer();
 const protectedPixels=await sharp(await load(stage+'protection.png')).ensureAlpha().raw().toBuffer();
 const comparisons=[{input:await load(stage+'base.png'),left:0,top:0}];
 const headComparisons=[{input:await load(stage+'head.png'),left:0,top:0}];
 const accounting={cap:18,maxAttempts:3,attempts:[],chargedGenerations:0,pending:0,retries:0,visualApproved:false};
 for(const [index,s]of review.styles.entries()){
  const submission=JSON.parse(await load(stage+s.id+'-submit.json'));
  const result=JSON.parse(await load(stage+s.id+'-result.json')).result;
  const receipt=result.structuredContent ?? {};
  const text=result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
  const block=result.content.find(c=>c.type==='image');
  accounting.attempts.push({id:s.id,jobId:submission.result.structuredContent.job_id,status:receipt.status??text,chargedGenerations:receipt.charged_generations??null});
  if(!block){accounting.pending++;continue;}
  if(typeof receipt.charged_generations!=='number')throw Error('Completed output missing billing receipt');
  accounting.chargedGenerations+=receipt.charged_generations;
  const bytes=Buffer.from(block.data,'base64'); const meta=await sharp(bytes).metadata();
  await writeFile(new URL(stage+s.id+'-raw.png',root),bytes);
  if(meta.width!==128||meta.height!==128)throw Error('Unexpected output canvas: no automatic resize or realignment permitted');
  const pixels=await sharp(bytes).ensureAlpha().raw().toBuffer();
  const mask=await sharp(await load(stage+s.id+'-mask.png')).ensureAlpha().raw().toBuffer();
  let visible=0,scalpGaps=0,protectedOverlap=0,semitransparent=0,outsideMask=0,warmSkinLike=0;const colors=new Set();
  for(let p=0;p<pixels.length;p+=4){
   const a=pixels[p+3];if(scalp[p+3]&&!a)scalpGaps++;
   if(!a)continue;visible++;colors.add(pixels.subarray(p,p+3).toString('hex'));
   if(a!==255)semitransparent++;if(protectedPixels[p+3])protectedOverlap++;if(mask[p]!==255)outsideMask++;
   if(pixels[p]>pixels[p+1]+20&&pixels[p+1]>pixels[p+2]+12)warmSkinLike++;
  }
  const composite=Buffer.from(body),head=Buffer.from(await sharp(await load(stage+'head.png')).ensureAlpha().raw().toBuffer());
  // Ordinary source-over preview; retain raw provider bytes, including any rejected contamination.
  for(const dest of [composite,head])for(let p=0;p<pixels.length;p+=4){const a=pixels[p+3]/255,b=dest[p+3]/255,out=a+b*(1-a);if(!out)continue;for(let c=0;c<3;c++)dest[p+c]=Math.round((pixels[p+c]*a+dest[p+c]*b*(1-a))/out);dest[p+3]=Math.round(out*255);}
  const comp=await png(composite),headComp=await png(head);
  await writeFile(new URL(stage+s.id+'-composite.png',root),comp);
  await writeFile(new URL(runtime+s.id+'-raw.png',root),bytes);
  comparisons.push({input:comp,left:(index+1)*128,top:0});headComparisons.push({input:headComp,left:(index+1)*128,top:0});
  s.url='/assets/character-v2/hair-front-pipeline-02/'+s.id+'-raw.png';s.sha256=hash(bytes);
  s.metrics={visible,colors:colors.size,scalpGaps,protectedOverlap,semitransparent,outsideMask,warmSkinLike};
  s.status=scalpGaps||protectedOverlap||outsideMask||warmSkinLike?'technical-issues / visual-review-required':'technical-fit / visual-review-required';
  s.isolationRejected=true;
  s.visualFindings=index===0?'ไม่ผ่าน hair-only: มีผิวหน้าผากและเส้นคิ้วปะปน ปอยสั้นแยกชัดแต่ยอดถูกตัดแบนด้วยขอบ mask':index===1?'ไม่ผ่าน hair-only: มีผิวหน้าผากและเส้นคิ้วปะปน ทรงม่านแสกกลางต่างจากผมสั้น แต่ความยาวไม่ถึงบ๊อบตามสเปก': 'ไม่ผ่าน hair-only: มีผิวบริเวณไรผมปะปน และ scalp coverage ไม่ครบ มวยสูงอ่านออกแต่ยังใช้เปลี่ยนสีผมไม่ได้';
  s.visualApproved=false;s.productionReady=false;s.jobId=receipt.job_id;
 }
 if(accounting.chargedGenerations>18)throw Error('Provider exceeded authorized cap');
 await save(stage+'accounting.json',accounting);await save(stage+'review.json',review);await save(runtime+'review.json',review);
 if(accounting.pending===0){
  const sheet=await sharp({create:{width:512,height:128,channels:4,background:'#23312f'}}).composite(comparisons).png().toBuffer();
  await writeFile(new URL(stage+'comparison-native.png',root),sheet);
  await sharp(sheet).resize(2048,512,{kernel:'nearest'}).png().toFile(fileURLToPath(new URL(stage+'comparison-4x.png',root)));
  const heads=await sharp({create:{width:512,height:128,channels:4,background:'#23312f'}}).composite(headComparisons).png().toBuffer();
  await sharp(heads).extract({left:0,top:6,width:512,height:52}).resize(2048,208,{kernel:'nearest'}).png().toFile(fileURLToPath(new URL(stage+'heads-4x.png',root)));
 }
 for(const [p,h]of Object.entries(JSON.parse(await load(stage+'frozen.json'))))if(hash(await load(p))!==h)throw Error('Frozen base/ledger/manifest changed: '+p);
 console.log(JSON.stringify(accounting));
}
