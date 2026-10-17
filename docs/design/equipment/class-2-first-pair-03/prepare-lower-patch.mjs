import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/';
const bytes=await readFile('docs/design/equipment/class-2-first-pair-02/juggernaut-raw.png');
const raw=await sharp(bytes).ensureAlpha().raw().toBuffer(),source=await sharp('apps/client/public/assets/character-v3/body-eight-02/south.png').ensureAlpha().raw().toBuffer();
const rgba=(b,x,y)=>[...b.subarray((y*128+x)*4,(y*128+x)*4+4)],hex=p=>'#'+Buffer.from(p).toString('hex');
const ramp=[[31,28,28,255],[53,49,48,255],[72,77,79,255],[101,108,109,255],[139,143,139,255]];
const pixels=[];
for(let y=94;y<128;y++)for(let x=32;x<=96;x++){
 let next=[0,0,0,0]; const s=rgba(source,x,y);
 if(y<=112&&s[3]){const light=(s[0]+s[1]+s[2])/3;next=ramp[light<42?0:light<85?1:light<130?2:light<180?3:4];}
 // Preserve the approved central crimson hanging cloth at its native pixels, shortened above the soles.
 if(x>=58&&x<=66&&y<=106){const p=rgba(raw,x,y);if(p[3]&&p[0]>p[1]*1.12)next=p;}
 const old=rgba(raw,x,y);if(hex(old)!==hex(next))pixels.push([x,y,hex(old),hex(next)]);
}
const packet={image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Rejected paid lower inpaint erased the legs. Deterministic lower-leg reconstruction uses original V3 leg/boot silhouette at unchanged ground row112, hand-authored five-shade dark metal/leather ramp, and approved central crimson strip shortened above boots. Erase old overlong lower costume only inside x32..96 y94..127; no body scaling or anchor changes.'}]};
await writeFile(dir+'lower-patches.json',JSON.stringify(packet,null,2)+'\n');console.log(JSON.stringify(packet));
