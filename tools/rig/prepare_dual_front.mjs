import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {save} from './body-eight-lib.mjs';
const designs=[
 {id:'swept-spikes-front-01',name:'ดำตั้งปัดหลัง · Swept Spikes',palette:'black',description:'Original short upswept swept-back black hairstyle: exposed clean forehead, strong backward-flowing thick locks, asymmetrical radial crown with 6-8 pointed hooked tufts, short compact temples, one tapered temple lock each side, narrow forehead V hairline. Controlled medium-height crown: extend about 5 native pixels above original crown, silhouette tallest near center and bends backward; avoid a mohawk, flat cap or spherical fluffy wig. Bold connected dark shadow masses and directional grey-violet midtones, restrained highlights. Source pale muted lavender-silver for palette conversion, not pure white. Both original eyes and brows fully visible.'},
 {id:'curtain-gold-front-01',name:'แสกกลางกรอบหน้า · Golden Curtains',palette:'gold',description:'Original warm golden-brown curtain hairstyle shape: precise central root split, two broad curved curtain wings flowing down diagonally, layered feathered cheek-length ends taper just below both ears, a small inverted V forehead opening, symmetrical overall mass with slight natural strand variation. Low rounded crown, medium length and controlled width, coherent large curved locks rather than many thin noisy lines. Tips follow both cheeks and flick gently inward, not a bowl bob, tall spikes or a wolf mullet. Source pale muted lavender-silver for recoloring into warm gold, not pure white. Both original eyes and brows visible; retain original ears/face.'}
];
const prep=await readFile(new URL('./prepare_face_fit_short.mjs',import.meta.url),'utf8'),pub=await readFile(new URL('./publish_face_fit_short.mjs',import.meta.url),'utf8'),test=await readFile(new URL('./test_golden_part.mjs',import.meta.url),'utf8');
for(const item of designs){
 const dir='docs/design/ssr/'+item.id+'/';await mkdir(dir,{recursive:true});
 let code=prep.replaceAll('face-fit-short-01',item.id);
 // More top room for the spiked design, and ear-length margins for the curtains.
 code=code.replace('dy=-4','dy=-7');
 if(item.id.startsWith('curtain'))code=code.replace('const crop=Buffer.alloc',"for(let y=32;y<=52;y++)for(let x=45;x<=81;x++){const k=y*128+x;if((x<=55||x>=70)&&!info.skin[k]&&!info.interior[k])mask[k]=1;}const crop=Buffer.alloc");
 await writeFile('tools/rig/prepare_'+item.id+'.mjs',code);
 await import('./prepare_'+item.id+'.mjs');
 const request=JSON.parse(await readFile(dir+'request.json','utf8'));
 request.description='Create ONE original FRONT hairstyle on this EXACT owned Shaman head. '+item.description+' Preserve exact skull proportions, face, eyes, ears, nose, mouth, jaw and neck; no new face or body. Coherent root-to-tip pixel clusters, limited purposeful highlights, clean connected masses, no antialiasing or random bright pixels. Finish every tip inside mask with transparent margins. Head only, one front view, no sheet, text or accessories. Keep all unmasked RGBA exact.';
 await save(dir+'request.json',request);
 await save(dir+'spec.json',{...item,nativeCanvas:128,crop:{x:32,y:0,width:64,height:64},headPivot:{x:62,y:49},status:'FRONT candidate; await visual approval before other directions',source:'Owned head-eight-01/south.png only. User image studied for silhouette; not sent to provider.'});
 let publisher=pub.replaceAll('face-fit-short-01',item.id).replaceAll('face-fit-short-candidate',item.id+'-candidate').replace("H.volumeTrim(ramp,fixed,ref)","H.volumeTrim(ramp,fixed,ref,mask)");
 publisher=publisher.replace("spent=after-before;if(spent!==5)","spent=Number(r.charged_generations);if(spent!==5)").replace("actualBasis:'Provider generations_used delta'","actualBasis:'Provider completed job charged_generations; account balance recorded separately'");
 publisher=publisher.replace("name:'ทรง 1 · หน้าม้ายาวรับกรอบหน้า'",'name:'+JSON.stringify(item.name));
 await writeFile('tools/rig/publish_'+item.id+'.mjs',publisher);
 await writeFile('tools/rig/test_'+item.id+'.mjs',test.replaceAll('golden-part-01',item.id));
 await save(dir+'intent.json',{cap:5,attempts:1,retries:0,status:'prepared',authorization:'User requested these two additional hairstyles. FRONT-first review; single attempt per design, 10-credit total ceiling.'});
}
await save('docs/design/ssr/dual-front-spec.json',{designs,cap:10,attempts:2,retries:0,scope:'Two FRONT candidates only; no other directions until approval'});
