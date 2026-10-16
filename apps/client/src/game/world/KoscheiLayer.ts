import Phaser from 'phaser';
import type {Room} from '@colyseus/sdk';
import type {GameState} from '@shaman/schema';
import {KOSCHEI_RELICS,WORLD_UNIT_PX as U} from '@shaman/shared';
import {KoscheiVfx} from '../vfx/boss/KoscheiVfx';
import {koscheiPose} from '../vfx/boss/koschei-pose';
import type {MonsterLayer} from './MonsterLayer';
export class KoscheiLayer{
  private fx:KoscheiVfx;private off:()=>void;private clock=0;private sampled=0;private reportAt=0;
  private transformation:Phaser.GameObjects.Image;
  private action=-1;private relicStage=-1;private contacts=new Set<string>();
  constructor(private scene:Phaser.Scene,private actors:MonsterLayer,private room:()=>Room<GameState>|null){
    this.fx=new KoscheiVfx(scene);
    this.transformation=scene.add.image(0,0,'kos:immortal-rebirth',0).setVisible(false);
    const command=(e:Event)=>{const r=room(),d=(e as CustomEvent).detail;if(!r||!d)return;if(d.action==='relic')r.send('koschei:relic',d.relic);else if(process.env.NODE_ENV==='development')r.send('koschei:review',d);};
    const interact=()=>{const r=room(),p=r?.state.players.get(r.sessionId),s=r?.state.koschei.get('koschei'),node=s?KOSCHEI_RELICS[s.relicStage]:undefined;if(r&&p&&node&&Math.hypot(p.x-node.x,p.y-node.y)<=2)r.send('koschei:relic',node.id);};
    window.addEventListener('koschei:command',command);scene.input.keyboard?.on('keydown-E',interact);this.off=()=>{window.removeEventListener('koschei:command',command);scene.input.keyboard?.off('keydown-E',interact);};
  }
  update(time:number){const r=this.room(),s=r?.state.koschei.get('koschei');if(!r||!s){this.fx.update([],time);this.transformation.setVisible(false);return;}
    if(this.clock!==s.now){this.clock=s.now;this.sampled=time;}const now=this.clock+Math.min(150,Math.max(0,time-this.sampled));this.fx.update(s.hazards.values(),now);
    const sound=(key:string,volume:number)=>{if(!this.scene.sound.locked&&this.scene.cache.audio.exists('kos:'+key))this.scene.sound.play('kos:'+key,{volume});};
    if(this.action!==s.actionAt){if(this.action>=0&&now-s.actionAt<180)sound('charge',.18);this.action=s.actionAt;}
    if(this.relicStage!==s.relicStage){if(this.relicStage>=0&&s.relicStage>this.relicStage)sound('relic',.18);this.relicStage=s.relicStage;}
    for(const h of s.hazards.values())if(now>=h.startsAt&&now<h.startsAt+180&&!this.contacts.has(h.id)){this.contacts.add(h.id);sound('contact',.14);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.scene.cameras.main.shake(65,.0007);}
    for(const id of this.contacts)if(!s.hazards.has(id))this.contacts.delete(id);
    const body=[...r.state.monsters.entries()].find(([,m])=>m.kind==='koschei');if(body){const[id,m]=body,sp=this.actors.spriteOf(id);if(sp&&m.state!=='dead'){sp.anims.stop();sp.setFrame(koscheiPose(s.mode,s.skill,s.actionAt,now,m.facing,s.hazards.values()).actorFrame);if(s.phase>=2)sp.setY(m.y*U-3-Math.sin(now*.003)*2);}
      this.transformation.setVisible(m.state!=='dead'&&(s.mode==='transition'||s.mode==='ultimate'||s.healing));
      if(this.transformation.visible){const transition=s.mode==='transition',q=transition?Math.max(0,Math.min(1,(now-s.actionAt)/2600)):Math.min(1,s.ultimateStage/5);this.transformation.setTexture(s.mode==='ultimate'?'kos:the-last-needle':'kos:immortal-rebirth',Math.min(7,Math.floor(q*8))).setPosition(m.x*U,m.y*U-55).setDisplaySize(250,250).setAlpha(transition?Math.sin(q*Math.PI)*.38:.2).setDepth(m.y*U-1);}
    }
    for(const[i,node]of KOSCHEI_RELICS.entries()){const prop=this.scene.children.getByName('kos-relic-'+node.id)as Phaser.GameObjects.Image|undefined;prop?.setVisible(i===s.relicStage).setAlpha(s.mode==='transition'?.35:1);const label=this.scene.children.getByName('kos-label-'+node.id);if(label) (label as Phaser.GameObjects.Text).setVisible(i===s.relicStage);}
    const needle=this.actors.spriteOf('koschei-hidden-needle');if(needle&&r.state.monsters.get('koschei-hidden-needle')?.state!=='dead')needle.setVisible(s.needleExposed).setAlpha(s.needleExposed?1:0);
    if(time-this.reportAt>120){this.reportAt=time;const p=r.state.players.get(r.sessionId),node=KOSCHEI_RELICS[s.relicStage];window.dispatchEvent(new CustomEvent('koschei:snapshot',{detail:{hp:s.hp,hpMax:s.hpMax,phase:s.phase,mode:s.mode,skill:s.skill,relicStage:s.relicStage,hint:s.hint,exposed:s.needleExposed,broken:s.needleBroken,healing:s.healing,stage:s.ultimateStage,countered:s.countered,nearby:node&&p&&Math.hypot(p.x-node.x,p.y-node.y)<=2?node.id:null,vfx:this.fx.stats}}));}
  }
  destroy(){this.off();this.fx.destroy();this.transformation.destroy();window.dispatchEvent(new CustomEvent('koschei:snapshot',{detail:null}));}
}
