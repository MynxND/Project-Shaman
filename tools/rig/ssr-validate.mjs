// SSR validator CLI: data contract (shared validateSsrPart) + pixel checks, then writes docs/design/ssr/validation-report.{md,json}.
// Usage: node tools/rig/ssr-validate.mjs [--strict]   (--strict exits 1 on any error)
import{readFile,writeFile}from'node:fs/promises';import{readdirSync}from'node:fs';import{rgba,hash,save}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');
const OUT='docs/design/ssr/',parts={};
for(const f of readdirSync(OUT+'parts'))if(f.endsWith('.json')){const p=JSON.parse(await readFile(OUT+'parts/'+f,'utf8'));parts[p.id]=p;}
const fileOf=url=>url.startsWith('/docs/')?url.slice(1):'apps/client/public'+url;
const issues=[],add=(severity,code,part,message,extra={})=>issues.push({severity,code,part,message,...extra});
// 1. Data contract.
for(const p of Object.values(parts))issues.push(...S.validateSsrPart(p));
// 2. Files exist and match their hashes.
const pix={};
for(const p of Object.values(parts))for(const i of p.images){try{const b=await readFile(fileOf(i.url));if(hash(b)!==i.sha256)add('error','hash',p.id,`${i.id} changed since conversion`);pix[i.id]=await rgba(b);}catch{add('error','file',p.id,`${i.url} missing`);}}
const lowest=q=>{for(let y=127;y>=0;y--)for(let x=0;x<128;x++)if(q[(y*128+x)*4+3])return y;return -1;};
// 3. Body: feet on the origin every frame; one origin per direction across all actions.
const body=parts['body.medium-novice'],neckStats={};
if(body)for(const d of S.SSR_DIRECTIONS){const ys=new Set();for(const a of S.SSR_ACTION_IDS){const c=body.clips[S.ssrClipId(a,d)];if(!c?.frames)continue;
 c.frames.forEach((f,n)=>{const q=pix[f.layers[0].image];if(q&&lowest(q)!==f.anchors.origin.y)add('error','ground',body.id,`${a} ${d} frame ${n}: feet at y=${lowest(q)}, origin y=${f.anchors.origin.y}`);ys.add(f.anchors.origin.y);});
 const ny=c.frames.map(f=>f.anchors.neck.y),nx=c.frames.map(f=>f.anchors.neck.x);(neckStats[a]??={})[d]={x:[Math.min(...nx),Math.max(...nx)],y:[Math.min(...ny),Math.max(...ny)]};}
 if(ys.size>1)add('warn','origin-drift',body.id,`${d}: origin y differs across actions (${[...ys].join(', ')})`);}
// Direction resolution: left head views may be mirrors (Ragnarok convention); references and zones flip with them.
const MIRROR={west:'east','south-west':'south-east','north-west':'north-east'};
const flipBuf=b=>{const o=Buffer.alloc(b.length);for(let y=0;y<128;y++)for(let x=0;x<128;x++)b.copy(o,(y*128+127-x)*4,(y*128+x)*4,(y*128+x)*4+4);return o;};
const flipSet=z=>new Set([...z].map(k=>(k/128|0)*128+127-k%128));
const isMirrored=(p,d)=>p.clips[S.ssrClipId('idle',d)]?.mirrorOf!==undefined;
/** Pixels of a static part in direction d (layers filtered by pred), mirrored clips flipped. */
function partPx(p,d,pred=()=>true){const r=S.ssrPartFrame(p,'idle',d,0);if(!r)return null;const o=Buffer.alloc(65536);
 for(const l of r.frame.layers.filter(pred)){let b=pix[l.image];if(!b)continue;if(l.mirror)b=flipBuf(b);for(let k=0;k<16384;k++)if(b[k*4+3])b.copy(o,k*4,k*4,k*4+4);}return o;}
