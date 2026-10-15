import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{MAPS,MONSTERS,newProfile}from'../../../packages/shared/dist/index.js';
import{FOLKLORE_BINDINGS}from'../../../packages/shared/dist/folklore-releases.js';
import{GameState,PlayerState}from'../../../packages/schema/dist/index.js';
import{CombatSystem}from'../../../apps/server/dist/rooms/combat-system.js';
import{withFolkloreResidents}from'../../../packages/shared/dist/maps/folklore-live.js';
const config=JSON.parse(await readFile('docs/design/monsters/folklore-01/encounter-04.json'));
const roster=JSON.parse(await readFile('docs/design/monsters/folklore-01/roster.json'));
let live=0,planned=0,ranged=0;
for(const[id,e]of Object.entries(config.monsters)){
 assert.equal(e.nation,roster.monsters.find(m=>m.id===id).nation);
 for(const l of e.locations){assert.equal(config.mapNations[l.mapId],e.nation,'home nation '+id);if(l.status==='live'){assert(MAPS[l.mapId]);assert(FOLKLORE_BINDINGS[l.mapId].some(b=>b.kind===id&&b.campIndex===l.campIndex));assert(MAPS[l.mapId].spawnRegions[l.campIndex].monsters.some(m=>m.kind===id));}else{assert(!MAPS[l.mapId],'planned habitat must not masquerade as live');}}
 if(e.locations.some(l=>l.status==='live'))live++;else planned++;
 const def=MONSTERS[id];assert.equal(def.attackRange,e.range);
 if(e.role==='melee'){assert(!def.projectile);assert(e.range<=1.8);continue;}
 ranged++;assert(def.projectile.speed>0);assert.equal(def.projectile.motif,e.projectile.motif);assert(e.attack.nameTh&&e.attack.basisTh&&e.attack.adaptation);assert(def.projectile.originHeight>0&&def.projectile.originHeight<1);assert.equal(def.projectile.family,e.projectile.family);assert(e.range>2);assert(def.aggroRange>=def.attackRange);
 for(const outcome of ['hit','dodge','out-of-range']){const dodge=outcome==='dodge';
  let now=10000;const events=[],map={id:'orb-qa',width:30,height:30,spawn:{x:2,y:2},ground:{base:'grass',regions:[]},objects:[],blockers:[],spawnRegions:[{id:'fixture',area:{x:7,y:7,w:6,h:6},monsters:[{kind:id,count:1}]}]};
  const state=new GameState(),player=new PlayerState();const distance=outcome==='out-of-range'?e.range*1.25+.2:e.range;player.x=10+distance;player.y=10;state.players.set('target',player);let profile=newProfile(map.spawn);Object.assign(profile,{hp:100000,hpMax:100000,level:99});
  const combat=new CombatSystem({map,state,now:()=>now,rng:()=>.5,profile:()=>profile,setProfile:(_id,p)=>{profile=p;},vitals:()=>{},broadcast:e=>events.push({...e,time:now})});
  const m=[...combat.monsters.values()][0];Object.assign(m,{x:10,y:10,home:{x:10,y:10},state:'attack',targetId:'target',lastAttackAt:0,swingAt:0});
  combat.step(1);if(outcome==='out-of-range'){assert(!events.some(e=>e.type==='swing'||e.type==='projectile'||e.type==='damage'),'range limit '+id);continue;}assert(events.some(e=>e.type==='swing'));assert(!events.some(e=>e.type==='projectile'));
  now+=def.attackWindupMs-1;combat.step(1);assert(!events.some(e=>e.type==='projectile'),'no early release '+id);
  now++;combat.step(1);const shot=events.find(e=>e.type==='projectile');assert(shot,'ranged launch '+id);assert.deepEqual(shot.origin,{x:10,y:10});assert.deepEqual(shot.aim,{x:10+distance,y:10});assert.equal(shot.flightMs,Math.round(distance/def.projectile.speed*1000));assert(!events.some(e=>e.type==='damage'));
  if(dodge)player.x+=2;
  now=shot.time+shot.flightMs-1;combat.step(1);assert(!events.some(e=>e.type==='damage'),'no early impact '+id);
  now++;combat.step(1);assert.equal(events.some(e=>e.type==='damage'&&e.source===m.id),!dodge,'arrival/dodge '+id);assert.deepEqual(shot.aim,{x:10+distance,y:10},'snapshot never follows dodger');
 }
}
assert.equal(new Set(Object.values(config.monsters).filter(e=>e.role==='ranged').map(e=>e.range)).size,17,'distinct authored ranges');
assert.equal(live,34);assert.equal(planned,6);assert.equal(ranged,17);
const guards=FOLKLORE_BINDINGS['lantern-paddy'];guards.push({kind:'gumiho',campIndex:0,count:1});try{assert.throws(()=>withFolkloreResidents(MAPS['lantern-paddy']),/Cross-nation/);}finally{guards.pop();}
console.log('PASS40 country habitats;34 live /6 honestly planned;17 ranged release/arrival/dodge contracts and23 melee roles');
