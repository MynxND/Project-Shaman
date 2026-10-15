import * as Phaser from 'phaser';
import { MOUNTAIN_SANCTUARY_PROTOTYPE as MAP, MOUNTAIN_PROTOTYPE_ROUTE as ROUTE, MOUNTAIN_PROTOTYPE_SIDE_ROUTES as SIDE_ROUTES, MOUNTAIN_PROTOTYPE_STREAMS as STREAMS, projectedY, terrainHeight, stepMovement, type Position } from '@shaman/shared';

export interface PrototypeControls { x: number; y: number; overview: boolean; guides: boolean; reset: number; tour: boolean }
export interface PrototypeReport { x: number; y: number; level: number; fps: number; sceneId: string; ready: boolean }
const U = 32, RISE = MAP.elevation!.risePx;
type XY = readonly [number, number];

/** Separate Phaser scene. No production renderer, assets, room or UI stores are touched. */
export function createMountainPrototype(parent: HTMLElement, controls: PrototypeControls, report: (r: PrototypeReport) => void) {
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

    private polygon(points: readonly XY[], color: number, depth: number, alpha=1) {
      const g = this.add.graphics().setDepth(depth);
      g.fillStyle(color,alpha).fillPoints(points.map(p=>new Phaser.Geom.Point(Math.round(p[0]),Math.round(p[1]))),true);
      return g;
    }
    private top(points: readonly XY[], level: number, color: number) {
      return this.polygon(points.map(([x,y])=>[x*U,y*U-level*RISE] as const),color,-90+level);
    }
    private face(a: XY, b: XY, high: number, low: number) {
      const ay=a[1]*U-high*RISE, by=b[1]*U-high*RISE, height=(high-low)*RISE;
      const depth=(a[1]+b[1])/2*U-1;
      // One continuous exposed rock mass. Shaded strata stay inside the same edge geometry.
      this.polygon([[a[0]*U,ay],[b[0]*U,by],[b[0]*U,by+height],[a[0]*U,ay+height]],0x474e4d,depth);
      for(let i=0;i<4;i++) {
        const f=i/4, next=(i+1)/4;
        const ax=a[0]*U+(b[0]-a[0])*U*f, bx=a[0]*U+(b[0]-a[0])*U*next;
        const top=ay+(by-ay)*f, end=ay+(by-ay)*next;
        const colors=[0x59615b,0x3e4947,0x697066,0x4d5852];
        this.polygon([[ax,top+4],[bx,end+4],[bx-3,end+height*.75],[ax+2,top+height*.9]],colors[i]!,depth+.01);
        const g=this.add.graphics().setDepth(depth+.02).lineStyle(2,0x283736,.7);
        g.lineBetween(ax+4,top+height*.12,ax+9,top+height*.4).lineBetween(ax+9,top+height*.4,ax+3,top+height*.7);
      }
      this.polygon([[a[0]*U,ay+height-8],[b[0]*U,by+height-8],[b[0]*U,by+height],[a[0]*U,ay+height]],0x21332e,depth+.03);
      this.polygon([[a[0]*U,ay],[b[0]*U,by],[b[0]*U,by+5],[a[0]*U,ay+5]],0x9b9e7e,depth+.04);
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
      this.top([[0,0],[40,0],[40,36],[0,36]],0,0x424e3c);
      this.top([[7,25],[17,23],[24,26],[33,25],[36,30],[30,34],[18,35],[8,33],[4,30]],0,0x77745a);
      const regions=[...MAP.elevation!.regions!].reverse();
      for(const r of regions) {
        this.cliffs(r.points,r.level);
        this.top(r.points,r.level,r.level===1?0x778069:r.level===2?0x8b9074:0x66745a);
      }
      this.paths();
      for(const route of SIDE_ROUTES)this.paths(route);
      // Terrain paving reserves the blueprint's spatial hierarchy without adding buildings.
      this.top([[11,14],[15,13.5],[17,15],[16,18],[12,18.5],[10.5,16]],1,0xaba184);
      this.add.ellipse(14*U,16*U-RISE,116,76,0x8e8468).setDepth(-79);
      this.top([[12,4],[19,4],[20,7],[16,8],[12,7]],2,0xb1a489);
      this.top([[27,14],[31,14],[32,17],[28,18]],1,0xa49b7e);
      this.top([[2.8,25.2],[4.5,25.2],[4.5,27],[2.8,27]],.5,0xaaa182);
      // Dense forest floor masses follow ravines and shoulders; no scattered rock props.
      for(const [points,level] of [
        [[[6,7],[9,5],[11,3],[12,5],[9,8],[7,10],[4.5,10]],2],
        [[[18,2.5],[22,3.5],[24,5],[22,7],[20.5,5.5]],2],
        [[[28,9],[31,12],[32.5,15],[30,13],[27,11]],1],
        [[[32,23],[36,22],[39,27],[37,33],[33,32],[34,28]],0],
        [[[.5,30],[4,32],[8,34],[7,35.5],[1,35]],0],
      ] as const) this.top(points,level,0x314b3c);
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
      for(const [x,y,caption] of [[14,28,'Z0'],[14,16,'Z1'],[15,5,'Z2']] as const)
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
        camera.setZoom(Math.min(1.5,Math.max(.8,this.scale.width/700)));
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
