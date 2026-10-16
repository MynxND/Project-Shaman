import { BossHazardState, KoscheiEncounterState, MonsterState } from '@shaman/schema';
import { KOSCHEI_HP, KOSCHEI_SKILLS, KOSCHEI_RELICS, KOSCHEI_NEEDLE, koscheiClamp, koscheiHit, inKoscheiCourt, createMonster, facingFromVector, type KoscheiSkill, type MonsterMotion, type Position } from '@shaman/shared';
import type { CombatHost } from './combat-system.js';
interface Hooks{sync(m:MonsterMotion):void;hit(id:string,m:MonsterMotion,damage:number):void;reset(id:string):void}
interface Area{state:BossHazardState;damage:number;hit:Set<string>;previous:number}
const distance=(a:Position,b:Position)=>Math.hypot(a.x-b.x,a.y-b.y);
/** Clip a ray by one common distance: independent X/Y clamping bends its aim. */
const courtRay=(a:Position,angle:number,length:number):Position=>{const dx=Math.cos(angle)*length,dy=Math.sin(angle)*length;const q=Math.min(1,Math.abs(dx)<1e-9?1:((dx>0?38:10)-a.x)/dx,Math.abs(dy)<1e-9?1:((dy>0?35:14)-a.y)/dy);return{x:a.x+dx*q,y:a.y+dy*q};};
/** Boss5: externalized death, not a dream-state variant. All decisions use room time. */
export class KoscheiEncounter{
  readonly state=new KoscheiEncounterState();
  private tasks:{at:number;run():void}[]=[];private areas=new Map<string,Area>();
  private ready=new Map<string,number>();private seq=0;private deck=0;private emptyAt=0;
  private manual=false;private interacted=new Map<string,number>();private healAt=0;
  constructor(private host:CombatHost,private monsters:Map<string,MonsterMotion>,private hooks:Hooks){host.state.koschei.set('koschei',this.state);this.reset();}
  get body(){return [...this.monsters.values()].find(m=>m.kind==='koschei');}
  get needle(){return this.monsters.get('koschei-hidden-needle');}
  controlled(m:MonsterMotion){return m.kind==='koschei'||m.kind==='koschei-needle';}
  object(m:MonsterMotion){return m.kind==='koschei-needle';}
  private players(){return [...this.host.state.players.entries()].filter(([,p])=>!p.dead&&inKoscheiCourt(p));}
  private later(ms:number,run:()=>void){this.tasks.push({at:this.host.now()+ms,run});}
  private clear(){this.tasks=[];this.areas.clear();this.state.hazards.clear();this.state.healing=false;}
  private relicReset(){
    let m=this.needle;
    if(!m){m=createMonster('koschei-hidden-needle','koschei-needle',this.host.map.spawnRegions![0]!,KOSCHEI_NEEDLE,this.host.now());m.summoned=true;this.monsters.set(m.id,m);const s=new MonsterState();s.kind=m.kind;this.host.state.monsters.set(m.id,s);}
    Object.assign(m,{hp:120,state:'idle',targetId:null,x:24,y:25});this.hooks.reset(m.id);this.hooks.sync(m);
    Object.assign(this.state,{relicStage:0,needleExposed:false,needleBroken:false,hint:'เปิดโอ๊กเพื่อค้นหาความตายที่ซ่อนอยู่'});this.interacted.clear();
  }
  reset(){this.clear();this.ready.clear();this.deck=0;this.emptyAt=0;const b=this.body;if(b){Object.assign(b,{hp:KOSCHEI_HP,state:'idle',targetId:null,x:24,y:20,facing:'south'});this.hooks.reset(b.id);this.hooks.sync(b);}Object.assign(this.state,{phase:1,mode:'dormant',skill:'',now:this.host.now(),hp:KOSCHEI_HP,hpMax:KOSCHEI_HP,ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:0});this.relicReset();}
  filterDamage(m:MonsterMotion,amount:number,playerId:string){
    const p=this.host.state.players.get(playerId);if(this.controlled(m)&&(!p||p.dead||!inKoscheiCourt(p)))return 0;
    if(m.kind==='koschei-needle')return this.state.needleExposed?amount:0;
    if(m.kind!=='koschei')return amount;
    if(['dormant','transition','defeated'].includes(this.state.mode))return 0;
    const floor=this.state.phase===1?14700:this.state.phase===2?7350:this.state.needleBroken?0:1;
    return Math.min(Math.max(0,m.hp-floor),Math.round(amount*(this.state.mode==='stagger'?1.5:this.state.phase===3&&this.state.needleExposed?1.25:1)));
  }
  objectDied(){
    this.state.needleExposed=false;this.state.needleBroken=true;this.state.countered=this.state.mode==='ultimate';
    this.clear();this.state.mode='stagger';this.state.endsAt=this.host.now()+4500;this.state.hint='เข็มแตกแล้ว · จอมเวทสิ้นความเป็นอมตะ';
    if(this.state.countered)this.state.ultimateStage=5;
    if(this.body){this.body.state='idle';this.hooks.sync(this.body);}
  }
  /** Only the currently released object can be opened, at actual player proximity. */
  interact(id:string,relic:unknown){
    const p=this.host.state.players.get(id),s=this.state,node=KOSCHEI_RELICS[s.relicStage];
    if(!p||p.dead||!inKoscheiCourt(p)||!node||node.id!==relic||distance(p,node)>2||['dormant','transition','defeated'].includes(s.mode)||this.host.now()-(this.interacted.get(id)??-1000)<350)return false;
    this.interacted.set(id,this.host.now());s.relicStage++;s.hint=s.relicStage===5?'ไข่เปิดแล้ว · โจมตีเข็มที่กลางลาน':`ค้นพบ ${KOSCHEI_RELICS[s.relicStage]!.name}`;
    if(s.relicStage===5)s.needleExposed=true;
    if(s.healing){this.clear();s.mode='stagger';s.endsAt=this.host.now()+3000;s.hint='เปิดผนึกสำเร็จ · ตัดการฟื้นคืนชีพ';if(this.body){this.body.state='idle';this.hooks.sync(this.body);}}
    else if(s.phase===1&&s.relicStage===2&&s.mode!=='ultimate'){this.clear();s.mode='stagger';s.endsAt=this.host.now()+2200;}
    return true;
  }
  private phase(n:number){this.clear();Object.assign(this.state,{phase:n,mode:'transition',skill:n===2?'immortal-rebirth':'throne-of-bones',ultimateStage:0,countered:false,actionAt:this.host.now(),endsAt:this.host.now()+2600});this.relicReset();if(n===3)this.ready.set('the-last-needle',this.host.now()+8000);this.later(2600,()=>{this.state.mode='recovery';this.state.endsAt=this.host.now()+1000;});}
  private hazard(skill:KoscheiSkill,shape:string,at:Position,radius:number,delay:number,duration:number,extra:Partial<{toX:number;toY:number;width:number;angle:number;arc:number;actor:string;damage:number}>={}){
    if(this.areas.size>=24)throw Error('Koschei critical hazard budget exceeded');const now=this.host.now(),h=new BossHazardState(),id=`koschei-${++this.seq}`;
    Object.assign(h,{id,skill,effect:skill,actor:extra.actor??'body',shape,x:at.x,y:at.y,toX:extra.toX??at.x,toY:extra.toY??at.y,radius,width:extra.width??.65,angle:extra.angle??0,arc:extra.arc??Math.PI/2,warnAt:now,startsAt:now+delay,endsAt:now+delay+duration});this.state.hazards.set(id,h);this.areas.set(id,{state:h,damage:extra.damage??KOSCHEI_SKILLS[skill].damage,hit:new Set(),previous:now});
  }
  private lane(k:KoscheiSkill,a:Position,z:Position,t:number,width=.65,charge=false,actor='body'){this.hazard(k,charge?'charge':'capsule',a,0,t,KOSCHEI_SKILLS[k].active,{toX:z.x,toY:z.y,width,actor});}
  start(k:KoscheiSkill,id:string,review=false){
    const b=this.body,p=this.host.state.players.get(id),s=KOSCHEI_SKILLS[k],now=this.host.now();
    if(!b||!p||p.dead||!inKoscheiCourt(p)||!review&&(s.phase>this.state.phase||(this.ready.get(k)??0)>now||now<this.state.endsAt))return false;
    this.ready.set(k,now+s.cooldown);Object.assign(this.state,{skill:k,mode:k==='the-last-needle'?'ultimate':'windup',ultimateStage:k==='the-last-needle'?1:0,actionAt:now,countered:false,healing:false});b.facing=facingFromVector(p.x-b.x,p.y-b.y)??b.facing;b.state='attack';this.hooks.sync(b);
    const target=koscheiClamp(p),from={x:b.x,y:b.y},tell=s.tell;let tail=tell+s.active;
    switch(k){
      case 'gravefrost-spear':{const a=Math.atan2(target.y-b.y,target.x-b.x);for(let i=-1;i<=1;i++){const q=a+i*.24;this.lane(k,from,courtRay(from,q,12),tell+(i+1)*300,.55,false,'staff');}tail+=600;break;}
      case 'deathly-chains':this.lane(k,{x:target.x-5,y:target.y-5},{x:target.x+5,y:target.y+5},tell,.65);this.lane(k,{x:target.x+5,y:target.y-5},{x:target.x-5,y:target.y+5},tell+400,.65);tail+=400;break;
      case 'necropolis-guard':for(let i=0;i<2;i++)this.lane(k,{x:12+i*24,y:17},target,tell+i*700,.8,true,'guard');tail+=700;break;
      case 'soul-lance':{const a=Math.atan2(target.y-b.y,target.x-b.x);this.lane(k,from,courtRay(from,a,16),tell,.65,false,'staff');break;}
      case 'immortal-rebirth':
        if(this.state.relicStage>=5)this.relicReset();this.state.healing=true;this.healAt=now+tell;
        this.hazard(k,'ring',from,9,tell,s.active,{width:.6});break;
      case 'cursed-needle':for(let i=0;i<3;i++)this.later(i*1500,()=>{const p=this.host.state.players.get(id);if(p&&!p.dead)this.lane(k,KOSCHEI_NEEDLE,koscheiClamp(p),tell,.45);});tail+=3000;break;
      case 'royal-necromancy':for(let i=-1;i<=1;i++)this.hazard(k,'disk',koscheiClamp({x:target.x+i*4,y:target.y+(i===0?0:-3)}),2.4,tell+(i+1)*450,s.active);tail+=900;break;
      // Concentric bands retain a reachable inner refuge at real WALK_SPEED.
      case 'deathstorm':for(let i=0;i<3;i++)this.hazard(k,'ring',from,12,tell+i*1100,s.active,{width:.6});tail+=2200;break;
      case 'throne-of-bones':for(let i=0;i<4;i++)this.hazard(k,'sector',{x:24,y:24},16,tell+i*700,s.active,{angle:i*Math.PI/2,arc:Math.PI/2});tail+=2100;break;
      case 'soul-severance':for(let i=0;i<3;i++)this.later(i*2200,()=>{const p=this.host.state.players.get(id),b=this.body;if(!p||p.dead||!b)return;const z=koscheiClamp(p);b.facing=facingFromVector(z.x-b.x,z.y-b.y)??b.facing;this.hooks.sync(b);this.lane(k,b,z,tell,.8,true);});tail+=4400;break;
      case 'the-last-needle':this.ultimate();return true;
    }
    this.state.endsAt=now+tail+s.recovery;
    this.later(tell,()=>{this.state.mode='active';});this.later(tail,()=>{this.state.healing=false;this.state.mode='recovery';if(this.body){this.body.state='idle';this.hooks.sync(this.body);}});return true;
  }
  private ultimate(){
    this.relicReset();const s=this.state;s.ultimateStage=1;s.endsAt=this.host.now()+36400;s.hint='ความตายอยู่ในโอ๊ก · เปิดผนึกทีละชั้น';
    this.later(1600,()=>{s.ultimateStage=2;});
    this.later(3000,()=>{s.ultimateStage=3;for(const x of[10,38])this.lane('the-last-needle',{x,y:13},{x,y:36},1600,1);});
    this.later(5000,()=>{s.ultimateStage=4;});
    this.later(32000,()=>{s.ultimateStage=5;this.hazard('the-last-needle','finale',{x:24,y:24},24,1600,800);});
    this.later(34400,()=>{s.mode='recovery';s.endsAt=this.host.now()+2000;s.hint='คลื่นมรณะผ่านไป · เข็มยังรอให้ทำลาย';});
  }
  /** GameRoom independently gates these to a development single unsaved guest. */
  review(id:string,m:Record<string,unknown>){const p=this.host.state.players.get(id),profile=this.host.profile(id);if(!p||!profile)return;
    if(m.action==='prepare'){this.reset();this.manual=true;const copy=structuredClone(profile);copy.hp=copy.hpMax=4000;this.host.setProfile(id,copy);this.host.vitals(id);p.dead=false;p.x=24;p.y=30;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='auto'){this.manual=false;this.state.mode='idle';this.state.endsAt=this.host.now();}
    else if(m.action==='arrange'&&typeof m.x==='number'&&typeof m.y==='number'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&inKoscheiCourt({x:m.x,y:m.y})&&!this.areas.size&&['idle','dormant','recovery'].includes(this.state.mode)){p.x=m.x;p.y=m.y;}
    else if(m.action==='phase'&&[1,2,3].includes(Number(m.phase))){if(this.body)this.body.hp=Number(m.phase)===1?21000:Number(m.phase)===2?14700:7350;this.phase(Number(m.phase));}
    else if(m.action==='skill'&&typeof m.skill==='string'&&m.skill in KOSCHEI_SKILLS){this.clear();this.state.mode='idle';this.state.endsAt=this.host.now();this.start(m.skill as KoscheiSkill,id,true);}
  }
  step(dt:number){
    const now=this.host.now(),b=this.body,s=this.state;s.contactStep=Math.max(1,now-s.now||1000/30);s.now=now;if(!b)return;
    if(s.mode==='defeated'&&b.hp>0){this.reset();return;}s.hp=b.hp;
    if(b.hp<=0){if(s.mode!=='defeated'){this.clear();s.mode='defeated';s.actionAt=now;s.ultimateStage=0;s.needleExposed=false;const n=this.needle;if(n){n.hp=0;n.state='dead';this.hooks.sync(n);this.hooks.reset(n.id);}}return;}
    if(!this.players().length){if(!this.emptyAt)this.emptyAt=now;if(now-this.emptyAt>5000&&s.mode!=='dormant')this.reset();return;}this.emptyAt=0;
    if(s.phase===1&&b.hp<=14700)this.phase(2);else if(s.phase===2&&b.hp<=7350)this.phase(3);
    const due=this.tasks.filter(t=>t.at<=now);this.tasks=this.tasks.filter(t=>t.at>now);for(const t of due)t.run();
    if(s.healing&&now>=this.healAt){const ceiling=s.phase===2?14700:7350;b.hp=Math.min(ceiling,b.hp+150);this.healAt=now+300;this.hooks.sync(b);}
    for(const[id,a]of this.areas){const h=a.state,contact=Math.min(now,h.endsAt),previous=Math.max(h.startsAt,a.previous);if(now>=h.startsAt&&a.previous<h.endsAt){for(const[pid,p]of this.players())if(!a.hit.has(pid)&&koscheiHit(h,p,contact,previous)){a.hit.add(pid);this.hooks.hit(pid,b,a.damage);}if(h.shape==='charge'&&h.actor==='body'){const q=Math.max(0,Math.min(1,(contact-h.startsAt)/(h.endsAt-h.startsAt)));b.x=h.x+(h.toX-h.x)*q;b.y=h.y+(h.toY-h.y)*q;this.hooks.sync(b);}}a.previous=now;if(now>h.endsAt+600){this.areas.delete(id);s.hazards.delete(id);}}
    if(s.mode==='dormant'){s.mode='idle';s.endsAt=now+1200;}
    if(s.mode==='transition'||s.mode==='ultimate'||now<s.endsAt)return;s.mode='idle';if(this.manual)return;
    const target=this.players().sort((a,c)=>distance(a[1],b)-distance(c[1],b))[0];if(!target)return;
    if(distance(b,target[1])>8){s.mode='reposition';const d=distance(b,target[1]),v=Math.min(1.3*dt/1000,d-7.5),dx=(target[1].x-b.x)/d,dy=(target[1].y-b.y)/d;b.x+=dx*v;b.y+=dy*v;b.facing=facingFromVector(dx,dy)??b.facing;b.state='chase';this.hooks.sync(b);s.endsAt=now;return;}
    const keys=(Object.keys(KOSCHEI_SKILLS)as KoscheiSkill[]).filter(k=>KOSCHEI_SKILLS[k].phase<=s.phase&&(this.ready.get(k)??0)<=now);
    if(s.phase===3&&keys.includes('the-last-needle'))this.start('the-last-needle',target[0]);else if(keys.length)this.start(keys[this.deck++%keys.length]!,target[0]);
  }
}
