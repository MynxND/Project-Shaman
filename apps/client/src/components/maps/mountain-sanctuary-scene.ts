import * as Phaser from 'phaser';
import { MOUNTAIN_SANCTUARY_DRAFT as MAP, MOUNTAIN_DRAFT_ROUTE as ROUTE, MOUNTAIN_DRAFT_SIDE_ROUTES as SIDE_ROUTES, MOUNTAIN_DRAFT_STREAMS as STREAMS, MOUNTAIN_DRAFT_FOCUS, projectedY, terrainHeight, stepMovement, type Position } from '@shaman/shared';

export interface PrototypeControls { x: number; y: number; overview: boolean; guides: boolean; reset: number; tour: boolean; focus: number; focusRequest: number }
export interface PrototypeReport { x: number; y: number; level: number; fps: number; sceneId: string; ready: boolean }
const U = 32, RISE = MAP.elevation!.risePx;
type XY = readonly [number, number];

/** Separate Phaser scene. No production renderer, assets, room or UI stores are touched. */
export function createMountainSanctuary(parent: HTMLElement, controls: PrototypeControls, report: (r: PrototypeReport) => void) {
  const sceneId = `mountain-${Date.now()}`;
  class MountainScene extends Phaser.Scene {
    private position: Position = { ...MAP.spawn };
    private walker!: Phaser.GameObjects.Container;
    private diagnostics!: Phaser.GameObjects.Container;
    private keys?: Record<string, Phaser.Input.Keyboard.Key>;
    private lastReport = 0;
    private resetSeen = 0;
    private waypoint = 0;
    private reverse = false;
    private focusSeen=0;
    private textureId=0;
    private manifest!: {objects: Record<string,{image:string;width:number;height:number;anchor:{x:number;y:number}}>;ground:Record<string,{image:string}>;decals:Record<string,{image:string;width:number;height:number;anchor?:{x:number;y:number}}>};
    preload() {
      this.load.json('mountain-manifest','/assets/umbral/manifest.json');
      this.load.image('yantra-disc','/assets/umbral/decals/yantra-disc.png');
      for(const key of ['front-face-01','front-cap-01','front-base-01','water-body-01','water-lip-01','water-base-01','stairs-01'])
        this.load.image(key,`/assets/umbral/candidates/mountain-sanctuary-phase-c/${key}.png`);
      this.load.once('filecomplete-json-mountain-manifest',()=>{
        this.manifest=this.cache.json.get('mountain-manifest');
        for(const key of new Set(MAP.objects.map(o=>o.asset)))this.load.image(`building-${key}`,`/assets/umbral/${this.manifest.objects[key]!.image}`);
        for(const key of ['dark-earth','dark-grass','ritual-paving'])this.load.image(`ground-${key}`,`/assets/umbral/${this.manifest.ground[key]!.image}`);
      });
    }

    private polygon(points: readonly XY[], color: number, depth: number, alpha=1) {
      const material=color===0x9c9276?'ground-ritual-paving':(color===0xa39d84||color===0x898b77)?'stairs-01':undefined;
      if(material&&this.textures.exists(material)) {
        const x=Math.floor(Math.min(...points.map(p=>p[0]))),y=Math.floor(Math.min(...points.map(p=>p[1])));
        const w=Math.max(1,Math.ceil(Math.max(...points.map(p=>p[0]))-x)),h=Math.max(1,Math.ceil(Math.max(...points.map(p=>p[1]))-y));
        const key=`path-${this.textureId++}`,texture=this.textures.createCanvas(key,w,h)!;
        const ctx=texture.context;ctx.imageSmoothingEnabled=false;ctx.beginPath();
        points.forEach((p,i)=>i?ctx.lineTo(p[0]-x,p[1]-y):ctx.moveTo(p[0]-x,p[1]-y));ctx.closePath();ctx.clip();
        const pattern=ctx.createPattern(this.textures.get(material).getSourceImage() as HTMLImageElement,'repeat');
        if(pattern){pattern.setTransform(new DOMMatrix().scale(2));ctx.fillStyle=pattern;ctx.fillRect(0,0,w,h);}
        texture.refresh();return this.add.image(x,y,key).setOrigin(0).setDepth(depth).setAlpha(alpha);
      }
      const g = this.add.graphics().setDepth(depth);
      g.fillStyle(color,alpha).fillPoints(points.map(p=>new Phaser.Geom.Point(Math.round(p[0]),Math.round(p[1]))),true);
      return g;
    }
    private top(points: readonly XY[], level: number, color: number) {
      const projected=points.map(([x,y])=>[x*U,y*U-level*RISE] as const);
      const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
      const x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys)),w=Math.ceil(Math.max(...xs)-x)+1,h=Math.ceil(Math.max(...ys)-y)+1;
      const key=`terrain-${this.textureId++}`,texture=this.textures.createCanvas(key,w,h)!;
      const ctx=texture.context;ctx.imageSmoothingEnabled=false;ctx.beginPath();
      projected.forEach((p,i)=>i?ctx.lineTo(p[0]-x,p[1]-y):ctx.moveTo(p[0]-x,p[1]-y));ctx.closePath();ctx.clip();
      const ground=this.textures.get(level>0?'ground-dark-grass':'ground-dark-earth').getSourceImage() as HTMLImageElement;
      const pattern=ctx.createPattern(ground,'repeat');if(pattern){ctx.fillStyle=pattern;ctx.fillRect(0,0,w,h);}
      ctx.fillStyle=`#${color.toString(16).padStart(6,'0')}30`;ctx.fillRect(0,0,w,h);texture.refresh();
      return this.add.image(x,y,key).setOrigin(0).setDepth(-90+level);
    }
    private face(a: XY,b: XY,high:number,low:number) {
      const left=b[0]*U,right=a[0]*U,width=Math.ceil(right-left);
      if(width<1)return;
      const topA=a[1]*U-high*RISE,topB=b[1]*U-high*RISE;
      const y=Math.floor(Math.min(topA,topB))-12,drop=(high-low)*RISE;
      const key=`cliff-${this.textureId++}`,texture=this.textures.createCanvas(key,width,Math.ceil(Math.abs(topA-topB)+drop+32))!;
      const ctx=texture.context;ctx.imageSmoothingEnabled=false;
      const body=this.textures.get('front-face-01').getSourceImage() as HTMLImageElement;
      const cap=this.textures.get('front-cap-01').getSourceImage() as HTMLImageElement;
      const base=this.textures.get('front-base-01').getSourceImage() as HTMLImageElement;
      // Native columns follow authored terrain edges; materials remain exactly 2x.
      for(let x=0;x<width;x+=2) {
        const t=x/width,py=Math.round(topB+(topA-topB)*t-y),sx=Math.floor((left+x)/2)%64;
        for(let v=0;v<drop;v+=112) {
          const h=Math.min(112,drop-v);ctx.drawImage(body,sx,0,1,h/2,x,py+v,2,h);
        }
        ctx.drawImage(cap,sx,10,1,10,x,py-12,2,20);
        ctx.drawImage(base,sx,0,1,8,x,py+drop-8,2,16);
      }
      texture.refresh();this.add.image(left,y,key).setOrigin(0).setDepth((a[1]+b[1])/2*U-1);
    }
    private cliffs(points: readonly XY[], high: number) {
      for(let i=0;i<points.length;i++) {
        const a=points[i]!,b=points[(i+1)%points.length]!;
        // Only camera-facing edges; closed polygon is still authoritative on every side.
        if(b[0]>=a[0]) continue;
        const cuts=[0,1];
        for(const t of MAP.elevation!.transitions) {
          for(const x of [t.x,t.x+t.w]) { const f=(x-a[0])/(b[0]-a[0]); if(f>0&&f<1)cuts.push(f); }
          if(a[1]!==b[1]) for(const y of [t.y,t.y+t.h]) {const f=(y-a[1])/(b[1]-a[1]);if(f>0&&f<1)cuts.push(f);}
        }
        cuts.sort((x,y)=>x-y);
        const at=(f:number):XY=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
        for(let j=0;j<cuts.length-1;j++) {
          const mid=at((cuts[j]!+cuts[j+1]!)/2);
          if(MAP.elevation!.transitions.some(t=>mid[0]>=t.x&&mid[0]<=t.x+t.w&&mid[1]>=t.y&&mid[1]<=t.y+t.h))continue;
          const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
          const low=terrainHeight(MAP,mid[0]+(b[1]-a[1])/length*.06,mid[1]-(b[0]-a[0])/length*.06);
          if(low<high)this.face(at(cuts[j]!),at(cuts[j+1]!),high,low);
        }
      }
    }
    private paths(route: readonly XY[]=ROUTE) {
      for(let i=0;i<route.length-1;i++) {
        const a=route[i]!,b=route[i+1]!,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        const n=terrainHeight(MAP,a[0],a[1])===terrainHeight(MAP,b[0],b[1])?1:Math.ceil(length*8), nx=-(b[1]-a[1])/length*.85,ny=(b[0]-a[0])/length*.85;
        for(let j=0;j<n;j++) {
          const f=j/n,k=(j+1)/n;
          const p=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],q=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
          const h=terrainHeight(MAP,p[0]!,p[1]!);
          this.polygon([[p[0]!*U+nx*U,(p[1]!+ny)*U-h*RISE],[q[0]!*U+nx*U,(q[1]!+ny)*U-terrainHeight(MAP,q[0]!,q[1]!)*RISE],[q[0]!*U-nx*U,(q[1]!-ny)*U-terrainHeight(MAP,q[0]!,q[1]!)*RISE],[p[0]!*U-nx*U,(p[1]!-ny)*U-h*RISE]],0x9c9276,-80);
        }
      }
    }
    create() {
      this.cameras.main.setBackgroundColor('#182f2c').setRoundPixels(true).setBounds(0,-2*RISE,MAP.width*U,MAP.height*U+2*RISE);
      this.top([[0,0],[96,0],[96,112],[0,112]],0,0x424e3c);
      for(const r of [...MAP.elevation!.regions!].reverse()) {
        this.cliffs(r.points,r.level);this.top(r.points,r.level,r.level===2?0x8b9074:0x66745a);
      }
      this.paths();for(const route of SIDE_ROUTES)this.paths(route);
      // Paved ritual disc and summit forecourt retain the original building scale.
      this.add.image(33.6*U,49.8*U-RISE,'yantra-disc').setScale(2).setDepth(-78);
      this.polygon([[29*U,18*U-2*RISE],[48*U,18*U-2*RISE],[48*U,24*U-2*RISE],[29*U,24*U-2*RISE]],0x9c9276,-79);
      for(const object of MAP.objects) {
        const meta=this.manifest.objects[object.asset]!;
        const y=projectedY(MAP,object.x,object.y);
        this.add.ellipse(object.x*U,y-2,meta.width*1.1,18,0x102720,.25).setDepth(object.y*U-.2);
        this.add.image(object.x*U,y,`building-${object.asset}`).setOrigin(meta.anchor.x/meta.width,meta.anchor.y/meta.height).setScale(2).setDepth(object.y*U).setFlipX(!!object.flip);
      }
      for(const t of MAP.elevation!.transitions) {
        const n=20;
        for(let i=0;i<n;i++) {
          if(t.axis==='x') {
            const x=t.x+t.w*i/n,end=t.x+t.w*(i+1)/n;
            this.polygon([[x*U,projectedY(MAP,x,t.y)],[end*U,projectedY(MAP,end,t.y)],[end*U,projectedY(MAP,end,t.y+t.h)],[x*U,projectedY(MAP,x,t.y+t.h)]],0x9b987e,(t.y+t.h)*U-.5);
            continue;
          }
          const y=t.y+t.h*i/n, end=t.y+t.h*(i+1)/n;
          const a=projectedY(MAP,t.x+t.w/2,y),b=projectedY(MAP,t.x+t.w/2,end);
          this.polygon([[t.x*U,a],[(t.x+t.w)*U,a],[(t.x+t.w)*U,b],[t.x*U,b]],i%2?0xa39d84:0x898b77,y*U-.5);
          const h=terrainHeight(MAP,t.x+t.w/2,y),h2=terrainHeight(MAP,t.x+t.w/2,end);
          if(Math.abs(h-h2)>.001) this.add.graphics().setDepth(y*U-.4).lineStyle(2,0x414d47).lineBetween(t.x*U,a,(t.x+t.w)*U,a);
        }
      }
      // Continuous stream on the east bank, with explicit falls at the two exposed lips.
      for(const stream of STREAMS) {
      const left=stream.x,right=left+stream.w,center=(left+right)/2;
      let riverStart: number=stream.from, riverLevel=terrainHeight(MAP,center,riverStart+.0625);
      for(let y=riverStart+.125;y<=stream.to;y+=.125) {
        const next=terrainHeight(MAP,center,y+.0625);
        if(next===riverLevel&&y<stream.to)continue;
        const level=riverLevel;
        const a=riverStart*U-level*RISE,b=y*U-level*RISE;
        this.polygon([[left*U,a],[right*U,a],[right*U,b],[left*U,b]],0x397b86,-70);
        this.add.graphics().setDepth(-69).lineStyle(2,0x7bb2ac,.65).lineBetween((left+.25)*U,a,(left+.25)*U,b);
        if(level>next) {
          const bottom=y*U-next*RISE;
          for(let x=left*U;x<right*U;x+=64) {
            const w=Math.min(64,right*U-x);
            const img=this.add.image(x,b,'water-body-01').setOrigin(0).setScale(2).setDepth(y*U+.15);
            img.setCrop(0,0,w/2,Math.min(56,(bottom-b)/2));
          }
          this.add.image(center*U,bottom,'water-base-01').setOrigin(.5,.4).setScale(2).setDepth(y*U+.3);
          this.polygon([[left*U,b],[right*U,b],[right*U,bottom],[left*U,bottom]],0x528e99,y*U);
          for(const f of [.15,.4,.65,.85]) {const x=left+stream.w*f;this.add.graphics().setDepth(y*U+.1).lineStyle(3,0xa4d0c5,.8).lineBetween(x*U,b,x*U,bottom);}
          this.add.ellipse(center*U,bottom,stream.w*U+14,18,0xa1d5cc,.65).setDepth(y*U+.2);
        }
        riverStart=y;riverLevel=next;
      }
      // Real walkable river crossing, matching blockers exactly.
      for(const [start,end] of stream.crossings) {
        const y0=projectedY(MAP,center,start),y1=projectedY(MAP,center,end);
        this.polygon([[(left-.5)*U,y0],[(right+.5)*U,y0],[(right+.5)*U,y1],[(left-.5)*U,y1]],0x766449,end*U-2);
        for(let y=y0;y<=y1;y+=9)this.add.graphics().setDepth(end*U-1).lineStyle(2,0x3b4435).lineBetween((left-.5)*U,y,(right+.5)*U,y);
      }
      }
      this.diagnostics=this.add.container(0,0).setDepth(5000);
      for(const r of MAP.elevation!.regions!) {
        const g=this.add.graphics().lineStyle(2,0xe6ca7b).strokePoints(r.points.map(([x,y])=>new Phaser.Geom.Point(x*U,y*U-r.level*RISE)),true);
        this.diagnostics.add(g);
      }
      for(const [x,y,caption] of [[33.6,87.1,'Z0'],[33.6,49.8,'Z1'],[38.4,18.7,'Z2']] as const)
        this.diagnostics.add(this.add.text(x*U,projectedY(MAP,x,y)-24,caption,{fontSize:'18px',color:'#ffe5a5',backgroundColor:'#18332e'}));
      this.walker=this.add.container(0,0,[this.add.ellipse(0,0,17,7,0x182c26,.6),this.add.rectangle(0,-12,10,18,0xe3b655),this.add.circle(0,-24,6,0xffe3a1)]);
      this.keys=this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>|undefined;
      this.input.keyboard?.addCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT');
      this.input.on('pointerdown',()=>{ (this.game.canvas as HTMLCanvasElement).focus(); });
      this.game.canvas.setAttribute('tabindex','0');
      this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.keyboard?.removeCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT');});
      this.update(0,0);
    }
    update(time: number, delta: number) {
      if(!this.walker)return;
      if(this.resetSeen!==controls.reset) {this.resetSeen=controls.reset;this.position={...MAP.spawn};this.waypoint=0;this.reverse=false;}
      if(this.focusSeen!==controls.focusRequest) {this.focusSeen=controls.focusRequest;this.position={...MOUNTAIN_DRAFT_FOCUS[controls.focus]!};this.waypoint=controls.focus===0?0:controls.focus===1?6:ROUTE.length-1;}
      let x=controls.x+(this.keys?.D?.isDown||this.keys?.RIGHT?.isDown?1:0)-(this.keys?.A?.isDown||this.keys?.LEFT?.isDown?1:0);
      let y=controls.y+(this.keys?.S?.isDown||this.keys?.DOWN?.isDown?1:0)-(this.keys?.W?.isDown||this.keys?.UP?.isDown?1:0);
      if(controls.tour&&!x&&!y) {
        const target=ROUTE[this.waypoint]!;
        const dx=target[0]-this.position.x,dy=target[1]-this.position.y,d=Math.hypot(dx,dy);
        if(d<.08) {
          if(this.waypoint===ROUTE.length-1)this.reverse=true;
          if(this.waypoint===0)this.reverse=false;
          this.waypoint+=this.reverse?-1:1;
        } else {x=dx/d;y=dy/d;delta=Math.min(delta,d/4*1000);}
      }
      this.position=stepMovement(this.position,{x,y,sequence:0},Math.min(delta,40)/1000,MAP).position;
      this.walker.setPosition(this.position.x*U,projectedY(MAP,this.position.x,this.position.y)).setDepth(this.position.y*U);
      this.diagnostics.setVisible(controls.guides);
      const camera=this.cameras.main;
      if(controls.overview) {
        camera.removeBounds();
        camera.setZoom(Math.min(this.scale.width/(MAP.width*U+64),this.scale.height/(MAP.height*U+2*RISE+32)));
        camera.centerOn(MAP.width*U/2,(MAP.height*U-2*RISE)/2);
      } else {
        camera.setBounds(0,-2*RISE,MAP.width*U,MAP.height*U+2*RISE);
        camera.setZoom(Math.min(1,Math.max(.8,this.scale.width/700)));
        camera.centerOn(this.walker.x,this.walker.y-80);
      }
      if(time-this.lastReport>200||!this.lastReport) {
        this.lastReport=time;
        report({...this.position,level:terrainHeight(MAP,this.position.x,this.position.y),fps:this.game.loop.actualFps,sceneId,ready:true});
      }
    }
  }
  const game=new Phaser.Game({type:Phaser.CANVAS,parent,width:parent.clientWidth,height:parent.clientHeight,backgroundColor:'#182f2c',pixelArt:true,roundPixels:true,antialias:false,banner:false,audio:{noAudio:true},scene:[MountainScene],scale:{mode:Phaser.Scale.RESIZE},fps:{target:60}});
  const observer=new ResizeObserver(()=>{if(parent.clientWidth&&parent.clientHeight)game.scale.resize(parent.clientWidth,parent.clientHeight);});
  observer.observe(parent);
  return {destroy:()=>{observer.disconnect();game.destroy(true);}};
}
