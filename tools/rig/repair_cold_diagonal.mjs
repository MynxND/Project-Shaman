import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,save} from './body-eight-lib.mjs';
const d='docs/design/ssr/face-eight-02/';await mkdir(d,{recursive:true});
const p=await sharp(await readFile('apps/client/public/assets/ssr/candidates/face-eight-01/cold-detached-south-east-patch.png')).ensureAlpha().raw().toBuffer();
const before=await sharp(await readFile('apps/client/public/assets/ssr/candidates/face-eight-01/cold-detached-short-south-east-head.png')).ensureAlpha().raw().toBuffer();
const changes=[];function set(x,y,c){const k=(y*128+x)*4;changes.push({x,y,before:[...p.subarray(k,k+4)],after:c});p.set(c,k);}
// Native head y is one below assembled preview due neck attachment. Use skin from
// each corresponding row beside the nasal bridge, preserving row-specific shading.
for(const [x0,x1]of [[57,62],[69,72]])for(let y=37;y<=41;y++)for(let x=x0;x<=x1;x++){const k=((y-1)*128+66)*4;set(x,y,[...before.subarray(k,k+4)]);}
const lid=[76,50,54,255],white=[237,231,232,255],iris=[117,101,126,255],lower=[156,141,164,255];
// Near eye6px, far eye4px. Both half-lidded, same two-row aperture and gaze.
for(const [x0,x1,ix]of [[57,62,59],[69,72,70]]){
 for(let x=x0;x<=x1;x++){set(x,38,lid);set(x,39,white);set(x,40,white);}
 set(ix,39,iris);set(ix,40,lower);
 if(x1-x0>4){set(ix+1,39,iris);set(ix+1,40,lower);}
}
await writeFile(d+'cold-diagonal-patch.png',await sharp(p,{raw:{width:128,height:128,channels:4}}).png().toBuffer());await save(d+'cleanup.json',{scope:'Only cold SE eye clusters; SW uses mirrored part. FRONT and other styles/directions frozen.',credits:0,changes});
let pub=await readFile('tools/rig/publish_face_eight.mjs','utf8');pub=pub.replace("root='/assets/ssr/candidates/face-eight-01/'","root='/assets/ssr/candidates/face-eight-02/'");
pub=pub.replace("const b=await sharp(patch,{raw:{width:128,height:128,channels:4}}).png().toBuffer(),im=await png", "let b=await sharp(patch,{raw:{width:128,height:128,channels:4}}).png().toBuffer();if(style.id==='cold-detached'&&l.dir==='south-east')b=await readFile('docs/design/ssr/face-eight-02/cold-diagonal-patch.png');const im=await png");
// Keep original paid delivery receipt unchanged.
pub=pub.replace("await save(d+'delivery.json'","await save('docs/design/ssr/face-eight-02/delivery.json'");await writeFile('tools/rig/publish_face_eight02.mjs',pub);
