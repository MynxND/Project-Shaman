// head-layers-02 build (user rule 2026-10-10: the face must be identical across hairstyles).
//  base  = ONE shared bald head per direction for every style (face/eyes/mouth/ears never come from a hair edit);
//  faces = the head-layers-01 expression overlays (drawn on this same bald base);
//  hair  = only hair pixels of an edit made ON that direction's bald base (pixel-aligned): cool 4-connected
//          components >= 25 px + the red cord, minus the base's eye pixels; symmetric styles mirror E/SE/NE -> W/SW/NW.
//  check = scalp coverage: share of the base skull top covered by hair (front/side: top 30% of the head; back views:
//          top 75%). Anything under 97% is reported as a FAIL and the build exits non-zero.
import{readFile,writeFile}from'node:fs/promises';import{order,sharp,rgba,hash,save,json}from'./body-eight-lib.mjs';
const src='docs/design/character-v3/head-layers-02/',pub='apps/client/public/assets/character-v3/head-layers-01/';
const HAIR={'natural-short':true,'side-sweep':false,'spiky-up':true,'high-topknot':false},MIRROR={west:'east','south-west':'south-east','north-west':'north-east'};
const BACK=['north-east','north','north-west'];
const load=async f=>rgba(await readFile(f));
const flip=p=>{const o=Buffer.alloc(p.length);for(let y=0;y<128;y++)for(let x=0;x<128;x++)p.copy(o,(y*128+127-x)*4,(y*128+x)*4,(y*128+x)*4+4);return o;};
const png=p=>sharp(p,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
const warm=(p,x,y)=>x>=0&&y>=0&&x<128&&y<128&&p[(y*128+x)*4+3]&&p[(y*128+x)*4]-p[(y*128+x)*4+2]>=45;
// Eyes live in the face band only (the bald scalp highlight is also cool-on-skin and must stay hair-covered).
function eyeMask(b){const m=new Uint8Array(16384);let top=128,bottom=0;for(let k=0;k<16384;k++)if(b[k*4+3]){top=Math.min(top,k/128|0);bottom=Math.max(bottom,k/128|0);}const band=top+Math.round((bottom-top)*0.4);for(let y=band;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(!b[i+3]||b[i]-b[i+2]>=45)continue;let n=0;for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]])if(warm(b,x+dx,y+dy))n++;if(n>=2)for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){const yy=y+a,xx=x+c;if(yy>=0&&xx>=0&&yy<128&&xx<128)m[yy*128+xx]=1;}}return m;}
function hairOf(e,base,pivotY){const cand=new Uint8Array(16384),keep=new Uint8Array(16384),seen=new Uint8Array(16384),eye=eyeMask(base);
 for(let k=0;k<16384;k++)cand[k]=e[k*4+3]&&e[k*4]-e[k*4+2]<45&&!eye[k]?1:0;
 for(let k=0;k<16384;k++){if(!cand[k]||seen[k])continue;const comp=[k],st=[k];seen[k]=1;while(st.length){const c=st.pop();for(const n of[c-1,c+1,c-128,c+128]){if(n<0||n>=16384||seen[n]||!cand[n]||(Math.abs(n-c)===1&&(n/128|0)!==(c/128|0)))continue;seen[n]=1;st.push(n);comp.push(n);}}if(comp.length>=25)for(const c of comp)keep[c]=1;}
 // Red cord (bright and dark reds): grow from hair over red-dominant pixels so the band leaves no hole.
 for(let pass=0;pass<4;pass++)for(let k=0;k<16384;k++){const i=k*4;if(keep[k]||!e[i+3])continue;if(e[i]>70&&e[i]>e[i+1]*1.6&&e[i]>e[i+2]*1.6&&(k/128|0)<pivotY-8){const x=k%128,y=k/128|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const n=(y+dy)*128+x+dx;if(n>=0&&n<16384&&keep[n]){keep[k]=2;dy=9;break;}}}}
 // Pinched gaps (cord highlights, lock seams) above the face band: fill opaque pixels hemmed in by hair on opposite sides.
 let top=128;for(let k=0;k<16384;k++)if(base[k*4+3])top=Math.min(top,k/128|0);
 for(let pass=0;pass<3;pass++)for(let y=0;y<Math.min(128,top+14);y++)for(let x=1;x<127;x++){const k=y*128+x;if(keep[k]||!e[k*4+3])continue;const h=(dx,dy)=>{for(let t=1;t<=3;t++){const xx=x+dx*t,yy=y+dy*t;if(xx<0||yy<0||xx>127||yy>127)return false;if(keep[yy*128+xx])return true;}return false;};if((h(-1,0)&&h(1,0))||(h(0,-1)&&h(0,1)))keep[k]=3;}
 // keep 1 = hair (tinted at runtime); 2/3 = cord and filled seams (accent layer, never tinted).
 const o=Buffer.alloc(e.length),acc=Buffer.alloc(e.length);let accN=0;for(let k=0;k<16384;k++)if(keep[k]&&(k/128|0)<=pivotY){if(keep[k]===1)e.copy(o,k*4,k*4,k*4+4);else{e.copy(acc,k*4,k*4,k*4+4);accN++;}}
 const merged=Buffer.from(o);for(let k=0;k<16384;k++)if(acc[k*4+3])acc.copy(merged,k*4,k*4,k*4+4);return{hair:o,accent:accN?acc:null,merged};}
