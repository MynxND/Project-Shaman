import {readFile,writeFile} from 'node:fs/promises';
import {sharp,save} from './body-eight-lib.mjs';
const d='docs/design/ssr/face-cold-front-01/';
const {data,info}=await sharp(await readFile(d+'cold-detached-generated.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const original=Buffer.from(data);
const owned=await sharp(await readFile(d+'source.png')).ensureAlpha().raw().toBuffer();
const changes=[];function set(x,y,c){const i=(y*64+x)*4;changes.push({x:x+32,y,before:[...data.subarray(i,i+4)],after:c});data.set(c,i);}
// Restore the owned head's skin ramp, not the provider's different complexion.
const skin=(p,i)=>p[i+3]===255&&p[i]>190&&p[i+1]>130&&p[i]>p[i+1]*1.12&&p[i]>p[i+2]*1.12;
function localSkin(x,y){const k=(y*64+x)*4;if(skin(owned,k))return [...owned.subarray(k,k+4)];let best=null,score=Infinity;for(let yy=28;yy<=48;yy++)for(let xx=21;xx<=40;xx++){const i=(yy*64+xx)*4;if(!skin(owned,i))continue;const distance=(xx-x)**2+4*(yy-y)**2;if(distance<score){score=distance;best=[...owned.subarray(i,i+4)];}}if(!best)throw Error('No owned skin sample');return best;}
for(let y=31;y<=47;y++)for(let x=21;x<=40;x++){
 const k=(y*64+x)*4;
 const eye=y>=38&&y<=40&&((x>=21&&x<=27)||(x>=33&&x<=39))&&!skin(original,k)&&original[k+3]===255;
 const mouth=y>=44&&y<=47&&x>=28&&x<=33&&original[k]<180&&original[k+1]<140;
 if(!eye&&!mouth)set(x,y,localSkin(x,y));
}
for(const start of [22,34])for(let x=start;x<start+5;x++)set(x,36,[103,75,76,255]);
// One lower sclera row becomes local cheek skin: readable iris remains, half-lidded shape.
for(const start of [22,34])for(let x=start;x<start+6;x++)set(x,41,localSkin(x,41));
await writeFile(d+'cold-detached-cleaned.png',await sharp(data,{raw:info}).png().toBuffer());await save(d+'pixel-cleanup.json',{reason:'Relax brows to horizontal deadpan, reduce lower eye whites; no new generation',changes});



