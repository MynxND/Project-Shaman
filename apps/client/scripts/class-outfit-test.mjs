import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createHash } from 'node:crypto';
const data=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const source=async name=>ts.transpileModule(await readFile(new URL(`../src/game/characters/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const shared=new URL('../../../packages/shared/dist/index.js',import.meta.url).href;
const {parseClassOutfits,selectClassOutfit,outfitTexture,outfitLayerFrame,classOutfitManifestUrl}=await import(data((await source('class-outfit')).replace(/from '@shaman\/shared'/g,`from '${shared}'`)));
const standard='/assets/character-v3/class-outfits/manifest.json';
assert.equal(classOutfitManifestUrl(false,'?carryReview=1&outfitDraft=1'),standard,'production never loads draft art');
assert.equal(classOutfitManifestUrl(true,'?outfitDraft=1'),standard,'a normal gameplay session never loads draft art');
assert.equal(classOutfitManifestUrl(true,'?carryReview=1'),standard,'baseline review remains original');
assert.equal(classOutfitManifestUrl(true,'?carryReview=1&outfitDraft=1'),'/assets/character-v3/class-outfits/manifest-imagegen-draft.json');
assert.equal(classOutfitManifestUrl(true,'?carryReview=1&outfitDraft=1&outfitBaked=1'),'/assets/character-v3/class-outfits/manifest-imagegen-armed-draft.json');
assert.equal(classOutfitManifestUrl(true,'?carryReview=1&outfitDraft=1&outfitBaked=1&outfitDetail=1'),'/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json');
assert.equal(classOutfitManifestUrl(false,'?carryReview=1&outfitDraft=1&outfitBaked=1&outfitDetail=1'),standard);
assert.equal(classOutfitManifestUrl(true,'?outfitDraft=1&outfitBaked=1&outfitDetail=1'),standard);
assert.equal(classOutfitManifestUrl(false,'?carryReview=1&outfitDraft=1&outfitBaked=1'),standard);
const {FACINGS,BRANCH_WEAPONS}=await import(shared);
const root=new URL('../public/',import.meta.url);
const raw=JSON.parse(await readFile(new URL('./assets/character-v3/class-outfits/manifest.json',root),'utf8'));
const m=parseClassOutfits(raw);assert.equal(m.outfits.length,2,'both outfits must publish together');
const textures=new Set();let count=0;
for(const o of m.outfits)for(const f of FACINGS)for(const a of ['idle','walk','attack','cast']){
 const frames=a==='idle'?[o.directions[f].idle]:o.directions[f][a];
 for(const [i,p]of frames.entries()){
  const b=await readFile(new URL(`.${p.url}`,root));assert.equal(b.readUInt32BE(16),128);assert.equal(b.readUInt32BE(20),128);
  assert.equal(createHash('sha256').update(b).digest('hex'),p.sha256);
  assert.ok(p.hands,'own contact overlay replaces novice cuffs');await readFile(new URL(`.${p.hands}`,root));
  textures.add(outfitTexture(o.id,a==='attack'?o.attackAction:a,f,a==='idle'?undefined:i));count++;
 }
}
const scene={cache:{json:{get:()=>m}},textures:{exists:k=>textures.has(k)}};
assert.equal(selectClassOutfit(scene,'santet','wand-santet'),null,'other nations retain their existing renderer');
for(const o of m.outfits){
 const weapon=BRANCH_WEAPONS[o.branch];assert.equal(selectClassOutfit(scene,o.branch,weapon)?.id,o.id);
 assert.equal(selectClassOutfit(scene,o.branch,'bow-ullr'),null,'unsupported swap has a complete original-rig fallback');
 const key=outfitTexture(o.id,'walk','south',0);textures.delete(key);
 assert.equal(selectClassOutfit(scene,o.branch,weapon),null,'one missing motion texture disables the entire set');textures.add(key);
 const base={view:'south',grip:[20,60],tip:[20,48],front:true,crown:[0,0],tilt:0,carry:1};
 const frame=outfitLayerFrame(scene,outfitTexture(o.id,'idle','south'),base);
 assert.deepEqual(frame.grip,[o.directions.south.idle.main.x,o.directions.south.idle.main.y]);
 assert.equal(base.grip[0],20,'per-actor composition never mutates shared base anchors');
 assert.equal(frame.outwardAxe,o.id==='juggernaut');
 const broken=structuredClone(raw);broken.outfits[0].directions.north.cast.pop();assert.throws(()=>parseClassOutfits(broken));
 assert.equal(selectClassOutfit({...scene,cache:{json:{get:()=>broken}}},o.branch,weapon),null,'malformed optional cosmetics cannot crash the original rig');
}
const user=JSON.parse(await readFile(new URL('../../../docs/design/equipment/class-2-eight-01/user-head-offsets.json',import.meta.url),'utf8'));
const armed=structuredClone(raw);
const armedOutfit=armed.outfits[0],armedWeapon=BRANCH_WEAPONS[armedOutfit.branch];
for(const f of FACINGS){const d=armedOutfit.directions[f];for(const p of [d.idle,...d.walk,...d.attack,...d.cast])p.bakedWeapon=armedWeapon;}
parseClassOutfits(armed);
const armedScene={...scene,cache:{json:{get:()=>armed}}};
assert.equal(selectClassOutfit(armedScene,armedOutfit.branch,undefined),null,'unequip must not leave a baked weapon visible');
assert.equal(selectClassOutfit(armedScene,armedOutfit.branch,'bow-ullr'),null,'weapon swaps restore a complete compatible rig');
assert.equal(selectClassOutfit(armedScene,armedOutfit.branch,armedWeapon)?.id,armedOutfit.id);
for(const action of ['idle','walk','attack','cast'])assert.equal(outfitLayerFrame(armedScene,outfitTexture(armedOutfit.id,action==='attack'?armedOutfit.attackAction:action,'south',action==='idle'?undefined:0),{view:'south',grip:[20,60],tip:[20,48],front:true,crown:[0,0],tilt:0}),undefined,'baked frame suppresses separate main/off-hand layers');
armedOutfit.directions.south.idle.bakedWeapon='bow-ullr';assert.throws(()=>parseClassOutfits(armed),'baked item must match the registered branch weapon');
for(const p of user.offsets)assert.deepEqual(m.outfits.find(o=>o.id==='juggernaut').directions[p.direction].headOffset,{x:p.x,y:p.y});
assert.equal(count,400);
console.log('Class outfit publication:400 native/hash-checked frames, complete-set fallback, independent grip data, exact Russian user head offsets passed');

// Execute the actual puppet. Stub Phaser/SSR drawing only; no copied action-selection or head-placement logic.
const classUrl=data((await source('class-outfit')).replace(/from '@shaman\/shared'/g,`from '${shared}'`));
const ssrUrl=data('export const draws=[]; export const preloadSsr=()=>{}; export const ssrAssets=()=>null; export class SsrHead {supports(){return true} draw(...args){draws.push(args)} hide(){} destroy(){}}');
const stubUrl=data('export default {Textures:{FilterMode:{NEAREST:0}}}');
const modelUrl=data('export const parseHeadLayers=x=>x,parseBodyEight=x=>x,parseActionEight=x=>x,parseWalkEight=x=>x;export const WEAPON_ACTIONS=[];');
const puppetCode=(await source('V3Puppet')).replace(/from 'phaser'/g,`from '${stubUrl}'`).replace(/from '@shaman\/shared'/g,`from '${shared}'`).replace(/from '.\/SsrHead'/g,`from '${ssrUrl}'`).replace(/from '.\/class-outfit'/g,`from '${classUrl}'`).replace(/from '.\/(head-layers-model|body-eight-model|walk-eight-model)'/g,`from '${modelUrl}'`);
const {V3Puppet}=await import(data(puppetCode)),{draws}=await import(ssrUrl);
const read=async p=>JSON.parse(await readFile(new URL(`./assets/character-v3/${p}`,root),'utf8'));
const body=await read('body-eight-02/manifest.json'),walk=await read('walk-eight-02/manifest.json'),attack=await read('actions-eight-02/attack/manifest.json'),cast=await read('actions-eight-02/cast/manifest.json');
const sets={body,walk,attack,cast,layers:null,ssr:{},'attack-cast-staff':await read('actions-eight-02/attack-cast-staff/manifest.json'),'attack-axe-shield':await read('actions-eight-02/attack-axe-shield/manifest.json')};
const animations=new Map(),image=()=>{const v={destroy(){}};for(const k of ['setVisible','setTexture','setOrigin','setPosition','setScale','setDepth','setAlpha','setTint'])v[k]=()=>v;return v;};
const fakeScene={...scene,time:{now:0},textures:{...scene.textures,get:()=>({setFilter(){}})},add:{image},anims:{exists:k=>animations.has(k),create:a=>animations.set(a.key,a)}};
let headChecks=0;
for(const o of m.outfits){
 const puppet=new V3Puppet(fakeScene,sets);puppet.setClassOutfit(fakeScene,o);
 const sprite={scene:fakeScene,texture:{key:''},frame:{width:128,height:128},anims:{isPlaying:false,currentAnim:null,currentFrame:null,getProgress:()=>0,setProgress(){}},stop(){this.anims.isPlaying=false;return this;},setTexture(key){this.texture.key=key;return this;},setFlipX(){return this;},setOrigin(x,y){this.originX=x;this.originY=y;return this;},play(key){this.anims.isPlaying=true;this.anims.currentAnim={key};this.anims.currentFrame={index:1};this.texture.key=animations.get(key).frames[0].key;return this;}};
 for(const f of FACINGS){
  const original=body.frames.find(d=>d.direction===f),d=o.directions[f];
  const check=p=>{puppet.sync(sprite,f);const args=draws.at(-1),shift=args[7];assert.equal(args[1],'idle','same SSR identity; costume neck drives motion');assert.ok(Math.abs(shift.x-(p.neck.x-original.neckPivot.x+d.headOffset.x-(original.neckPivot.x-original.headPivot.x)))<1e-9);assert.ok(Math.abs(shift.y-(p.neck.y-original.neckPivot.y+d.headOffset.y-(original.neckPivot.y-original.headPivot.y)))<1e-9);headChecks++;};
  puppet.show(sprite,f,null);assert.equal(sprite.texture.key,outfitTexture(o.id,'idle',f));check(d.idle);
  puppet.show(sprite,f,'walk');for(let i=0;i<8;i++){sprite.anims.currentFrame.index=i+1;sprite.texture.key=outfitTexture(o.id,'walk',f,i);check(d.walk[i]);}
  for(let i=0;i<8;i++){puppet.showAttackFrame(sprite,f,i);assert.equal(sprite.texture.key,outfitTexture(o.id,o.attackAction,f,i));check(d.attack[i]);}
  for(let i=0;i<12;i++){puppet.showCast(sprite,f,i);const index=Math.round(i*7/11);assert.equal(sprite.texture.key,outfitTexture(o.id,'cast',f,index));check(d.cast[index]);}
 }
 puppet.setClassOutfit(fakeScene,null);puppet.show(sprite,'south',null);assert.equal(sprite.texture.key,'v3:idle:south');puppet.destroy();
}
console.log(`Actual V3 puppet: ${headChecks} idle/walk/attack/cast head attachments and12-step cast sampling passed; original-rig fallback restored`);

