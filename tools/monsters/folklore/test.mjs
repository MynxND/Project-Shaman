import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{execFileSync}from'node:child_process';
import{transpileModule,ModuleKind,ScriptTarget}from'typescript';
import{MAPS,MONSTERS,createMonster,stepMonster,isBehindMonster,pickSpawnPoint}from'../../../packages/shared/dist/index.js';
import{FOLKLORE_BINDINGS,FOLKLORE_RESIDENTS}from'../../../packages/shared/dist/folklore-releases.js';
const source=await readFile('apps/client/src/game/world/monster-sprite-model.ts','utf8'),js=transpileModule(source,{compilerOptions:{module:ModuleKind.ESNext,target:ScriptTarget.ES2022}}).outputText.replace("from '@shaman/shared'","from '"+new URL('../../../packages/shared/dist/index.js',import.meta.url).href+"'");
const model=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const manifest=JSON.parse(await readFile('apps/client/public/assets/monsters/manifest.json')),roster=JSON.parse(await readFile('docs/design/monsters/folklore-01/roster.json'));
assert.equal(Object.keys(FOLKLORE_RESIDENTS).length,40);
for(const m of roster.monsters){const s=manifest.monsters[m.id];model.validateMonsterSheet(s,160);assert.equal(new Set(roster.directions.map(f=>model.monsterAnimationKey(m.id,'move',s,f))).size,8);const broken=structuredClone(s);delete broken.directions.north;assert.throws(()=>model.validateMonsterSheet(broken));if(m.nation==='korea')assert(!Object.values(FOLKLORE_BINDINGS).flat().some(b=>b.kind===m.id));}
// Original map fields and resident ordering are unchanged by the derived camp adapter.
let bound=0;for(const[id,bindings]of Object.entries(FOLKLORE_BINDINGS)){const map=MAPS[id];assert(map,id);for(const b of bindings){const region=map.spawnRegions[b.campIndex];assert(region,id);assert(region.monsters.some(m=>m.kind===b.kind&&m.count===b.count));let seed=1234567;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);assert(pickSpawnPoint(map,region,rng,1000),id+' walkable spawn');bound++;}}
const oldManifest=JSON.parse(execFileSync('git',['show','HEAD:apps/client/public/assets/monsters/manifest.json'],{encoding:'utf8'}));for(const[k,v]of Object.entries(oldManifest.monsters).filter(([k])=>!FOLKLORE_RESIDENTS[k]))assert.deepEqual(manifest.monsters[k],v,'legacy art '+k);
const map={id:'qa',width:30,height:30,spawn:{x:15,y:15},ground:{base:'grass',regions:[]},objects:[],blockers:[],spawnRegions:[{id:'camp',area:{x:5,y:5,w:20,h:20},monsters:[]}]},region=map.spawnRegions[0];
for(const[face,dx,dy]of[['south',0,1],['south-west',-1,1],['west',-1,0],['north-west',-1,-1],['north',0,-1],['north-east',1,-1],['east',1,0],['south-east',1,1]]){const m=createMonster('qa','phi-pop',region,{x:15,y:15},0);m.state='wander';m.goal={x:15+dx*.01,y:15+dy*.01};stepMonster(m,[],1000,1000,map,()=>.5);assert.equal(m.facing,face,'short arrival '+face);m.state='attack';m.targetId='target';const events=stepMonster(m,[{id:'target',x:m.x+dx*.5,y:m.y+dy*.5,alive:true}],50,10000,map,()=>.5);assert.equal(m.facing,face);assert(events.some(e=>e.type==='swing'));assert(isBehindMonster({x:m.x-dx,y:m.y-dy},m));assert(!isBehindMonster({x:m.x+dx,y:m.y+dy},m));}
console.log('PASS40 directional manifests, legacy art unchanged, '+bound+' authored camp assignments, eight-way movement/attack/rear checks');

