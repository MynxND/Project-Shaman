// Phase 1 converter: existing ORIGINAL V3 assets -> Shaman Sprite Rig parts (docs/design/ssr/parts/*.json). No generation.
// Body images are referenced in place; the face-locked test sheets (head-layers-03) are sliced into per-direction layer
// PNGs under docs/design/ssr/assets/. Anchors are copied from today's manifests as-is (they are what the validator audits).
import{readFile,writeFile,mkdir}from'node:fs/promises';import{createRequire}from'node:module';import{sharp,rgba,hash,json,save}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');
// Parts + sliced layers are published under /assets/ssr for the /characters/ssr prototype; reports stay in docs/design/ssr.
const P='apps/client/public',OUT='docs/design/ssr/',PUB=P+'/assets/ssr/',A=PUB+'layers/',L3='docs/design/character-v3/head-layers-03/';
await mkdir(PUB+'parts',{recursive:true});await mkdir(A,{recursive:true});await mkdir(OUT+'zones',{recursive:true});
const imgRec=async(id,url,file)=>{const b=await readFile(file??P+url);const m=await sharp(b).metadata();return{id,url,sha256:hash(b),width:m.width,height:m.height};};
const lowest=p=>{for(let y=127;y>=0;y--)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3])return y;return -1;};
const part=(id,kind,variant,asymmetric,source)=>({version:'ssr/1',id,kind,variant,canvas:{width:128,height:128},asymmetric,images:[],clips:{},source});
const walkMs=1000/(8*S.WALK_SPEED/S.WALK_CYCLE_UNITS);
const INTERVAL={idle:1000,walk:Math.round(walkMs),attack:Math.round(1000/16),cast:Math.round(1000/12)};

// ---- body.medium-novice ----------------------------------------------------------------------------------------------
const body=part('body.medium-novice','body','medium-novice',true,'body-eight-02 idle, walk-eight-02, actions-eight-02 attack/cast; anchors copied from their manifests');
const idle=await json(P+'/assets/character-v3/body-eight-02/manifest.json'),walk=await json(P+'/assets/character-v3/walk-eight-02/manifest.json');
const atk=await json(P+'/assets/character-v3/actions-eight-02/attack/manifest.json'),cast=await json(P+'/assets/character-v3/actions-eight-02/cast/manifest.json');
async function bodyFrame(url,neck){const id=url.split('/assets/character-v3/')[1];if(!body.images.some(i=>i.id===id))body.images.push(await imgRec(id,url));
 const y=lowest(await rgba(await readFile(P+url)));return{layers:[{image:id,x:0,y:0}],anchors:{origin:{x:62,y},neck:{...neck}}};}
for(const d of S.SSR_DIRECTIONS){
 const f=idle.frames.find(x=>x.direction===d);body.clips[S.ssrClipId('idle',d)]={action:'idle',direction:d,intervalMs:INTERVAL.idle,frames:[await bodyFrame(f.url,f.neckPivot)]};
 for(const[action,m]of[['walk',walk],['attack',atk],['cast',cast]]){const dd=m.directions.find(x=>x.direction===d);
  body.clips[S.ssrClipId(action,d)]={action,direction:d,intervalMs:INTERVAL[action],frames:await Promise.all(dd.frames.map(f=>bodyFrame(f.url,f.neckPivot)))};}}
// origin x: the feet centre of the idle frame per direction (bodyOrigin), kept identical across a direction's clips.
for(const c of Object.values(body.clips)){const ox=idle.frames.find(x=>x.direction===c.direction).bodyOrigin.x;for(const f of c.frames)f.anchors.origin.x=ox;}

// ---- headBase.default (the user-approved head, face + its own hair) --------------------------------------------------
const heads=await json(P+'/assets/character-v3/head-eight-01/manifest.json');
const headDefault=part('headBase.default','headBase','default',true,'head-eight-01 (user-approved default head, face+hair in one image)');
for(const d of S.SSR_DIRECTIONS){const f=heads.frames.find(x=>x.direction===d),id='head-eight-01/'+d;headDefault.images.push(await imgRec(id,f.url));
 headDefault.clips[S.ssrClipId('idle',d)]={action:'idle',direction:d,intervalMs:INTERVAL.idle,frames:[{layers:[{image:id,x:0,y:0}],anchors:{neck:{...f.headPivot}}}]};}

