import type Phaser from'phaser';
import type{VfxFamily}from'@shaman/shared';
import{DARKNESS_DEPTH}from'./Lighting';
import{orientedShotPixels,orbPalette,orbTravel}from'./monster-orb-model';
type Point={x:number;y:number};
interface Flight{from:Point;to:Point;start:number;ms:number;family:VfxFamily;motif?:string;beat:number;core:Phaser.GameObjects.Graphics;trails:Phaser.GameObjects.Graphics[]}
/** One bounded presentation layer. Server events launch; scene time moves and disposes every object. */
export class MonsterOrbLayer{
 private readonly flights=new Set<Flight>();
 constructor(private readonly scene:Phaser.Scene){scene.events.once('shutdown',()=>this.destroy());}
 launch(from:Point,to:Point,ms:number,family:VfxFamily,motif?:string){
  if(!Number.isFinite(ms)||ms<0||![from.x,from.y,to.x,to.y].every(Number.isFinite))return;
  if(this.flights.size>=48)this.remove(this.flights.values().next().value!);
  const core=this.scene.add.graphics().setDepth(DARKNESS_DEPTH+1);
  const trails=[0,1].map(()=>this.scene.add.graphics().setDepth(DARKNESS_DEPTH+1));
  const f:Flight={from:{...from},to:{...to},start:this.scene.time.now,ms:Math.max(1,ms),family,motif,beat:-1,core,trails};this.flights.add(f);this.position(f,0);
 }
 private position(f:Flight,elapsed:number){
  const p=orbTravel(f.from,f.to,elapsed,f.ms);f.core.setPosition(p.x,p.y);
  // Eight silhouette beats per flight, with no per-frame display-object allocation.
  const beat=Math.floor(p.progress*8);
  if(beat!==f.beat){f.beat=beat;const palette=orbPalette(f.family),pixels=orientedShotPixels(f.motif,p.progress,f.to.x-f.from.x,f.to.y-f.from.y);
   f.core.clear();for(const[x,y,w,h,c]of pixels)f.core.fillStyle(palette[c],1).fillRect(x,y,w,h);
   f.trails.forEach((trail,i)=>{trail.clear();for(const[x,y,w,h,c]of pixels.filter((_,j)=>j%(3+i)===0))trail.fillStyle(palette[c],.3-i*.1).fillRect(x,y,w,h);});
  }
  f.trails.forEach((trail,i)=>{const q=orbTravel(f.from,f.to,Math.max(0,elapsed-(i+1)*35),f.ms);trail.setPosition(q.x,q.y).setAlpha(Math.min(1,elapsed/70));});
 }
 update(){for(const f of this.flights){const elapsed=this.scene.time.now-f.start;if(elapsed>=f.ms){this.scene.events.emit('ranged:arrival');this.remove(f);}else this.position(f,elapsed);}}
 private remove(f:Flight){f.core.destroy();for(const trail of f.trails)trail.destroy();this.flights.delete(f);}
 destroy(){for(const f of this.flights)this.remove(f);}
}
