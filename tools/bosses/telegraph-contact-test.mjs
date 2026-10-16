import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {dreamHit,koscheiHit,getMap,newProfile} from '../../packages/shared/dist/index.js';
import {GameState,PlayerState} from '../../packages/schema/dist/index.js';
import {CombatSystem} from '../../apps/server/dist/rooms/combat-system.js';
import {MaiyarapEncounterState,KoscheiEncounterState} from '../../packages/schema/dist/index.js';
const ts=createRequire(import.meta.url)('typescript'),ctx={exports:{},Math,Number};
vm.runInNewContext(ts.transpileModule(readFileSync('apps/client/src/game/vfx/boss/boss-contact-footprint.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);
const {sweptRingRadii}=ctx.exports;let checks=0;
for(const hit of[dreamHit,koscheiHit])for(const step of[16,1000/30,50,100,250])for(const duration of[350,500,900])for(const elapsed of[0,50,150,300,500,900]){
 const h={shape:'ring',x:24,y:24,toX:24,toY:24,radius:12,width:.6,angle:0,arc:0,startsAt:1000,endsAt:1000+duration};
 const now=Math.min(h.endsAt,1000+elapsed),band=sweptRingRadii(h,now,1.2,.28,step);
 for(const d of[0,Math.max(0,band.inner-.001),band.inner+.001,(band.inner+band.outer)/2,band.outer-.001,band.outer+.001,14]){
  assert.equal(hit(h,{x:24+d,y:24},now,now-step),d>=band.inner&&d<=band.outer);checks++;
 }
}
for(const State of[MaiyarapEncounterState,KoscheiEncounterState])assert.equal(new State().contactStep,1000/30);
assert(Math.abs(sweptRingRadii({radius:12,width:.6,startsAt:1000,endsAt:1900},1600,1.2,.28,50).inner-6.92)<1e-9);
for(const [boss,mapId]of[['koschei','frozen-necropolis'],['maiyarap','maiyarap-palace']]){
 let now=1000;const state=new GameState(),map=getMap(mapId),profiles=new Map([['p',newProfile(map.spawn)]]),player=new PlayerState();player.x=24;player.y=30;state.players.set('p',player);
 const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(){},broadcast(){},reduceCooldown(){}};
 const combat=new CombatSystem(host);combat[boss].review('p',{action:'prepare'});
 // Prime the snapshot clock before varying the subsequent authoritative steps.
 combat.step(0);
 for(const dt of[16,33,50,100,250]){now+=dt;combat.step(dt);assert.equal(combat[boss].state.contactStep,dt);checks++;}
}
console.log(`PASS ${checks+3} swept-annulus boundary checks; two boss policies, variable16–250ms steps, no filled safe center`);
