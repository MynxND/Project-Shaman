// Credit-saving packed inpaint (head-layers-03): crop the approved heads (head-eight-01) to 64x64 cells (native pixels, no
// scaling), tile up to 8 cells in one 256x128 canvas and inpaint them in ONE call (9 generations instead of 6 per head).
// Unmasked pixels (the approved face) come back byte-identical.
//   hair <style>          : 8 directions, mask = old hair + room for volume + forehead/brows down to just above the eyes
//   face <expression>     : 5 face-visible directions, mask = brows, eyes and mouth only
// Usage: node tools/rig/pack_head_inpaint.mjs hair side-sweep | face cold
import{readFile,writeFile,mkdir}from'node:fs/promises';import{sharp,rgba,json,order}from'./body-eight-lib.mjs';
// Optional 3rd arg: comma list of directions (e.g. north,north-east for a back-view redo); 4th: output tag suffix.
const[kind,id,dirArg,tagArg]=process.argv.slice(2);if(!['hair','face'].includes(kind)||!id)throw Error('usage: hair <style> [dirs] [tag] | face <expression>');
// Volume cap (Hair Layer Standard v1, user-approved 2026-10-10): hair may extend at most TOP px above and SIDE px beside
// the reference head, keeping the head (with hair) about 37 % of the character height.
const TOP=4,SIDE=3;
const out='docs/design/character-v3/head-layers-03/';await mkdir(out,{recursive:true});
export const CELL=64,CROP={x:32,y:0};
const heads=await json('apps/client/public/assets/character-v3/head-eight-01/manifest.json');
// Hair Layer Standard v1: left views are mirrors, so only S, SE, E, NE, N are generated (one 256x128 sheet).
const DIRS=dirArg?dirArg.split(','):kind==='hair'?['south','south-east','east','north-east','north']:['south','south-east','east'];
const HAIR={'natural-short':'full voluminous short layered hair with thick locks and a natural fringe','side-sweep':'voluminous hair with a long thick fringe swept toward the character right side, the front locks falling low to just above the eyes, fuller layered sides','spiky-up':'big dense spiky hair with thick pointed spikes radiating upward and outward','high-topknot':'thick smooth hair pulled up into a big high round topknot bun tied with a red cord, loose bangs and long side locks framing the face'};
const FACE={closed:'calm closed eyes for a blink: both eyes shut as thin gently curved lash lines, eyebrows and mouth unchanged and relaxed',cold:'a cold, aloof expression: half-lidded unimpressed eyes, flat level eyebrows, small straight closed mouth',sad:'a sad expression: inner eyebrows raised, eyes slightly downcast and watery, small downturned mouth'};
if(kind==='hair'&&!HAIR[id]&&id!=='default'||kind==='face'&&!FACE[id])throw Error('unknown '+id);
let dirNow='';
function maskFor(p,pivotY){const warm=(x,y)=>x>=0&&y>=0&&x<128&&y<128&&p[(y*128+x)*4+3]&&p[(y*128+x)*4]-p[(y*128+x)*4+2]>=45;
 let x0=128,x1=0,y0=128,y1=0;for(let k=0;k<16384;k++)if(p[k*4+3]){const x=k%128,y=k/128|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 let skinTop=128;for(let y=0;y<128&&skinTop===128;y++)for(let x=0;x<128;x++)if(warm(x,y)){skinTop=y;break;}
 let eyeTop=128,eyeBottom=0;for(let y=skinTop+1;y<pivotY;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(p[i+3]&&Math.min(p[i],p[i+1],p[i+2])>185&&p[i]-p[i+2]<30){eyeTop=Math.min(eyeTop,y-1);eyeBottom=Math.max(eyeBottom,y+1);}}
 const enclosed=(x,y)=>{let l=false,r=false;for(let t=1;t<=6;t++){if(warm(x-t,y))l=true;if(warm(x+t,y))r=true;}return l&&r;};
 const m=new Uint8Array(16384);
 // Envelope: the reference silhouette grown TOP px upward and SIDE px sideways.
 const env=new Uint8Array(16384);for(let k=0;k<16384;k++){if(!p[k*4+3])continue;const x=k%128,y=k/128|0;for(let dy=-TOP;dy<=0;dy++)for(let dx=-SIDE;dx<=SIDE;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<128)env[yy*128+xx]=1;}}
 if(kind==='hair'){for(let y=Math.max(0,y0-TOP);y<=y1;y++)for(let x=Math.max(0,x0-SIDE);x<=Math.min(127,x1+SIDE);x++){if(!env[y*128+x])continue;const k=y*128+x,old=p[k*4+3]&&!warm(x,y),empty=!p[k*4+3];
   if(y<eyeTop-1)m[k]=1;else if((old||empty)&&!(y>=skinTop&&enclosed(x,y))&&!warm(x,y))m[k]=1;}
  // Side views: never offer the space in front of the face below the brow line (generations drew extra faces there).
  const front={east:1,'south-east':1}[dirNow];if(front&&eyeTop<128)for(let y=eyeTop-1;y<pivotY;y++){let edge=-1;for(let x=0;x<128;x++)if(warm(x,y))edge=x;if(edge>=0)for(let x=edge+1;x<128;x++)m[y*128+x]=0;}}
 else{// face features: rows from 3 above the eyes to the chin, pixels inside the skin span only (never hair or outline).
  for(let y=Math.max(skinTop,eyeTop-3);y<pivotY-1;y++)for(let x=0;x<128;x++){const k=y*128+x;if(p[k*4+3]&&(warm(x,y)||enclosed(x,y))&&enclosed(x,y))m[k]=1;}}
 // Below the neck: face views stop at the collar; back views may let hair fall onto the upper back (up to 10 px below
 // the neck, never over the body's outline sides) so back hair is not cut in a straight line (user 2026-10-10).
 const back=['north','north-east','north-west'].includes(dirNow),stop=back?pivotY+10:pivotY-1;
 for(let y=stop;y<128;y++)for(let x=0;x<128;x++)m[y*128+x]=0;
 if(back)for(let y=pivotY-1;y<stop;y++)for(let x=0;x<128;x++){const k=y*128+x;m[k]=(x>=x0&&x<=x1)?1:0;}return m;}
