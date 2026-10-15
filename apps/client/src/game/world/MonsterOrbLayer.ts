import type Phaser from'phaser';
import type{VfxFamily}from'@shaman/shared';
import{DARKNESS_DEPTH}from'./Lighting';
import{ORB_PIXELS,orbPalette,orbTravel}from'./monster-orb-model';
type Point={x:number;y:number};
interface Flight{from:Point;to:Point;start:number;ms:number;core:Phaser.GameObjects.Graphics;trails:Phaser.GameObjects.Graphics[]}
/** One bounded presentation layer. Server events launch; scene time moves and disposes every object. */
export class MonsterOrbLayer{
 private readonly flights=new Set<Flight>();
 constructor(private readonly scene:Phaser.Scene){scene.events.once('shutdown',()=>this.destroy());}
 launch(from:Point,to:Point,ms:number,family:VfxFamily){
  if(!Number.isFinite(ms)||ms<0||![from.x,from.y,to.x,to.y].every(Number.isFinite))return;
  if(this.flights.size>=48)this.remove(this.flights.values().next().value!);
  const palette=orbPalette(family),core=this.scene.add.graphics().setDepth(DARKNESS_DEPTH+1);
  for(const[x,y,w,h,token]of ORB_PIXELS)core.fillStyle(palette[token],1).fillRect(x,y,w,h);
  const trails=[5,3].map(size=>this.scene.add.graphics().setDepth(DARKNESS_DEPTH+1).fillStyle(palette.body,.65).fillRect(Math.floor(-size/2),Math.floor(-size/2),size,size));
  const f={from:{...from},to:{...to},start:this.scene.time.now,ms:Math.max(1,ms),core,trails};this.flights.add(f);this.position(f,0);
 }
 private position(f:Flight,elapsed:number){
  const p=orbTravel(f.from,f.to,elapsed,f.ms);f.core.setPosition(p.x,p.y);
  f.trails.forEach((trail,i)=>{const q=orbTravel(f.from,f.to,Math.max(0,elapsed-(i+1)*35),f.ms);trail.setPosition(q.x,q.y).setAlpha(Math.min(1,elapsed/70));});
 }
 update(){for(const f of this.flights){const elapsed=this.scene.time.now-f.start;if(elapsed>=f.ms)this.remove(f);else this.position(f,elapsed);}}
 private remove(f:Flight){f.core.destroy();for(const trail of f.trails)trail.destroy();this.flights.delete(f);}
 destroy(){for(const f of this.flights)this.remove(f);}
}
