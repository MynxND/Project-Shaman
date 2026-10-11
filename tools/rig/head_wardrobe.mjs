import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),out='docs/design/head-wardrobe-01/',pub=process.argv[2]==='publish'?'apps/client/public/assets/head-wardrobe-02/':'apps/client/public/assets/head-wardrobe-01/';
const req=createRequire(new URL('apps/client/package.json',root)),sharp=createRequire(req.resolve('next'))('sharp');
const load=p=>readFile(new URL(p,root)),json=async p=>JSON.parse(await load(p)),save=(p,j)=>writeFile(new URL(p,root),JSON.stringify(j,null,2)+'\n'),hash=b=>createHash('sha256').update(b).digest('hex');
const raw=async b=>sharp(b).ensureAlpha().raw().toBuffer(),png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
export const directions=['south','south-west','west','north-west','north','north-east','east','south-east'];
const designs=[['swept-spike','ผมสั้นปัดแหลม','Compact short swept silver-lavender spikes, broken asymmetric fringe, restrained volume.'],['tied-curtains','ผมยาวรวบ','Smooth lavender curtains, center part, compact low rear tied tail extending below the neck.'],['layered-shag','ผมซอยยาว','Dark lavender layered shag, ear framing and tapered long nape, separated large feathered locks.'],['round-crop','ผมสั้นมน','Short pale silver rounded crop, soft irregular fringe and tiny side tips, no spikes.'],['textured-crop','ผมหยักศกสั้น','Dark smoky purple tight wavy crop, compact grouped curls and open forehead part.'],['airy-feathers','ผมซอยปลายเบา','Pale lavender airy feathered locks, medium crown, sweeping diagonal fringe with irregular wispy tips.'],['soft-spikes','ผมแหลมนุ่ม','Medium silver-lavender soft pointed locks, separated center fringe and small outward temple tips.'],['side-part','ผมแสกข้าง','Compact dark slate purple side part, smooth low dome and one sweeping forehead lock.'],['smooth-curtains','ผมแสกกลางประบ่า','Muted lavender medium smooth center-part curtains, rounded ear sides and compact nape length.'],['wild-spikes','ผมแหลมกระจาย','Pale silver separated wild spikes, strong asymmetrical star crown, individually readable large locks.'],['tall-crest','ผมตั้งปัดสูง','Tall cream-silver swept crest, sharp backward-flowing tapered spikes and small close temple roots.']];
await mkdir(new URL(out,root),{recursive:true});await mkdir(new URL(pub,root),{recursive:true});
if(process.argv[2]==='prepare'){
 try{const l=await json(out+'ledger.json');if(l.attempts.length)throw Error('Ledger already has paid attempts; prepare would erase evidence.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await copyFile('C:/Users/nikza/AppData/Local/Temp/codex-clipboard-d52562fc-5f3a-478e-a31b-79371c219940.png',new URL(out+'user-reference.png',root));
 const reference=await load(out+'user-reference.png'),source=await load('docs/design/character-v2/hair-front-pipeline-02/head.png');
 const frozen={};for(const p of ['apps/client/public/assets/character-v2/manifest.json','docs/design/character-v2/cost-ledger.json','docs/design/character-v2/body-front-02/raw.png'])frozen[p]=hash(await load(p));await save(out+'frozen.json',frozen);
 const masks=Buffer.alloc(65536);for(let y=4;y<=70;y++)for(let x=39;x<=85;x++){const yes=y<=34||(x<=46||x>=78);masks.set([yes?255:0,yes?255:0,yes?255:0,255],(y*128+x)*4);}for(let p=0;p<masks.length;p+=4)masks[p+3]=255;
 await writeFile(new URL(out+'hair-mask.png',root),await png(masks));await writeFile(new URL(out+'base-head-south.png',root),source);
 const bases={};for(const dir of directions){const path=dir==='south'?'docs/design/character-v2/body-front-02/raw.png':'docs/design/character-v2/body-rotation-01/raw/'+dir+'.png';const bytes=await load(path),b=await raw(bytes),h=Buffer.from(b),body=Buffer.from(b);h.fill(0,49*512);body.fill(0,0,49*512);await writeFile(new URL(out+'canonical-'+dir+'.png',root),await png(h));await writeFile(new URL(pub+'canonical-'+dir+'.png',root),await png(h));const cardinal=['south','east','north','west'].includes(dir);if(cardinal)await writeFile(new URL(pub+'body-'+dir+'.png',root),await png(body));bases[dir]={sourcePath:path,sourceSha256:hash(bytes),headUrl:'/assets/head-wardrobe-01/canonical-'+dir+'.png',headSha256:hash(await png(h)),bodyUrl:cardinal?'/assets/head-wardrobe-01/body-'+dir+'.png':null,bodySha256:cardinal?hash(await png(body)):null,neckAnchor:{x:62,y:49},semanticCut:'visible upper region y<=48; neck and body y>=49; provisional rig, never hidden anatomy',bodyApproved:cardinal,diagonalTemplateProvisional:!cardinal};}
 for(const [i,[id,nameThai,shape]]of designs.entries()){
  const strip=await sharp(reference).extract({left:0,top:i*55,width:150,height:Math.min(55,600-i*55)}).png().toBuffer();await writeFile(new URL(out+id+'-reference.png',root),strip);
  const context=await sharp({create:{width:320,height:128,channels:4,background:'#00000000'}}).composite([{input:source,left:0,top:0},{input:strip,left:160,top:4}]).png().toBuffer();
  const description=`Draw only the hairstyle on the LEFT Project Shaman bald head. ${shape} The three tiny heads at RIGHT are the USER supplied hairstyle reference, not extra characters to draw. Match their compact classic pixel-art lock structure and flowing lavender shadow clusters. Fit our exact existing skull and face at x62,y32. Native crisp pixel clusters, upper-left light, restrained highlights, no flat polygon bands, no random noise. Keep every unmasked original face/eye/ear pixel exactly. Draw hair only in mask; never a body, shoulders, neck, hat, panel or background. End side locks naturally. Transparent background. Preserve source placement and scale.`;
  await save(out+id+'-front-request.json',{image_base64:source.toString('base64'),mask_image_base64:(await png(masks)).toString('base64'),context_image:{base64:context.toString('base64'),usage_description:'User explicitly requests imitation of this supplied hairstyle sheet. Left is our actual identity-locked head; right three small native heads guide HAIR ONLY. Do not copy reference faces or change our anatomy.'},bounding_box:{x:0,y:0,width:128,height:128},description,output_method:'Modify current layer',no_background:true,crop_to_mask:true});
 }
 await save(out+'plan.json',{version:'detachable-head-wardrobe/1',authorization:'USER approved new88 cap, no retry,11 hairstyles x8 static directions, detachable head+hair on unchanged V2 body. Latest explicit supplied-sheet adaptation request supersedes prior reference-input restriction for this stage only.',cap:88,estimatedFront:66,estimatedRotations:22,paidAttemptsPerStyle:{front:1,rotation:1},native:[128,128],origin:{x:61,y:112},headAnchor:{x:62,y:26},bases,referenceSha256:hash(reference),styles:designs.map(([id,nameThai,shape],i)=>({id,nameThai,row:i+1,shape,visualApproved:false})),animation:false,gameplayAdoption:false});
 await save(out+'ledger.json',{cap:88,spent:0,reserved:0,attempts:[],retries:0});console.log('11 identity-locked FRONT recipes;8 owned head templates;4 reversible headless bodies prepared.');
}
// Deterministic local cleanup of generated artifacts; the untouched paid output is kept as -front-generated.png.
if(process.argv[2]==='clean'){
 const id=process.argv[3],path=out+id+'-front-raw.png',original=out+id+'-front-generated.png';
 try{await readFile(new URL(original,root));}catch{await copyFile(new URL(path,root),new URL(original,root));}
 const b=await raw(await load(original));let cleared=0;const clear=p=>{if(b[p+3]){b.fill(0,p,p+4);cleared++;}};
 // Opaque white fill inside the left mask strip (model painted background instead of transparency).
 for(let y=0;y<128;y++)for(let x=0;x<=46;x++){const p=(y*128+x)*4;if(b[p+3]&&b[p]>240&&b[p+1]>240&&b[p+2]>240)clear(p);}
 // Detached specks of at most 8 pixels are noise, not readable locks.
 const seen=new Uint8Array(16384);for(let i=0;i<16384;i++){if(seen[i]||!b[i*4+3])continue;const stack=[i],c=[];seen[i]=1;while(stack.length){const j=stack.pop();c.push(j);const x=j%128,y=j>>7;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>127||ny>127)continue;const k=ny*128+nx;if(!seen[k]&&b[k*4+3]){seen[k]=1;stack.push(k);}}}if(c.length<=8)for(const j of c)clear(j*4);}
 await writeFile(new URL(path,root),await png(b));console.log(id+': cleared '+cleared+' artifact pixels.');
}
if(process.argv[2]==='front'){
 const id=process.argv[3],bytes=await load(out+id+'-front-raw.png'),b=await raw(bytes),face=await raw(await load(out+'base-head-south.png')),mask=await raw(await load(out+'hair-mask.png'));
 let mismatches=0;for(let p=0;p<65536;p+=4)if(mask[p]===0&&!b.subarray(p,p+4).equals(face.subarray(p,p+4)))mismatches++;
 if(mismatches)throw Error('Unmasked identity drift: '+mismatches);await writeFile(new URL(out+id+'-front-source.png',root),bytes);
 await save(out+id+'-rotation-request.json',{name:'shaman-detachable-head-'+id,description:'Isolated detachable human head with '+designs.find(s=>s[0]===id)[2]+' Eight static views of the SAME head and hairstyle. Compact classic MMORPG pixel art. Head only, absolutely no body, shoulders, neck, clothing or hat. Preserve the first image and canvas registration. Match hair volumes, parts, nape and left/right anatomy consistently.',first_frame_base64:bytes.toString('base64'),first_frame_direction:'south',n_directions:8,view:'low top-down'});console.log(id+': protected pixels unchanged; rotation source prepared.');
}
// Directions whose rotation output is wrong (face drawn on a back view); excluded, never retried.
const defects={'soft-spikes':['north-west','north','north-east']};
if(process.argv[2]==='publish'){
 const plan=await json(out+'plan.json'),ledger=await json(out+'ledger.json'),styles=[];
 // Publish a reversible revision. Never replace the paid output, old previews, or recipes.
 for(const base of Object.values(plan.bases))for(const key of ['headUrl','bodyUrl'])if(base[key]){
  const previous=base[key];base[key]=previous.replace('/head-wardrobe-01/','/head-wardrobe-02/');
  await copyFile(new URL('apps/client/public'+previous,root),new URL('apps/client/public'+base[key],root));
 }
 for(const s of plan.styles){const views={};for(const dir of directions){if(defects[s.id]?.includes(dir))continue;const path=dir==='south'?out+s.id+'-front-raw.png':out+s.id+'-'+dir+'-raw.png';let b;try{b=await raw(await load(path));}catch{continue;}const meta=await sharp(await load(path)).metadata();if(meta.width!==128||meta.height!==128)throw Error('Unexpected rotation dimensions');
  // SOUTH uses the identity-locked inpaint (face pixels verified identical). Other views keep the
  // rotation's own face: pasting canonical pixels left visible seams (RMSE 56-89 vs canonical).
  const head=Buffer.from(b),back=Buffer.from(b);head.fill(0,49*512);back.fill(0,0,49*512);
  // Keep every source pixel. The body occludes the rear layer at render time;
  // deleting the central corridor destroyed tied tails and longer napes.
  const h=await png(head),rear=await png(back),complete=await png(b),prefix='/assets/head-wardrobe-02/'+s.id+'-'+dir;
  await writeFile(new URL(pub+s.id+'-'+dir+'-head.png',root),h);await writeFile(new URL(pub+s.id+'-'+dir+'-back.png',root),rear);await writeFile(new URL(pub+s.id+'-'+dir+'-complete.png',root),complete);
  views[dir]={headUrl:prefix+'-head.png',headSha256:hash(h),backUrl:prefix+'-back.png',backSha256:hash(rear),completeUrl:prefix+'-complete.png',completeSha256:hash(complete),visualApproved:false,alignmentReviewed:false};
 }styles.push({...s,views,defectDirections:defects[s.id]??[]});}
 for(const[p,h]of Object.entries(await json(out+'frozen.json')))if(hash(await load(p))!==h)throw Error('Frozen approved source changed');
 const manifest={...plan,version:'detachable-head-wardrobe/2',authoringStatus:'FRONT is legacy face-locked inpaint; whole-head co-design still required',composition:'rear head pixels -> headless body -> upper head; no original face underlay',styles,ledger,visualApproved:false,productionReady:false};await save(pub+'manifest.json',manifest);
 const fronts=[];for(let i=0;i<styles.length;i++){const s=styles[i];if(!s.views.south)continue;fronts.push({input:await load(pub+s.id+'-south-head.png'),left:i*128,top:0});}
 if(fronts.length){const sheet=await sharp({create:{width:11*128,height:128,channels:4,background:'#23312f'}}).composite(fronts).png().toBuffer();await sharp(sheet).extract({left:0,top:0,width:1408,height:80}).resize(2816,160,{kernel:'nearest'}).toFile(fileURLToPath(new URL(out+'fronts-2x.png',root)));}
 console.log({styles:styles.length,views:styles.reduce((n,s)=>n+Object.keys(s.views).length,0),ledger});
}
