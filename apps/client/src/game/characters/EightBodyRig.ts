import Phaser from 'phaser';
import {type BodyEightFrame,type NativePoint} from './body-eight-model';
/** Independent textures, nested native anchors; no flattened character asset. */
export class EightBodyRig{
 readonly bodyRoot:Phaser.GameObjects.Container;
 readonly neckAnchor:Phaser.GameObjects.Container;
 readonly headRoot:Phaser.GameObjects.Container;
 private body:Phaser.GameObjects.Image;
 private head:Phaser.GameObjects.Image;
 private guide:Phaser.GameObjects.Graphics;
 constructor(scene:Phaser.Scene){
  this.bodyRoot=scene.add.container(0,0);
  this.body=scene.make.image({x:0,y:0,key:'body-0',add:false}).setOrigin(0);this.bodyRoot.add(this.body);
  this.neckAnchor=scene.make.container({x:0,y:0,add:false});this.bodyRoot.add(this.neckAnchor);
  this.headRoot=scene.make.container({x:0,y:0,add:false});this.neckAnchor.add(this.headRoot);
  this.head=scene.make.image({x:0,y:0,key:'head-0',add:false}).setOrigin(0);this.headRoot.add(this.head);
  this.guide=scene.add.graphics();
 }
 setFrame(f:BodyEightFrame,mode:'body'|'head'|'assembled',offset:NativePoint,guides:boolean,original=false){
  this.bodyRoot.setPosition(f.bodyOrigin.x,f.bodyOrigin.y);
  this.body.setTexture(original?'original':`body-${f.index}`).setPosition(-f.bodyOrigin.x,-f.bodyOrigin.y).setVisible(mode!=='head');
  this.neckAnchor.setPosition(f.neckPivot.x-f.bodyOrigin.x,f.neckPivot.y-f.bodyOrigin.y).setVisible(mode!=='body');
  this.headRoot.setPosition(Math.round(offset.x),Math.round(offset.y));
  this.head.setTexture(`head-${f.index}`).setPosition(-f.headPivot.x,-f.headPivot.y);
  this.guide.clear();if(guides){this.guide.lineStyle(1,0xe5bd66);for(const p of [f.bodyOrigin,f.neckPivot,{x:f.neckPivot.x+Math.round(offset.x),y:f.neckPivot.y+Math.round(offset.y)}]){this.guide.lineBetween(p.x-3,p.y,p.x+3,p.y);this.guide.lineBetween(p.x,p.y-3,p.x,p.y+3);}}
 }
 destroy(){this.guide.destroy();this.bodyRoot.destroy(true);}
}
