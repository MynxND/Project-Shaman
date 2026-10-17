import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
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
const images=[];
const scene={cache:{json:{get:key=>key==='v3-hand-anchors'?anchors:grips}},textures:{exists:()=>true},add:{image:()=>{
  const img={texture:{setFilter(){}},destroy(){}};
  for(const method of ['setVisible','setTexture','setOrigin','setPosition','setRotation','setScale','setDepth','setAlpha','setTint']) img[method]=(...args)=>{img[method.slice(3)]=args;return img;};
  images.push(img);return img;
}}};
const layers=new EquipmentLayers(scene);
const actor={scene,x:210,y:300,originX:.5,originY:1,scaleX:.75,scaleY:.75,depth:300,visible:true,alpha:1,tintTopLeft:0xffffff};
let count=0,behind=0;
for(const [id,item] of Object.entries(EQUIPMENT_VISUALS)) {
  if(item.kind!=='weapon')continue;
  const action=weaponAttackAction(id,!!item.bolt),mode=item.bolt?'bolt':item.swing?'swing':'rest';
  for(const dir of FACINGS) {
    const scales=[], rotations=new Map();
    for(const [motion,i] of [['idle',0],...Array.from({length:8},(_,i)=>['walk',i]),...Array.from({length:8},(_,i)=>[action,i])]) {
      const frame=v3WeaponFrame(scene,`v3:${motion}:${dir}:${i}`,mode,action);
      layers.sync(actor,{weapon:id},dir,frame,128);
      if(motion==='attack-dagger'){assert.equal(images[0].Visible[0],false);continue;}
      assert.ok(frame,`${id}/${dir}/${motion}/${i} has real anchors`);
      const check=async (img,grip)=>{
        assert.equal(img.Visible[0],true);
        assert.deepEqual(img.Position,[actor.x-64*.75+grip[0]*.75,actor.y-128*.75+grip[1]*.75],`${id} grip stays on its hand`);
        assert.ok(Number.isFinite(img.Rotation[0]));
        const [,art,view]=img.Texture[0].split(':');
        await access(new URL(`../public/assets/equipment/${art}/${view}.png`,import.meta.url));
        if(img.Depth[0]<actor.depth)behind++;
      };
      await check(images[0],frame.grip);
      if(item.offhand)await check(images[1],frame.off.grip);
      scales.push(images[0].Scale[0]);
      rotations.set(`${motion}:${i}`,images[0].Rotation[0]);
      if(dir==='south')assert.equal(images[0].Scale[0],actor.scaleX*item.scale,'south baseline size unchanged');
      count++;
    }
    assert.ok(scales.every(x=>x===scales[0]),`${id}/${dir} never scales on attack`);
    if(action!=='attack-dagger')for(const i of [0,7]) {
      const delta=rotations.get(`${action}:${i}`)-rotations.get('idle:0');
      assert.ok(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<1e-10,`${id}/${dir} starts/ends at carry rotation`);
    }
  }
}
layers.sync(actor,{},'south',undefined,128);
assert.ok(images.every(i=>!i.Visible[0]),'unequip clears all attachments');
// Swap an off-hand-bearing weapon for a one-hand item: no stale shield/second blade survives.
const syncWeapon=id=>{
  const item=EQUIPMENT_VISUALS[id],action=weaponAttackAction(id,!!item.bolt);
  layers.sync(actor,{weapon:id},'east',v3WeaponFrame(scene,'v3:idle:east',item.bolt?'bolt':item.swing?'swing':'rest',action),128);
};
for(const offhandId of ['axe-juggernaut','keris']) {
  syncWeapon(offhandId); assert.equal(images[1].Visible[0],true);
  syncWeapon('staff-achan'); assert.equal(images[1].Visible[0],false,'weapon swap clears previous off-hand image');
}
const exists=scene.textures.exists;
scene.textures.exists=()=>false;
syncWeapon('axe-juggernaut');
assert.ok(images.every(i=>!i.Visible[0]),'missing equipment textures fail closed instead of keeping old attachments');
scene.textures.exists=exists;
actor.visible=false;syncWeapon('axe-juggernaut');
assert.ok(images.every(i=>!i.Visible[0]),'hidden body cannot leave floating equipment');
actor.visible=true;
// Preserve the real legacy rig's main-hand behavior. This is not female V3/off-hand visual certification.
const legacy=JSON.parse(await readFile(new URL('../public/assets/rig-v2/manifest.json',import.meta.url)));
let legacyFrames=0;
for(const data of Object.values(legacy.bodies))for(const directions of Object.values(data.layers))for(const [dir,frames] of Object.entries(directions))for(const frame of frames) {
  layers.sync(actor,{weapon:'axe-juggernaut'},dir,frame,legacy.frame);
  assert.equal(images[0].Scale[0],actor.scaleX*EQUIPMENT_VISUALS['axe-juggernaut'].scale,'carry multipliers do not alter legacy scale');
  assert.equal(images[0].Depth[0]>actor.depth,frame.front,'legacy layer table remains authoritative');
  assert.deepEqual(images[0].Position,[actor.x-64*.75+frame.grip[0]*.75,actor.y-128*.75+frame.grip[1]*.75]);
  legacyFrames++;
}
assert.ok(behind>0,'directional equipment still renders behind the body');
const {withLegacyOffhand}=await import(offhandReviewUrl);
const candidate=JSON.parse(await readFile(new URL('../public/assets/rig-v2/candidates/female-offhand-01.json',import.meta.url)));
const baseline=legacy.bodies.female.layers.idle.south[0];
const original=JSON.stringify(baseline);
for(let i=0;i<4;i++){
  const reviewed=withLegacyOffhand(baseline,candidate,'female','idle','south',i);
  assert.deepEqual(reviewed.off.grip,candidate.frames.idle.south[i].grip);
  layers.sync(actor,{weapon:'axe-juggernaut'},'south',reviewed,128);
  assert.equal(images[1].Visible[0],true,'measured draft exposes shield');
}
assert.equal(JSON.stringify(baseline),original,'draft does not mutate production frame');
for(const [body,action,dir,index] of [['male','idle','south',0],['female','walk','south',0],['female','idle','north',0],['female','idle','south',4]])
  assert.equal(withLegacyOffhand(baseline,candidate,body,action,dir,index),baseline,'unmeasured draft entries preserve baseline');
assert.equal(withLegacyOffhand(baseline,{...candidate,frames:null},'female','idle','south',0),baseline);
console.log('female draft: four measured south idle grips, shield visibility, immutable baseline and missing-entry isolation passed');
assert.equal(carryScale('future-category','east'),1);
assert.ok(Math.abs(carryRotation(3.1,-3.1,.5)-Math.PI)<.001,'angle blending takes shortest arc');
console.log(`carry renderer: ${count} real weapon/facing/pose frames; exact grips, south baseline, stable scales, assets, back layers and unequip passed`);
console.log(`carry regressions: off-hand swaps, missing textures, hidden body and ${legacyFrames} real legacy main-hand frames passed; female off-hand support remains a separate review item`);