function coverage(base,hair,dir){let top=128,bottom=0;for(let k=0;k<16384;k++)if(base[k*4+3]){top=Math.min(top,k/128|0);bottom=Math.max(bottom,k/128|0);}
 const lim=top+Math.round((bottom-top)*(BACK.includes(dir)?0.6:0.3));let n=0,c=0;for(let y=top;y<=lim;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(!base[i+3])continue;
  if(BACK.includes(dir)&&y>top+(bottom-top)*0.45&&warm(base,x,y)&&!warm(base,x+3,y)!==!warm(base,x-3,y))continue; // ears at the silhouette edge
  n++;if(hair[i+3])c++;}return c/n;}
const old=await json(pub+'manifest.json'),manifest={version:'head-layers/2',directions:[]},report={};let fail=false;
const put=async(name,p)=>{const b=await png(p);await writeFile(pub+name,b);return{url:'/assets/character-v3/head-layers-01/'+name,sha256:hash(b)};};
const hairSrc={};for(const[h,sym]of Object.entries(HAIR))for(const d of order){
 if(d==='south')hairSrc[h+d]=await load(`${src}front-${h}-raw.png`);
 else if(sym&&MIRROR[d])hairSrc[h+d]=flip(await load(`${src}dir-${h}-${MIRROR[d]}-raw.png`));
 else hairSrc[h+d]=await load(`${src}dir-${h}-${d}-raw.png`);}
for(const[i,d]of order.entries()){
 const base=await load(`${src}bald-${d}.png`),prev=old.directions[i],pivot=prev.pivot,baseAsset=await put(`base-${d}.png`,base),entry={direction:d,pivot,bases:{},faces:prev.faces,hair:{}};report[d]={};
 for(const h of Object.keys(HAIR)){
  // Mirrored hair is extracted against the mirrored base it was drawn on, i.e. this direction's base.
  const{hair,accent,merged}=hairOf(hairSrc[h+d],base,pivot.y),cov=coverage(base,merged,d);
  entry.hair[h]=await put(`hair-${h}-${d}.png`,hair);if(accent)(entry.accents??={})[h]=await put(`accent-${h}-${d}.png`,accent);entry.bases[h]=baseAsset;report[d][h]=+cov.toFixed(3);if(cov<0.97)fail=true;}
 manifest.directions.push(entry);}
await save(pub+'manifest.json',manifest);await save(src+'manifest.json',manifest);await save(src+'coverage-report.json',report);
for(const d of order)console.log(d.padEnd(11),JSON.stringify(report[d]));
if(fail){console.log('FAIL: scalp coverage under 97% somewhere (see above)');process.exitCode=2;}
