// Face-locked hair (head-layers-03): inpaint new hair onto the USER-APPROVED head (head-eight-01) of one direction.
// The mask covers only the old hair plus room above/around the skull for volume; the face, eyes, mouth, ears and skin
// are outside the mask, so PixelLab returns them byte-identical. The approved front design of the style sits beside the
// source in the context image as the style reference.
// Usage: node tools/rig/prepare_face_locked_hair.mjs <style> <direction> [fringe]
import{readFile,writeFile,mkdir}from'node:fs/promises';import{sharp,rgba,json}from'./body-eight-lib.mjs';
const[style,dir]=process.argv.slice(2);if(!style||!dir)throw Error('usage: <style> <direction>');
const out='docs/design/character-v3/head-layers-03/';await mkdir(out,{recursive:true});
const heads=await json('apps/client/public/assets/character-v3/head-eight-01/manifest.json'),f=heads.frames.find(x=>x.direction===dir);
const srcBuf=await readFile('apps/client/public'+f.url),p=await rgba(srcBuf);
const DESC={'natural-short':'full voluminous short layered hair with thick locks and a natural fringe','side-sweep':'voluminous hair with a long thick fringe swept toward the character right side and fuller layered sides','spiky-up':'big dense spiky hair with thick pointed spikes radiating upward and outward','high-topknot':'thick smooth hair pulled up into a big high round topknot bun tied with a red cord, loose bangs and long side locks framing the face'};
const warm=(x,y)=>x>=0&&y>=0&&x<128&&y<128&&p[(y*128+x)*4+3]&&p[(y*128+x)*4]-p[(y*128+x)*4+2]>=45;
let x0=128,x1=0,y0=128,y1=0;for(let k=0;k<16384;k++)if(p[k*4+3]){const x=k%128,y=k/128|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
// Face rows: from the topmost skin row that has eyes below it; keep every warm (skin) pixel there and the eyes.
let skinTop=128;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(warm(x,y)){skinTop=Math.min(skinTop,y);}
// Eye top: first row holding an eye white (bright, neutral pixel); the fringe may cover brows but stops 2 px above it.
let eyeTop=128;for(let y=skinTop+1;y<128&&eyeTop===128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(p[i+3]&&Math.min(p[i],p[i+1],p[i+2])>185&&p[i]-p[i+2]<30){eyeTop=y-1;break;}}
// fringe: let the fringe fall over the forehead/brows down to 1 px above the eyes (user request 2026-10-10).
const fringe=process.argv[4]==="fringe";
const mask=new Uint8Array(16384);
for(let y=Math.max(0,y0-14);y<=y1;y++)for(let x=Math.max(0,x0-10);x<=Math.min(127,x1+10);x++){const k=y*128+x;
 const old=p[k*4+3]&&!warm(x,y),empty=!p[k*4+3];
 // Above the skin: everything (old hair + room for volume). Within the face rows: only old hair and empty space beside/behind
 // the head, never skin, never anything enclosed by skin (eyes, brows, mouth).
 let enclosed=false;if(y>=skinTop){let l=false,r=false;for(let t=1;t<=6;t++){if(warm(x-t,y))l=true;if(warm(x+t,y))r=true;}enclosed=l&&r;}
 if(y<skinTop||(fringe&&y<eyeTop))mask[k]=1;else if((old||empty)&&!enclosed&&!warm(x,y))mask[k]=1;}
// Never paint below the neck pivot (the collar).
for(let y=f.headPivot.y-1;y<128;y++)for(let x=0;x<128;x++)mask[y*128+x]=0;
const m=Buffer.alloc(16384*4);for(let k=0;k<16384;k++){const v=mask[k]?255:0;m[k*4]=m[k*4+1]=m[k*4+2]=v;m[k*4+3]=255;}
const maskPng=await sharp(m,{raw:{width:128,height:128,channels:4}}).png().toBuffer();await writeFile(`${out}mask-${style}-${dir}.png`,maskPng);
// Context: approved front design (left) + the source (right, at the bounding box).
const front=await readFile(`docs/design/character-v3/head-layers-02/front-${style}-raw.png`);
const ctx=await sharp({create:{width:256,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:front,left:0,top:0},{input:srcBuf,left:128,top:0}]).png().toBuffer();
await writeFile(`${out}inpaint-${style}-${dir}-request.json`,JSON.stringify({image_base64:srcBuf.toString('base64'),mask_image_base64:maskPng.toString('base64'),
 context_image:{base64:ctx.toString('base64'),usage_description:'Left: the approved hairstyle design (front view). Right: the head being edited. Draw that same hairstyle on the right head from its own viewing angle.'},
 bounding_box:{x:128,y:0,width:128,height:128},
 description:`Replace the hair of this character head with the hairstyle shown on the left of the context: ${DESC[style]}. ${fringe?"The front fringe locks hang LOWER, falling down over the forehead to just above the eyes without covering the eyes. ":""}Thick voluminous hair that fully covers the skull, back hair down to the nape, no scalp visible. Pale silver-white hair with light-grey shading. Only paint inside the mask; crisp classic MMORPG pixel art, top-left light.`}));
let n=0;for(const v of mask)n+=v;console.log(style,dir,'mask px',n);
