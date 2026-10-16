import {BossHazardState,CalonEncounterState,CalonConnectionState,CalonInfectionState,MonsterState} from '@shaman/schema';
import {CALON_HP,CALON_SKILLS,CALON_CONNECTIONS,CALON_SOURCE,CALON_WELLS,calonClamp,calonHit,inCalonCourt,createMonster,facingFromVector,type CalonSkill,type MonsterMotion,type Position} from '@shaman/shared';
import type {CombatHost} from './combat-system.js';
interface Hooks {sync(m:MonsterMotion):void;hit(id:string,m:MonsterMotion,damage:number):void;reset(id:string):void}
interface Area {state:BossHazardState;damage:number;hit:Set<string>;previous:number;infect:boolean}
const dist=(a:Position,b:Position)=>Math.hypot(a.x-b.x,a.y-b.y);
/** Boss15: unordered infection connections and a proximity-validated purification channel. */
export class CalonEncounter {
  readonly state=new CalonEncounterState();
  private areas=new Map<string,Area>();private tasks:{at:number;run:()=>void}[]=[];
  private ready=new Map<string,number>();private cleanseAt=new Map<string,number>();
  private seq=0;private deck=0;private emptyAt=0;private pulseAt=0;private manual=false;
  constructor(private host:CombatHost,private monsters:Map<string,MonsterMotion>,private hooks:Hooks){host.state.calon.set('calon-arang',this.state);this.reset();}
  get body(){return [...this.monsters.values()].find(m=>m.kind==='calon-arang');}
  controlled(m:MonsterMotion){return m.kind==='calon-arang'||m.kind==='calon-effigy';}
  object(m:MonsterMotion){return m.kind==='calon-effigy';}
  private players(){return [...this.host.state.players.entries()].filter(([,p])=>!p.dead&&inCalonCourt(p));}
  private later(ms:number,run:()=>void){this.tasks.push({at:this.host.now()+ms,run});}
  private clear(){this.tasks=[];this.areas.clear();this.state.hazards.clear();this.state.purifyOwner='';this.state.purifyProgress=0;}
  private network(phase:number){
    this.state.connections.clear();this.state.purifyOwner='';this.state.purifyProgress=0;
    for(const [i,node]of CALON_CONNECTIONS.entries()){
      const id='calon-link-'+node.id;let m=this.monsters.get(id);
      if(!m){m=createMonster(id,'calon-effigy',this.host.map.spawnRegions![0]!,node,this.host.now());m.summoned=true;this.monsters.set(id,m);const s=new MonsterState();s.kind=m.kind;this.host.state.monsters.set(id,s);}
      const enabled=phase>1||i===0||i===2;
      Object.assign(m,{x:node.x,y:node.y,hp:enabled?40:0,state:enabled?'idle':'dead',targetId:null});this.hooks.reset(id);this.hooks.sync(m);
      if(enabled){const n=new CalonConnectionState();Object.assign(n,{id:node.id,monsterId:id,broken:false});this.state.connections.set(node.id,n);}
    }
    this.pulseAt=this.host.now()+2200;
  }
  reset(){this.clear();this.ready.clear();this.cleanseAt.clear();this.state.infections.clear();this.deck=0;this.emptyAt=0;
    const b=this.body;if(b){Object.assign(b,{hp:CALON_HP,state:'idle',targetId:null,x:24,y:20,facing:'south'});this.hooks.reset(b.id);this.hooks.sync(b);}
    Object.assign(this.state,{phase:1,mode:'dormant',skill:'',now:this.host.now(),hp:CALON_HP,hpMax:CALON_HP,ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:0,hint:'ตัดหุ่นเชื่อมคำสาป แล้วชำระแท่นต้นกำเนิด'});this.network(1);
  }
  filterDamage(m:MonsterMotion,amount:number,playerId:string){
    const p=this.host.state.players.get(playerId);if(this.controlled(m)&&(!p||p.dead||!inCalonCourt(p)))return 0;
    if(this.object(m))return this.state.connections.get(m.id.replace('calon-link-',''))?.broken===false?amount:0;
    if(m.kind!=='calon-arang')return amount;
    if(['dormant','transition','defeated'].includes(this.state.mode))return 0;
    const floor=this.state.phase===1?CALON_HP*.7:this.state.phase===2?CALON_HP*.35:0;
    return Math.min(Math.max(0,m.hp-floor),Math.round(amount*(this.state.mode==='stagger'?1.5:1)));
  }
  objectDied(m:MonsterMotion){const n=this.state.connections.get(m.id.replace('calon-link-',''));if(!n||n.broken)return;n.broken=true;
    for(const[id,a]of this.areas)if(a.state.actor==='link:'+n.id){this.areas.delete(id);this.state.hazards.delete(id);}
    this.state.hint=this.uncut?'เส้นเชื่อมถูกตัด · ชำระบ่อน้ำเพื่อล้างเชื้อ':'เครือข่ายขาดแล้ว · เข้าใกล้แท่นต้นกำเนิดและกด E ค้างพิธี';
  }
  get uncut(){return [...this.state.connections.values()].filter(n=>!n.broken).length;}
  interact(id:string,action:unknown){const p=this.host.state.players.get(id),s=this.state,now=this.host.now();if(!p||p.dead||!inCalonCourt(p)||['defeated','transition','dormant'].includes(s.mode))return false;
    if(action==='cleanse'&&CALON_WELLS.some(w=>dist(w,p)<=2)&&(this.cleanseAt.get(id)??0)<=now){s.infections.delete(id);this.cleanseAt.set(id,now+4000);s.hint='กักเชื้อสำเร็จ · พื้นที่ปลอดเชื้อยังเดินผ่านได้';return true;}
    if(action==='purify'&&!this.uncut&&dist(p,CALON_SOURCE)<=2&&(!s.purifyOwner||s.purifyOwner===id)){s.purifyOwner=id;return true;}
    return false;
  }
  private purified(){const s=this.state;s.countered=s.mode==='ultimate';this.clear();s.infections.clear();s.mode='stagger';s.endsAt=this.host.now()+4500;s.hint='ชำระต้นกำเนิดสำเร็จ · จาลน อารังอ่อนกำลัง';if(s.countered)s.ultimateStage=5;if(this.body){this.body.state='idle';this.hooks.sync(this.body);}}
  private infect(id:string){const now=this.host.now();let n=this.state.infections.get(id);if(!n){n=new CalonInfectionState();this.state.infections.set(id,n);}n.stacks=Math.min(3,n.stacks+1);n.until=now+14000;if(n.stacks>=2&&!n.spreadAt)n.spreadAt=now+1800;}
  private phase(n:number){this.clear();this.state.infections.clear();Object.assign(this.state,{phase:n,mode:'transition',skill:n===2?'black-ritual':'plague-eclipse',ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:this.host.now()+2600,hint:n===2?'รากต้องสาปเชื่อมครบสี่ทิศ · ใช้บ่อกักเชื้อ':'เครือข่ายเต้นถี่ขึ้น · ตัดเส้นเปิดช่องสวนกลับ'});this.network(n);if(n===3)this.ready.set('night-of-a-thousand-curses',this.host.now()+10000);this.later(2600,()=>{this.state.mode='recovery';this.state.endsAt=this.host.now()+1000;});}
  private hazard(skill:CalonSkill,shape:string,at:Position,radius:number,delay:number,duration:number,extra:Partial<{toX:number;toY:number;width:number;angle:number;arc:number;actor:string;damage:number;infect:boolean}>={}){
    if(this.areas.size>=24)throw Error('Calon critical hazard budget exceeded');const now=this.host.now(),h=new BossHazardState(),id='calon-'+(++this.seq);
    Object.assign(h,{id,skill,effect:skill,actor:extra.actor??'body',shape,x:at.x,y:at.y,toX:extra.toX??at.x,toY:extra.toY??at.y,radius,width:extra.width??.65,angle:extra.angle??0,arc:extra.arc??Math.PI/2,warnAt:now,startsAt:now+delay,endsAt:now+delay+duration});this.state.hazards.set(id,h);this.areas.set(id,{state:h,damage:extra.damage??CALON_SKILLS[skill].damage,hit:new Set(),previous:now,infect:extra.infect??false});
  }
  private lane(k:CalonSkill,a:Position,z:Position,tell:number,width=.65,charge=false,actor='body'){this.hazard(k,charge?'charge':'capsule',a,0,tell,CALON_SKILLS[k].active,{toX:z.x,toY:z.y,width,actor,infect:k==='spirit-swarm'||k==='soul-withering'});}
  private pulse(){for(const n of this.state.connections.values())if(!n.broken){const edge=CALON_CONNECTIONS.find(e=>e.id===n.id)!;this.hazard('cursed-altar','capsule',edge.from,0,1400,650,{toX:edge.to.x,toY:edge.to.y,width:.35,actor:'link:'+n.id,damage:20,infect:true});}this.pulseAt=this.host.now()+(this.state.phase===3?3000:this.state.phase===2?3500:4500);}
  start(k:CalonSkill,id:string,review=false){const b=this.body,p=this.host.state.players.get(id),s=CALON_SKILLS[k],now=this.host.now();
    if(!b||!p||p.dead||!inCalonCourt(p)||!review&&(s.phase>this.state.phase||(this.ready.get(k)??0)>now||now<this.state.endsAt))return false;
    this.ready.set(k,now+s.cooldown);Object.assign(this.state,{skill:k,mode:k==='night-of-a-thousand-curses'?'ultimate':'windup',ultimateStage:k==='night-of-a-thousand-curses'?1:0,actionAt:now,countered:false});b.facing=facingFromVector(p.x-b.x,p.y-b.y)??b.facing;b.state='attack';this.hooks.sync(b);
    const target=calonClamp(p),from={x:b.x,y:b.y},tell=s.tell;let tail=tell+s.active;
    switch(k){
      case 'plague-bloom':this.hazard(k,'disk',target,2.3,tell,s.active,{infect:true});break;
      case 'cursed-effigy':for(const sign of[-1,1])this.lane(k,{x:target.x-5,y:target.y-sign*3},{x:target.x+5,y:target.y+sign*3},tell,.55);break;
      case 'spirit-swarm':for(let i=0;i<3;i++)this.lane(k,{x:15+i*9,y:19},target,tell+i*350,.6);tail+=700;break;
      case 'black-ritual':this.hazard(k,'ring',from,10,tell,s.active,{width:.65});break;
      case 'graveyard-procession':for(const sign of[-1,1])this.lane(k,{x:target.x+sign*5,y:18},target,tell,.7,true,'procession');break;
      case 'soul-withering':this.lane(k,from,target,tell,.75);break;
      case 'cursed-altar':for(const dx of[-5,0,5])this.hazard(k,'disk',calonClamp({x:target.x+dx,y:target.y}),2,tell+Math.abs(dx)*60,s.active,{infect:true});tail+=300;break;
      case 'thousand-cursed-hands':for(let i=0;i<4;i++)this.hazard(k,'sector',{x:24,y:24},16,tell+i*700,s.active,{angle:i*Math.PI/2,arc:Math.PI/2});tail+=2100;break;
      case 'plague-eclipse':for(let i=0;i<3;i++)this.hazard(k,'ring',from,12,tell+i*1100,s.active,{width:.6});tail+=2200;break;
      case 'soul-harvest':for(let i=0;i<3;i++)this.later(i*2200,()=>{const p=this.host.state.players.get(id),b=this.body;if(!p||p.dead||!b)return;const z=calonClamp(p);b.facing=facingFromVector(z.x-b.x,z.y-b.y)??b.facing;this.hooks.sync(b);this.lane(k,b,z,tell,.85,true);});tail+=4400;break;
      case 'night-of-a-thousand-curses':this.ultimate();return true;
    }
    this.state.endsAt=now+tail+s.recovery;this.later(tell,()=>this.state.mode='active');this.later(tail,()=>{this.state.mode='recovery';if(this.body){this.body.state='idle';this.hooks.sync(this.body);}});return true;
  }
  private ultimate(){const s=this.state;this.network(3);s.infections.clear();s.endsAt=this.host.now()+44400;s.hint='ราตรีพันคำสาป · ตัดเส้นเชื่อมทั้งสี่ แล้วชำระแท่น';
    this.later(1600,()=>s.ultimateStage=2);this.later(3000,()=>{s.ultimateStage=3;for(const x of[10,38])this.lane('night-of-a-thousand-curses',{x,y:13},{x,y:36},1600,1);});
    this.later(5500,()=>s.ultimateStage=4);this.later(40000,()=>{s.ultimateStage=5;this.hazard('night-of-a-thousand-curses','finale',{x:24,y:24},24,1600,800);});this.later(42400,()=>{s.mode='recovery';s.endsAt=this.host.now()+2000;});
  }
  /** GameRoom separately restricts review to a development single unsaved guest. */
  review(id:string,m:Record<string,unknown>){const p=this.host.state.players.get(id),profile=this.host.profile(id);if(!p||!profile)return;
    if(m.action==='prepare'){this.reset();this.manual=true;const copy=structuredClone(profile);copy.hp=copy.hpMax=4000;this.host.setProfile(id,copy);this.host.vitals(id);p.dead=false;p.x=24;p.y=30;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='auto'){this.manual=false;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='arrange'&&typeof m.x==='number'&&typeof m.y==='number'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&inCalonCourt({x:m.x,y:m.y})&&!this.areas.size&&['idle','dormant','recovery'].includes(this.state.mode)){p.x=m.x;p.y=m.y;}
    else if(m.action==='phase'&&[1,2,3].includes(Number(m.phase))){if(this.body)this.body.hp=Number(m.phase)===1?CALON_HP:Number(m.phase)===2?CALON_HP*.7:CALON_HP*.35;this.phase(Number(m.phase));}
    else if(m.action==='skill'&&typeof m.skill==='string'&&m.skill in CALON_SKILLS){this.clear();this.state.mode='idle';this.state.endsAt=this.host.now();this.start(m.skill as CalonSkill,id,true);}
  }
  step(dt:number){const now=this.host.now(),b=this.body,s=this.state;s.contactStep=Math.max(1,now-s.now||1000/30);s.now=now;if(!b)return;s.hp=b.hp;
    if(s.mode==='defeated'&&b.hp>0){this.reset();return;}if(b.hp<=0){if(s.mode!=='defeated'){this.clear();s.infections.clear();s.mode='defeated';s.actionAt=now;s.ultimateStage=0;for(const n of s.connections.values()){n.broken=true;const m=this.monsters.get(n.monsterId);if(m){m.hp=0;m.state='dead';this.hooks.sync(m);}}}return;}
    if(!this.players().length){if(!this.emptyAt)this.emptyAt=now;if(now-this.emptyAt>5000&&s.mode!=='dormant')this.reset();return;}this.emptyAt=0;
    if(s.phase===1&&b.hp<=CALON_HP*.7)this.phase(2);else if(s.phase===2&&b.hp<=CALON_HP*.35)this.phase(3);
    const due=this.tasks.filter(t=>t.at<=now);this.tasks=this.tasks.filter(t=>t.at>now);for(const t of due)t.run();
    for(const[id,n]of s.infections){const p=this.host.state.players.get(id);if(!p||p.dead||now>=n.until){s.infections.delete(id);continue;}if(n.spreadAt&&now>=n.spreadAt){n.spreadAt=0;this.hazard('plague-bloom','disk',calonClamp(p),1.5,1500,500,{damage:25,actor:'infection'});if(s.phase>=2)for(const[other,q]of this.players())if(other!==id&&dist(p,q)<3)this.infect(other);}}
    for(const[id,a]of this.areas){const h=a.state,contact=Math.min(now,h.endsAt),previous=Math.max(h.startsAt,a.previous);if(now>=h.startsAt&&a.previous<h.endsAt){for(const[pid,p]of this.players())if(!a.hit.has(pid)&&calonHit(h,p,contact,previous)){a.hit.add(pid);this.hooks.hit(pid,b,a.damage);if(a.infect&&!p.dead)this.infect(pid);if(s.purifyOwner===pid){s.purifyOwner='';s.purifyProgress=0;}}if(h.shape==='charge'&&h.actor==='body'){const q=Math.max(0,Math.min(1,(contact-h.startsAt)/(h.endsAt-h.startsAt)));b.x=h.x+(h.toX-h.x)*q;b.y=h.y+(h.toY-h.y)*q;this.hooks.sync(b);}}a.previous=now;if(now>h.endsAt+600){this.areas.delete(id);s.hazards.delete(id);}}
    if(s.purifyOwner){const p=this.host.state.players.get(s.purifyOwner);if(!p||p.dead||dist(p,CALON_SOURCE)>2||this.uncut){s.purifyOwner='';s.purifyProgress=0;}else{s.purifyProgress=Math.min(1,s.purifyProgress+Math.max(0,dt)/2400);if(s.purifyProgress>=1)this.purified();}}
    if((!this.manual||s.mode==='ultimate')&&this.uncut&&now>=this.pulseAt&&!['transition','stagger','dormant'].includes(s.mode))this.pulse();
    if(s.mode==='dormant'){s.mode='idle';s.endsAt=now+1200;}if(['transition','ultimate','stagger'].includes(s.mode)&&now<s.endsAt||now<s.endsAt)return;s.mode='idle';if(this.manual)return;
    const target=this.players().sort((a,c)=>dist(a[1],b)-dist(c[1],b))[0];if(!target)return;
    if(dist(b,target[1])>8){s.mode='reposition';const d=dist(b,target[1]),v=Math.min(1.3*dt/1000,d-7.5),dx=(target[1].x-b.x)/d,dy=(target[1].y-b.y)/d;b.x+=dx*v;b.y+=dy*v;b.facing=facingFromVector(dx,dy)??b.facing;b.state='chase';this.hooks.sync(b);s.endsAt=now;return;}
    const keys=(Object.keys(CALON_SKILLS)as CalonSkill[]).filter(k=>CALON_SKILLS[k].phase<=s.phase&&(this.ready.get(k)??0)<=now);if(s.phase===3&&keys.includes('night-of-a-thousand-curses'))this.start('night-of-a-thousand-curses',target[0]);else if(keys.length)this.start(keys[this.deck++%keys.length]!,target[0]);
  }
}
