// Offline drawings use the real EquipmentLayers transforms; not a Phaser/gameplay certification.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import ts from 'typescript';
import {sharp,hash} from './body-eight-lib.mjs';
import {BRANCH_WEAPONS,EQUIPMENT_VISUALS} from '../../packages/shared/dist/index.js';
const root='docs/design/equipment/class-2-imagegen-motion-01',idleRoot='docs/design/equipment/class-2-imagegen-eight-01';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const codeUrl=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const compile=async n=>ts.transpileModule(await readFile(`apps/client/src/game/characters/${n}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const shared=new URL('../../packages/shared/dist/index.js',import.meta.url).href;
const carry=codeUrl(await compile('weapon-carry')),legacy=codeUrl(await compile('legacy-offhand-review'));
const stub=codeUrl('export default {Textures:{FilterMode:{NEAREST:0}},Math:{DegToRad:x=>x*Math.PI/180}}');
const rig=codeUrl((await compile('ModularRig')).replace(/from 'phaser'/g,`from '${stub}'`).replace(/from '@shaman\/shared'/g,`from '${shared}'`).replace(/from '.\/weapon-carry'/g,`from '${carry}'`).replace(/from '.\/legacy-offhand-review'/g,`from '${legacy}'`).replace(/import \{ HAND_ANCHORS_KEY \} from '.\/v3-weapon';/,"const HAND_ANCHORS_KEY='v3-hand-anchors';").replace(/import \{ WEAPON_ACTIONS \} from '.\/walk-eight-model';/,'const WEAPON_ACTIONS=[];'));
const {EquipmentLayers}=await import(rig);
const v3=codeUrl((await compile('v3-weapon')).replace(/from '.\/ModularRig'/g,`from '${rig}'`).replace(/import \{ outfitLayerFrame \} from '.\/class-outfit';/,'const outfitLayerFrame=()=>undefined;'));
const {v3WeaponFrame}=await import(v3);
const anchors=await json('apps/client/public/assets/character-v3/hand-anchors.json'),grips=await json('apps/client/public/assets/equipment/grips.json');
const idleReport=await json(`${idleRoot}/export-report.json`),motions=await json(`${root}/export-report.json`),lock=await json(`${root}/source-lock.json`);
const entries=[...idleReport.frames.map(f=>({id:f.id,action:'idle',direction:f.direction,index:0,url:`../class-2-imagegen-eight-01/${f.url}`,neck:f.neckPivot,main:null,off:null,sourceAction:'idle',sourceIndex:0,bodyOrigin:f.bodyOrigin,headTranslation:{x:0,y:0}})),...motions.frames];
const report={renderer:'real EquipmentLayers transform code, rasterized offline via SVG; no Phaser runtime adoption',pixelLabCredits:0,frames:[],issues:[]},imageCache=new Map();
const img=async path=>{if(!imageCache.has(path)){const bytes=await readFile(path);imageCache.set(path,{bytes,meta:await sharp(bytes).metadata(),sha256:hash(bytes)});}return imageCache.get(path);};
const svgImage=(b,x,y,w,h)=>`<image href="data:image/png;base64,${b.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const skin=(p,i)=>p[i+3]>180&&p[i]>140&&p[i]>p[i+1]*1.18&&p[i+1]>p[i+2]*1.12;
function fitHand(p,target){let point=null,dist=Infinity;for(let y=Math.max(0,Math.floor(target[1])-9);y<=Math.min(127,Math.ceil(target[1])+9);y++)for(let x=Math.max(0,Math.floor(target[0])-9);x<=Math.min(127,Math.ceil(target[0])+9);x++)if(skin(p,(y*128+x)*4)){const d=(x+.5-target[0])**2+(y+.5-target[1])**2;if(d<dist){dist=d;point=[x+.5,y+.5];}}return {point:point??target,distance:point?Math.sqrt(dist):null,verified:false};}
for(const f of entries){
 const weapon=BRANCH_WEAPONS[f.id],visual=EQUIPMENT_VISUALS[weapon],attack=lock.ids[f.id],images=[];
 const scene={cache:{json:{get:k=>k==='v3-hand-anchors'?anchors:grips}},textures:{exists:()=>true},add:{image:()=>{const i={texture:{setFilter(){}},destroy(){}};for(const m of ['Visible','Texture','Origin','Position','Rotation','Scale','Depth','Alpha','Tint'])i['set'+m]=(...v)=>{i[m]=v;return i;};images.push(i);return i;}}};
 const actor={scene,x:128,y:144,originX:(f.bodyOrigin.x+.5)/128,originY:(f.bodyOrigin.y+1)/128,scaleX:1,scaleY:1,depth:144,visible:true,alpha:1,tintTopLeft:0xffffff};
 const body=await img(`${root}/${f.url}`),pixels=await sharp(body.bytes).ensureAlpha().raw().toBuffer();
 const frame=v3WeaponFrame(scene,`v3:${f.sourceAction}:${f.direction}${f.action==='idle'?'':':'+f.sourceIndex}`,visual.bolt?'bolt':visual.swing?'swing':'rest',attack);
 let main=null,off=null;
 if(frame){
  main=fitHand(pixels,frame.grip);const old=[...frame.grip];frame.grip=main.point;frame.tip=[frame.tip[0]+frame.grip[0]-old[0],frame.tip[1]+frame.grip[1]-old[1]];
  if(frame.off){off=fitHand(pixels,frame.off.grip);const oldOff=[...frame.off.grip];frame.off.grip=off.point;frame.off.tip=[frame.off.tip[0]+off.point[0]-oldOff[0],frame.off.tip[1]+off.point[1]-oldOff[1]];}
  frame.hands=undefined;frame.headSafe=f.action==='cast'&&f.index>0&&f.index<7;
  if(main.distance===null)report.issues.push({id:f.id,action:f.action,direction:f.direction,index:f.index,reason:'No visible candidate main-hand skin'});
 }
 new EquipmentLayers(scene).sync(actor,{weapon},f.direction,frame,128);
 const gear=images.filter(i=>i.Visible?.[0]&&i.Texture?.[0]?.startsWith('gear:')).map(i=>({texture:i.Texture[0],origin:i.Origin,position:i.Position,rotation:i.Rotation[0],scale:i.Scale,depth:i.Depth[0]}));
 const bx=actor.x-actor.originX*128,by=actor.y-actor.originY*128,back=[],middle=[],front=[];
 for(const g of gear){const [,item,view]=g.texture.split(':'),art=await img(`apps/client/public/assets/equipment/${item}/${view}.png`);g.artSha256=art.sha256;
  const s=`<g transform="translate(${g.position[0]},${g.position[1]}) rotate(${g.rotation*180/Math.PI}) scale(${g.scale[0]},${g.scale[1]})">${svgImage(art.bytes,-g.origin[0]*art.meta.width,-g.origin[1]*art.meta.height,art.meta.width,art.meta.height)}</g>`;
  (g.depth<actor.depth?back:frame?.headSafe?middle:front).push(s);
 }
 const head=await img(`apps/client/public/assets/character-v3/head-eight-01/${f.direction}.png`),dx=f.headTranslation?.x??0,dy=f.headTranslation?.y??0;
 const contacts=[];
 if(frame&&gear[0]?.depth>=actor.depth)for(const h of [main?.point,...(visual.offhand?[off?.point]:[])])if(h){for(let y=Math.round(h[1])-1;y<=Math.round(h[1])+1;y++)for(let x=Math.round(h[0])-1;x<=Math.round(h[0])+1;x++)if(x>=0&&x<128&&y>=0&&y<128&&skin(pixels,(y*128+x)*4))contacts.push(`<rect x="${bx+x}" y="${by+y}" width="1" height="1"/>`);}
 const fingers=contacts.length?`<defs><clipPath id="fingers">${contacts.join('')}</clipPath></defs><g clip-path="url(#fingers)">${svgImage(body.bytes,bx,by,128,128)}</g>`:'';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="176"><rect width="256" height="176" fill="#243a34"/>${back.join('')}${svgImage(body.bytes,bx,by,128,128)}${middle.join('')}${svgImage(head.bytes,bx+dx,by+dy,128,128)}${front.join('')}${fingers}</svg>`;
 const out=`${f.id}/equipment/${f.action}/${f.direction}-${f.index}.png`;await mkdir(`${root}/${f.id}/equipment/${f.action}`,{recursive:true});await sharp(Buffer.from(svg)).png().toFile(`${root}/${out}`);
 report.frames.push({id:f.id,action:f.action,direction:f.direction,index:f.index,url:out,weapon,main,off,gear,bakedKerisException:!frame&&f.id==='keris'&&f.action==='attack',visualApproved:false});
}
await writeFile(`${root}/equipment-review.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({frames:report.frames.length,issues:report.issues.length,runtimePublished:false}));
