import Phaser from 'phaser';
import {getMap,MAPS,type MapDefinition} from '@shaman/shared';
import {preloadMapAssets,renderMap} from '@/game/world/MapRenderer';
import {WATER_FRAGMENT} from '@/game/world/water-shader';
import {coverZoom,type WaterControls} from '@/game/world/water-model';
import {WATER_SAMPLER,type WaterLayer} from '@/game/world/WaterLayer';

export interface WaterPreviewControls extends WaterControls {mapId:string;zoom:number;panX:number;panY:number;fallback:boolean}
export interface WaterPreviewReport {ready:boolean;seconds:number;fps:number;waterPixels:number;mapId:string;zoom:number;viewW:number;viewH:number;covered:boolean;renderer:string}
/** Same production MapRenderer/WaterLayer and actual map geometry; this lab does not join gameplay rooms. */
export function createWaterPreview(parent:HTMLElement,controls:WaterPreviewControls,report:(r:WaterPreviewReport)=>void){
 class Preview extends Phaser.Scene{
  private map:MapDefinition=getMap(controls.mapId);
  private water?:WaterLayer;
  private fall?:Phaser.GameObjects.Shader;
  private fallStatic?:Phaser.GameObjects.Image;
  private lastReport=0;
  private fallPixels?:Uint8ClampedArray;
  private fallData?:ImageData;
  private fallWidth=0;
  private fallHeight=0;
  private lastFallFrame=-1;
  constructor(){super('water-review');}
  init(){this.map=getMap(controls.mapId);}
  preload(){preloadMapAssets(this,this.map);}
  create(){
   this.water=renderMap(this,this.map).water;
   this.water?.setControls(controls,true);
   const art=this.textures.get('water:fall'),image=art.getSourceImage()as HTMLImageElement;art.setFilter(Phaser.Textures.FilterMode.NEAREST);
   const key='water:fall-coverage';const texture=this.textures.createCanvas(key,image.width,image.height)!;texture.context.drawImage(image,0,0);const d=texture.context.getImageData(0,0,image.width,image.height);
   this.fallWidth=image.width;this.fallHeight=image.height;this.fallPixels=Uint8ClampedArray.from(d.data);this.fallData=texture.context.createImageData(image.width,image.height);
   const frameTexture=this.textures.createCanvas('water:fall-frame',image.width,image.height)!;frameTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
   for(let i=0;i<d.data.length;i+=4){const alpha=d.data[i+3]!;d.data[i]=alpha>15?255:0;d.data[i+1]=0;d.data[i+2]=200;d.data[i+3]=255;}texture.context.putImageData(d,0,0);texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
   const x=25*32,y=45*32;
   this.fallStatic=this.add.image(x,y,'water:fall').setOrigin(.5,1).setScale(2).setDepth(44*32).setVisible(false);
   if(this.game.renderer.type===Phaser.WEBGL){
    const uniforms={uNative:{type:'2f',value:{x:image.width,y:image.height}},uElapsed:{type:'1f',value:0},uMode:{type:'1f',value:3},uRipple:{type:'1f',value:.55},uShore:{type:'1f',value:1},uFall:{type:'1f',value:1},uFlow:{type:'2f',value:{x:0,y:1}},uTint:{type:'3fv',value:controls.color},uRates:{type:'4fv',value:controls.rates},...Object.fromEntries([0,1,2,3].map(i=>['uRipple'+i,{type:'4fv',value:[-9999,-9999,20,0]}]))};
    this.fall=this.add.shader(new Phaser.Display.BaseShader('waterfall-review',WATER_FRAGMENT,undefined,uniforms),x-image.width,y-image.height*2,image.width*2,image.height*2,[key,'water:fall']).setChannel0(key,WATER_SAMPLER).setChannel1('water:fall',WATER_SAMPLER).setOrigin(0).setDepth(44*32);
   }
   this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{for(const k of [key,'water:fall-frame'])if(this.textures.exists(k))this.textures.remove(k);});
  }
  update(time:number){
   if(this.map.id!==controls.mapId){this.scene.restart();return;}
   this.water?.setControls(controls);
   const fall=controls.mode==='waterfall';this.fall?.setVisible(fall&&!controls.before);this.fallStatic?.setVisible(fall&&(controls.before||!this.fall));
   if(fall&&!this.fall&&!controls.before)this.animateCanvasFall();else this.fallStatic?.setTexture('water:fall');
   this.fall?.setUniform('uElapsed.value',this.water?.seconds??0).setUniform('uRipple.value',controls.ripple).setUniform('uTint.value',controls.color).setUniform('uShore.value',controls.shore?1:0);
   this.fall?.setUniform('uRates.value',controls.rates);
   const cam=this.cameras.main,min=coverZoom(cam.width,cam.height,this.map.width*32,this.map.height*32);
   cam.setBounds(0,0,this.map.width*32,this.map.height*32).setZoom(Math.max(min,controls.zoom)).setRoundPixels(true);
   const pond=this.map.terrain?.paint.find(p=>p.terrain==='water'&&p.shape==='circle');
   const channel=this.map.terrain?.paint.find(p=>p.terrain==='water'&&p.shape==='rect'&&p.w>p.h);
   const waterFocus=pond&&pond.shape==='circle'&&(controls.mode==='pond'||!channel)?{x:pond.x,y:pond.y}:channel&&channel.shape==='rect'?{x:Math.round(channel.x+channel.w*.4),y:channel.y+channel.h/2}:{x:16,y:44};
   const target=controls.mode==='waterfall'?{x:25,y:41.5}:waterFocus;
   cam.centerOn((target.x+controls.panX)*32,(target.y+controls.panY)*32);
   if(time-this.lastReport>200){this.lastReport=time;report({ready:true,seconds:this.water?.seconds??0,fps:this.game.loop.actualFps,waterPixels:this.water?.coveragePixels??0,mapId:this.map.id,zoom:cam.zoom,viewW:cam.width/cam.zoom,viewH:cam.height/cam.zoom,covered:cam.width/cam.zoom<=this.map.width*32+.01&&cam.height/cam.zoom<=this.map.height*32+.01,renderer:this.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas'});}
  }
  private animateCanvasFall(){
   this.fallStatic?.setTexture('water:fall-frame');const frame=Math.floor((this.water?.seconds??0)*8);if(frame===this.lastFallFrame)return;this.lastFallFrame=frame;
   const p=this.fallPixels,d=this.fallData,w=this.fallWidth,h=this.fallHeight;if(!p||!d)return;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,sampledY=y/h>.88?y:Math.floor(((((y/h*.65-frame/8*controls.rates[3]/64)%1+1)%1)*.65+.12)*h),source=(sampledY*w+x)*4;
    for(let k=0;k<3;k++)d.data[i+k]=p[source+k]!;d.data[i+3]=p[i+3]!;
   }
   const t=this.textures.get('water:fall-frame')as Phaser.Textures.CanvasTexture;t.context.putImageData(d,0,0);t.refresh();
  }
 }
 if(!MAPS[controls.mapId])controls.mapId='umbral-capital';
 const game=new Phaser.Game({type:controls.fallback?Phaser.CANVAS:Phaser.AUTO,parent,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),backgroundColor:'#142a2d',pixelArt:true,roundPixels:true,scene:[Preview],audio:{noAudio:true}});
 const observer=new ResizeObserver(()=>{if(parent.clientWidth&&parent.clientHeight)game.scale.resize(parent.clientWidth,parent.clientHeight);});observer.observe(parent);
 return{destroy:()=>{observer.disconnect();game.destroy(true);}};
}
