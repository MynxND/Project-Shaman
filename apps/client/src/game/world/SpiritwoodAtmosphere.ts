import Phaser from 'phaser';
import { WORLD_UNIT_PX, pointInRect, type MapDefinition } from '@shaman/shared';
import presentation from './leveling-presentation.json';

// Presentation from leveling-first-four/plan.json. Keep authoritative geometry untouched.
export function addSpiritwoodAtmosphere(scene: Phaser.Scene, map: MapDefinition, override?:{fog:{id:string;x:number;y:number;w:number;h:number;alpha:number}[];graph:{edges:{points:number[][];width:number}[]}}) {
  const profile = override ?? (presentation as Record<string,{fog:{id:string;x:number;y:number;w:number;h:number;alpha:number}[];graph:{edges:{points:number[][];width:number}[]}}>)[map.id];
  if (!profile) return;
  const key = 'spiritwood:ground-mist';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 64, 24);
    if (!texture) return;
    texture.context.fillStyle = '#9dafac';
    for (const [x,y,w,h] of [[0,11,13,5],[7,7,20,9],[21,5,23,11],[40,9,18,8],[51,12,13,4],[12,16,22,3],[30,17,18,2]]) {
      texture.context.fillRect(x!,y!,w!,h!);
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const zones = profile.fog;
  const nearApproach = (x:number,y:number)=>profile.graph.edges.some(e=>e.points.slice(1).some((b,i)=>{
    const a=e.points[i]!,dx=b[0]!-a[0]!,dy=b[1]!-a[1]!;
    const t=Math.max(0,Math.min(1,((x-a[0]!)*dx+(y-a[1]!)*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(x-a[0]!-t*dx,y-a[1]!-t*dy)<e.width/2+.5;
  }));
  const sprites: {sprite:Phaser.GameObjects.Image;x:number;y:number;phase:number}[] = [];
  for (const zone of zones) {
    for (const [i, p] of [[.2,.3],[.65,.25],[.35,.65],[.75,.7],[.55,.48],[.15,.8]].entries()) {
      const x=zone.x+p[0]!*zone.w, y=zone.y+p[1]!*zone.h;
      // Keep the central approach, safe village, NPCs and warp triggers readable.
      if (nearApproach(x,y) || (map.safeZones??[]).some(r=>pointInRect({x,y},r)) || (map.portals??[]).some(p=>pointInRect({x,y},p.area))) continue;
      sprites.push({sprite:scene.add.image(x*WORLD_UNIT_PX,y*WORLD_UNIT_PX,key).setScale(2).setAlpha(zone.alpha).setDepth(-1.4).setName(zone.id),x,y,phase:i});
    }
  }
  let elapsed=0;
  const update=(_time:number,delta:number)=>{
    elapsed+=delta;
    for(const f of sprites) f.sprite.setX((f.x+Math.sin(elapsed*.00008+f.phase)*.45)*WORLD_UNIT_PX);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE,update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));
}