// A visual hover/hop must never leak into attack range or ground selection.
for(const s of Object.values(manifest.monsters)){
 for(const a of ['attack','hurt','death'])for(let k=0;k<4;k++)assert.equal(model.monsterMotionOffset(s,a,k,4),0);
 if(s.motionProfile){for(let k=0;k<4;k++){assert(Number.isInteger(model.monsterMotionOffset(s,'move',k,4)));assert.equal(model.monsterMotionOffset(s,'move',k,4),model.monsterMotionOffset(s,'move',k+4,4));}}
}
for(const[id,s]of Object.entries(manifest.monsters).filter(([id])=>FOLKLORE_RESIDENTS[id]))assert.equal(Math.round(model.monsterImpactFrame(s,s.animations.attack)*1000/s.animations.attack.fps),MONSTERS[id].attackWindupMs,'review/server launch timing '+id);
const layerSource=await readFile('apps/client/src/game/world/MonsterLayer.ts','utf8');
const layerJs=transpileModule(layerSource,{compilerOptions:{module:ModuleKind.ESNext,target:ScriptTarget.ES2022}}).outputText
 .replace(/import Phaser from 'phaser';/, 'const Phaser={};')
 .replace(/import \{ MonsterArtVfxLayer, preloadMonsterArtVfx \} from '\.\/MonsterArtVfxLayer';/, 'class MonsterArtVfxLayer{update(){}destroy(){}}')
 .replace(/import \{ MonsterOrbLayer \} from '\.\/MonsterOrbLayer';/, 'class MonsterOrbLayer{update(){}destroy(){}}')
 .replace(/from '\.\/monster-sprite-model'/, 'from '+JSON.stringify('data:text/javascript;base64,'+Buffer.from(js).toString('base64')))
 .replace(/from '@shaman\/shared'/g,'from '+JSON.stringify(new URL('../../../packages/shared/dist/index.js',import.meta.url).href))
 .replace(/import \{ addContactShadow, DARKNESS_DEPTH \} from '\.\/Lighting';/, 'const DARKNESS_DEPTH=0;');
const {MonsterLayer}=await import('data:text/javascript;base64,'+Buffer.from(layerJs).toString('base64'));
const layer=new MonsterLayer({cache:{json:{get:()=>({monsters:{}})}}},{});
layer.views.set('floating',{sprite:{x:64,y:148},groundY:128,dead:false});
const {WORLD_UNIT_PX}=await import('../../../packages/shared/dist/index.js');
assert.deepEqual(layer.position('floating'),{x:64/WORLD_UNIT_PX,y:128/WORLD_UNIT_PX});
assert.equal(layer.nearest({x:64/WORLD_UNIT_PX,y:128/WORLD_UNIT_PX},.01),'floating');
console.log('PASS cosmetic motion repeats without moving target/range ground coordinates');

const irelandKinds=roster.monsters.filter(m=>m.nation==='ireland');assert.equal(irelandKinds.length,6);for(const m of irelandKinds){assert(m.mapIds.length);for(const id of m.mapIds)assert(FOLKLORE_BINDINGS[id]?.some(b=>b.kind===m.id));}assert(!roster.monsters.some(m=>m.nation==='iceland'));

const audit=JSON.parse(await readFile('docs/design/monsters/folklore-01/audit-02/report.json'));for(const id of Object.keys(audit.sequenceRepairs)){const s=manifest.monsters[id];for(const face of roster.directions){const clip=s.directions[face].attack;assert.equal(clip.frames,4);if(!s.repairedActions?.includes('attack'))assert.equal(clip.indices.at(-1),s.directions[face].idle.indices[0]);}assert.equal(MONSTERS[id].attackWindupMs,Math.round(s.attackImpactFrame*1000/s.directions.south.attack.fps));}

for(const id of [...Object.keys(audit.sequenceRepairs),'phi-krasue']){const m=createMonster('impact',id,region,{x:15,y:15},0);m.state='attack';m.targetId='target';const target=[{id:'target',x:15.4,y:15,alive:true}];stepMonster(m,target,16,10000,map,()=>.5);const at=m.swingAt;assert.equal(at,10000+MONSTERS[id].attackWindupMs);assert(!stepMonster(m,target,16,at-1,map,()=>.5).some(e=>e.type==='hit'));assert(stepMonster(m,target,16,at,map,()=>.5).some(e=>e.type==='hit'));}console.log('PASS all10 repaired attack impact deadlines; no early server hit');
