import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GameState,PlayerState} from '../../../packages/schema/dist/index.js';
import {getMap,newProfile,CALON_SKILLS,CALON_HP,CALON_CONNECTIONS,CALON_SOURCE,CALON_WELLS,calonHit,stepMovement,inCalonCourt,FACINGS} from '../../../packages/shared/dist/index.js';
import {CombatSystem} from '../../../apps/server/dist/rooms/combat-system.js';
const out='docs/design/bosses/calon-arang/evidence';mkdirSync(out,{recursive:true});
let checks=0;const check=(v,s)=>{assert(v,s);checks++;};
export function fixture(){
 let now=1000;const state=new GameState(),profiles=new Map(),events=[],map=getMap('girah-ruined-temple');
 const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(id){const p=profiles.get(id),s=state.players.get(id);if(p&&s){s.hp=p.hp;s.hpMax=p.hpMax;}},broadcast:e=>events.push({...e,at:now}),reduceCooldown(){}};
 const c=new CombatSystem(host),p=new PlayerState();p.x=24;p.y=30;state.players.set('p',p);profiles.set('p',newProfile(map.spawn));c.calon.review('p',{action:'prepare'});const profile=profiles.get('p');profile.hp=profile.hpMax=100000;host.vitals('p');
 const step=(ms=50)=>{now+=ms;c.step(ms);},run=ms=>{for(let i=0;i<ms;i+=50)step();};
 return{c,e:c.calon,p,state,profiles,events,map,now:()=>now,step,run};
}
const clips=[];
for(const[skill,s]of Object.entries(CALON_SKILLS))for(const face of FACINGS){
 const f=fixture();f.e.review('p',{action:'phase',phase:s.phase});f.run(3650);const angle=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4;f.p.x=f.e.body.x+Math.cos(angle)*6;f.p.y=f.e.body.y+Math.sin(angle)*6;f.e.review('p',{action:'skill',skill});
 check(f.e.body.facing===face,skill+' facing '+face);const start=f.now(),cues=new Map(),actor=[],stages=new Set();const duration=skill==='night-of-a-thousand-curses'?46000:skill==='soul-harvest'?9500:8000;
 for(let t=0;t<=duration;t+=50){for(const h of f.e.state.hazards.values())cues.set(h.id,{...h.toJSON(),warnAt:h.warnAt-start,startsAt:h.startsAt-start,endsAt:h.endsAt-start});actor.push({at:t,x:f.e.body.x,y:f.e.body.y,facing:f.e.body.facing,mode:f.e.state.mode,stage:f.e.state.ultimateStage});stages.add(f.e.state.ultimateStage);f.step();}
 check(cues.size>0,skill+' hazards');check([...cues.values()].every(h=>h.startsAt-h.warnAt>=1400&&h.endsAt>h.startsAt),skill+' timing');check(f.e.state.hazards.size===0,skill+' cleanup');check(f.e.state.mode==='idle',skill+' recovery');if(skill==='night-of-a-thousand-curses')check([1,2,3,4,5].every(n=>stages.has(n)),'five ultimate stages');
 clips.push({skill,face,duration,cues:[...cues.values()],actor,source:'actual CombatSystem recording at50ms; arranged phase and stationary guest',damage:f.events.filter(e=>e.type==='damage'&&e.target.id==='p').reduce((n,e)=>n+e.amount,0)});
}
const walk=(f,to)=>{let n=0;while(Math.hypot(f.p.x-to.x,f.p.y-to.y)>.15){check(n++<1000,'route bounded');const dx=to.x-f.p.x,dy=to.y-f.p.y,d=Math.hypot(dx,dy);Object.assign(f.p,stepMovement(f.p,{x:dx/d,y:dy/d,sequence:0},.05,f.map).position);f.step();check(inCalonCourt(f.p),'route stays court');}};
{
 const f=fixture();f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.body.hp===CALON_HP*.7&&f.e.state.phase===2,'70% transition');f.run(3650);f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.body.hp===CALON_HP*.35&&f.e.state.phase===3,'35% transition');f.run(3650);f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.state.mode==='defeated'&&!f.e.state.hazards.size,'death clears');f.run(6000);check(!f.e.state.hazards.size,'no postdeath delayed attacks');
}
{
 const f=fixture();f.e.review('p',{action:'phase',phase:3});f.run(3650);f.e.review('p',{action:'skill',skill:'night-of-a-thousand-curses'});const start=f.now();check(!f.e.interact('p','purify'),'remote locked source rejected');
 for(const node of [...CALON_CONNECTIONS].reverse()){walk(f,node);const m=f.c.monsters.get('calon-link-'+node.id);f.c.damageMonster(m,99999,'p');f.step();check(f.e.state.connections.get(node.id).broken,'unordered connection cut '+node.id);}
 walk(f,CALON_SOURCE);check(f.e.interact('p','purify'),'source channel starts');f.run(2450);check(f.e.state.countered&&f.e.state.mode==='stagger','solo walking counter');check(f.now()-start<40000,'counter before finale');check(!f.e.state.hazards.size,'counter removes all cues');f.run(46000);check(!f.events.some(e=>e.type==='damage'&&e.at>start+40000),'cancelled ultimate never hits');
}
{
 const f=fixture();f.e.review('p',{action:'skill',skill:'plague-bloom'});const start=f.now();f.run(3250);check(f.e.state.infections.get('p')?.stacks===1,'bloom infects');walk(f,CALON_WELLS[0]);check(f.e.interact('p','cleanse'),'well validates proximity');check(!f.e.state.infections.has('p'),'well removes infection');check(!f.e.interact('p','cleanse'),'well cooldown');f.run(4100);check(f.e.interact('p','cleanse'),'well ready again');check(f.events.filter(e=>e.type==='damage').every(e=>e.at>=start+1400),'no prewindup damage');
}
{
 const f=fixture();f.e.review('p',{action:'phase',phase:3});f.run(3650);for(const n of CALON_CONNECTIONS)f.c.damageMonster(f.c.monsters.get('calon-link-'+n.id),9999,'p');walk(f,CALON_SOURCE);check(f.e.interact('p','purify'),'channel starts');f.run(500);walk(f,{x:24,y:30});check(!f.e.state.purifyOwner&&!f.e.state.purifyProgress,'walking cancels channel');
}
{
 const f=fixture();f.e.review('p',{action:'skill',skill:'plague-bloom'});check(!f.e.start('plague-bloom','p'),'cooldown blocks spam');f.state.players.clear();f.run(6000);check(f.e.state.mode==='dormant'&&!f.e.state.hazards.size,'empty room reset');
}
mkdirSync('apps/client/public/boss-review/calon-arang',{recursive:true});writeFileSync('apps/client/public/boss-review/calon-arang/clips.json',JSON.stringify(clips));writeFileSync(out+'/behavior.json',JSON.stringify({checks,clips:clips.length,stepMs:50,status:'pass'},null,2));console.log('PASS Calon',checks,'checks',clips.length,'recorded clips');
