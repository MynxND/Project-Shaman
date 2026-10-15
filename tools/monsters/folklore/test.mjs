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
for(const m of roster.monsters){const s=manifest.monsters[m.id];model.validateMonsterSheet(s,160);assert.equal(new Set(roster.directions.map(f=>model.monsterAnimationKey(m.id,'move',s,f))).size,8);const broken=structuredClone(s);delete broken.directions.north;assert.throws(()=>model.validateMonsterSheet(broken));if(['korea','iceland'].includes(m.nation))assert(!Object.values(FOLKLORE_BINDINGS).flat().some(b=>b.kind===m.id));}
// Original map fields and resident ordering are unchanged by the derived camp adapter.
let bound=0;for(const[id,bindings]of Object.entries(FOLKLORE_BINDINGS)){const map=MAPS[id];assert(map,id);for(const b of bindings){const region=map.spawnRegions[b.campIndex];assert(region,id);assert(region.monsters.some(m=>m.kind===b.kind&&m.count===b.count));let seed=1234567;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);assert(pickSpawnPoint(map,region,rng,1000),id+' walkable spawn');bound++;}}
const oldManifest=JSON.parse(execFileSync('git',['show','HEAD:apps/client/public/assets/monsters/manifest.json'],{encoding:'utf8'}));for(const[k,v]of Object.entries(oldManifest.monsters))assert.deepEqual(manifest.monsters[k],v,'legacy art '+k);
const map={id:'qa',width:30,height:30,spawn:{x:15,y:15},ground:{base:'grass',regions:[]},objects:[],blockers:[],spawnRegions:[{id:'camp',area:{x:5,y:5,w:20,h:20},monsters:[]}]},region=map.spawnRegions[0];
for(const[face,dx,dy]of[['south',0,1],['south-west',-1,1],['west',-1,0],['north-west',-1,-1],['north',0,-1],['north-east',1,-1],['east',1,0],['south-east',1,1]]){const m=createMonster('qa','phi-pop',region,{x:15,y:15},0);m.state='wander';m.goal={x:15+dx*.01,y:15+dy*.01};stepMonster(m,[],1000,1000,map,()=>.5);assert.equal(m.facing,face,'short arrival '+face);m.state='attack';m.targetId='target';const events=stepMonster(m,[{id:'target',x:m.x+dx*.5,y:m.y+dy*.5,alive:true}],50,10000,map,()=>.5);assert.equal(m.facing,face);assert(events.some(e=>e.type==='swing'));assert(isBehindMonster({x:m.x-dx,y:m.y-dy},m));assert(!isBehindMonster({x:m.x+dx,y:m.y+dy},m));}
console.log('PASS40 directional manifests, legacy art unchanged, '+bound+' authored camp assignments, eight-way movement/attack/rear checks');