// ---- face-locked test sheets (head-layers-03): hair zone + hairFront.side-sweep + faces ------------------------------
async function cells(tag){const lay=await json(`${L3}pack-${tag}-layout.json`),out=await rgba(await readFile(`${L3}pack-${tag}-raw.png`)),mask=await rgba(await readFile(`${L3}pack-${tag}-mask.png`)),W=lay.W;
 const res={};for(const c of lay.layout){const px=Buffer.alloc(128*128*4),mk=new Uint8Array(16384);
  for(let y=0;y<lay.CELL;y++)for(let x=0;x<lay.CELL;x++){const si=((c.cell.y+y)*W+c.cell.x+x)*4,k=(c.crop.y+y)*128+c.crop.x+x;out.copy(px,k*4,si,si+4);mk[k]=mask[si]?1:0;}
  res[c.direction]={px,mk};}return res;}
const png=b=>sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer();
async function saveLayer(name,buf){const b=await png(buf);await writeFile(A+name,b);const m={id:'ssr/'+name.replace('.png',''),url:'/assets/ssr/layers/'+name,sha256:hash(b),width:128,height:128};return{rec:m,file:A+name};}
// ---- Hair Layer Standard v1 (HAIR_STANDARD.md, tools/rig/ssr-hair-standard.mjs) --------------------------------------
// One shared skin base per direction (reference face/eyes/ears/neck, no scalp); each hairstyle contributes ONLY hair
// (+ untinted accents). Nothing else a generation drew survives.
const H=await import('./ssr-hair-standard.mjs');
const hair=await cells('hair-side-sweep');
// Back views (N, NE) regenerated 2026-10-10 with the volume envelope and a 10 px nape extension (user-approved, 12 credits).
const back={'side-sweep':await cells('hair-side-sweep-back'),default:await cells('hair-default-back')};
const cleared=part('headBase.skin','headBase','skin',false,'head-eight-01 reference minus its hair (Hair Layer Standard v1): face, eyes, ears, neck; no scalp');
const sweep=part('hairFront.side-sweep','hairFront','side-sweep',true,'head-layers-03 pack-hair-side-sweep (face-locked inpaint test) filtered by Hair Layer Standard v1');
const hairDefault=part('hairFront.default','hairFront','default',true,'head-eight-01 hair (approved default) filtered by Hair Layer Standard v1');
const zones={},gens={'side-sweep':{},default:{}},masks={'side-sweep':{},default:{}},refs={},infos={},necks={};
for(const d of S.SSR_DIRECTIONS){const f=heads.frames.find(x=>x.direction===d),ref=await rgba(await readFile(P+f.url));zones[d]=hair[d].mk;refs[d]=ref;infos[d]=H.analyseReference(ref,d);necks[d]=f.headPivot;
 gens['side-sweep'][d]=hair[d].px;gens.default[d]=ref;masks['side-sweep'][d]=hair[d].mk;masks.default[d]=null;
 for(const st of['side-sweep','default'])if(back[st][d]){gens[st][d]=back[st][d].px;masks[st][d]=back[st][d].mk;}
 if(back['side-sweep'][d])zones[d]=back['side-sweep'][d].mk;
 const{rec}=await saveLayer(`base-skin-${d}.png`,H.skinBase(ref,infos[d]));cleared.images.push(rec);
 cleared.clips[S.ssrClipId('idle',d)]={action:'idle',direction:d,intervalMs:INTERVAL.idle,frames:[{layers:[{image:rec.id,x:0,y:0}],anchors:{neck:{...f.headPivot}}}]};}
