/** Capture real authority timelines for the read-only VFX lab; no hand-authored combat simulation. */
import fs from 'node:fs';
import {GameState,PlayerState} from '../../packages/schema/dist/index.js';
import {getMap,newProfile,SHUTEN_SKILLS,FACINGS} from '../../packages/shared/dist/index.js';
import {CombatSystem} from '../../apps/server/dist/rooms/combat-system.js';
function fixture(){let now=1000;const state=new GameState(),profiles=new Map(),map=getMap('mount-oe-fortress');
 const host={map,state,now:()=>now,rng:()=>.5,profile:id=>profiles.get(id),setProfile:(id,p)=>profiles.set(id,p),vitals(){},broadcast(){},reduceCooldown(){}};
 const combat=new CombatSystem(host),p=new PlayerState();p.x=24;p.y=24;p.hp=p.hpMax=100000;state.players.set('p',p);const profile=newProfile(map.spawn);profile.hp=profile.hpMax=100000;profiles.set('p',profile);
 const step=()=>{now+=50;combat.step(50);};combat.shuten.review('p',{action:'prepare'});p.hp=p.hpMax=100000;profiles.get('p').hp=profiles.get('p').hpMax=100000;
 return {state,combat,p,step,now:()=>now};}
function capture(kind,face){const f=fixture(),e=f.combat.shuten,phase=kind==='phase-2'?2:kind==='phase-3'||kind==='death'?3:SHUTEN_SKILLS[kind].phase;
 e.review('p',{action:'phase',phase:phase===1?1:phase});
 if(!kind.startsWith('phase-'))for(let t=0;t<3300;t+=50)f.step();
 const angle=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4,head=f.combat.monsters.get(e.state.headId);
 const origin=kind==='cursed-head'?head:kind==='wrath-severed-king'?{x:24,y:14}:e.body;
 f.p.x=origin.x+Math.cos(angle)*3;f.p.y=origin.y+Math.sin(angle)*3;
 if(kind==='death')f.combat.damageMonster(e.body,999999,'p');
 else if(!kind.startsWith('phase-'))e.review('p',{action:'skill',skill:kind});
 if(kind.startsWith('phase-')||kind==='death'){e.body.facing=face;for(const m of f.state.monsters.values())if(m.kind==='shuten-doji')m.facing=face;}
 const start=f.now(),duration=kind.startsWith('phase-')?4300:kind==='death'?2600:Math.max(3400,e.state.endsAt-start+850),cues=[],seen=new Set(),frames=[];
 let last='';
 for(let t=0;t<=duration;t+=50){
  const b=e.state;
  for(const h of b.hazards.values())if(!seen.has(h.id)){seen.add(h.id);const raw=h.toJSON();cues.push({...raw,warnAt:raw.warnAt-start,startsAt:raw.startsAt-start,endsAt:raw.endsAt-start});}
  const frame={phase:b.phase,mode:b.mode,skill:b.skill,actionAt:b.actionAt-start,endsAt:b.endsAt-start,headAt:b.headAt-start,headUntil:b.headUntil-start,headId:b.headId,headSkill:b.headSkill,rejoinedUntil:b.rejoinedUntil?b.rejoinedUntil-start:0,ultimateStage:b.ultimateStage,sealed:b.sealed,hp:b.hp,damageMask:b.damageMask,
   actors:[...f.state.monsters.entries()].filter(([,m])=>['shuten-doji','shuten-head','oe-elite-oni'].includes(m.kind)).map(([id,m])=>({id,kind:m.kind,x:m.x,y:m.y,facing:m.facing,state:m.state}))};
  const encoded=JSON.stringify(frame);if(encoded!==last){frames.push({at:f.now()-start,...frame});last=encoded;}f.step();
 }
 return {id:kind,face,duration,player:{x:f.p.x,y:f.p.y},cues,frames};}
const clips={};for(const kind of [...Object.keys(SHUTEN_SKILLS),'phase-2','phase-3','death'])for(const face of FACINGS)clips[kind+':'+face]=capture(kind,face);
const out='apps/client/public/assets/vfx/boss/shuten-complete/clips.json';fs.mkdirSync(out.slice(0,out.lastIndexOf('/')),{recursive:true});fs.writeFileSync(out,JSON.stringify({source:'actual CombatSystem controlled-clock capture; no gameplay authority in preview',stepMs:50,clips}));
console.log(`Captured ${Object.keys(clips).length} server-derived clips, ${fs.statSync(out).size} bytes`);