const cols=Math.min(4,DIRS.length),W=cols*CELL,H=Math.ceil(DIRS.length/cols)*CELL,src=Buffer.alloc(W*H*4),mk=Buffer.alloc(W*H*4),layout=[];
for(let k=3;k<mk.length;k+=4)mk[k]=255;
for(const[i,d]of DIRS.entries()){dirNow=d;const f=heads.frames.find(x=>x.direction===d),p=await rgba(await readFile('apps/client/public'+f.url)),m=maskFor(p,f.headPivot.y);
 const cx=(i%cols)*CELL,cy=Math.floor(i/cols)*CELL;layout.push({direction:d,cell:{x:cx,y:cy},crop:CROP});
 for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){const sx=CROP.x+x,sy=CROP.y+y,si=(sy*128+sx)*4,di=((cy+y)*W+cx+x)*4;p.copy(src,di,si,si+4);const v=m[sy*128+sx]?255:0;mk[di]=mk[di+1]=mk[di+2]=v;}}
const png=(b)=>sharp(b,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
const srcPng=await png(src),maskPng=await png(mk),tag=`${kind}-${id}${tagArg?'-'+tagArg:''}`;
await writeFile(`${out}pack-${tag}-source.png`,srcPng);await writeFile(`${out}pack-${tag}-mask.png`,maskPng);await writeFile(`${out}pack-${tag}-layout.json`,JSON.stringify({W,H,CELL,layout},null,1));
const req={image_base64:srcPng.toString('base64'),mask_image_base64:maskPng.toString('base64')};
if(kind==='hair'){
 // Style reference: the approved front design (the default style's reference is the approved head itself).
 const front=await readFile(id==='default'?'apps/client/public/assets/character-v3/head-eight-01/south.png':`docs/design/character-v3/head-layers-02/front-${id}-raw.png`);
 const ctx=await sharp({create:{width:128+W,height:Math.max(128,H),channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:front},{input:srcPng,left:128,top:0}]).png().toBuffer();
 Object.assign(req,{context_image:{base64:ctx.toString('base64'),usage_description:'Left: the approved hairstyle design (front view). Right: the sheet being edited, the same head in eight views.'},bounding_box:{x:128,y:0,width:W,height:H},
  description:`A sheet of the same character head in ${DIRS.length} views (${DIRS.join(', ')}). Give every head the SAME hairstyle shown on the left: ${HAIR[id]??'the same short layered hair as the reference head'}. Hair fully covers the skull, close to the head (not puffy), no scalp visible.${DIRS.every(d=>d.startsWith('north'))?' Seen from behind: the back hair falls naturally past the nape onto the upper back and ends in soft tapered strand tips, never a straight horizontal cut.':''} Pale silver-white hair with light-grey shading. Keep each head in its own cell. Only paint inside the mask; crisp classic MMORPG pixel art, top-left light.`});
}else req.description=`A sheet of the same character face in three views (front, front-right, right). Change ONLY the facial expression of every face to ${FACE[id]}, consistent across all views. Keep the same eyes style, skin and pixel scale. Only paint inside the mask; crisp pixel art.`;
await writeFile(`${out}pack-${tag}-request.json`,JSON.stringify(req));
let n=0;for(let k=0;k<mk.length;k+=4)if(mk[k])n++;console.log(tag,`${W}x${H}`,'mask px',n);
