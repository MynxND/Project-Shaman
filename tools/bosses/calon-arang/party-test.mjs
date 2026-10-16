import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GameState,PlayerState,CalonInfectionState} from '../../../packages/schema/dist/index.js';
import {getMap,newProfile,CALON_WELLS,CALON_SOURCE,CALON_HP} from '../../../packages/shared/dist/index.js';
import {CombatSystem} from '../../../apps/server/dist/rooms/combat-system.js';
let checks=0;const check=(v,label)=>{assert(v,label);checks++;};
export function fixture(count=3,manual=true){let now=1000;const state=new GameState(),profiles=new Map(),map=getMap('girah-ruined-temple'),events=[];
 const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(){},broadcast:e=>events.push(e),reduceCooldown(){}};
 const combat=new CombatSystem(host);
 for(let i=0;i<count;i++){const p=new PlayerState();Object.assign(p,i<2?CALON_WELLS[i]:CALON_SOURCE);p.dead=false;state.players.set('p'+i,p);const profile=newProfile(map.spawn);profile.hp=profile.hpMax=100000;profiles.set('p'+i,profile);}
 const e=combat.calon;if(manual)e.review('p2',{action:'prepare'});
 if(count>=3)Object.assign(state.players.get('p2'),CALON_SOURCE);
 const step=(ms=50)=>{now+=ms;combat.step(ms);},run=ms=>{for(let i=0;i<ms;i+=50)step();};
 const cut=()=>{for(const n of e.state.connections.values()){const m=combat.monsters.get(n.monsterId);m.hp=0;m.state='dead';e.objectDied(m);}};
 return{e,state,profiles,step,run,cut,now:()=>now,combat};
}
for(const count of[1,2,3,4,5]){const f=fixture(count,false);f.step();check(count<3?f.e.state.mode==='dormant':f.e.state.mode!=='dormant','minimum party '+count);if(count>=3){check(f.e.state.hpMax===CALON_HP*(1+(count-3)*.25),'party HP '+count);f.state.players.delete('p0');f.step();check(f.e.state.hpMax===CALON_HP*(1+(count-3)*.25),'frozen HP '+count);}}
for(const fault of['missing-west','same-player','infected-west','infected-purifier','dead-east','blocked-west','leave-midchannel']){
 const f=fixture();f.cut();const p=id=>f.state.players.get(id);
 if(fault==='missing-west')p('p0').x=24;
 if(fault==='same-player'){p('p1').x=12;p('p1').y=33;}
 if(fault==='infected-west'||fault==='infected-purifier'){const n=new CalonInfectionState();n.stacks=1;n.until=f.now()+10000;f.e.state.infections.set(fault==='infected-west'?'p0':'p2',n);}
 if(fault==='dead-east')p('p1').dead=true;
 if(fault==='blocked-west')f.e.state.wells.get('west').blockedUntil=f.now()+10000;
 const accepted=f.e.interact('p2','purify');if(fault==='leave-midchannel'){check(accepted,'valid start');f.run(1000);p('p0').x=20;f.run(1500);check(f.e.state.purifyProgress===0&&!f.e.state.exposedUntil,'keeper departure resets');}else check(!accepted,'reject '+fault);
}
{const f=fixture();f.cut();check(f.e.interact('p2','purify'),'three roles accepted');f.run(2450);check(f.e.state.exposedUntil>f.now(),'team opens exposure');check(f.e.state.mode==='stagger','team stagger');f.run(12100);check(f.e.uncut===2,'network regrows');}
{const f=fixture();const b=f.e.body;const ward=f.e.filterDamage(b,100,'p2');f.cut();f.e.interact('p2','purify');f.run(2450);check(f.e.filterDamage(b,100,'p2')>ward*5,'objective improves damage over strafe-only');}
{const f=fixture();f.e.review('p2',{action:'phase',phase:3});f.run(3650);f.e.review('p2',{action:'skill',skill:'plague-eclipse'});const h=[...f.e.state.hazards.values()].find(h=>h.shape==='quarantine');const far=Math.max(...[...f.state.players.values()].map(p=>Math.hypot(p.x-h.toX,p.y-h.toY)));check(h.startsAt-h.warnAt>=far/4*1000+1500,'farthest party travel allowance');}
{const f=fixture();f.e.review('p2',{action:'phase',phase:3});f.run(3650);f.e.review('p2',{action:'skill',skill:'soul-harvest'});check(f.e.state.mode==='stagger'&&f.e.state.hazards.size===0,'clean party denies harvest');}
{const f=fixture(),p=f.state.players.get('p2');f.e.review('p2',{action:'skill',skill:'plague-bloom'});p.x=28;f.run(500);const h=[...f.e.state.hazards.values()][0];check(h.x===28,'bloom tracks carrier');f.run(550);p.x=32;f.run(500);check(h.x===28,'bloom locks after placement window');f.run(1500);check(f.e.state.hazards.size>0,'patch persists beyond cast');}
{const f=fixture();f.e.review('p2',{action:'skill',skill:'cursed-effigy'});check(f.e.state.hazards.size===1,'effigy attack originates from source');f.cut();check(f.e.state.hazards.size===0,'destroy source cancels attached spell');}
{const f=fixture();f.e.review('p2',{action:'phase',phase:2});f.run(3650);f.e.review('p2',{action:'skill',skill:'graveyard-procession'});f.run(4150);check([...f.e.state.wells.values()].every(w=>w.blockedUntil>f.now()),'processions contaminate both wells');f.run(10100);check([...f.e.state.wells.values()].every(w=>w.blockedUntil<f.now()),'wells recover');}
{const f=fixture();f.e.review('p2',{action:'phase',phase:2});f.run(3650);f.e.body.hp-=1000;const hp=f.e.body.hp;f.e.review('p2',{action:'skill',skill:'soul-withering'});f.run(2300);check(f.e.body.hp>hp,'uncountered tether heals boss');f.state.players.get('p2').x=40;f.step();check(f.e.state.mode==='stagger'&&f.e.state.hazards.size===0,'distance breaks tether');}
for(const interrupted of[false,true]){const f=fixture();f.e.review('p2',{action:'phase',phase:2});f.run(3650);const n=[...f.e.state.connections.values()][0],m=f.combat.monsters.get(n.monsterId);m.hp=0;f.e.objectDied(m);f.e.review('p2',{action:'skill',skill:'cursed-altar'});if(interrupted)f.e.filterDamage(f.e.body,80,'p2');f.run(4700);check(n.broken===interrupted,'repair counter '+interrupted);}
{const f=fixture();f.e.review('p2',{action:'phase',phase:3});f.run(3650);const n=[...f.e.state.connections.values()][0];f.e.objectDied(f.combat.monsters.get(n.monsterId));f.e.review('p2',{action:'skill',skill:'thousand-cursed-hands'});check(f.e.state.hazards.size===3,'hands only from surviving three sources');}
const out='docs/design/bosses/calon-arang/mechanics-v2/evidence';mkdirSync(out,{recursive:true});writeFileSync(out+'/party-behavior.json',JSON.stringify({checks,passed:true,scope:'deterministic server behavior; not human party balance or browser proof'},null,2));console.log('PASS',checks,'party checks');
