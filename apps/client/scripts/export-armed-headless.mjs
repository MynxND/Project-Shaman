import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import { readFile, access, writeFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
import { EQUIPMENT_VISUALS, FACINGS } from '../../../packages/shared/dist/index.js';
import { weaponAttackAction } from '../src/game/characters/weapon-action.ts';

// Execute the production renderer with recorded Phaser image calls; no copied placement formula.
const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = async name => ts.transpileModule(await readFile(new URL(`../src/game/characters/${name}.ts`, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const carryUrl = url(await compile('weapon-carry'));
const offhandReviewUrl = url(await compile('legacy-offhand-review'));
const sharedUrl = new URL('../../../packages/shared/dist/index.js', import.meta.url).href;
const stub = url('export default {Textures:{FilterMode:{NEAREST:0}},Math:{DegToRad:x=>x*Math.PI/180}}');
const rendererCode = (await compile('ModularRig')).replace(/from 'phaser'/g, `from '${stub}'`).replace(/from '@shaman\/shared'/g, `from '${sharedUrl}'`).replace(/from '.\/weapon-carry'/g, `from '${carryUrl}'`).replace(/from '.\/legacy-offhand-review'/g, `from '${offhandReviewUrl}'`).replace(/import \{ HAND_ANCHORS_KEY \} from '.\/v3-weapon';/, "const HAND_ANCHORS_KEY='v3-hand-anchors';").replace(/import \{ WEAPON_ACTIONS \} from '.\/walk-eight-model';/, 'const WEAPON_ACTIONS=[];');
const rendererUrl = url(rendererCode);
const classOutfitUrl = url((await compile('class-outfit')).replace(/from '@shaman\/shared'/g, `from '${sharedUrl}'`));
const {EquipmentLayers} = await import(rendererUrl);
const {v3WeaponFrame} = await import(url((await compile('v3-weapon')).replace(/from '.\/ModularRig'/g, `from '${rendererUrl}'`).replace(/from '.\/class-outfit'/g, `from '${classOutfitUrl}'`)));
const {carryRotation,carryScale} = await import(carryUrl);
const anchors = JSON.parse(await readFile(new URL('../public/assets/character-v3/hand-anchors.json',import.meta.url)));
const grips = JSON.parse(await readFile(new URL('../public/assets/equipment/grips.json',import.meta.url)));
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const {createCanvas,loadImage}=require('@napi-rs/canvas');const sharp=require('sharp');
const manifest=JSON.parse(await readFile(new URL('../public/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json',import.meta.url)));
const images=[];
const scene={cache:{json:{get:key=>key==='v3-class-outfits'?manifest:key==='v3-hand-anchors'?anchors:grips}},textures:{exists:()=>true},add:{image:()=>{
  const img={texture:{setFilter(){}},destroy(){}};
  for(const method of ['setVisible','setTexture','setOrigin','setPosition','setRotation','setScale','setDepth','setAlpha','setTint']) img[method]=(...args)=>{img[method.slice(3)]=args;return img;};
  images.push(img);return img;
}}};

const {BRANCH_WEAPONS}=await import(sharedUrl);
const out=new URL('../public/weapon-poses/downloads/',import.meta.url);await mkdir(out,{recursive:true});
const report=[];
for(const o of manifest.outfits){
 const d=o.directions.south,p=d.idle,id=o.branch,weapon=BRANCH_WEAPONS[id];images.length=0;
 const layers=new EquipmentLayers(scene);
 const actor={scene,x:128,y:176,originX:(d.bodyOrigin.x+.5)/128,originY:(d.bodyOrigin.y+1)/128,scaleX:1,scaleY:1,depth:0,visible:true,alpha:1,tintTopLeft:0xffffff};
 const mode=EQUIPMENT_VISUALS[weapon].bolt?'bolt':EQUIPMENT_VISUALS[weapon].swing?'swing':'rest';
 const frame=v3WeaponFrame(scene,'v3:idle:south:outfit:'+o.id,mode,o.attackAction);layers.sync(actor,{weapon},'south',frame,128);
 const body=await loadImage(fileURLToPath(new URL('../public'+p.url,import.meta.url)));
 const draws=[{image:body,x:actor.x,y:actor.y,ox:actor.originX,oy:actor.originY,sx:1,sy:1,rotation:0,depth:0}];
 const sources=[p.url];
 for(const i of images.filter(i=>i.Visible?.[0])){
  const key=i.Texture[0];let src;
  if(key.startsWith('gear:')){const [,art,dir]=key.split(':');src=art==='axe-juggernaut-outward'?'/assets/character-v3/class-outfits/axe-south-outward.png':'/assets/equipment/'+art+'/'+dir+'.png';}
  else if(key.startsWith('v3:outfit-hands:'))src=p.hands;
  else throw Error('Unexpected export texture '+key);
  assert.ok(src);sources.push(src);const img=await loadImage(fileURLToPath(new URL('../public'+src,import.meta.url)));
  draws.push({image:img,x:i.Position[0],y:i.Position[1],ox:i.Origin[0],oy:i.Origin[1],sx:i.Scale[0],sy:i.Scale[1],rotation:i.Rotation?.[0]??0,depth:i.Depth[0]});
 }
 const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 for(const v of draws.sort((a,b)=>a.depth-b.depth)){ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.rotation);ctx.scale(v.sx,v.sy);ctx.drawImage(v.image,-v.ox*v.image.width,-v.oy*v.image.height);ctx.restore();}
 const native=p.bakedWeapon ? await sharp(await readFile(new URL('../public'+p.url,import.meta.url))).extend({top:64,bottom:64,left:64,right:64,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer() : canvas.toBuffer('image/png');const name=id+'-front-armed-headless.png';await writeFile(new URL(name,out),native);
 // 512px reference copy uses exact 2x nearest-neighbour scaling, with no new painted pixels.
 await writeFile(new URL(id+'-front-armed-headless-512.png',out),await sharp(native).resize(512,512,{kernel:'nearest'}).png().toBuffer());
 const raw=ctx.getImageData(0,0,256,256).data;let visible=0,edge=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(raw[(y*256+x)*4+3]){visible++;if(x===0||y===0||x===255||y===255)edge++;}assert.ok(visible>100);assert.equal(edge,0,'export clips '+id);
 report.push({class:id,file:name,size:256,head:false,background:'transparent',sources,baked:!!p.bakedWeapon,visiblePixels:visible});layers.destroy();
}
await writeFile(new URL('manifest.json',out),JSON.stringify({credits:0,source:'Existing detailed SOUTH idle outfit + production EquipmentLayers transforms',exports:report},null,2));console.log('Exported',report.length,'headless armed classes; all have transparent margins and no clipped edge pixels.');
