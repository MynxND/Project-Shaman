import assert from 'node:assert/strict';
import {GameState,PlayerState} from '../../packages/schema/dist/index.js';
import {getMap,newProfile} from '../../packages/shared/dist/index.js';
import {CombatSystem} from '../../apps/server/dist/rooms/combat-system.js';
function fixture(){let now=1000;const state=new GameState(),profiles=new Map(),events=[],map=getMap('mount-oe-fortress');const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(){},broadcast:e=>events.push(e),reduceCooldown(){}};
 const combat=new CombatSystem(host),e=combat.shuten,p=new PlayerState();p.x=24;p.y=24;p.hp=p.hpMax=100000;state.players.set('p',p);const profile=newProfile(map.spawn);profile.hp=profile.hpMax=100000;profiles.set('p',profile);
 e.review('p',{action:'prepare'});p.hp=p.hpMax=100000;profiles.get('p').hp=profiles.get('p').hpMax=100000;
 const step=()=>{now+=50;combat.step(50);},run=ms=>{for(let i=0;i<ms;i+=50)step();};e.review('p',{action:'phase',phase:3});run(3300);return {state,combat,e,p,events,step,run,now:()=>now};}
{
 const f=fixture();f.e.review('p',{action:'ai'});let overlapping=false;
 for(let i=0;i<10000;i+=50){f.step();const active=[...f.e.state.hazards.values()].filter(h=>f.now()>=h.startsAt&&f.now()<=h.endsAt);if(active.some(h=>h.actor==='head')&&active.some(h=>h.actor==='body'))overlapping=true;}
 assert(overlapping,'normal production AI coordinates independent head/body damaging windows');
}
{
 const f=fixture();const before=f.e.body.hp;f.e.review('p',{action:'skill',skill:'wrath-severed-king'});f.run(8300);assert.equal(f.e.body.hp,before,'full phase-3 health must never lose 1HP from a healing rejoin');assert(f.e.state.rejoinedUntil>f.now());
}
{
 const f=fixture();f.e.body.hp=3000;f.e.review('p',{action:'skill',skill:'wrath-severed-king'});f.run(8300);assert.equal(f.e.body.hp,4120,'intended 1120HP heal unchanged');
}
{
 const f=fixture();f.e.review('p',{action:'skill',skill:'mount-oe-cataclysm'});f.run(1250);f.combat.damageMonster(f.e.body,999999,'p');f.step();const at=f.e.state.actionAt;
 assert.equal(f.e.state.mode,'dead');assert.equal(at,f.now(),'death timestamp is authoritative');assert.equal(f.e.state.hazards.size,0);f.run(2000);assert.equal(f.e.state.actionAt,at,'late joins must not restart death time');assert.equal(f.e.state.hp,0);assert([...f.state.monsters.values()].filter(m=>['shuten-head','shuten-altar','shuten-drum','oe-elite-oni'].includes(m.kind)).every(m=>m.state==='dead'));
}
console.log('PASS coordinated normal AI, capped healing without HP loss, intended heal amount, authoritative death timestamp and cleanup');