// Ramp: 8 luminance steps over all hair pixels; silver = the reference hair's own mean colour per step.
const lum=(b,i)=>0.299*b[i]+0.587*b[i+1]+0.114*b[i+2];
const Ls=[];for(const d of S.SSR_DIRECTIONS){for(let k=0;k<H.PX;k++){if(infos[d].hair[k])Ls.push(H.lum(refs[d],k));if(H.cool(gens['side-sweep'][d],k))Ls.push(H.lum(gens['side-sweep'][d],k));}}Ls.sort((a,b)=>a-b);
const cuts=Array.from({length:S.SSR_RAMP_STEPS-1},(_,i)=>Ls[Math.floor(Ls.length*(i+1)/S.SSR_RAMP_STEPS)]);
const step=L=>{let i=0;while(i<cuts.length&&L>=cuts[i])i++;return i;};
const acc=Array.from({length:S.SSR_RAMP_STEPS},()=>[0,0,0,0]);for(const d of S.SSR_DIRECTIONS)for(let k=0;k<H.PX;k++)if(infos[d].hair[k]){const a=acc[step(H.lum(refs[d],k))],i=k*4;a[0]+=refs[d][i];a[1]+=refs[d][i+1];a[2]+=refs[d][i+2];a[3]++;}
const hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const silver=acc.map(([r,g,b,n])=>n?[r/n,g/n,b/n]:[128,128,128]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// Palettes in HSL: one hue and saturation per colour, lightness follows the reference hair's own 8-step light curve
// (so contrast matches the art). Highlights never wash out to grey/white; shadows lean slightly cooler.
const silverL=silver.map(([r,g,b])=>0.299*r+0.587*g+0.114*b),t0=silverL[0],t1=silverL[S.SSR_RAMP_STEPS-1],curve=silverL.map(v=>(v-t0)/(t1-t0));
const hsl2rgb=(h,s,l)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)));};return[f(0),f(8),f(4)];};
const HSL={white:{h:250,s:0.10,l:[0.50,0.96]},black:{h:248,s:0.16,l:[0.05,0.27]},brown:{h:24,s:0.45,l:[0.12,0.55]},gold:{h:42,s:0.62,l:[0.24,0.76]},red:{h:4,s:0.58,l:[0.14,0.56]},teal:{h:172,s:0.38,l:[0.11,0.52]},blue:{h:222,s:0.50,l:[0.15,0.62]}};
const palettes={silver:silver.map(hex)};
for(const[id,{h,s,l}]of Object.entries(HSL))palettes[id]=curve.map(t=>hex(hsl2rgb((h+(1-t)*10+360)%360,s,l[0]+(l[1]-l[0])*t)));
await save(PUB+'palettes.json',{ramp:{steps:S.SSR_RAMP_STEPS,luminanceCuts:cuts.map(v=>+v.toFixed(1))},hair:palettes});
// Brows follow the hair palette (Ragnarok-style): an extra ramp layer on the shared base.
for(const d of S.SSR_DIRECTIONS){const br=H.browRamp(refs[d],infos[d],step);if(!br.some((v,i)=>i%4===3&&v))continue;const{rec}=await saveLayer(`base-brow-${d}.png`,br);cleared.images.push(rec);cleared.clips[S.ssrClipId('idle',d)].frames[0].layers.push({image:rec.id,x:0,y:0,palette:'hair'});}
const standardReport={};
for(const[style,p]of[['side-sweep',sweep],['default',hairDefault]])for(const d of S.SSR_DIRECTIONS){
 const{ramp,fixed,filled}=H.buildHair(gens[style][d],refs[d],infos[d],step,masks[style][d]);
 // Volume cap (HAIR_STANDARD §3.2): back views keep their own mask (nape extension).
 const trimmed=H.volumeTrim(ramp,fixed,refs[d],back[style][d]?.mk);
 // A regenerated view of an existing style keeps that style's tone: quantile-match its ramp steps to the reference hair.
 if(style==='default'&&back[style][d])H.matchTone(ramp,refs[d],infos[d],step);
 // H7: back views get hanging strand tips instead of a straight mask cut.
 const tips=['north','north-east','north-west'].includes(d)?H.backTips(ramp):0;(standardReport[style]??={})[d]={filled,tips,trimmed};
 const layers=[];
 if(fixed.some((v,i)=>i%4===3&&v)){const fx=(await saveLayer(`hair-${style}-${d}-accent.png`,fixed)).rec;p.images.push(fx);layers.push({image:fx.id,x:0,y:0});}
 const r=(await saveLayer(`hair-${style}-${d}-ramp.png`,ramp)).rec;p.images.push(r);layers.push({image:r.id,x:0,y:0,palette:'hair'});
 p.clips[S.ssrClipId('idle',d)]={action:'idle',direction:d,intervalMs:INTERVAL.idle,frames:[{layers,anchors:{neck:{...necks[d]}}}]};}
