// Builds the layered V3 head (head-layers-01) from PixelLab sources:
//  base  = bald rotation (S, SE, E, NE, N); W/SW/NW are mirrors of E/SE/NE (the bald head is symmetric, so mirrored
//          expression overlays line up exactly);
//  faces = pixels that differ from the bald head inside the face band (S/SE/E edits; W/SW mirrored);
//  hair  = cool pixels of each hairstyle rotation (+ its red cord), silhouette-aligned onto the base;
//  bases = per hairstyle: the bald base below the brow line, the hairstyle's own skull/skin above it, so no shared bald
//          scalp can show outside or through a style (2026-10-10 fix);
//  pivot = placed so the face lands where the approved head-eight-01 face sits on the body (keeps approved E/W balance).
// Usage: node tools/rig/build_head_layers.mjs   (reports per-layer pixel counts and scalp exposure for review)
import{readFile,writeFile,mkdir}from'node:fs/promises';import{order,sharp,rgba,hash,save}from'./body-eight-lib.mjs';
const src='docs/design/character-v3/head-layers-01/',pub='apps/client/public/assets/character-v3/head-layers-01/';await mkdir(pub,{recursive:true});
const HAIR=['natural-short','side-sweep','spiky-up','high-topknot'],FACES=['smile','angry','sad','surprised','closed'];
const MIRROR={west:'east','south-west':'south-east','north-west':'north-east'},FACE_DIRS=['south','south-east','east','west','south-west'];
const flip=p=>{const o=Buffer.alloc(p.length);for(let y=0;y<128;y++)for(let x=0;x<128;x++)p.copy(o,(y*128+127-x)*4,(y*128+x)*4,(y*128+x)*4+4);return o;};
const png=p=>sharp(p,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
const load=async f=>rgba(await readFile(f));
const at=(p,x,y)=>p.subarray((y*128+x)*4,(y*128+x)*4+4);
const warm=(p,i)=>p[i*4+3]&&p[i*4]-p[i*4+2]>=25;
// Chin anchor: bottom-most row of warm (skin) pixels and its centre.
function chin(p){for(let y=127;y>=0;y--){const xs=[];for(let x=0;x<128;x++)if(warm(p,y*128+x))xs.push(x);if(xs.length>=3)return{x:(Math.min(...xs)+Math.max(...xs))/2,y};}throw Error('no skin');}
function pivotOf(p){let y1=-1;for(let y=127;y>=0&&y1<0;y--)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3]){y1=y;break;}const xs=[];for(const y of[y1-1,y1])for(let x=0;x<128;x++)if(p[(y*128+x)*4+3])xs.push(x);return{x:Math.round((Math.min(...xs)+Math.max(...xs))/2),y:y1};}
function shift(p,dx,dy){const o=Buffer.alloc(p.length);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>127||ny>127)continue;p.copy(o,(ny*128+nx)*4,(y*128+x)*4,(y*128+x)*4+4);}return o;}
// Hair: cool pixels (r-b < 45; silver hair measures 0..39, skin 80+) in components >= 20 px (drops eye whites), plus saturated red cord pixels touching hair.
function hairMask(p){const cand=new Uint8Array(128*128),keep=new Uint8Array(128*128),seen=new Uint8Array(128*128);
 for(let i=0;i<128*128;i++)cand[i]=p[i*4+3]&&p[i*4]-p[i*4+2]<45?1:0;
 for(let i=0;i<128*128;i++){if(!cand[i]||seen[i])continue;const comp=[i],st=[i];seen[i]=1;while(st.length){const c=st.pop(),x=c%128,y=(c-x)/128;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=(y+dy)*128+x+dx;if(x+dx<0||x+dx>127||y+dy<0||y+dy>127||seen[n]||!cand[n])continue;seen[n]=1;st.push(n);comp.push(n);}}if(comp.length>=20)for(const c of comp)keep[c]=1;}
 for(let i=0;i<128*128;i++){if(keep[i]||!p[i*4+3])continue;const r=p[i*4],g=p[i*4+1],b=p[i*4+2];if(r>140&&g<90&&b<90){const x=i%128,y=(i-x)/128;let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const n=(y+dy)*128+x+dx;if(n>=0&&n<16384&&keep[n]){near=true;break;}}if(near)keep[i]=2;}}
 return keep;}
