import{preloadEdgeEcology,finishBankEcology}from'./EdgeEcology';
import Phaser from 'phaser';
import {terrainHeight,type MapDefinition} from '@shaman/shared';
import {advanceWater,waterDefaults,waterSeed,type WaterClock,type WaterControls} from './water-model';
import {WATER_FRAGMENT} from './water-shader';

const BASE='/assets/umbral/water-animation-01';
export const WATER_SAMPLER={magFilter:'nearest',minFilter:'nearest',wrapS:'clamp_to_edge',wrapT:'clamp_to_edge',repeat:false,flipY:false};
const clocks=new WeakMap<Phaser.Game,WaterClock>();
const MODES=['river','pond','swamp','waterfall'];
const SWAMP_TINT=[.65,.8,.72];
interface MaskManifest {waterBit:number;tiles:{x:number;y:number;size:number;corners:number[]}[]}
export function preloadWater(scene:Phaser.Scene){preloadEdgeEcology(scene);scene.load.json('water:manifest',BASE+'/manifest.json');scene.load.image('water:mask',BASE+'/mask-tiles.png');scene.load.image('water:surface',BASE+'/surface.png');scene.load.image('water:fall',BASE+'/waterfall.png');}

/** One immutable native-pixel coverage mask and one water draw, irrespective of tile count. */
export class WaterLayer {
 readonly controls:WaterControls=waterDefaults();
 private width:number;
 private height:number;
 private margin:number;
 private pixels:Uint8ClampedArray;
 private atlas:Uint8ClampedArray;
 private metadata:MaskManifest;
 private shader?:Phaser.GameObjects.Shader;
 private fallback?:Phaser.GameObjects.Image;
 private clock:WaterClock;
 private maskKey:string;
 private fallbackKey:string;
 private reflectionKey:string;
 private reflectionPixels?:Uint8ClampedArray;
 private lastStep=0;
 private lastCanvasFrame=-1;
 private wet:number[]=[];
 private fallbackData?:ImageData;
 private surface?:Uint8ClampedArray;
 private canvasColor?:number[];
 private canvasRipple=-1;
 private canvasShore=false;
 private canvasMode='';
 private canvasFlow?:number[];
 private readonly onUpdate=(_time:number,delta:number)=>this.update(delta);
 constructor(private scene:Phaser.Scene,private map:MapDefinition,private ecologyMap:MapDefinition=map){
  if(map.id==='monsoon-marsh'||map.id==='moon-mangrove')this.controls.mode='swamp';
  if(map.id==='lantern-paddy')this.controls.mode='pond';
  this.width=map.width*16;this.margin=map.elevation?48:0;this.height=map.height*16+this.margin;
  this.pixels=new Uint8ClampedArray(this.width*this.height*4);
  this.metadata=scene.cache.json.get('water:manifest') as MaskManifest;
  const atlasCanvas=document.createElement('canvas');atlasCanvas.width=64;atlasCanvas.height=64;const ctx=atlasCanvas.getContext('2d')!;ctx.drawImage(scene.textures.get('water:mask').getSourceImage() as HTMLImageElement,0,0);this.atlas=ctx.getImageData(0,0,64,64).data;
  this.maskKey=`water:coverage:${scene.sys.settings.key}:${map.id}`;this.fallbackKey=this.maskKey+':canvas';
  this.reflectionKey=this.maskKey+':reflection';
  this.clock=clocks.get(scene.game)??{seconds:0};clocks.set(scene.game,this.clock);
 }
 /** Called from the actual terrain selection loop after its three-way junction resolution. */
 addTile(cx:number,cy:number,corners:readonly string[]){
  if(!corners.includes('water'))return;
  const m=this.metadata,water=m.waterBit,t=m.tiles.find(t=>t.corners.every((c,i)=>c===(corners[i]==='water'?water:1-water)));if(!t)return;
  let mode=0,flow=0,narrow=false;
  for(const p of this.map.terrain?.paint??[])if(p.terrain==='water'){
   if(p.shape==='circle'&&Math.hypot(cx+.5-p.x,cy+.5-p.y)<=p.r+1)mode=1;
   if(p.shape==='rect'&&cx+.5>=p.x-1&&cx+.5<=p.x+p.w+1&&cy+.5>=p.y-1&&cy+.5<=p.y+p.h+1){flow=p.w>p.h?1:0;narrow=Math.min(p.w,p.h)<=3;}
  }
  const baseY=cy*16+this.margin-(this.map.elevation?terrainHeight(this.map,cx+.5,cy+.5)*this.map.elevation.risePx/2:0);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(this.atlas[((t.y+y)*64+t.x+x)*4]){
   const yy=Math.round(baseY+y);if(yy<0||yy>=this.height)continue;const i=(yy*this.width+cx*16+x)*4;
   this.pixels[i]=255;this.pixels[i+2]=(mode*4+flow)*16+(narrow?12:4);this.pixels[i+3]=255;
  }
 }
 /** Opt-in coverage for flat, authored native-resolution maps; legacy tile callers are unchanged. */
 setNativeCoverage(coverage:Uint8Array){
  if(this.map.elevation||coverage.length!==this.width*this.height)throw new Error('Native water coverage requires a matching flat map');
  if(coverage.some(value=>value>2))throw new Error('Unknown native water mode');
  this.pixels.fill(0);
  for(let cell=0;cell<coverage.length;cell++)if(coverage[cell]){const i=cell*4;this.pixels[i]=255;this.pixels[i+2]=(coverage[cell]!-1)*64+4;this.pixels[i+3]=255;}
 }
 finish(){
  finishBankEcology(this.scene,this.ecologyMap,this.pixels,this.width,this.height,this.margin);
  const p=this.pixels,w=this.width,h=this.height;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!p[i])continue;this.wet.push(i);
   for(let d=1;d<=4;d++)if(x-d<0||x+d>=w||y-d<0||y+d>=h||!p[i-d*4]||!p[i+d*4]||!p[i-d*w*4]||!p[i+d*w*4]){p[i+1]=Math.round((5-d)/4*15);break;}
  }
  if(!this.wet.length)return this;
  // Authoring positions select interaction sites. These effects never add blockers or gameplay positions.
  for(const o of this.map.objects)if(/bridge|rock|reed|lotus/.test(o.asset)){
   const xx=o.x*16,yy=o.y*16+this.margin-terrainHeight(this.map,o.x,o.y)*(this.map.elevation?.risePx??0)/2;
   for(let y=Math.max(0,Math.floor(yy-32));y<Math.min(h,yy+32);y++)for(let x=Math.max(0,Math.floor(xx-32));x<Math.min(w,xx+32);x++){
    const i=(y*w+x)*4;if(p[i]){const interaction=Math.max(Math.floor(p[i+1]!/16),Math.round(Math.max(0,1-Math.hypot(x-xx,y-yy)/32)*15));p[i+1]=p[i+1]!%16+interaction*16;}
   }
  }
  const texture=this.scene.textures.createCanvas(this.maskKey,w,h)!;const coverage=texture.context.createImageData(w,h);coverage.data.set(p);texture.context.putImageData(coverage,0,0);texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  this.scene.textures.get('water:surface').setFilter(Phaser.Textures.FilterMode.NEAREST);
  this.buildReflections();
  if(this.scene.game.renderer.type===Phaser.WEBGL){
   const sites=this.rippleSites();
   const uniforms={uNative:{type:'2f',value:{x:w,y:h}},uElapsed:{type:'1f',value:0},uMode:{type:'1f',value:-1},uRipple:{type:'1f',value:.55},uShore:{type:'1f',value:1},uFall:{type:'1f',value:0},uFlow:{type:'2f',value:{x:0,y:0}},uTint:{type:'3fv',value:this.controls.color},...Object.fromEntries(sites.map((site,i)=>['uRipple'+i,{type:'4fv',value:site}]))};
   this.shader=this.scene.add.shader(new Phaser.Display.BaseShader('water-illustrated',WATER_FRAGMENT,undefined,{...uniforms,uRates:{type:'4fv',value:this.controls.rates}}),0,-this.margin*2,w*2,h*2,[this.maskKey,'water:surface',this.reflectionKey]).setChannel0(this.maskKey,WATER_SAMPLER).setChannel1('water:surface',WATER_SAMPLER).setChannel2(this.reflectionKey,WATER_SAMPLER).setOrigin(0).setDepth(-1.7);
  }else{
   const target=this.scene.textures.createCanvas(this.fallbackKey,w,h)!;target.setFilter(Phaser.Textures.FilterMode.NEAREST);this.fallbackData=target.context.createImageData(w,h);
   const c=document.createElement('canvas');c.width=16;c.height=16;const ctx=c.getContext('2d')!;ctx.drawImage(this.scene.textures.get('water:surface').getSourceImage()as HTMLImageElement,0,0);this.surface=ctx.getImageData(0,0,16,16).data;
   this.fallback=this.scene.add.image(0,-this.margin*2,this.fallbackKey).setOrigin(0).setScale(2).setDepth(-1.7);
  }
  this.scene.events.on(Phaser.Scenes.Events.UPDATE,this.onUpdate);
  this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.destroy());this.update(0);return this;
 }
 private buildReflections(){
  const t=this.scene.textures.createCanvas(this.reflectionKey,this.width,this.height)!,ctx=t.context;
  const manifest=this.scene.cache.json.get('umbral-manifest') as {objects:Record<string,{width:number;height:number;anchor:{x:number;y:number}}>};
  ctx.imageSmoothingEnabled=false;
  for(const o of this.map.objects)if(/tree|bridge|reed|house|lodge|hut/.test(o.asset)){
   const a=manifest.objects[o.asset];if(!a)continue;const image=this.scene.textures.get('umbral:object:'+o.asset).getSourceImage()as HTMLImageElement,crop=Math.min(40,a.height),top=a.height-crop;
   ctx.save();ctx.translate(o.x*16,o.y*16+this.margin-terrainHeight(this.map,o.x,o.y)*(this.map.elevation?.risePx??0)/2);ctx.scale(o.flip?-1:1,-1);ctx.drawImage(image,0,top,a.width,crop,-a.anchor.x,-(a.anchor.y-top),a.width,crop);ctx.restore();
  }
  const data=ctx.getImageData(0,0,this.width,this.height);for(let i=0;i<data.data.length;i+=4)if(!this.pixels[i])data.data[i+3]=0;
  this.reflectionPixels=data.data;ctx.putImageData(data,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 private rippleSites():number[][]{
  const sites:number[][]=[];
  for(const p of this.map.terrain?.paint??[])if(p.terrain==='water'&&p.shape==='circle'&&sites.length<4){const seed=waterSeed(this.map.id,p.x,p.y);sites.push([p.x*16,p.y*16+this.margin-terrainHeight(this.map,p.x,p.y)*(this.map.elevation?.risePx??0)/2,14+seed*9,seed]);}
  for(const o of this.map.objects)if(/bridge|rock/.test(o.asset)&&sites.length<4){const seed=waterSeed(this.map.id,o.x,o.y);sites.push([o.x*16,o.y*16+this.margin-terrainHeight(this.map,o.x,o.y)*(this.map.elevation?.risePx??0)/2,12+seed*10,seed]);}
  while(sites.length<4)sites.push([-9999,-9999,20,0]);return sites;
 }
 private update(delta:number){
  const c=this.controls;const step=c.step-this.lastStep;this.lastStep=c.step;advanceWater(this.clock,delta,c.paused,c.speed,step);
  this.shader?.setVisible(!c.before);this.fallback?.setVisible(!c.before);
  if(this.shader){this.shader.setUniform('uElapsed.value',this.clock.seconds).setUniform('uMode.value',c.mode==='map'?-1:MODES.indexOf(c.mode)).setUniform('uRipple.value',c.ripple).setUniform('uShore.value',c.shore?1:0).setUniform('uTint.value',c.color).setUniform('uFlow.value.x',c.flow[0]).setUniform('uFlow.value.y',c.flow[1]);}
  if(this.shader)this.shader.setUniform('uRates.value',c.rates);
  else this.updateCanvas();
 }
 private updateCanvas(){
  const c=this.controls,frame=Math.floor(this.clock.seconds*8);if(frame===this.lastCanvasFrame&&this.canvasColor===c.color&&this.canvasRipple===c.ripple&&this.canvasShore===c.shore&&this.canvasMode===c.mode&&this.canvasFlow===c.flow)return;this.lastCanvasFrame=frame;this.canvasColor=c.color;this.canvasRipple=c.ripple;this.canvasShore=c.shore;this.canvasMode=c.mode;this.canvasFlow=c.flow;
  const data=this.fallbackData,surface=this.surface;if(!data||!surface)return;
  const selected=c.mode==='map'?-1:MODES.indexOf(c.mode),t=this.clock.seconds;
  for(const i of this.wet){const cell=i/4,x=cell%this.width,y=Math.floor(cell/this.width),code=Math.floor(this.pixels[i+2]!/16),mode=selected<0?Math.floor(code/4):selected,dir=code%4,shift=mode===0?Math.floor(t*c.rates[0]*(this.pixels[i+2]!%16>=8?1.35:1)):mode===3?Math.floor(t*c.rates[3]):Math.round(Math.sin(t*c.rates[mode===1?1:2]));
   let dx=dir===1?1:dir===3?-1:0,dy=dir===0?1:dir===2?-1:0;if(c.flow[0]||c.flow[1]){dx=c.flow[0];dy=c.flow[1];}if(mode===3){dx=0;dy=1;}if(mode===1||mode===2){dx=1;dy=-1;}
   const sx=((x-dx*shift)%16+16)%16,sy=((y-dy*shift)%16+16)%16,source=(sy*16+sx)*4,light=.65+Math.min(1,Math.max(0,((surface[source]!*.2+surface[source+1]!*.5+surface[source+2]!*.3)/255-.40)*8))*.95,crest=Math.sin(x*.055+y*.11-t*(mode===2?.3:.9))>.965?c.ripple*.04:0,foam=c.shore&&Math.sin(x*.13+y*.17-t*.7)>.65?(this.pixels[i+1]!%16)/15*.03:0;
   const reflection=this.reflectionPixels,reflectAlpha=(reflection?.[i+3]??0)/255*.12;
   for(let k=0;k<3;k++){const color=Math.min(1,c.color[k]!*(mode===2?SWAMP_TINT[k]!:1)*light+crest+foam)*255;data.data[i+k]=Math.round(color*(1-reflectAlpha)+(reflection?.[i+k]??0)*reflectAlpha);}data.data[i+3]=255;
  }
  const texture=this.scene.textures.get(this.fallbackKey)as Phaser.Textures.CanvasTexture;texture.context.putImageData(data,0,0);texture.refresh();
 }
 get seconds(){return this.clock.seconds;}
 setControls(controls:WaterControls,initialize=false){Object.assign(this.controls,controls);if(initialize)this.lastStep=controls.step;}
 get coveragePixels(){return this.wet.length;}
 destroy(){this.scene.events.off(Phaser.Scenes.Events.UPDATE,this.onUpdate);this.shader?.destroy();this.fallback?.destroy();for(const key of [this.maskKey,this.fallbackKey,this.reflectionKey])if(this.scene.textures.exists(key))this.scene.textures.remove(key);}
}
