import{Room,type Client}from'@colyseus/core';
import{GameState,PlayerState,MonsterState}from'@shaman/schema';
import{MAPS,MONSTERS,FACINGS,createMonster,newProfile,isMovementInput,stepMovement,type PlayerProfile,type MovementInput,type Facing}from'@shaman/shared';
import{CombatSystem}from'./combat-system.js';
/** Isolated unsaved development fixture using the actual map, movement and authoritative combat systems. */
export class RangedReviewRoom extends Room<{state:GameState}>{
 state=new GameState();maxClients=1;private profiles=new Map<string,PlayerProfile>();private combat!:CombatSystem;private reviewInputs=new Map<string,{input:MovementInput;at:number}>();private starts=Infinity;private active=false;private seq=0;private current='';
 private map={...MAPS['lantern-paddy']!,spawnRegions:[]};
 private reset(){this.state.monsters.clear();this.combat=new CombatSystem({map:this.map,state:this.state,now:()=>this.clock.currentTime,rng:()=>.5,profile:id=>this.profiles.get(id),setProfile:(id,p)=>this.profiles.set(id,p),vitals:id=>{const p=this.profiles.get(id)!;const s=this.state.players.get(id)!;s.hp=p.hp;s.hpMax=p.hpMax;this.clients.find(c=>c.sessionId===id)?.send('vitals',p);},...{reduceCooldown:()=>{}},broadcast:e=>{this.broadcast('combat',e);this.broadcast('ranged:trace',{...e,serverAt:this.clock.currentTime,caseId:this.current});}});}
 onCreate(){if(process.env.NODE_ENV==='production')throw Error('development-only');this.state.mapId=this.map.id;this.patchRate=30;this.reset();
 this.onMessage('ranged:stop',()=>{this.active=false;this.starts=Infinity;this.reset();this.reviewInputs.clear();});
 this.onMessage('profile:get',c=>c.send('profile',{profile:this.profiles.get(c.sessionId)}));
 this.onMessage('move',(c,m:unknown)=>{if(isMovementInput(m))this.reviewInputs.set(c.sessionId,{input:m,at:this.clock.currentTime});});
 this.onMessage('ranged:case',(c,m:{kind?:string;facing?:Facing;outcome?:string})=>{if(!m||typeof m!=='object')return;const def=MONSTERS[m.kind??''];if(!def?.projectile?.motif||!FACINGS.includes(m.facing!)||!['hit','dodge','outside'].includes(m.outcome??''))return;
 this.reset();this.active=false;this.reviewInputs.clear();const p=this.state.players.get(c.sessionId)!;const i=FACINGS.indexOf(m.facing!),a=Math.PI/2-i*Math.PI/4,d=m.outcome==='outside'?def.attackRange*1.25+.5:def.attackRange,v={x:Math.cos(a),y:Math.sin(a)};p.x=36+v.x*d;p.y=14+v.y*d;p.dead=false;p.moving=false;const profile=newProfile(p);profile.level=60;profile.hp=profile.hpMax=50000;this.profiles.set(c.sessionId,profile);p.hp=p.hpMax=50000;
 const id='ranged-'+(++this.seq),region={id:'ranged-qa',respawnMs:60000,area:{x:35,y:13,w:2,h:2},monsters:[]};const monster=createMonster(id,m.kind!,region,{x:36,y:14},this.clock.currentTime);Object.assign(monster,{state:'attack',facing:m.facing,targetId:c.sessionId,lastAttackAt:this.clock.currentTime+100000});if(m.outcome==='outside')monster.statuses.root=this.clock.currentTime+10000;this.combat.monsters.set(id,monster);const s=new MonsterState();Object.assign(s,{kind:m.kind,x:36,y:14,facing:m.facing,state:'idle',hp:def.hp,hpMax:def.hp});this.state.monsters.set(id,s);this.starts=this.clock.currentTime+400;this.current=id;
 c.send('profile',{profile});c.send('ranged:ready',{caseId:id,kind:m.kind,facing:m.facing,outcome:m.outcome,range:def.attackRange,flightMs:Math.round(d/def.projectile.speed*1000),serverAt:this.clock.currentTime,player:{x:p.x,y:p.y},origin:{x:36,y:14}});
 });
 this.setSimulationInterval(ms=>{const now=this.clock.currentTime;for(const[id,p]of this.state.players){const value=this.reviewInputs.get(id);if(!value||now-value.at>300){p.moving=false;continue;}const out=stepMovement(p,value.input,Math.min(ms,100)/1000,this.map);p.moving=out.position.x!==p.x||out.position.y!==p.y;p.x=out.position.x;p.y=out.position.y;if(out.facing)p.facing=out.facing;}
 if(now>=this.starts){for(const m of this.combat.monsters.values()){if(m.lastAttackAt>now+50000)m.lastAttackAt=0;}this.starts=Infinity;this.active=true;}
 if(this.active)this.combat.step(Math.min(ms,100));},1000/30);
 }
 onAuth(_c:Client,o?:{authToken?:unknown;ticket?:unknown}){if(o?.authToken||o?.ticket)throw Error('guest-only');return true;}
 onJoin(c:Client){const p=new PlayerState();p.x=36;p.y=14;this.state.players.set(c.sessionId,p);this.profiles.set(c.sessionId,newProfile(p));}
 onLeave(c:Client){this.profiles.delete(c.sessionId);this.reviewInputs.delete(c.sessionId);this.state.players.delete(c.sessionId);}
}
