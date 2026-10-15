import type Phaser from'phaser';import{FACINGS,type Facing}from'@shaman/shared';import{DARKNESS_DEPTH}from'./Lighting';import{orbTravel}from'./monster-orb-model';
import{MONSTER_ART_VFX,artFlightTip,monsterArtVfxUrl}from'./monster-vfx-art-model';
const key=(style:string)=>'monster-art-vfx:'+style;
export function preloadMonsterArtVfx(scene:Phaser.Scene,kinds:Iterable<string>){const styles=new Set([...kinds].map(k=>MONSTER_ART_VFX[k]).filter((s):s is string=>s!==undefined));for(const style of styles)if(!scene.textures.exists(key(style))){scene.load.spritesheet(key(style),monsterArtVfxUrl(style),{frameWidth:160,frameHeight:160});scene.events.once('shutdown',()=>{if(scene.textures.exists(key(style)))scene.textures.remove(key(style));});}}
type P={x:number;y:number};interface Flight{source:string;from:P;to:P;start:number;ms:number;face:Facing;phase:'flight'|'wait'|'impact';impactAt:number;arrival:boolean;core:Phaser.GameObjects.Image;trails:Phaser.GameObjects.Image[];flash:Phaser.GameObjects.Image}
/** Thick authored art, separated flight and server-confirmed impact. Ideas studied from haowg/GODOT-VFX-LIBRARY (MIT); no Godot runtime required. */
export class MonsterArtVfxLayer{
 private flights=new Set<Flight>();constructor(private scene:Phaser.Scene){for(const s of new Set(Object.values(MONSTER_ART_VFX)))if(scene.textures.exists(key(s)))scene.textures.get(key(s)).setFilter(1);scene.events.once('shutdown',()=>this.destroy());}
 launch(source:string,kind:string,face:Facing,from:P,to:P,ms:number){if(!Number.isFinite(ms)||ms<=0||![from.x,from.y,to.x,to.y].every(Number.isFinite))return false;const style=MONSTER_ART_VFX[kind];if(!style||!this.scene.textures.exists(key(style)))return false;if(this.flights.size>=32)this.remove(this.flights.values().next().value!);
 const index=FACINGS.indexOf(face)*8,make=()=>this.scene.add.image(from.x,from.y,key(style),index).setDepth(DARKNESS_DEPTH+1).setScale(.62),core=make(),trails=[make().setAlpha(.17),make().setAlpha(.08)],flash=make().setFrame(index+4).setOrigin(.5).setScale(.2).setAlpha(.8);
 // Pivot sits at the leading edge, so the visible front reaches aim at the damage deadline.
 const tip=artFlightTip(face,style);core.setOrigin(tip.x/160,tip.y/160);for(const t of trails)t.setOrigin(tip.x/160,tip.y/160);
 this.flights.add({source,from:{...from},to:{...to},start:this.scene.time.now,ms:Math.max(1,ms),face,phase:'flight',impactAt:0,arrival:false,core,trails,flash});return true;}
 impact(source:string){for(const f of this.flights)if(f.source===source&&f.phase!=='impact'){if(!f.arrival){f.arrival=true;this.scene.events.emit('ranged:arrival');}f.phase='impact';f.impactAt=this.scene.time.now;f.core.setOrigin(.5).setPosition(f.to.x,f.to.y).setScale(.78);f.flash.setVisible(false);for(const t of f.trails)t.setVisible(false);}}
 update(){const now=this.scene.time.now;for(const f of this.flights){const age=now-f.start,index=FACINGS.indexOf(f.face)*8;if(f.phase==='impact'){const p=(now-f.impactAt)/280;if(p>=1){this.remove(f);continue;}f.core.setFrame(index+4+Math.min(3,Math.floor(p*4))).setAlpha(1-p*.7).setScale(.78+p*.16);continue;}
 const p=orbTravel(f.from,f.to,age,f.ms);if(age>=f.ms){if(!f.arrival){f.arrival=true;this.scene.events.emit('ranged:arrival');}f.phase='wait';f.core.setPosition(Math.round(f.to.x),Math.round(f.to.y));f.core.setAlpha(Math.max(0,.28*(1-(age-f.ms)/150)));for(const t of f.trails)t.setVisible(false);f.flash.setVisible(false);if(age>=f.ms+180)this.remove(f);continue;}
 const grow=Math.min(1,.3+age/110);f.core.setPosition(p.x,p.y).setFrame(index+Math.floor(age/80)%4).setScale(.62*grow).setAlpha(.95);
 f.trails.forEach((t,i)=>{const q=orbTravel(f.from,f.to,Math.max(0,age-(i+1)*45),f.ms);t.setPosition(q.x,q.y).setFrame(index+Math.floor(Math.max(0,age-(i+1)*45)/80)%4).setScale(.62*grow).setAlpha(age<50?0:.15/(i+1));});
 f.flash.setAlpha(Math.max(0,1-age/90)).setScale(.2+Math.min(90,age)/300);
 }}
 private remove(f:Flight){f.core.destroy();f.flash.destroy();for(const t of f.trails)t.destroy();this.flights.delete(f);}destroy(){for(const f of this.flights)this.remove(f);}
}
