import Phaser from 'phaser';
import { resolveRig, type RigLook, type RigManifest, type Slot } from './separated-rig-model';

/** Actual nested display objects. Only FRONT IDLE; no world/session dependency. */
export class SeparatedFrontRig {
 readonly bodyRoot: Phaser.GameObjects.Container;
 readonly neckAnchor: Phaser.GameObjects.Container;
 readonly headRoot: Phaser.GameObjects.Container;
 private readonly body: Phaser.GameObjects.Image;
 private readonly head: Phaser.GameObjects.Image;
 private readonly children = new Map<Slot, Phaser.GameObjects.Container>();
 private readonly guides: Phaser.GameObjects.Graphics;
 constructor(private readonly scene: Phaser.Scene, readonly manifest: RigManifest, private readonly key: (id: string) => string) {
  this.bodyRoot = scene.add.container(manifest.sceneFoot.x,manifest.sceneFoot.y);
  this.body = scene.make.image({x:-manifest.bodyOrigin.x,y:-manifest.bodyOrigin.y,key:key(manifest.bodyId),add:false}).setOrigin(0);
  this.bodyRoot.add(this.body);
  const outfit=scene.make.container({x:0,y:0,add:false});this.children.set('outfit',outfit);this.bodyRoot.add(outfit);
  this.neckAnchor = scene.make.container({x:manifest.neckPivot.x-manifest.bodyOrigin.x,y:manifest.neckPivot.y-manifest.bodyOrigin.y,add:false});
  this.bodyRoot.add(this.neckAnchor);
  this.headRoot = scene.make.container({x:0,y:0,add:false}); this.neckAnchor.add(this.headRoot);
  this.head = scene.make.image({x:0,y:0,key:key(manifest.headIds[0]!),add:false}).setOrigin(0);
  // FRONT hair slots are children of HeadRoot, so all head transforms propagate.
  for(const slot of ['backHair','head','frontHair','headgear'] as const){
   const node=scene.make.container({x:0,y:0,add:false}); this.children.set(slot,node); this.headRoot.add(node);
   if(slot==='head')node.add(this.head);
  }
  for(const slot of ['weapon','offhand','accessories'] as const){const node=scene.make.container({x:0,y:0,add:false});this.children.set(slot,node);this.bodyRoot.add(node);}
  this.guides = scene.add.graphics();
 }
 setLook(look: RigLook, mode: 'body'|'head'|'attached', anchors: boolean) {
  const m=this.manifest, part=m.parts.find(p=>p.id===look.headId && p.slot==='head');
  if(m.variant==='whole-head-v2-identity' && look.hairSetId)throw Error('Replace the whole head to change hairstyle');
  if(!part)throw Error('Unknown independent head');
  this.head.setTexture(this.key(part.id)).setPosition(-part.pivot.x,-part.pivot.y);
  this.headRoot.setPosition(Math.round(look.offset.x),Math.round(look.offset.y)+Math.round(look.bob)).setAngle(((Math.round(look.quarterTurns)%4)+4)%4*90);
  this.body.setVisible(mode!=='head'); this.neckAnchor.setVisible(mode!=='body');
  for(const slot of ['outfit','weapon','offhand','accessories']as const){
   const node=this.children.get(slot)!;node.removeAll(true);node.setVisible(mode!=='head');
   const id=look.equipment?.[slot];if(!id)continue;
   const p=m.parts.find(v=>v.id===id&&v.slot===slot);if(!p)throw Error(`Invalid ${slot} component`);
   const attach=slot==='weapon'?m.rightHand:slot==='offhand'?m.leftHand:slot==='accessories'?m.accessoryPivot:m.bodyOrigin;
   node.add(this.scene.make.image({x:attach.x-m.bodyOrigin.x-p.pivot.x,y:attach.y-m.bodyOrigin.y-p.pivot.y,key:this.key(p.id),add:false}).setOrigin(0));
  }
  for(const slot of ['backHair','frontHair','headgear'] as const)this.children.get(slot)!.removeAll(true);
  const hair=look.hairSetId ? m.hairSets.find(s=>s.id===look.hairSetId) : undefined;
  if(look.hairSetId&&!hair)throw Error('Unknown hair set');
  const selected=[...(hair?.partIds??[]),...(look.headgearId?[look.headgearId]:[])];
  for(const id of selected){const p=m.parts.find(v=>v.id===id);if(!p||!['backHair','frontHair','headgear'].includes(p.slot))throw Error('Invalid head child');
   const attach=p.slot==='headgear'?m.headgearPivot:m.hairPivot;
   const image=this.scene.make.image({x:attach.x-part.pivot.x-p.pivot.x,y:attach.y-part.pivot.y-p.pivot.y,key:this.key(id),add:false}).setOrigin(0);
   this.children.get(p.slot)!.add(image);
  }
  this.guides.clear();
  if(anchors){const points=resolveRig(m,look);this.guides.lineStyle(1,0xe5bd66,1);for(const p of [points.neck,points.headRoot,m.sceneFoot]){this.guides.lineBetween(p.x-3,p.y,p.x+3,p.y);this.guides.lineBetween(p.x,p.y-3,p.x,p.y+3);}this.guides.lineStyle(1,0x61c6bd,1);this.guides.lineBetween(points.neck.x,points.neck.y,points.headRoot.x,points.headRoot.y);}
 }
 destroy(){this.guides.destroy();this.bodyRoot.destroy(true);}
}
