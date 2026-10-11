// Builds the headless FRONT outfit reference from the user's Medium concept sheet and the outfit edit request.
import{readFile}from'node:fs/promises';import{sharp,save,hash}from'./body-eight-lib.mjs';
const dir='docs/design/character-v3/body-eight-02/',sheet=dir+'concept/medium-base-class-sheet.webp',sourcePath='apps/client/public/assets/character-v3/separated-front-02/body.png';
// FRONT figure from neck to sandals; head excluded so the reference never introduces a head.
const crop={left:50,top:264,width:146,height:202},target={x:39,y:48,w:46,h:65};
const {data,info}=await sharp(sheet).extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const bg=[data[0],data[1],data[2]];
for(let i=0;i<data.length;i+=4){const d=Math.hypot(data[i]-bg[0],data[i+1]-bg[1],data[i+2]-bg[2]);data[i+3]=d<38?0:255;}
const small=await sharp(data,{raw:info}).resize(target.w,target.h,{kernel:'nearest',fit:'fill'}).png().toBuffer();
const ref=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:small,left:target.x,top:target.y}]).png().toBuffer();
await sharp(ref).toFile(dir+'concept/front-reference-128.png');await sharp(ref).resize(512,512,{kernel:'nearest'}).toFile(dir+'concept/front-reference-4x.png');
const source=await readFile(sourcePath);
await save(dir+'front-request.json',{method:'reference',no_background:true,image_base64:source.toString('base64'),
reference_image:{base64:ref.toString('base64'),usage_description:'Same headless body re-dressed in this Medium novice outfit. Copy outfit design, colors and placement only; keep the source body silhouette, proportions, stance and pixel scale.'},
description:'Re-dress ONLY this existing HEADLESS Project Shaman body in the Medium novice outfit from the reference. Native 128 canvas, same body proportions, stance, shoulder/hip width, skin tone and one-pixel scale. Neck stump stays at x62 y49, feet baseline y112. Everything above the neck stays TRANSPARENT: absolutely no head, face, hair or skull. Outfit: off-white short-sleeved wrap shirt with brown crossed collar trim, thin brown cord necklace with small bronze amulet, thin brown leather strap diagonally from right shoulder, crimson-red cloth waist sash with knot, yellow paper talisman strip with red script hanging at front right hip, small amber gourd pouch at left hip, charcoal baggy knee-length shorts, white cloth wraps on both wrists and around lower calves, brown leather sandals with straps over bare toes. Detailed compact classic MMORPG pixel clusters, upper-left light, warm dark outline. No weapon, cape, hat, glow, ground or shadow.'});
await save(dir+'reference.json',{sheet,sheetHash:hash(await readFile(sheet)),crop,target,backgroundKey:bg,threshold:38,note:'User-supplied concept (2026-10-10). Headless crop only; concept head/hair not used. Approved head-eight-01 stays frozen.'});
console.log('prepared');