// 4. Head sets agree on the neck pivot (same body + different head set must land in the same place).
const heads=Object.values(parts).filter(p=>['headBase','face','hairFront','hairBack'].includes(p.kind)&&p.id!=='headBase.default');
for(const d of S.SSR_DIRECTIONS){const piv=heads.map(p=>[p.id,S.ssrPartFrame(p,'idle',d,0)?.frame.anchors.neck]).filter(([,n])=>n);const set=new Set(piv.map(([,n])=>`${n.x},${n.y}`));if(set.size>1)add('error','pivot-mismatch','heads',`${d}: head parts use different neck pivots: ${piv.map(([i,n])=>`${i}=(${n.x},${n.y})`).join(' ')}`);}
// 5–6. Hair Layer Standard v1 (HAIR_STANDARD.md). Reference = approved head (flipped opposite for mirrored left views).
const H=await import('./ssr-hair-standard.mjs');
const appr=parts['headBase.default'],cl=parts['headBase.skin'],faceLock={},standard={};
const ref=d=>{const real=MIRROR[d]&&isMirrored(cl,d)?MIRROR[d]:d,b=pix[appr.clips[S.ssrClipId('idle',real)].frames[0].layers[0].image];return real===d?b:flipBuf(b);};
const same=(a,b,k)=>(!a[k*4+3]&&!b[k*4+3])||a.subarray(k*4,k*4+4).equals(b.subarray(k*4,k*4+4));
if(appr&&cl)for(const d of S.SSR_DIRECTIONS){const r=ref(d),info=H.analyseReference(r,d),base=partPx(cl,d,l=>!l.palette),brows=partPx(cl,d,l=>!!l.palette),want=H.skinBase(r,info);
 // Brow layer must be exactly the reference brow pixels (recoloured by the hair palette).
 {let bd=0;for(let k=0;k<H.PX;k++)if(!!brows[k*4+3]!==!!info.brow[k])bd++;if(bd)add('error','brow-lock',cl.id,`${d}: brow layer differs from the reference brows on ${bd} px`);}
 // S1 base lock: the shared base is exactly the reference face/eyes/ears/neck.
 let diff=0;for(let k=0;k<H.PX;k++)if(!same(base,want,k))diff++;faceLock[d]=diff;if(diff)add('error','face-lock',cl.id,`${d}: base differs from the reference face on ${diff} px`);
 for(const hp of Object.values(parts).filter(p=>p.kind==='hairFront')){const hr=partPx(hp,d);if(!hr)continue;const accent=partPx(hp,d,l=>!l.palette),st=(standard[hp.id]??={})[d]={};
  // H2 no hair over the face from the brow line down.
  let cover=0;for(let k=0;k<H.PX;k++)if(hr[k*4+3]&&info.interior[k]&&(k/H.N|0)>=info.eyeTop-1)cover++;st.faceCover=cover;if(cover)add('error','face-cover',hp.id,`${d}: hair covers ${cover} px of the face below the brow line`);
  // H5 only hair/accents from a generation: non-red accent pixels must be hole fills copied from reference skin.
  let foreign=0;for(let k=0;k<H.PX;k++)if(accent[k*4+3]&&!H.red(accent,k)&&!H.warm(accent,k))foreign++;st.foreign=foreign;if(foreign)add('error','generated-pixels',hp.id,`${d}: ${foreign} non-hair pixels from a generation`);
  // H6 no holes: transparent pixels enclosed by the composite head.
  const comp=Buffer.from(base);for(let k=0;k<H.PX;k++){if(brows[k*4+3])brows.copy(comp,k*4,k*4,k*4+4);if(hr[k*4+3])hr.copy(comp,k*4,k*4,k*4+4);}
  const out=new Uint8Array(H.PX),q=[];for(let k=0;k<H.PX;k++){const x=k%H.N,y=k/H.N|0;if((!x||!y||x===H.N-1||y===H.N-1)&&!comp[k*4+3]){out[k]=1;q.push(k);}}
  while(q.length){const c=q.pop(),x=c%H.N;for(const n of[x>0?c-1:-1,x<H.N-1?c+1:-1,c-H.N,c+H.N])if(n>=0&&n<H.PX&&!out[n]&&!comp[n*4+3]){out[n]=1;q.push(n);}}
  let holes=0;for(let k=0;k<H.PX;k++)if(!comp[k*4+3]&&!out[k])holes++;st.holes=holes;if(holes)add('error','hair-hole',hp.id,`${d}: ${holes} enclosed transparent px`);
  // Untinted grey next to hair: a cool pixel that does not follow the hair palette (not ramp, not brow, not an
  // eye/face-interior pixel) touching hair would stay grey/silver when the hair colour changes.
  {const ramp=partPx(hp,d,l=>!!l.palette);let grey=0;for(let k=0;k<H.PX;k++){if(!comp[k*4+3]||ramp[k*4+3]||brows[k*4+3]||!H.cool(comp,k)||info.interior[k])continue;const x=k%H.N;if([k-1,k+1,k-H.N,k+H.N].some(n=>n>=0&&n<H.PX&&Math.abs(n%H.N-x)<=1&&ramp[n*4+3]))grey++;}st.untintedGrey=grey;if(grey)add('error','untinted-hair',hp.id,`${d}: ${grey} grey/silver px beside the hair do not follow the hair colour`);}
  // Scalp coverage: the reference skull top (its hair above the brow band) must be covered by the new hair.
  let need=0,miss=0;for(let k=0;k<H.PX;k++)if(info.hair[k]&&(k/H.N|0)<info.eyeTop-3){need++;if(!hr[k*4+3])miss++;}st.scalpGap=need?+(miss/need).toFixed(3):0;if(need&&miss/need>0.03)add('error','scalp-gap',hp.id,`${d}: ${(100*miss/need).toFixed(1)}% of the skull top is not covered by hair`);}}
