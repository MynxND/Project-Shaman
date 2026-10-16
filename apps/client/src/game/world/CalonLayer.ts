import Phaser from 'phaser';
import type {Room} from '@colyseus/sdk';
import type {GameState} from '@shaman/schema';
import {CALON_SOURCE,CALON_WELLS,WORLD_UNIT_PX as U} from '@shaman/shared';
import {CalonVfx} from '../vfx/boss/CalonVfx';
import {CalonMotion,calonActorFrame} from '../vfx/boss/calon-motion';
import type {MonsterLayer} from './MonsterLayer';
export class CalonLayer {
  private fx:CalonVfx;private off:()=>void;private clock=0;private sampled=0;private reportAt=0;private motion=new CalonMotion();
  private aura:Phaser.GameObjects.Image;private sourceAura:Phaser.GameObjects.Image;
  private lastFrame=0;private frameIntervals:number[]=[];
  private actionAt=-1;private countered=false;private observed=false;private contacts=new Set<string>();
  constructor(private scene:Phaser.Scene,private actors:MonsterLayer,private room:()=>Room<GameState>|null){
    this.fx=new CalonVfx(scene);
    // Authored non-damaging phase/ritual presence, separate from authoritative attack footprints.
    this.aura=scene.add.image(0,0,'ca:plague-bloom').setVisible(false);
    this.sourceAura=scene.add.image(CALON_SOURCE.x*U,CALON_SOURCE.y*U-26,'ca:plague-bloom').setVisible(false);
    const command=(e:Event)=>{const r=room(),d=(e as CustomEvent).detail;if(!r||!d)return;if(d.action==='interact')r.send('calon:interact',d.kind);else if(process.env.NODE_ENV==='development')r.send('calon:review',d);};
    const interact=()=>{const r=room(),p=r?.state.players.get(r.sessionId);if(!r||!p)return;if(CALON_WELLS.some(w=>Math.hypot(w.x-p.x,w.y-p.y)<=2))r.send('calon:interact','cleanse');else if(Math.hypot(CALON_SOURCE.x-p.x,CALON_SOURCE.y-p.y)<=2)r.send('calon:interact','purify');};
    window.addEventListener('calon:command',command);scene.input.keyboard?.on('keydown-E',interact);this.off=()=>{window.removeEventListener('calon:command',command);scene.input.keyboard?.off('keydown-E',interact);};
  }
  update(time:number){const frameDelta=this.lastFrame?Math.max(0,time-this.lastFrame):16.67;if(this.lastFrame){this.frameIntervals.push(time-this.lastFrame);if(this.frameIntervals.length>1800)this.frameIntervals.shift();}this.lastFrame=time;const r=this.room(),s=r?.state.calon.get('calon-arang');if(!r||!s){this.fx.update([],time);return;}if(this.clock!==s.now){this.clock=s.now;this.sampled=time;}const now=this.clock+Math.min(150,Math.max(0,time-this.sampled));this.fx.update(s.hazards.values(),now,'awake',s.contactStep);
    const camera=this.scene.cameras.main,short=this.scene.scale.height<=500&&this.scene.scale.width>this.scene.scale.height,finale=s.skill==='night-of-a-thousand-curses'&&now<s.actionAt+45000,desired=(finale?(short?-1:2.5):(short?6:5))*U;camera.setFollowOffset(0,camera.followOffset.y+(desired-camera.followOffset.y)*(1-Math.exp(-frameDelta/180)));
    const sound=(key:string,volume:number)=>{if(!this.scene.sound.locked&&this.scene.cache.audio.exists('ca:'+key))this.scene.sound.play('ca:'+key,{volume});};
    if(this.actionAt!==s.actionAt){if(this.actionAt>=0&&now-s.actionAt<180)sound('charge',.18);this.actionAt=s.actionAt;}
    if(this.observed&&s.countered&&!this.countered)sound('relic',.18);this.countered=s.countered;
    const ids=new Set([...s.hazards.values()].map(h=>h.id));for(const id of this.contacts)if(!ids.has(id))this.contacts.delete(id);
    for(const h of s.hazards.values())if(now>=h.startsAt&&now<h.startsAt+180&&!this.contacts.has(h.id)){this.contacts.add(h.id);if(!this.observed)continue;sound('contact',.14);if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&['thousand-cursed-hands','night-of-a-thousand-curses'].includes(h.skill))camera.shake(55,.0005);}this.observed=true;

    this.aura.setVisible(false);this.sourceAura.setVisible(false);
    const body=[...r.state.monsters.entries()].find(([,m])=>m.kind==='calon-arang');if(body){const[id,m]=body,sp=this.actors.spriteOf(id);if(sp&&m.state!=='dead'){const walk=this.motion.sample(sp.x/U,sp.y/U,s.mode==='reposition');sp.anims.stop();sp.setFrame(calonActorFrame(s.mode,s.skill,s.actionAt,now,m.facing,s.hazards.values(),walk));
      const transition=s.mode==='transition',ritual=s.mode==='ultimate',key=s.phase===3?'plague-eclipse':'black-ritual';
      if(s.phase>1&&this.scene.textures.exists('ca:'+key)){const t=Math.max(0,Math.min(1,(now-s.actionAt)/2600)),frame=transition?Math.min(15,Math.floor(t*16)):4+Math.floor(now/150)%4;this.aura.setTexture('ca:'+key,frame).setPosition(sp.x,sp.y-55).setDisplaySize(transition?300:225,transition?240:180).setAlpha(transition ? .45*Math.sin(t*Math.PI) : ritual ? .2 : .1).setDepth(sp.y-1).setVisible(true);}
      const sourceKey='cursed-altar';if((s.purifyOwner||ritual)&&this.scene.textures.exists('ca:'+sourceKey))this.sourceAura.setTexture('ca:'+sourceKey,4+Math.floor(now/120)%4).setDisplaySize(130,130).setAlpha(s.purifyOwner ? .38 : .15).setDepth(CALON_SOURCE.y*U-1).setVisible(true);
    }}
    if(time-this.reportAt>120){this.reportAt=time;const p=r.state.players.get(r.sessionId),infection=s.infections.get(r.sessionId),uncut=[...s.connections.values()].filter(n=>!n.broken).length;
      const sorted=[...this.frameIntervals].sort((a,b)=>a-b);
      window.dispatchEvent(new CustomEvent('calon:snapshot',{detail:{hp:s.hp,hpMax:s.hpMax,phase:s.phase,mode:s.mode,skill:s.skill,hint:s.hint,stage:s.ultimateStage,countered:s.countered,uncut,infection:infection?.stacks??0,purify:s.purifyProgress,nearWell:!!p&&CALON_WELLS.some(w=>Math.hypot(w.x-p.x,w.y-p.y)<=2),nearSource:!!p&&Math.hypot(CALON_SOURCE.x-p.x,CALON_SOURCE.y-p.y)<=2,vfx:{...this.fx.stats,frameP95:sorted[Math.floor(sorted.length*.95)]??0,samples:sorted.length,renderer:this.scene.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas',objects:this.scene.children.length}}}));}
  }
  destroy(){this.off();this.fx.destroy();this.aura.destroy();this.sourceAura.destroy();this.motion.reset();window.dispatchEvent(new CustomEvent('calon:snapshot',{detail:null}));}
}
