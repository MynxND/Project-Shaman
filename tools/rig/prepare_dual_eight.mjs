import{readFile,writeFile,mkdir}from'node:fs/promises';
import{json,save,hash}from'./body-eight-lib.mjs';
const sets=[{id:'swept-spikes-eight-01',front:'swept-spikes-front-01',name:'ดำตั้งปัดหลัง · แปดทิศ',design:'Strong swept-back upswept short haircut with 6-8 broad pointed hooked locks flowing backward, exposed forehead and small V hairline, compact short temple locks, short layered nape, controlled tall crown matching FRONT. Not generic fluffy spikes or a mohawk.'},{id:'curtain-gold-eight-01',front:'curtain-gold-front-01',name:'แสกกลางกรอบหน้า · แปดทิศ',design:'Low rounded crown with true middle-part root split, broad curved layered curtain wings sweeping down around cheekbones to just below ears, gently feathered inward ends, compact medium length, forehead V opening. Match FRONT length and parted shape; no tall spikes, wolf mullet or bowl cut.'}];
const prep=await readFile('tools/rig/prepare_korean_wolf_eight.mjs','utf8'),publisher=await readFile('tools/rig/publish_korean_wolf_eight.mjs','utf8'),test=await readFile('tools/rig/test_eye_veil_eight.mjs','utf8');
for(const s of sets){
 const f='apps/client/public/assets/ssr/candidates/'+s.front+'/',fd='docs/design/ssr/'+s.front+'/';
 const m=await json(f+'manifest.json'),part=await json(f+'part.json');
 const approval={version:'visual-approval/1',approved:true,date:'2026-10-11',userStatement:'ผ่านทั้ง 2 ทรงเลยครับ ทำ 8 ทิศเลย ขอผมแดงด้วย',scope:s.front+' FRONT only; extend to eight static views with red palette',partSha256:hash(await readFile(f+'part.json')),images:m.files,details:m.details};
 await save(fd+'approval.json',approval);await save(f+'approval.json',approval);m.visualApproved=true;await save(fd+'manifest.json',m);await save(f+'manifest.json',m);
 let p=prep.replaceAll('korean-wolf-eight-01',s.id).replaceAll('korean-wolf-front-02',s.front).replaceAll("front+'black-head.png'","front+'silver-head.png'").replace('dy=-4','dy=-7');
 p=p.replace('if(!back)for(let y=34;y<=58;y++)for(let x=42;x<=84;x++)','if(!back)for(let y=34;y<=52;y++)for(let x=45;x<=81;x++)');
 await writeFile('tools/rig/prepare_'+s.id+'.mjs',p);await import('./prepare_'+s.id+'.mjs');
 const d='docs/design/ssr/'+s.id+'/',req=await json(d+'request.json');
 req.context_image.usage_description='LEFT: user-approved original Project Shaman FRONT hairstyle in neutral silver for directional construction. RIGHT: target four-view sheet. Preserve exact haircut silhouette, volume, root flow and length of FRONT.';
 req.description='Create four views of EXACTLY the approved haircut on the LEFT. Target2x2 cells: top-left SOUTH-EAST front-right three-quarter; top-right EAST profile; bottom-left NORTH-EAST rear-right; bottom-right NORTH back. '+s.design+' Muted lavender-silver hair for palette conversion, coherent broad root-to-tip shadow and midtone clusters, limited highlights. Do not generate brown skin-like hair or black blocks. Both original eyes visible in face views. Preserve exact original face, eye, ear, neck, head proportion, orientation and pixels outside mask. One complete haircut in each cell with transparent margin. No torso, accessory, new face, white markings or text. Original Shaman art only; do not output left context.';
 await save(d+'request.json',req);await save(d+'spec.json',{...s,nativeCanvas:128,palettes:['gold','silver','black','red'],scope:'Eight static head/hair views, no animations or gameplay publication'});await save(d+'intent.json',{cap:6,attempts:1,retries:0,status:'prepared',authorization:approval.userStatement});
 let pub=publisher.replaceAll('korean-wolf-eight-01',s.id).replaceAll('korean-wolf-front-02',s.front).replaceAll('korean-wolf-eight-candidate',s.id+'-candidate');
 pub=pub.replace("await copyFile(front+'silver-tip-mask.png',pub+'south-tip-mask.png');",'');
 pub=pub.replace(/for\(let k=0;k<H.PX;k\+\+\)\{const y=k\/128\|0;if\(ramp\[k\*4\+3\][\s\S]*?await writeFile\(pub\+l.direction\+'-tip-mask.png',await png\(tipMask\)\);/,'');
 pub=pub.replaceAll('[14,24,36,52,70,90,120]','palettes.ramp.luminanceCuts');
 pub=pub.replace("const base=await json", "Object.assign(palettes.hair,(await json(front+'manifest.json')).paletteOverrides||{});\nconst base=await json");
 pub=pub.replaceAll("['gold','silver','black']","['gold','silver','black','red']");
 pub=pub.replace('height:384','height:512').replace('resize(4096,1536','resize(4096,2048');
 pub=pub.replace("name:'แสกกลางเกาหลี · Wolf Cut รุ่นยาว ปลายเงิน'",'name:'+JSON.stringify(s.name)).replace('const manifest={details,','const manifest={paletteOverrides:(await json(front+\'manifest.json\')).paletteOverrides||{},details,');
 await writeFile('tools/rig/publish_'+s.id+'.mjs',pub);
 let t=test.replaceAll('eye-veil-eight-01',s.id).replaceAll('eye-veil-front-03',s.front).replace('m.files.length,96','m.files.length,128');
 // Both new designs preserve original eyes in all directions, including FRONT.
 t=t.replaceAll("dir!=='south'&&",'');
 await writeFile('tools/rig/test_'+s.id+'.mjs',t);
}
await save('docs/design/ssr/dual-eight-spec.json',{sets,cap:12,attempts:2,retries:0,red:'Existing SSR red ramp; no paid generation needed',scope:'FRONT frozen; added seven views per style await user review'});