// 6b. Head volume (HAIR_STANDARD §3.2, user-approved 2026-10-10): composed on the idle body, the head (hair top to the
//     bottom of the skin base) is at most 38 % of the character height and at most 4 px wider than the front-view body
//     (profile bodies are narrow, so the front silhouette is the yardstick).
const volumeStats={};const skinPart=parts['headBase.skin'];let frontW=0;{const fb=S.ssrPartFrame(body,'idle','south',0);let x0=1e9,x1=-1;for(const l of fb.frame.layers){const b=pix[l.image];for(let k=0;k<16384;k++)if(b?.[k*4+3]){x0=Math.min(x0,k%128);x1=Math.max(x1,k%128);}}frontW=x1-x0+1;}
if(skinPart)for(const hp of Object.values(parts).filter(p=>p.kind==='hairFront'))for(const d of S.SSR_DIRECTIONS){
 let ht=1e9,hb=-1,bt=1e9,bb=-1,bx0=1e9,bx1=-1;const head=[];
 for(const it of S.ssrCompose(body,[skinPart,hp],'idle',d,0)){let b=pix[it.image];if(!b)continue;if(it.mirror)b=flipBuf(b);
  for(let k=0;k<16384;k++){if(!b[k*4+3])continue;const x=k%128+it.x,y=(k/128|0)+it.y;
   if(it.kind==='body'){bt=Math.min(bt,y);bb=Math.max(bb,y);bx0=Math.min(bx0,x);bx1=Math.max(bx1,x);}else{head.push(x,y);ht=Math.min(ht,y);if(it.part===skinPart.id)hb=Math.max(hb,y);}}}
 let hx0=1e9,hx1=-1;for(let i=0;i<head.length;i+=2)if(head[i+1]<=hb){hx0=Math.min(hx0,head[i]);hx1=Math.max(hx1,head[i]);}
 const ratio=(hb-ht+1)/(bb-Math.min(ht,bt)+1),hw=hx1-hx0+1,bw=frontW;(volumeStats[hp.id]??={})[d]={ratio:+ratio.toFixed(3),headWidth:hw,bodyWidth:bw};
 if(ratio>0.38||hw>bw+4)add('warn','head-volume',hp.id,`${d}: head ${(100*ratio).toFixed(1)}% of height, ${hw}px wide (front body ${bw}px); cap 38% and front body width + 4 px`);}
// 7. Palette layers: every ramp pixel holds a valid index; ramp and fixed layers never overlap; silver reproduces the
//    approved default hair (mean per-channel error).
const PAL=JSON.parse(await readFile('apps/client/public/assets/ssr/palettes.json','utf8')).hair,paletteStats={};
for(const p of Object.values(parts))for(const c of Object.values(p.clips))for(const f of c.frames??[]){const rl=f.layers.find(l=>l.palette),fl=f.layers.find(l=>!l.palette);if(!rl)continue;const rp=pix[rl.image],fp=fl?pix[fl.image]:null;let bad=0,overlap=0;
 for(let k=0;k<16384;k++){if(!rp[k*4+3])continue;if(S.ssrRampIndex(rp[k*4])<0)bad++;if(fp?.[k*4+3])overlap++;}if(bad)add('error','ramp-index',p.id,`${c.direction}: ${bad} ramp pixels hold no valid index`);if(overlap)add('error','ramp-overlap',p.id,`${c.direction}: ramp and fixed layers overlap on ${overlap} px`);}
