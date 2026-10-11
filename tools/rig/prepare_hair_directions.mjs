// Prepares head-layers-02 hair edits: each direction is drawn ON the shared bald base of that direction (so hair lands
// pixel-exact, no re-alignment) with the user-approved front design as the reference. Symmetric styles generate
// SE/E/NE/N and mirror the rest; asymmetric styles (side part, topknot cord) generate all seven non-front views.
import{readFile,writeFile}from'node:fs/promises';import{sharp}from'./body-eight-lib.mjs';
const d='docs/design/character-v3/head-layers-02/',bald=d+'bald-';
const STYLES={
 'natural-short':{sym:true,desc:'full voluminous short layered hair with thick locks and a natural fringe'},
 'side-sweep':{sym:false,desc:'voluminous hair with a long thick fringe swept toward the character right side and fuller layered sides'},
 'spiky-up':{sym:true,desc:'big dense spiky hair with thick pointed spikes radiating upward and outward'},
 'high-topknot':{sym:false,desc:'thick smooth hair pulled up into a big high round topknot bun tied with a red cord, loose bangs and long side locks framing the face'},
};
const VIEW={
 'south-east':'seen in front-right three-quarter view',east:'seen in right profile',
 'north-east':'seen from the back-right three-quarter view: hair covers the entire back of the head down to the nape',
 north:'seen straight from the back: thick hair covers the entire back of the head down to the nape, no scalp or skin visible except the neck below the hairline',
 'north-west':'seen from the back-left three-quarter view: hair covers the entire back of the head down to the nape',
 west:'seen in left profile','south-west':'seen in front-left three-quarter view',
};
const jobs=[];
for(const[id,s]of Object.entries(STYLES)){
 const ref=(await readFile(`${d}front-${id}-raw.png`)).toString('base64');
 for(const dir of s.sym?['south-east','east','north-east','north']:['south-east','east','north-east','north','north-west','west','south-west']){
  const src=(await readFile(`${bald}${dir}.png`)).toString('base64');
  await writeFile(`${d}dir-${id}-${dir}-request.json`,JSON.stringify({method:'reference',no_background:true,image_base64:src,
   reference_image:{base64:ref,usage_description:'The approved hairstyle design (front view). Reproduce this exact hairstyle, volume, lock shapes and pale silver-white colour on the source head from its own viewing angle.'},
   description:`Give this same bald head the hairstyle from the reference: ${s.desc}, ${VIEW[dir]}. The hair fully covers the skull with real volume; NO scalp or bald skin visible anywhere through or around the hair. Do NOT change the head, face, ears, skin, viewing angle, position or pixel scale; only add hair. Pale silver-white hair with light-grey shading. Native 128 canvas, transparent background, crisp classic MMORPG pixel art, top-left light.`}));
  jobs.push(`dir-${id}-${dir}`);
 }
}
await writeFile(d+'dir-jobs.txt',jobs.join('\n'));console.log(jobs.length,'jobs');
