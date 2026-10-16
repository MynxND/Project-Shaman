import assert from 'node:assert/strict';
import {GameState,PlayerState} from '../../packages/schema/dist/index.js';
import {getMap,newProfile,bossPartyPlan,raiseBossPartyBudget} from '../../packages/shared/dist/index.js';
import {CombatSystem} from '../../apps/server/dist/rooms/combat-system.js';
import {mkdirSync,writeFileSync} from 'node:fs';
let checks=0;const check=(v,s)=>{assert(v,s);checks++;};const cases=[];
for(const [mapId,key,hp]of[['mount-oe-fortress','shuten',14000],['maiyarap-palace','maiyarap',18000],['frozen-necropolis','koschei',21000]])for(const count of[1,2,3,4,5,10]){
 let now=1000;const state=new GameState(),profiles=new Map(),map=getMap(mapId);
 const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(){},broadcast(){},reduceCooldown(){}};
 const c=new CombatSystem(host),e=c[key];for(let i=0;i<count;i++){const p=new PlayerState();p.x=24;p.y=30;state.players.set('p'+i,p);profiles.set('p'+i,newProfile(map.spawn));}
 now+=50;c.step(50);check(count<3?e.state.mode==='dormant':e.state.mode!=='dormant',key+' activation '+count);
 if(count>=3){const max=hp*bossPartyPlan(count).hpMultiplier;check(Math.abs(e.state.hpMax-max)<.01,key+' hp '+count);check(e.state.participants===count,key+' participant budget');const body=e.body;check(state.monsters.get(body.id).hpMax===max,key+' monster HP agrees');state.players.delete('p0');now+=50;c.step(50);check(e.state.hpMax===max,key+' leave cannot rescale');body.hp=max*.7;now+=50;c.step(50);check(e.state.phase===2,key+' scaled phase threshold');}
 cases.push({mapId,count,phase:e.state.phase,hpMax:e.state.hpMax,participants:e.state.participants});
}
const budget={participants:3,hpMax:14000,hp:7000},body={hp:7000};check(raiseBossPartyBudget(budget,body,14000,10),'late join raises budget');check(budget.participants===10&&Math.abs(body.hp/budget.hpMax-.5)<.00001,'late join preserves damage percentage');check(!raiseBossPartyBudget(budget,body,14000,3)&&budget.participants===10,'departures never lower budget');
const out='docs/design/bosses/motion-identity-v3/evidence';mkdirSync(out,{recursive:true});writeFileSync(out+'/party-budget.json',JSON.stringify({passed:true,checks,cases,limits:'activation/scaling tests only; no role, balance or motion quality proof'},null,2));console.log('PASS',checks,'party budget checks');
