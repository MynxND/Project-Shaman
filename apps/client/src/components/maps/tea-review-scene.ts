import Phaser from 'phaser';
import{projectedY,terrainHeight,stepMovement,type MapDefinition,type Position}from'@shaman/shared';
import{preloadMapAssets,renderMap}from'../../game/world/MapRenderer';
import{addSpiritwoodAtmosphere}from'../../game/world/SpiritwoodAtmosphere';
import data from './tea-review-map.json';
import plan from './tea-review-plan.json';
const map=data as unknown as MapDefinition,U=32;
export interface TeaControls{x:number;y:number;overview:boolean;guides:boolean;tour:boolean;reset:number;focus:number;request:number}
export interface TeaReport{ready:boolean;x:number;y:number;level:number;fps:number;water:number;tourPasses:number}
/** Local layout review. No room, active portal, stat grants or live-world store changes. */
export function createTeaReview(parent:HTMLElement,controls:TeaControls,report:(r:TeaReport)=>void){
 class Review extends Phaser.Scene{
  private pos:Position={...map.spawn};private actor!:Phaser.GameObjects.Container;private labels!:Phaser.GameObjects.Container;private keys?:Record<string,Phaser.Input.Keyboard.Key>;private last=0;private resetSeen=0;private requestSeen=0;private waypoint=1;private backwards=false;private passes=0;private water=0;
  preload(){preloadMapAssets(this,map);for(const kind of ['leaf-wisp','shadow-macaque','clay-guardian'])this.load.spritesheet('tea:'+kind,'/assets/monsters/'+kind+'.png',{frameWidth:128,frameHeight:128});}
  create(){const result=renderMap(this,map);this.water=result.water?.coveragePixels??0;
   // Independent local profile; no gameplay or live-map presentation changes.
   // Live MapRenderer owns this same reviewed profile; do not duplicate its mist here.
   for(const camp of plan.camps){for(const [i,[x,y]]of camp.positions.entries()){const key='tea:'+camp.art,anim=key+':idle';if(!this.anims.exists(anim))this.anims.create({key:anim,frames:this.anims.generateFrameNumbers(key,{start:0,end:4}),frameRate:6,repeat:-1});this.add.sprite(x!*U,y!*U,key).setOrigin(.5,114/128).setScale(.5).setDepth(y!*U).play(anim);}}
   this.actor=this.add.container(0,0,[this.add.ellipse(0,0,24,10,0x0a1712,.5),this.add.circle(0,-12,8,0xd6b46c),this.add.rectangle(0,-5,10,12,0x77b99b)]);
   this.labels=this.add.container(0,0);for(const camp of plan.camps){const a=camp.area;this.labels.add(this.add.rectangle((a.x+a.w/2)*U,(a.y+a.h/2)*U,a.w*U,a.h*U,0x9e5549,.1).setStrokeStyle(2,0xd8ac70,.75));}for(const l of plan.locations){this.labels.add(this.add.text(l.x*U,projectedY(map,l.x,l.y)-16,l.name,{fontFamily:'Tahoma',fontSize:'16px',color:'#ffe8ac',backgroundColor:'#102b27'}).setOrigin(.5,1));}
   this.labels.setDepth(1000001);this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT')as Record<string,Phaser.Input.Keyboard.Key>;
   this.cameras.main.setBounds(0,0,map.width*U,map.height*U).setRoundPixels(true);
  }
  update(time:number,delta:number){if(!this.actor)return;
   if(controls.reset!==this.resetSeen){this.resetSeen=controls.reset;this.pos={...map.spawn};this.waypoint=1;this.backwards=false;}
   if(controls.request!==this.requestSeen){this.requestSeen=controls.request;const l=plan.locations[controls.focus]!;this.pos={x:l.x,y:l.y};this.waypoint=1;}
   let x=controls.x+(this.keys?.D?.isDown||this.keys?.RIGHT?.isDown?1:0)-(this.keys?.A?.isDown||this.keys?.LEFT?.isDown?1:0),y=controls.y+(this.keys?.S?.isDown||this.keys?.DOWN?.isDown?1:0)-(this.keys?.W?.isDown||this.keys?.UP?.isDown?1:0);
   if(controls.tour){const target=plan.route[this.waypoint]!;const dx=target[0]!-this.pos.x,dy=target[1]!-this.pos.y;if(Math.hypot(dx,dy)<.14){if(this.waypoint===plan.route.length-1){this.backwards=true;this.passes++;}if(this.waypoint===0){this.backwards=false;this.passes++;}this.waypoint+=this.backwards?-1:1;}else{x=Math.abs(dx)>.07?Math.sign(dx):0;y=Math.abs(dy)>.07?Math.sign(dy):0;}}
   this.pos=stepMovement(this.pos,{x,y,sequence:0},Math.min(delta/1000,.05),map).position;this.actor.setPosition(this.pos.x*U,projectedY(map,this.pos.x,this.pos.y)).setDepth(this.pos.y*U+1);this.labels.setVisible(controls.guides);
   const cam=this.cameras.main;if(controls.overview){cam.removeBounds();cam.setZoom(Math.min(cam.width/(map.width*U),cam.height/(map.height*U)));cam.centerOn(map.width*U/2,map.height*U/2);}else{cam.setBounds(0,0,map.width*U,map.height*U);cam.setZoom(Math.max(cam.width/960,cam.height/720));cam.centerOn(this.pos.x*U,projectedY(map,this.pos.x,this.pos.y)-64);}
   if(time-this.last>150){this.last=time;report({ready:true,x:this.pos.x,y:this.pos.y,level:terrainHeight(map,this.pos.x,this.pos.y),fps:this.game.loop.actualFps,water:this.water,tourPasses:this.passes});}
  }
 }
 const game=new Phaser.Game({type:Phaser.AUTO,parent,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),pixelArt:true,roundPixels:true,backgroundColor:'#0d201f',audio:{noAudio:true},scene:[Review]});
 const observer=new ResizeObserver(()=>{if(parent.clientWidth&&parent.clientHeight)game.scale.resize(parent.clientWidth,parent.clientHeight);});observer.observe(parent);
 return{destroy:()=>{observer.disconnect();game.destroy(true);}};
}