// Alignment: shift the haired head so its silhouette best matches the bald base: reward hair+skin covering base pixels,
// punish base scalp left uncovered and pixels hanging off the base below the hairline.
function bestShift(base,full,m){let best=[0,0],bs=-1e9;for(let dy=-8;dy<=8;dy++)for(let dx=-12;dx<=12;dx++){let sc=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const sx=x-dx,sy=y-dy,bo=base[(y*128+x)*4+3]>0;const ho=sx>=0&&sy>=0&&sx<128&&sy<128&&full[(sy*128+sx)*4+3]>0;const isHair=ho&&m[sy*128+sx];if(bo&&ho)sc+=1;else if(bo&&!ho)sc-=2;else if(ho&&!bo&&!isHair)sc-=2;}if(sc>bs){bs=sc;best=[dx,dy];}}return best;}
// Skin-only fit: shift `full` so its warm (skin) pixels best overlap the approved head's skin.
function skinShift(approved,full){let best=[0,0],bs=-1e9;for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){let sc=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const sx=x-dx,sy=y-dy;if(sx<0||sy<0||sx>127||sy>127)continue;const a=warm(approved,y*128+x),f=warm(full,sy*128+sx);if(a&&f)sc+=2;else if(a!==f)sc-=1;}if(sc>bs){bs=sc;best=[dx,dy];}}return best;}
const approvedHeads=JSON.parse(await readFile('apps/client/public/assets/character-v3/head-eight-01/manifest.json','utf8'));
// A cool base pixel counts as an eye only when skin surrounds it (not the hair-free outline of the skull).
function warmAround(p,x,y){let n=0;for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<128&&yy<128&&warm(p,yy*128+xx))n++;}return n>=2;}
const manifest={version:'head-layers/2',directions:[]},report={};
const pub1=async(name,p)=>{const b=await png(p);await writeFile(pub+name,b);return{url:'/assets/character-v3/head-layers-01/'+name,sha256:hash(b)};};
const baseOf={};for(const d of order)baseOf[d]=MIRROR[d]?flip(await load(`${src}rot-bald/${MIRROR[d]}.png`)):await load(`${src}rot-bald/${d}.png`);
for(const d of order){
 const base=baseOf[d],bc=chin(base),appr=approvedHeads.frames.find(f=>f.direction===d),apprPx=await load('apps/client/public'+appr.url);
 // The approved head was balanced on the body by the user; land this base's face exactly where that face was.
 const [px,py]=skinShift(apprPx,base),pivot={x:appr.headPivot.x-px,y:appr.headPivot.y-py},entry={direction:d,pivot,bases:{},faces:{},hair:{}};report[d]={pivot,fit:[px,py]};
 let top0=128;for(let i=0;i<16384;i++)if(base[i*4+3])top0=Math.min(top0,(i-i%128)/128);const cut=Math.round(top0+(bc.y-top0)*0.35);
 if(FACE_DIRS.includes(d)){const s=MIRROR[d]??d;const bald=await load(d==='south'?`${src}bald-front-raw.png`:`${src}rot-bald/${s}.png`);
  // Face band: from 35% down the head to just above the chin, inside the skin box.
  let y0=128,x0=128,x1=0;for(let i=0;i<16384;i++)if(bald[i*4+3]){const x=i%128,y=(i-x)/128;y0=Math.min(y0,y);if(warm(bald,i)){x0=Math.min(x0,x);x1=Math.max(x1,x);}}const top=Math.round(y0+(bc.y-y0)*0.35);
  for(const f of FACES){const e=await load(`${src}face-${f}-${s}-raw.png`),o=Buffer.alloc(e.length);let n=0;
   for(let y=top;y<=bc.y-1;y++)for(let x=x0;x<=x1;x++){const i=(y*128+x)*4;if(e[i+3]&&bald[i+3]&&!e.subarray(i,i+4).equals(bald.subarray(i,i+4))){e.copy(o,i,i,i+4);n++;}}
   entry.faces[f]=await pub1(`face-${f}-${d}.png`,MIRROR[d]?flip(o):o);report[d][f]=n;}}
 for(const h of HAIR){const full=await load(`${src}rot-${h}/${d}.png`),m=hairMask(full),hc=chin(full),o=Buffer.alloc(full.length);let n=0;
  const [ax,ay]=bestShift(base,full,m);
  // The source rotation has its own eyes (offset from the base face): drop cool pixels that skin surrounds.
  // Only inside the source face band (below the brow line, in source coordinates) so hairline edges stay intact.
  for(let i=0;i<16384;i++){const y=(i-i%128)/128;if(m[i]&&m[i]!==2&&y>=cut-ay+2&&warmAround(full,i%128,y))m[i]=0;}
  for(let i=0;i<16384;i++)if(m[i]){full.copy(o,i*4,i*4,i*4+4);n++;}
  const al=shift(o,ax,ay);
  // Eyes are cool too (whites, grey shadows): never let them into the tinted hair layer. Eye mask = cool base pixels
  // inside the face band, grown by 1 px.
  for(let y=cut;y<128;y++)for(let x=0;x<128;x++){let eye=false;for(let dy=-1;dy<=1&&!eye;dy++)for(let dx=-1;dx<=1;dx++){const yy=y+dy,xx=x+dx;if(yy<cut||yy>127||xx<0||xx>127)continue;const i=(yy*128+xx)*4;if(base[i+3]&&base[i]-base[i+2]<45&&warmAround(base,xx,yy)){eye=true;break;}}if(eye)al.fill(0,(y*128+x)*4,(y*128+x)*4+4);}
  // Short styles never hang below the neck pivot (that would draw over the collar); clip alignment spill.
  for(let y=pivot.y+1;y<128;y++)al.fill(0,y*512,(y+1)*512);
  // Per-style base: bald below the brow line; above it only this style's own non-hair pixels (its skin/scalp).
  const fullAl=shift(full,ax,ay),bs=Buffer.from(base);for(let y=0;y<cut;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(fullAl[i+3]&&!al[i+3]&&fullAl[i]-fullAl[i+2]>=45&&fullAl[i+1]>=90)fullAl.copy(bs,i,i,i+4);else bs.fill(0,i,i+4);}
  entry.bases[h]=await pub1(`base-${h}-${d}.png`,bs);
  // Scalp exposure: bald skin above the eyes not covered by this hair (a visible bald patch at runtime).
  let exposed=0;for(let y=0;y<cut;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(base[i+3]&&!al[i+3]&&!fullAl[i+3])exposed++;}
  entry.hair[h]=await pub1(`hair-${h}-${d}.png`,al);report[d][h]={px:n,exposed,shift:[ax,ay]};}
 manifest.directions.push(entry);}
await save(pub+'manifest.json',manifest);await save(src+'manifest.json',manifest);await save(src+'build-report.json',report);
for(const d of order)console.log(d,JSON.stringify(report[d]));