const hd=parts['hairFront.default'];if(hd&&appr)for(const d of S.SSR_DIRECTIONS){const rp=partPx(hd,d,l=>l.palette),a=ref(d);const cols=PAL.silver.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));let err=0,n=0;
 let tl=0,tn=0,rl=0,rn=0;const L=(b,i)=>0.299*b[i]+0.587*b[i+1]+0.114*b[i+2];const ri=H.analyseReference(a,d);for(let k=0;k<16384;k++)if(ri.hair[k]){rl+=L(a,k*4);rn++;}
 for(let k=0;k<16384;k++){if(!rp[k*4+3])continue;const c=cols[S.ssrRampIndex(rp[k*4])];tl+=L(c,0);tn++;for(let j=0;j<3;j++)err+=Math.abs(c[j]-a[k*4+j]);n+=3;}
 // Regenerated views (e.g. new back hair) cannot match pixel by pixel; their overall tone must still match (≤ 8 lum).
 const tone=tn&&rn?Math.abs(tl/tn-rl/rn):0;paletteStats[d]={pixel:+(err/n).toFixed(1),tone:+tone.toFixed(1)};if(err/n>12&&tone>8)add('warn','palette-drift',hd.id,`${d}: silver palette differs from the reference hair by ${(err/n).toFixed(1)} per channel`);}
// 8. Runtime facts that the data cannot fix.
const scale=0.5*118/97;if(!Number.isInteger(scale)&&!Number.isInteger(1/scale))add('warn','scale','runtime',`V3 world scale ${scale.toFixed(3)} is not an integer ratio (pixel shimmer)`);
// Report.
const by=k=>issues.reduce((m,i)=>(m[i[k]]=(m[i[k]]??0)+1,m),{});
const errors=issues.filter(i=>i.severity==='error').length,warns=issues.length-errors;
await save(OUT+'validation-report.json',{generated:new Date().toISOString(),errors,warns,byCode:by('code'),neckStats,faceLock,standard,paletteStats,volumeStats,issues});
const row=i=>`| ${i.severity} | ${i.code} | ${i.part} | ${i.clip??''} | ${i.frame??''} | ${i.message} |`;
const neckTable=Object.entries(neckStats).map(([a,m])=>`| ${a} | ${S.SSR_DIRECTIONS.map(d=>m[d]?`${m[d].y[0]}–${m[d].y[1]}`:'').join(' | ')} |`).join('\n');
const md=`# SSR validation report — existing V3 assets

Generated by \`node tools/rig/ssr-validate.mjs\` from \`docs/design/ssr/parts/*.json\` (converted by \`tools/rig/ssr-convert.mjs\`; no new art).

**${errors} errors, ${warns} warnings.** By code: ${Object.entries(by('code')).map(([k,v])=>`${k} ${v}`).join(', ')}.

## Neck anchor range per clip (y, px) — head moves this much inside one animation

| action | ${S.SSR_DIRECTIONS.join(' | ')} |
|---|${S.SSR_DIRECTIONS.map(()=>'---').join('|')}|
${neckTable}

## Face lock (approved face pixels changed outside the hair zone)
${S.SSR_DIRECTIONS.map(d=>`${d}: ${faceLock[d]??'n/a'}`).join(' · ')}

## Silver palette vs approved default hair (mean abs error per channel, 0–255)
${S.SSR_DIRECTIONS.map(d=>`${d}: ${paletteStats[d]?`${paletteStats[d].pixel} px / ${paletteStats[d].tone} tone`:"n/a"}`).join(" · ")}

Head volume (head height ÷ character height, cap 0.38):
${Object.entries(volumeStats).map(([id,v])=>`- ${id}: ${S.SSR_DIRECTIONS.map(d=>`${d} ${v[d].ratio}`).join(" · ")}`).join("\n")}

## All issues
| severity | code | part | clip | frame | message |
|---|---|---|---|---|---|
${issues.map(row).join('\n')}
`;
await writeFile(OUT+'validation-report.md',md);
console.log(`${errors} errors, ${warns} warnings`,by('code'));
if(process.argv.includes('--strict')&&errors)process.exitCode=1;
