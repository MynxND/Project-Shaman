import Phaser from 'phaser';
import {shutenBaitAlpha} from './shuten-vfx-model';
import {WORLD_UNIT_PX as U} from '@shaman/shared';
import {clamp01} from './stomp-timeline';
import {SHUTEN_ATLASES,sampleShutenCue,smooth,shutenMouthPort,shutenActiveTell,type ShutenCue,type ShutenMaterial} from './shuten-vfx-model';
import {SHUTEN_TELL_KEY,prepareShutenTell,drawShutenTell,shutenTellKey} from './shuten-telegraph';
const key=(name:string)=>'oe3:'+name;
export function preloadShutenCombatVfx(s:Phaser.Scene){for(const id of [...SHUTEN_ATLASES,'drinking','fallen'])if(!s.textures.exists(key(id)))s.load.spritesheet(key(id),`/assets/vfx/boss/shuten-complete/${id}.png`,{frameWidth:256,frameHeight:256});if(!s.textures.exists(SHUTEN_TELL_KEY))s.load.svg(SHUTEN_TELL_KEY,'/assets/vfx/boss/shuten-complete/telegraph-marks.svg',{width:512,height:128});}
type View={label:Phaser.GameObjects.Text;id:string;h:ShutenCue|null;seen:number;cancelAt:number;contact:boolean;sprites:Phaser.GameObjects.Sprite[];tell:Phaser.GameObjects.Graphics;clip:Phaser.GameObjects.Graphics;mask:Phaser.Display.Masks.GeometryMask};
/** One pooled view per authoritative hazard. Organic art and gameplay geometry have separate lifetimes. */
export class ShutenCombatVfx {
    private pool:View[]=[];
    private particles:Phaser.GameObjects.Particles.ParticleEmitter;
    private reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    private shakeAt=-Infinity;
    private cost:number[]=[];
    private peak=0;
    constructor(private scene:Phaser.Scene,private capacity=32){
        prepareShutenTell(scene);
        for(const id of [...SHUTEN_ATLASES,'drinking','fallen'])scene.textures.get(key(id)).setFilter(Phaser.Textures.FilterMode.NEAREST);
        // ParticleEmitter total-count limits include the reserved dead pool in Phaser 3.90.
        this.particles=scene.add.particles(0,0,'stomp-v2',{frame:[13,14],reserve:96,maxAliveParticles:96,emitting:false,
            lifespan:{min:300,max:850},speed:{min:28,max:130},angle:{min:190,max:350},gravityY:155,
            scale:{start:.045,end:.008},alpha:{start:.85,end:0},rotate:{min:0,max:360}}).setDepth(99998);
    }
    private make():View{
        const clip=this.scene.make.graphics({x:0,y:0},false),mask=clip.createGeometryMask();
        const sprites=Array.from({length:8},()=>this.scene.add.sprite(0,0,key('impact')).setVisible(false));
        return {label:this.scene.add.text(0,0,'',{fontFamily:'Tahoma',fontSize:'14px',color:'#e5d3a4',stroke:'#10231f',strokeThickness:4}).setOrigin(.5).setDepth(99998).setVisible(false),id:'',h:null,seen:0,cancelAt:0,contact:false,sprites,tell:this.scene.add.graphics().setDepth(-.57),clip,mask};
    }
    private outline(g:Phaser.GameObjects.Graphics,h:ShutenCue,r:number,fill=false){
        const x=h.x*U,y=h.y*U;
        if(h.shape==='line'){
            const tx=h.toX*U,ty=h.toY*U,a=Math.atan2(ty-y,tx-x),dx=Math.sin(a)*h.width*U,dy=Math.cos(a)*h.width*U;
            const pts=[{x:x-dx,y:y+dy},{x:x+dx,y:y-dy},{x:tx+dx,y:ty-dy},{x:tx-dx,y:ty+dy}];
            if(fill)g.fillPoints(pts,true);else{g.strokePoints(pts,true);g.strokeCircle(x,y,h.width*U);g.strokeCircle(tx,ty,h.width*U);}return;
        }
        if(h.shape==='cone'){
            g.beginPath().moveTo(x,y).arc(x,y,r,h.angle-h.arc/2,h.angle+h.arc/2,false).closePath();
            fill?g.fillPath():g.strokePath();return;
        }
        fill?g.fillCircle(x,y,r):g.strokeCircle(x,y,r);
    }
    update(cues:Iterable<ShutenCue>,now:number,rate=1,phase=1){
        const start=performance.now();this.particles.timeScale=rate;
        const warnings=new Map<string,ShutenCue>();
        for(const h of cues){let v=this.pool.find(v=>v.id===h.id);
            if(!v){v=this.pool.find(v=>!v.id);if(!v&&this.pool.length<this.capacity){v=this.make();this.pool.push(v);}if(!v)continue;
                v.id=h.id;v.contact=false;v.cancelAt=0;}
            // Copy primitive fields; schema removal must not erase the cosmetic tail.
            v.h={...h};v.seen=now;
            if(now>=h.warnAt&&now<h.startsAt){const k=shutenTellKey(h),previous=warnings.get(k);if(!previous||h.startsAt<previous.startsAt)warnings.set(k,h);}
        }
        for(const v of this.pool){if(!v.id||!v.h)continue;
            const h=v.h,p=sampleShutenCue(h,now),x=h.x*U,y=h.y*U,r=h.radius*U;
            if(v.seen!==now&&now<h.endsAt&&!v.cancelAt)v.cancelAt=now;
            const cancel=v.cancelAt?1-smooth((now-v.cancelAt)/180):1;
            v.label.setVisible(false);v.tell.clear();v.clip.clear();for(const s of v.sprites)s.setVisible(false).clearMask();
            const draw=(i:number,material:ShutenMaterial,frame:number,px:number,py:number,w:number,height:number,alpha:number,depth:number,angle=0,originX=.5,originY=.5)=>{
                const s=v.sprites[i]!;s.setTexture(key(material),frame).setPosition(px,py).setDisplaySize(Math.max(1,w),Math.max(1,height)).setOrigin(originX,originY)
                    .setRotation(angle).setAlpha(clamp01(alpha*cancel)).setDepth(depth).setBlendMode(Phaser.BlendModes.NORMAL).clearTint().setVisible(alpha*cancel>.001);return s;
            };
            if(h.actor==='altar-bait'){
                const fade=shutenBaitAlpha(h.endsAt,now,v.cancelAt);
                if(fade<=0){v.id='';v.h=null;continue;}
                v.tell.lineStyle(2,0xd6b46c,.9*fade).strokeCircle(x,y,r);
                // draw() already applies cancellation alpha; avoid applying it twice.
                draw(0,'liquid',4+Math.floor(Math.max(0,p.age)/150)%8,x,y,r*2.1,r*1.6,.65*fade/Math.max(.001,cancel),-.60,0,.5,.5);
                v.label.setText(phase===3?'ล่อเศียรลงสาเก':'ล่อร่างลงสาเก').setPosition(x,y+r+12).setAlpha(fade).setVisible(true);continue;
            }
            const indicator=h.effect==='portal'||h.effect==='faces'?0xd6b46c:h.actor==='head'?0xb4d1ca:0xdfae77;
            if(p.warning){
                const first=warnings.get(shutenTellKey(h));if(first&&first.id!==h.id&&!v.cancelAt)continue;
                drawShutenTell(v.tell,v.sprites,h,h.radius,p.charge,true,cancel,this.reduced);
                draw(0,'portal',Math.floor(p.charge*15),x,y,Math.min(r*1.1,135),Math.min(r*.8,100),.16+.13*p.charge,-.62).setTint(indicator);
                if(h.effect!=='sake'&&h.effect!=='violet')draw(1,'smoke',Math.min(4,Math.floor(p.charge*5)),x,y,75,105,.1+.2*p.charge,y+.2,0,.5,.9);
                if(h.effect==='fist'&&p.age>-180)draw(2,'fist',Math.min(3,Math.floor((p.age+180)/45)),x,y,Math.max(90,r*2.1),Math.max(90,r*2.1),smooth((p.age+180)/180)*.8,y+2,0,.5,.7);
            } else if(!v.cancelAt||v.contact){
                const late=now>h.endsAt,fade=late?1-smooth((now-h.endsAt)/240):1;
                if(!v.contact){v.contact=true;if(p.age<120){
                    if(!['sake','portal','faces','breath'].includes(h.effect))this.particles.emitParticleAt(p.x*U,p.y*U,this.reduced?2:h.effect==='fist'?12:8);
                    if(!this.reduced&&now-this.shakeAt>170&&['impact','fist','shock'].includes(h.effect)&&Phaser.Math.Distance.Between(this.scene.cameras.main.midPoint.x,this.scene.cameras.main.midPoint.y,x,y)<650){this.scene.cameras.main.shake(100,h.effect==='fist'?.0022:.0015);this.shakeAt=now;}
                }}
                if(p.live)drawShutenTell(v.tell,v.sprites,shutenActiveTell(h,now),p.radius,1,false,1,this.reduced);
                draw(0,'portal',Math.floor(p.age/60)%16,x,y,Math.min(r*1.2,150),Math.min(r*.85,105),.14*fade,-.63);
                let px=x,py=y,w=r*2.05,height=w,rot=0,ox=.5,oy=.65,depth=y+1,alpha=.87*fade;
                if(h.shape==='ring'){
                    w=height=Math.max(1,p.radius*U*2.08);oy=.5;depth=-.58;alpha*=p.live?Math.min(1,(h.endsAt-now)/100):0;
                }else if(h.shape==='cone'){
                    if(h.effect==='breath'||h.effect==='roar'){
                        const port=shutenMouthPort(h,phase),endX=x+Math.cos(h.angle)*r,endY=y+Math.sin(h.angle)*r;
                        px=x+port.x;py=y+port.y;rot=Math.atan2(endY-py,endX-px);w=Math.hypot(endX-px,endY-py)/.88;height=Math.max(85,2*r*Math.sin(h.arc/2)*.8);ox=.06;oy=.5;depth=Math.sin(h.angle)<-.1?y+(h.actor==='head'?1:-.1):y+3;
                    }else{
                        oy=.5;rot=h.angle+Math.PI;depth=-.56;
                        if(p.material==='sweep'){v.clip.fillStyle(0xffffff,1);this.outline(v.clip,h,r,true);}
                        // The authored crescent opens right; its safe gap must open behind the strike.
                        if(p.material==='impact'){px+=Math.cos(h.angle)*r*.55;py+=Math.sin(h.angle)*r*.55;w=height=r*1.25;oy=.65;rot=0;depth=py+1;}
                    }
                }else if(h.shape==='line'){
                    rot=Math.atan2(h.toY-h.y,h.toX-h.x);const port=shutenMouthPort({...h,angle:rot},phase);px=p.x*U+port.x;py=p.y*U+port.y;w=height=105;oy=.5;depth=p.y*U+3;
                }else if(h.effect==='sake'){
                    // Non-damaging liquid stage, deliberately distinct from the later violet ignition.
                    w=r*2.2;height=r*1.6;oy=.5;depth=-.60;alpha=.78*fade;
                }else if(h.effect==='portal'){
                    w=r*2.3;height=r*1.7;oy=.5;depth=-.58;
                }else if(h.effect==='faces'){
                    py=y-55;w=height=r*2.15;oy=.5;alpha*=.65;
                }else if(h.effect==='fist'){w=height=r*2.65;oy=.7;}
                // Two authored adjacent frames blend; neither the gameplay radius nor hit deadline is eased.
                draw(2,p.material,p.frame,px,py,w,height,alpha*(1-p.blend),depth,rot,ox,oy);
                draw(3,p.material,p.next,px,py,w,height,alpha*p.blend,depth+.001,rot,ox,oy);
                if(h.shape==='cone'&&p.material==='sweep'){v.sprites[2]!.setMask(v.mask);v.sprites[3]!.setMask(v.mask);}
                if(h.shape==='line'||h.effect==='breath')draw(4,p.material,(p.frame+14)%16,px-Math.cos(rot)*18,py-Math.sin(rot)*18,w*.95,height*.82,.14*fade,depth-.01,rot,ox,oy);
                if(h.shape==='ring'&&p.live)draw(4,'wave',(p.frame+8)%16,x,y,w*.94,height*.94,.18*fade,-.60,-.08,.5,.5);
                if(p.age<100&&h.effect!=='sake'&&h.effect!=='portal'&&h.effect!=='faces'){
                    draw(5,'impact',0,h.shape==='line'?px:x,h.shape==='line'?py:y,80,80,.25*(1-p.age/100),depth+.1,0,.5,.65)
                        .setBlendMode(this.scene.game.renderer.type===Phaser.WEBGL?Phaser.BlendModes.SCREEN:Phaser.BlendModes.NORMAL);
                }
                const smokeAge=p.age-140;
                if(smokeAge>=0&&smokeAge<800&&h.effect!=='sake')draw(6,'smoke',Math.min(15,Math.floor(smokeAge/50)),x,y,Math.min(r*1.6,150),Math.min(r*2,190),.25*Math.sin(smokeAge/800*Math.PI)*fade,y+.4,0,.5,.85);
                if(p.age>280)draw(7,'portal',15,x,y,Math.min(r*1.7,170),Math.min(r,110),.12*(1-p.tail),-.64);
                if(h.shape==='cone'&&h.effect==='violet'){
                    // Upright fire tongues distributed over the damaging arc, never rotated as a flat pillar.
                    for(let j=0;j<5;j++){const a=h.angle-h.arc*.44+j*h.arc*.88/4,fx=x+Math.cos(a)*r*.62,fy=y+Math.sin(a)*r*.62;
                        draw(2+j,'sake',(p.frame+j*3)%16,fx,fy,105,150,.78*fade,fy+1,0,.5,.65).clearMask();}
                    draw(7,'impact',Math.min(15,Math.floor(p.age/22)),x+Math.cos(h.angle)*r*.4,y+Math.sin(h.angle)*r*.4,150,150,.45*fade,y+2,0,.5,.65);
                }
            }
            if(p.tail>=1||cancel<=0){v.id='';v.h=null;v.label.setVisible(false);v.tell.clear();for(const s of v.sprites)s.setVisible(false).clearMask();}
        }
        this.peak=Math.max(this.peak,this.particles.getAliveParticleCount());this.cost.push(performance.now()-start);if(this.cost.length>1200)this.cost.shift();
    }
    get stats(){const a=[...this.cost].sort((a,b)=>a-b);return {active:this.pool.filter(v=>v.id).length,pooled:this.pool.length,capacity:this.capacity,particles:this.particles.getAliveParticleCount(),peakParticles:this.peak,objects:this.pool.length*11+1,cpuP95:a[Math.floor(a.length*.95)]??0};}
    reset(){for(const v of this.pool){v.id='';v.h=null;v.label.setVisible(false);v.tell.clear();for(const s of v.sprites)s.setVisible(false).clearMask();}this.particles.killAll();}
    destroy(){for(const v of this.pool){for(const s of v.sprites)s.destroy();v.label.destroy();v.tell.destroy();v.mask.destroy();v.clip.destroy();}this.pool=[];this.particles.destroy();}
}
