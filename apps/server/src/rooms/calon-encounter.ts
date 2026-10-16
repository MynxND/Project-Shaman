import {BossHazardState,CalonEncounterState,CalonConnectionState,CalonInfectionState,CalonWellState,MonsterState} from '@shaman/schema';
import {CALON_HP,CALON_SKILLS,CALON_CONNECTIONS,CALON_SOURCE,CALON_WELLS,calonClamp,calonHit,inCalonCourt,createMonster,facingFromVector,type CalonSkill,type MonsterMotion,type Position} from '@shaman/shared';
import type {CombatHost} from './combat-system.js';
interface Hooks {sync(m:MonsterMotion):void;hit(id:string,m:MonsterMotion,damage:number):void;reset(id:string):void}
interface Area {state:BossHazardState;damage:number;hit:Map<string,number>;previous:number;infect:boolean;repeat:number;trackUntil:number;target:string;heals:boolean;well:string;source:string}
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
  /** Keepers cannot also purify; infection and unavailable water invalidate a role. */
  private keepers(owner=''){
    const used=new Set([owner]);
    return CALON_WELLS.map(w=>{
      const water=this.state.wells.get(w.id);
      if(!water||this.host.now()<water.blockedUntil)return '';
      const found=this.players().find(([id,p])=>!used.has(id)&&!this.state.infections.has(id)&&dist(p,w)<=2);
      if(found)used.add(found[0]);return found?.[0]??'';
    });
  }
  private canPurify(id:string){const p=this.host.state.players.get(id);return !!p&&!p.dead&&!this.uncut&&!this.state.infections.has(id)&&dist(p,CALON_SOURCE)<=2&&this.keepers(id).every(Boolean);}
  private later(ms:number,run:()=>void){this.tasks.push({at:this.host.now()+ms,run});}
  private clear(){this.tasks=[];this.areas.clear();this.state.hazards.clear();this.state.purifyOwner='';this.state.purifyProgress=0;this.state.tetherTarget='';this.state.tetherUntil=0;}
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
  reset(){this.clear();this.ready.clear();this.cleanseAt.clear();this.state.infections.clear();this.state.wells.clear();for(const w of CALON_WELLS){const n=new CalonWellState();n.id=w.id;this.state.wells.set(w.id,n);}this.state.exposedUntil=0;this.state.partySize=0;this.state.westKeeper='';this.state.eastKeeper='';this.state.ritualPressure=0;this.state.tetherTarget='';this.state.tetherUntil=0;this.deck=0;this.emptyAt=0;
    const b=this.body;if(b){Object.assign(b,{hp:CALON_HP,state:'idle',targetId:null,x:24,y:20,facing:'south'});this.hooks.reset(b.id);this.hooks.sync(b);}
    Object.assign(this.state,{phase:1,mode:'dormant',skill:'',now:this.host.now(),hp:CALON_HP,hpMax:CALON_HP,ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:0,hint:'ตัดหุ่นเชื่อมคำสาป แล้วชำระแท่นต้นกำเนิด'});this.network(1);
  }
  filterDamage(m:MonsterMotion,amount:number,playerId:string){
    const p=this.host.state.players.get(playerId);if(this.controlled(m)&&(!p||p.dead||!inCalonCourt(p)))return 0;
    if(this.object(m))return this.state.connections.get(m.id.replace('calon-link-',''))?.broken===false?amount:0;
    if(m.kind!=='calon-arang')return amount;
    if(['dormant','transition','defeated'].includes(this.state.mode))return 0;
    const floor=this.state.phase===1?this.state.hpMax*.7:this.state.phase===2?this.state.hpMax*.35:0;
    const now=this.host.now(),s=this.state;
    if(s.skill==='cursed-altar'&&['windup','active'].includes(s.mode)&&s.ritualPressure<s.ritualGoal){s.ritualPressure+=Math.max(0,amount);if(s.ritualPressure>=s.ritualGoal){this.clear();s.mode='stagger';s.endsAt=now+3000;s.exposedUntil=Math.max(s.exposedUntil,now+5000);s.hint='ขัดพิธีสำเร็จ · หุ่นไม่ฟื้นและแม่มดเสียหลัก';}}
    const mul=s.mode==='stagger'?1.5:now<s.exposedUntil?1.25:s.skill==='cursed-altar'&&['windup','active'].includes(s.mode)?1:this.uncut ? .15 : .3;
    return Math.min(Math.max(0,m.hp-floor),Math.round(amount*mul));
  }
  objectDied(m:MonsterMotion){const n=this.state.connections.get(m.id.replace('calon-link-',''));if(!n||n.broken)return;n.broken=true;
    for(const[id,a]of this.areas)if(a.state.actor==='link:'+n.id){this.areas.delete(id);this.state.hazards.delete(id);}
    this.state.hint=this.uncut?'เส้นเชื่อมถูกตัด · ชำระบ่อน้ำเพื่อล้างเชื้อ':'เครือข่ายขาดแล้ว · เข้าใกล้แท่นต้นกำเนิดและกด E ค้างพิธี';
  }
  get uncut(){return [...this.state.connections.values()].filter(n=>!n.broken).length;}
  interact(id:string,action:unknown){const p=this.host.state.players.get(id),s=this.state,now=this.host.now();if(!p||p.dead||!inCalonCourt(p)||['defeated','transition','dormant'].includes(s.mode))return false;
    const well=CALON_WELLS.find(w=>dist(w,p)<=2),water=well?s.wells.get(well.id):undefined;
    if(action==='cleanse'&&water&&now>=water.blockedUntil&&now>=water.readyAt&&(this.cleanseAt.get(id)??0)<=now){const infected=(s.infections.get(id)?.stacks??0)>0;s.infections.delete(id);this.cleanseAt.set(id,now+4000);if(infected){water.readyAt=now+12000;water.blockedUntil=now+(s.phase===1?5000:8000);}s.hint=infected?'ล้างเชื้อแล้ว · บ่อนี้ต้องพัก เลือกเส้นทางไปอีกบ่อ':'ไม่มีเชื้อสะสม';return true;}
    if(action==='purify'&&this.canPurify(id)&&(!s.purifyOwner||s.purifyOwner===id)){s.purifyOwner=id;return true;}
    return false;
  }
  private purified(){const s=this.state;s.countered=s.mode==='ultimate';this.clear();s.infections.clear();s.mode='stagger';s.endsAt=this.host.now()+4500;s.exposedUntil=this.host.now()+(s.phase===1?12000:s.phase===2?10000:8000);s.hint='ชำระต้นกำเนิดสำเร็จ · จาลน อารังอ่อนกำลัง';if(s.countered)s.ultimateStage=5;if(this.body){this.body.state='idle';this.hooks.sync(this.body);}}
  private infect(id:string){const now=this.host.now();let n=this.state.infections.get(id);if(!n){n=new CalonInfectionState();this.state.infections.set(id,n);}n.stacks=Math.min(3,n.stacks+1);n.until=now+14000;if(n.stacks>=2&&!n.spreadAt)n.spreadAt=now+1800;}
  private phase(n:number){this.clear();this.state.infections.clear();Object.assign(this.state,{phase:n,mode:'transition',skill:n===2?'black-ritual':'plague-eclipse',ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:this.host.now()+2600,exposedUntil:0,ritualPressure:0,hint:n===2?'เชื้อที่ล้างทำให้บ่อพัก · ขัดพิธีซ่อมหุ่นด้วยการโจมตี':'มือผีเกิดจากหุ่นที่ยังอยู่ · ตัดแหล่งกำเนิดเพื่อเปิดทาง'});this.network(n);if(n===3)this.ready.set('night-of-a-thousand-curses',this.host.now()+10000);this.later(2600,()=>{this.state.mode='recovery';this.state.endsAt=this.host.now()+1000;});}
  private hazard(skill:CalonSkill,shape:string,at:Position,radius:number,delay:number,duration:number,extra:Partial<{toX:number;toY:number;width:number;angle:number;arc:number;actor:string;damage:number;infect:boolean;repeat:number;trackMs:number;target:string;heals:boolean;well:string;source:string}>={}){
    if(this.areas.size>=24)throw Error('Calon critical hazard budget exceeded');const now=this.host.now(),h=new BossHazardState(),id='calon-'+(++this.seq);
    Object.assign(h,{id,skill,effect:skill,actor:extra.actor??'body',shape,x:at.x,y:at.y,toX:extra.toX??at.x,toY:extra.toY??at.y,radius,width:extra.width??.65,angle:extra.angle??0,arc:extra.arc??Math.PI/2,warnAt:now,startsAt:now+delay,endsAt:now+delay+duration});this.state.hazards.set(id,h);this.areas.set(id,{state:h,damage:extra.damage??CALON_SKILLS[skill].damage,hit:new Map(),previous:now,infect:extra.infect??false,repeat:extra.repeat??0,trackUntil:now+(extra.trackMs??0),target:extra.target??'',heals:extra.heals??false,well:extra.well??'',source:extra.source??''});
  }
  private lane(k:CalonSkill,a:Position,z:Position,tell:number,width=.65,charge=false,actor='body'){this.hazard(k,charge?'charge':'capsule',a,0,tell,CALON_SKILLS[k].active,{toX:z.x,toY:z.y,width,actor,infect:k==='spirit-swarm'||k==='soul-withering'});}
  private pulse(){for(const n of this.state.connections.values())if(!n.broken){const edge=CALON_CONNECTIONS.find(e=>e.id===n.id)!;this.hazard('cursed-altar','capsule',edge.from,0,1400,650,{toX:edge.to.x,toY:edge.to.y,width:.35,actor:'link:'+n.id,damage:20,infect:true});}this.pulseAt=this.host.now()+(this.state.phase===3?3000:this.state.phase===2?3500:4500);}
  start(k:CalonSkill,id:string,review=false){const b=this.body,p=this.host.state.players.get(id),s=CALON_SKILLS[k],now=this.host.now();
    if(!b||!p||p.dead||!inCalonCourt(p)||!review&&(s.phase>this.state.phase||(this.ready.get(k)??0)>now||now<this.state.endsAt))return false;
    this.ready.set(k,now+s.cooldown);Object.assign(this.state,{skill:k,mode:k==='night-of-a-thousand-curses'?'ultimate':'windup',ultimateStage:k==='night-of-a-thousand-curses'?1:0,actionAt:now,countered:false});b.facing=facingFromVector(p.x-b.x,p.y-b.y)??b.facing;b.state='attack';this.hooks.sync(b);
    const target=calonClamp(p),from={x:b.x,y:b.y},tell=s.tell;let tail=tell+s.active;
    switch(k){
      case 'plague-bloom':this.hazard(k,'disk',target,1.7,tell,s.active,{infect:true,repeat:900,target:id,trackMs:1000,actor:'spore'});tail=tell+500;this.state.hint='มีเชื้อติดตาม · ลากออกจากบ่อและทางเดิน ก่อนเครื่องหมายหยุด';break;
      case 'cursed-effigy':{const node=this.liveNodes().sort((a,c)=>dist(a,target)-dist(c,target))[0];if(node)this.hazard(k,'capsule',node,0,tell,1800,{toX:target.x,toY:target.y,width:.55,actor:'link:'+node.id,source:node.id,infect:true,repeat:900});tail=tell+1800;this.state.hint='หุ่นผูกคำสาป · ทำลายหุ่นต้นทางเพื่อตัดสกิล';break;}
      case 'spirit-swarm':{const nodes=this.liveNodes();for(const[i,node]of nodes.slice(0,3).entries())this.hazard(k,'capsule',node,0,tell+i*450,650,{toX:target.x,toY:target.y,width:.7,actor:'link:'+node.id,source:node.id,target:id,trackMs:Math.max(0,tell+i*450-650),infect:true});tail=tell+1550;this.state.hint='ฝูงผีเสื้อล็อกเป้าช้า · หลอกทางแล้วตัดหุ่นต้นกำเนิด';break;}
      case 'black-ritual':for(const node of this.liveNodes()){this.hazard(k,'capsule',node.from,0,tell,1800,{toX:node.to.x,toY:node.to.y,width:.5,actor:'link:'+node.id,source:node.id,infect:true,repeat:850});}tail=tell+1800;this.state.hint='เส้นเชื่อมกำลังติดเชื้อ · ตัดเส้นที่ขวางทางไปบ่อ';break;
      case 'graveyard-procession':for(const[i,w]of CALON_WELLS.entries()){const node=this.liveNodes()[i%Math.max(1,this.liveNodes().length)];if(node)this.hazard(k,'charge',node,0,tell,2600,{toX:w.x,toY:w.y,width:.65,actor:'procession',well:w.id,source:node.id});}tail=tell+2600;this.state.hint='ขบวนกำลังทำให้บ่อปนเปื้อน · ตัดหุ่นต้นทางก่อนขบวนถึง';break;
      case 'soul-withering':this.hazard(k,'capsule',from,0,tell,s.active,{toX:target.x,toY:target.y,width:.55,actor:'tether',target:id,trackMs:tell+s.active,infect:true,repeat:900,heals:true});this.state.tetherTarget=id;this.state.tetherUntil=now+tell+s.active;this.state.hint='สายดูดวิญญาณ · ห่างแม่มดเกิน 9 ช่อง หรือล้างเชื้อเพื่อตัดสาย';break;
      case 'cursed-altar':this.hazard(k,'ritual',from,2,tell,s.active,{damage:0});this.state.ritualPressure=0;this.state.hint='ช่วงสวนกลับ! ตีแม่มดให้ครบแรงขัดพิธี ก่อนหุ่นฟื้น';this.later(tell+s.active,()=>{if(this.state.ritualPressure<this.state.ritualGoal)this.repairOne();});break;
      case 'thousand-cursed-hands':for(const[i,node]of this.liveNodes().entries())this.hazard(k,'sector',node,7.5,tell+i*450,650,{angle:Math.atan2(26-node.y,24-node.x),arc:Math.PI*.42,actor:'link:'+node.id,source:node.id});tail=tell+2000;this.state.hint='มือผีออกจากหุ่น · ทำลายต้นทางเพื่อเปิดช่องผ่าน';break;
      case 'plague-eclipse':{const safe=this.safeWell(target),wind=this.travelTell(target,safe);this.hazard(k,'quarantine',{x:24,y:24},30,wind,700,{toX:safe.x,toY:safe.y,width:2.4});tail=wind+700;this.state.hint='คราสกำลังมา · เข้าบ่อกักเชื้อที่ทำเครื่องหมายเพื่อรอดและล้างเชื้อ';break;}
      case 'soul-harvest':{const prey=this.players().filter(([pid])=>(this.state.infections.get(pid)?.stacks??0)>0).sort((a,c)=>(this.state.infections.get(c[0])?.stacks??0)-(this.state.infections.get(a[0])?.stacks??0))[0];if(!prey){this.state.mode='stagger';this.state.exposedUntil=Math.max(this.state.exposedUntil,now+3500);this.state.endsAt=now+2500;this.state.hint='ไม่มีเหยื่อติดเชื้อ · เก็บเกี่ยวล้มเหลว เปิดช่องตี';return true;}const[pid,q]=prey;this.hazard(k,'charge',from,0,tell,s.active,{toX:q.x,toY:q.y,width:1,actor:'harvest',target:pid,trackMs:tell-650});this.state.tetherTarget=pid;this.state.tetherUntil=now+tell+s.active;this.state.hint='ผู้ติดเชื้อถูกเก็บเกี่ยว · ล้างเชื้อก่อนแม่มดพุ่ง';break;}
      case 'night-of-a-thousand-curses':this.ultimate();return true;
    }
    this.state.endsAt=now+tail+s.recovery;this.later(tell,()=>this.state.mode='active');this.later(tail,()=>{this.state.mode='recovery';if(this.body){this.body.state='idle';this.hooks.sync(this.body);}});return true;
  }
  private liveNodes(){return CALON_CONNECTIONS.filter(n=>this.state.connections.get(n.id)?.broken===false);}
  private repairOne(){const n=[...this.state.connections.values()].find(n=>n.broken);if(n){n.broken=false;const m=this.monsters.get(n.monsterId);if(m){m.hp=40;m.state='idle';this.hooks.reset(m.id);this.hooks.sync(m);}this.state.hint='ขัดพิธีไม่ทัน · หุ่นเชื่อมคำสาปฟื้นหนึ่งตัว';}else if(this.body){this.body.hp=Math.min(this.state.hpMax,this.body.hp+400);this.hooks.sync(this.body);}}
  private safeWell(p:Position){const ready=CALON_WELLS.filter(w=>this.host.now()>=(this.state.wells.get(w.id)?.blockedUntil??0)),w=[...(ready.length?ready:CALON_WELLS)].sort((a,b)=>dist(a,p)-dist(b,p))[0]!;const state=this.state.wells.get(w.id);if(state)state.blockedUntil=this.host.now();return w;}
  private travelTell(p:Position,w:Position){const farthest=Math.max(dist(p,w),...this.players().map(([,q])=>dist(q,w)));return Math.max(3200,Math.ceil((farthest/4+1.6)*1000));}
  private cancelHunt(){this.clear();this.state.mode='stagger';this.state.endsAt=this.host.now()+2200;this.state.exposedUntil=Math.max(this.state.exposedUntil,this.host.now()+3500);this.state.hint='ตัดคำสาปสำเร็จ · แม่มดเสียจังหวะ สวนกลับได้';}
  private ultimate(){const s=this.state;this.network(3);s.infections.clear();s.endsAt=this.host.now()+48000;s.hint='ราตรีพันคำสาป · ตัดเส้นเชื่อมทั้งสี่ แล้วชำระแท่น';
    this.later(1600,()=>s.ultimateStage=2);this.later(3000,()=>{s.ultimateStage=3;for(const x of[10,38])this.lane('night-of-a-thousand-curses',{x,y:13},{x,y:36},1600,1);});
    this.later(5500,()=>s.ultimateStage=4);this.later(36000,()=>{s.ultimateStage=5;const p=this.players()[0]?.[1]??CALON_SOURCE,w=this.safeWell(p),tell=this.travelTell(p,w);this.hazard('night-of-a-thousand-curses','quarantine',{x:24,y:24},30,tell,800,{toX:w.x,toY:w.y,width:2.4});s.endsAt=this.host.now()+tell+2800;this.later(tell+800,()=>{s.mode='recovery';s.endsAt=this.host.now()+2000;});});
  }
  /** GameRoom restricts review to unsaved development guests; party QA must be explicitly created. */
  review(id:string,m:Record<string,unknown>){const p=this.host.state.players.get(id),profile=this.host.profile(id);if(!p||!profile)return;
    if(m.action==='prepare'){this.reset();this.manual=true;const copy=structuredClone(profile);copy.hp=copy.hpMax=4000;this.host.setProfile(id,copy);this.host.vitals(id);p.dead=false;p.x=24;p.y=30;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='auto'){this.manual=false;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='arrange'&&typeof m.x==='number'&&typeof m.y==='number'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&inCalonCourt({x:m.x,y:m.y})&&!this.areas.size&&['idle','dormant','recovery'].includes(this.state.mode)){p.x=m.x;p.y=m.y;}
    else if(m.action==='phase'&&[1,2,3].includes(Number(m.phase))){if(this.body)this.body.hp=Number(m.phase)===1?this.state.hpMax:Number(m.phase)===2?this.state.hpMax*.7:this.state.hpMax*.35;this.phase(Number(m.phase));}
    else if(m.action==='skill'&&typeof m.skill==='string'&&m.skill in CALON_SKILLS){this.clear();this.state.mode='idle';this.state.endsAt=this.host.now();this.start(m.skill as CalonSkill,id,true);}
  }
  step(dt:number){const now=this.host.now(),b=this.body,s=this.state;s.contactStep=Math.max(1,now-s.now||1000/30);s.now=now;if(!b)return;const bodyState=this.host.state.monsters.get(b.id);if(bodyState)bodyState.hpMax=s.hpMax;s.hp=b.hp;const keepers=this.keepers(s.purifyOwner);s.westKeeper=keepers[0]??'';s.eastKeeper=keepers[1]??'';
    if(s.mode==='defeated'&&b.hp>0){this.reset();return;}if(b.hp<=0){if(s.mode!=='defeated'){this.clear();s.infections.clear();s.mode='defeated';s.actionAt=now;s.ultimateStage=0;for(const n of s.connections.values()){n.broken=true;const m=this.monsters.get(n.monsterId);if(m){m.hp=0;m.state='dead';this.hooks.sync(m);}}}return;}
    if(!this.players().length){if(!this.emptyAt)this.emptyAt=now;if(now-this.emptyAt>5000&&s.mode!=='dormant')this.reset();return;}this.emptyAt=0;
    if(s.phase===1&&b.hp<=s.hpMax*.7)this.phase(2);else if(s.phase===2&&b.hp<=s.hpMax*.35)this.phase(3);
    const due=this.tasks.filter(t=>t.at<=now);this.tasks=this.tasks.filter(t=>t.at>now);for(const t of due)t.run();
    for(const[id,n]of s.infections){const p=this.host.state.players.get(id);if(!p||p.dead||now>=n.until){s.infections.delete(id);continue;}if(n.spreadAt&&now>=n.spreadAt){n.spreadAt=0;this.hazard('plague-bloom','disk',calonClamp(p),1.5,1500,500,{damage:25,actor:'infection'});if(s.phase>=2)for(const[other,q]of this.players())if(other!==id&&dist(p,q)<3)this.infect(other);}}
    if(s.exposedUntil>0&&now>=s.exposedUntil&&!['transition','defeated'].includes(s.mode)){s.exposedUntil=0;this.network(s.phase);s.hint='ช่องตีปิด · เครือข่ายเริ่มเชื่อมใหม่ ตัดหุ่นก่อนชำระอีกครั้ง';}
    for(const[id,a]of this.areas){const h=a.state;
      if(a.source&&s.connections.get(a.source)?.broken){this.areas.delete(id);s.hazards.delete(id);continue;}
      const prey=a.target?this.host.state.players.get(a.target):undefined;
      if(h.actor==='tether'&&(!prey||prey.dead||dist(prey,b)>9||(now>=h.startsAt&&a.hit.has(a.target)&&!s.infections.has(a.target)))){this.cancelHunt();break;}
      if(h.actor==='harvest'&&(!prey||prey.dead||!s.infections.has(a.target))){this.cancelHunt();break;}
      if(prey&&now<a.trackUntil){const aim=calonClamp(prey);if(h.shape==='disk'){h.x=aim.x;h.y=aim.y;}else{h.toX=aim.x;h.toY=aim.y;}if(h.actor==='tether'){h.x=b.x;h.y=b.y;}}
      if(h.shape==='quarantine'&&now>=h.startsAt&&a.previous<h.startsAt)for(const[pid,p]of this.players())if(Math.hypot(p.x-h.toX,p.y-h.toY)<=h.width+.28)s.infections.delete(pid);
      const contact=Math.min(now,h.endsAt),previous=Math.max(h.startsAt,a.previous);if(now>=h.startsAt&&a.previous<h.endsAt){for(const[pid,p]of this.players())if((!a.hit.has(pid)||a.repeat>0&&now-(a.hit.get(pid)??0)>=a.repeat)&&calonHit(h,p,contact,previous)){a.hit.set(pid,now);this.hooks.hit(pid,b,a.damage);if(a.heals){b.hp=Math.min(s.hpMax,b.hp+a.damage*4);this.hooks.sync(b);}if(a.infect&&!p.dead)this.infect(pid);if(s.purifyOwner===pid){s.purifyOwner='';s.purifyProgress=0;}}if(h.shape==='charge'&&(h.actor==='body'||h.actor==='harvest')){const q=Math.max(0,Math.min(1,(contact-h.startsAt)/(h.endsAt-h.startsAt)));b.x=h.x+(h.toX-h.x)*q;b.y=h.y+(h.toY-h.y)*q;this.hooks.sync(b);}}if(a.well&&a.previous<h.endsAt&&now>=h.endsAt){const w=s.wells.get(a.well);if(w)w.blockedUntil=now+10000;s.hint='ขบวนถึงบ่อ · บ่อปนเปื้อนชั่วคราว ใช้อีกเส้นทาง';}a.previous=now;if(now>h.endsAt+600){this.areas.delete(id);s.hazards.delete(id);}}
    if(s.purifyOwner){const p=this.host.state.players.get(s.purifyOwner);if(!this.canPurify(s.purifyOwner)){s.purifyOwner='';s.purifyProgress=0;s.hint='พิธีขาด · ต้องมีผู้ไร้เชื้อคุมบ่อทั้งสองฝั่งและผู้ชำระกลาง';}else{s.purifyProgress=Math.min(1,s.purifyProgress+Math.max(0,dt)/2400);if(s.purifyProgress>=1)this.purified();}}
    if((!this.manual||s.mode==='ultimate')&&this.uncut&&now>=this.pulseAt&&!['transition','stagger','dormant'].includes(s.mode))this.pulse();
    if(s.mode==='dormant'){if(this.players().length<3){s.hint='รอปาร์ตี้ 3–5 คน · คุมบ่อซ้าย คุมบ่อขวา และชำระกลาง';return;}s.partySize=Math.min(5,this.players().length);s.hpMax=CALON_HP*(1+(s.partySize-3)*.25);b.hp=s.hpMax;s.hp=b.hp;this.hooks.sync(b);s.mode='idle';s.endsAt=now+1200;}if(['transition','ultimate','stagger'].includes(s.mode)&&now<s.endsAt||now<s.endsAt)return;s.mode='idle';if(this.manual)return;
    const target=this.players().sort((a,c)=>dist(a[1],b)-dist(c[1],b))[0];if(!target)return;
    if(dist(b,target[1])>8){s.mode='reposition';const d=dist(b,target[1]),v=Math.min(1.3*dt/1000,d-7.5),dx=(target[1].x-b.x)/d,dy=(target[1].y-b.y)/d;b.x+=dx*v;b.y+=dy*v;b.facing=facingFromVector(dx,dy)??b.facing;b.state='chase';this.hooks.sync(b);s.endsAt=now;return;}
    const keys=(Object.keys(CALON_SKILLS)as CalonSkill[]).filter(k=>CALON_SKILLS[k].phase<=s.phase&&(this.ready.get(k)??0)<=now);const infected=this.players().some(([pid])=>(s.infections.get(pid)?.stacks??0)>0),broken=[...s.connections.values()].some(n=>n.broken);const choice=broken&&s.phase>=2&&keys.includes('cursed-altar')?'cursed-altar':infected&&s.phase>=3&&keys.includes('soul-harvest')?'soul-harvest':infected&&s.phase>=2&&keys.includes('soul-withering')?'soul-withering':null;if(s.phase===3&&keys.includes('night-of-a-thousand-curses'))this.start('night-of-a-thousand-curses',target[0]);else if(choice)this.start(choice,target[0]);else if(keys.length)this.start(keys[this.deck++%keys.length]!,target[0]);
  }
}