await save(OUT+'hair-standard-build.json',standardReport);
const faceParts=[];
for(const expr of['cold','sad','closed']){const c=await cells('face-'+expr),fp=part('face.'+expr,'face',expr,false,`head-layers-03 pack-face-${expr} (face-locked inpaint test), pixels inside the face zone only`);
 for(const[d,{px,mk}]of Object.entries(c)){const f=heads.frames.find(x=>x.direction===d),o=Buffer.alloc(px.length);for(let k=0;k<16384;k++)if(mk[k])px.copy(o,k*4,k*4,k*4+4);
  const{rec}=await saveLayer(`face-${expr}-${d}.png`,o);fp.images.push(rec);fp.clips[S.ssrClipId('idle',d)]={action:'idle',direction:d,intervalMs:INTERVAL.idle,frames:[{layers:[{image:rec.id,x:0,y:0}],anchors:{neck:{...f.headPivot}}}]};
  await writeFile(`${OUT}zones/zone-face-${expr}-${d}.json`,JSON.stringify([...mk].reduce((a,v,k)=>(v&&a.push(k),a),[])));}
 faceParts.push(fp);}
for(const[d,mk]of Object.entries(zones))await writeFile(`${OUT}zones/zone-hair-${d}.json`,JSON.stringify([...mk].reduce((a,v,k)=>(v&&a.push(k),a),[])));
// Ragnarok convention: W/SW/NW of head layers are mirrors of E/SE/NE (approved heads overlap 95-98% when flipped).
// This keeps one face drawing per side and removes the bad left-side generations.
const MIRROR={west:'east','south-west':'south-east','north-west':'north-east'};
for(const p of[cleared,hairDefault,sweep,...faceParts]){p.asymmetric=false;p.source+=' · W/SW/NW mirror E/SE/NE (Ragnarok convention, user-approved 2026-10-10)';
 for(const[l,r]of Object.entries(MIRROR)){const id=S.ssrClipId('idle',l),old=p.clips[id];if(!p.clips[S.ssrClipId('idle',r)])continue;
  if(old?.frames)for(const ly of old.frames[0].layers)p.images=p.images.filter(i=>i.id!==ly.image);
  p.clips[id]={action:'idle',direction:l,intervalMs:INTERVAL.idle,mirrorOf:S.ssrClipId('idle',r)};}}
// Hand-authored anchor fixes (from the prototype's anchor editor) override converted values: {partId:{clipId:{frame:{anchor:{x,y}}}}}.
let overrides={};try{overrides=JSON.parse(await readFile(OUT+'anchor-overrides.json','utf8'));}catch{}
let applied=0;for(const p of[body,headDefault,cleared,hairDefault,sweep,...faceParts])for(const[clip,frames]of Object.entries(overrides[p.id]??{}))for(const[n,anchors]of Object.entries(frames)){const f=p.clips[clip]?.frames?.[n];if(!f)continue;for(const[a,pt]of Object.entries(anchors)){f.anchors[a]={x:pt.x,y:pt.y};applied++;}}
const all=[body,headDefault,cleared,hairDefault,sweep,...faceParts];await save(PUB+'parts/index.json',all.map(p=>p.id));
for(const p of all){await save(`${PUB}parts/${p.id}.json`,p);await save(`${OUT}parts/${p.id}.json`,p);}
console.log('anchor overrides applied:',applied);
console.log('parts:',[body,headDefault,cleared,hairDefault,sweep,...faceParts].map(p=>`${p.id} (${Object.keys(p.clips).length} clips, ${p.images.length} images)`).join(', '));
