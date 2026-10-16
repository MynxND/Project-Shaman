import Phaser from 'phaser';
import type {CalonSkill} from '@shaman/shared';
import type {BossHazardState} from '@shaman/schema';
import {CalonVfx,preloadCalonArt} from './CalonVfx';
import {CalonMotion,calonActorFrame,CALON_FACES} from './calon-motion';
export interface CalonPreviewControl{skill:CalonSkill;facing:string;action:string;paused:boolean;speed:number;restart:number;seek:number;zoom:number}
interface Clip{skill:string;face:string;duration:number;cues:BossHazardState[];actor:{at:number;x:number;y:number;facing:string;mode:string;stage:number}[]}
/** Recorded authoritative combat and a separate, explicitly labelled authored motion inspector. */
export function createCalonPreview(parent:HTMLElement,read:()=>CalonPreviewControl,report:(s:string)=>void){
 class Lab extends Phaser.Scene{
  private fx!:CalonVfx;private actor!:Phaser.GameObjects.Image;private clips:Clip[]=[];private age=0;private restart=-1;private seek=-1;private at=0;private intervals:number[]=[];private gait=new CalonMotion();
  preload(){preloadCalonArt(this);this.load.spritesheet('ca:lab-actor','/assets/boss/calon-arang/actor.png',{frameWidth:240,frameHeight:240});this.load.json('ca:clips','/boss-review/calon-arang/clips.json');}
  create(){this.clips=this.cache.json.get('ca:clips') as Clip[];this.textures.get('ca:lab-actor').setFilter(Phaser.Textures.FilterMode.NEAREST);this.add.rectangle(24*32,24.5*32,34*32,27*32,0x28302b).setDepth(-3);this.actor=this.add.image(24*32,20*32,'ca:lab-actor').setOrigin(.5,232/240).setScale(.95);this.fx=new CalonVfx(this);this.fit();this.scale.on('resize',this.fit,this);this.events.once('shutdown',()=>{this.scale.off('resize',this.fit,this);this.fx.destroy();if(this.textures.exists('ca:lab-actor'))this.textures.remove('ca:lab-actor');});}
  private fit(){this.cameras.main.setZoom(Math.min(this.scale.width/1200,this.scale.height/1000)).centerOn(24*32,24.5*32).setRoundPixels(true);}
  update(time:number,delta:number){const c=read(),clip=this.clips.find(x=>x.skill===c.skill&&x.face===c.facing);if(!clip)return;const motion=c.action!=='combat',duration=motion?c.action==='walk'?1200:3000:clip.duration;
   if(this.restart!==c.restart){this.restart=c.restart;this.age=0;this.gait.reset();}if(this.seek!==c.seek){this.seek=c.seek;this.age=c.seek;}if(!c.paused)this.age+=delta*c.speed;if(this.age>duration)this.age=0;
   this.cameras.main.setZoom(Math.min(this.scale.width/1200,this.scale.height/1000)*c.zoom).centerOn(24*32,(motion?24:24.5)*32-(motion?110:0));const face=Math.max(0,(CALON_FACES as readonly string[]).indexOf(c.facing));
   if(motion){const frame=c.action==='walk'?8+face*16+Math.floor(this.age/duration*16)%16:c.action==='cast'?136+face*16+Math.min(15,Math.floor(this.age/duration*16)):c.action==='death'?264+Math.min(7,Math.floor(this.age/duration*8)):face;this.actor.setFrame(frame).setPosition(24*32,24*32).setDepth(24*32);this.fx.update([],this.age);}
   else{const sample=clip.actor[Math.min(clip.actor.length-1,Math.floor(this.age/50))]!,walk=this.gait.sample(sample.x,sample.y,sample.mode==='reposition');this.actor.setFrame(calonActorFrame(sample.mode,c.skill,0,this.age,sample.facing,clip.cues,walk)).setPosition(sample.x*32,sample.y*32).setDepth(sample.y*32);this.fx.update(clip.cues.map(h=>({...h,id:c.skill+':'+c.facing+':'+h.id})),this.age,'awake',50);}
   this.intervals.push(delta);if(this.intervals.length>1800)this.intervals.shift();if(time-this.at>250){this.at=time;const sorted=[...this.intervals].sort((a,b)=>a-b);report(`${motion?'authored motion inspector':'CombatSystem recording · 50ms'} · ${Math.round(this.age)}/${duration}ms · frame ${this.actor.frame.name} · ${this.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas'} · VFX CPU p95 ${this.fx.stats.cpuP95.toFixed(3)}ms · frame p95 ${(sorted[Math.floor(sorted.length*.95)]??0).toFixed(2)}ms · ${this.fx.stats.views}/24 views · particles ${this.fx.stats.particles}/64 peak ${this.fx.stats.peakParticles} · ${this.intervals.length} samples`);}
  }
 }
 const game=new Phaser.Game({type:Phaser.AUTO,parent,pixelArt:true,backgroundColor:'#14221f',scale:{mode:Phaser.Scale.NONE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight)},scene:Lab});const observer=new ResizeObserver(()=>{const w=Math.round(parent.clientWidth),h=Math.round(parent.clientHeight);if(w>0&&h>0&&game.isBooted&&(w!==game.scale.width||h!==game.scale.height))game.scale.resize(w,h);});observer.observe(parent);return{destroy(remove:boolean){observer.disconnect();game.destroy(remove);}};
}
