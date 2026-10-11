// Preview only (no generation, does not change the published parts): trims a hairstyle's volume to an envelope around
// the reference head (up to TOP px above it, SIDE px beside it), re-outlines the cut edge with the darkest ramp step,
// and renders before/after on the body with head-to-height ratios. Usage: node tools/rig/ssr-volume-preview.mjs side-sweep 4 3
import{readFile}from'node:fs/promises';import{readdirSync}from'node:fs';import{sharp,rgba}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');const P='apps/client/public',parts={};
for(const f of readdirSync(P+'/assets/ssr/parts'))if(f!=='index.json'){const p=JSON.parse(await readFile(P+'/assets/ssr/parts/'+f,'utf8'));parts[p.id]=p;}
const[style='side-sweep',TOP=4,SIDE=3]=process.argv.slice(2).map((v,i)=>i?Number(v):v);
const pal=JSON.parse(await readFile(P+'/assets/ssr/palettes.json','utf8')).hair.silver.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const heads=JSON.parse(await readFile(P+'/assets/character-v3/head-eight-01/manifest.json','utf8'));
const flip=b=>{const o=Buffer.alloc(b.length);for(let y=0;y<128;y++)for(let x=0;x<128;x++)b.copy(o,(y*128+127-x)*4,(y*128+x)*4,(y*128+x)*4+4);return o;};
async function px(url,mirror){let b=await rgba(await readFile(P+url));return mirror?flip(b):b;}
function envelope(ref){const e=new Uint8Array(16384);for(let k=0;k<16384;k++){if(!ref[k*4+3])continue;const x=k%128,y=k/128|0;for(let dy=-TOP;dy<=0;dy++)for(let dx=-SIDE;dx<=SIDE;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<128)e[yy*128+xx]=1;}}return e;}
function trim(ramp,env){const o=Buffer.from(ramp);for(let k=0;k<16384;k++)if(o[k*4+3]&&!env[k])o.fill(0,k*4,k*4+4);
 // Re-outline: hair pixels that now border empty space where hair used to be get the darkest step.
 for(let k=0;k<16384;k++){if(!o[k*4+3])continue;const x=k%128;if([k-1,k+1,k-128,k+128].some(n=>n>=0&&n<16384&&Math.abs(n%128-x)<=1&&!o[n*4+3]&&ramp[n*4+3]))o[k*4]=16;}return o;}
const recolor=b=>{const o=Buffer.from(b);for(let i=0;i<o.length;i+=4)if(o[i+3]){const s=S.ssrRampIndex(o[i]);if(s>=0)[o[i],o[i+1],o[i+2]]=pal[s];}return o;};
const cells=[],W=72,H=104,ratios={};
for(const[c,d]of S.SSR_DIRECTIONS.entries()){
 const real=parts['hairFront.'+style].clips[S.ssrClipId('idle',d)].mirrorOf!==undefined;const f=S.ssrPartFrame(parts['hairFront.'+style],'idle',d,0).frame;
 const refDir=real?{west:'east','south-west':'south-east','north-west':'north-east'}[d]:d;const ref=await px(heads.frames.find(x=>x.direction===refDir).url,real);
 const env=envelope(ref),items=S.ssrCompose(parts['body.medium-novice'],[parts['headBase.skin'],parts['hairFront.'+style]],'idle',d,0);
 for(const[r,mode]of['before','after'].entries()){const L=[];let hy0=999,hy1=0,by1=0,by0=999;
  for(const it of items){let b=await px(it.url,it.mirror);if(it.palette){if(mode==='after')b=trim(b,env);b=recolor(b);}
   for(let k=0;k<16384;k++)if(b[k*4+3]){const y=(k/128|0)+it.y;if(it.kind==='body'){by0=Math.min(by0,y);by1=Math.max(by1,y);}else{hy0=Math.min(hy0,y);hy1=Math.max(hy1,y);}}
   L.push({input:await sharp(b,{raw:{width:128,height:128,channels:4}}).png().toBuffer(),left:it.x,top:it.y});}
  (ratios[mode]??={})[d]=+((hy1-hy0+1)/(by1-Math.min(hy0,by0)+1)).toFixed(2);
  const img=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(L).png().toBuffer();
  cells.push({input:await sharp(img).extract({left:28,top:6,width:W,height:H}).png().toBuffer(),left:c*W,top:r*H});}}
const out=`docs/design/ssr/volume-preview-${style}.png`;const b=await sharp({create:{width:8*W,height:2*H,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();
await sharp(b).resize(8*W*2,2*H*2,{kernel:'nearest'}).toFile(out);console.log(out,JSON.stringify(ratios));
