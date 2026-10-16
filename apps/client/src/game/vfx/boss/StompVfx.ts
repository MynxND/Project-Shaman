import Phaser from 'phaser';
import { WORLD_UNIT_PX as U } from '@shaman/shared';
import { waveSample, clamp01, type WaveCue } from './stomp-timeline';
import { STOMP_ART, type WaveArtProfile } from './wave-profile';

export function preloadStomp(s:Phaser.Scene) {
    if(!s.textures.exists('stomp-v2')) s.load.spritesheet('stomp-v2','/assets/vfx/boss/stomp-v2/layers.png',{frameWidth:256,frameHeight:256});
}
type View={id:string; cue:WaveCue|null; seen:number; cancelled:number; burst:boolean; layers:Phaser.GameObjects.Sprite[]; tell:Phaser.GameObjects.Graphics; embers:Phaser.GameObjects.Particles.ParticleEmitter};
/** Fixed pool, server-clock sampling, cosmetic tails only. Never owns hitboxes or damage. */
export class StompVfx {
    private views:View[]=[];
    private reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    constructor(private s:Phaser.Scene, capacity=4, private profile:Readonly<WaveArtProfile>=STOMP_ART) {
        s.textures.get(profile.atlas).setFilter(Phaser.Textures.FilterMode.NEAREST);
        for(let i=0;i<capacity;i++) {
            const layers=Array.from({length:9},()=>s.add.sprite(0,0,profile.atlas).setVisible(false));
            const embers=s.add.particles(0,0,profile.atlas,{frame:[13,14],emitting:false,maxAliveParticles:32,reserve:32,lifespan:{min:350,max:850},speed:{min:35,max:115},angle:{min:200,max:340},gravityY:140,scale:{start:.055,end:.012},alpha:{start:.8,end:0},rotate:{min:0,max:360},blendMode:Phaser.BlendModes.NORMAL});
            this.views.push({id:'',cue:null,seen:0,cancelled:0,burst:false,layers,tell:s.add.graphics().setDepth(-.59),embers});
        }
    }
    update(cues:Iterable<WaveCue>,now:number,rate=1) {
        for(const h of cues) {
            if(h.skill!==this.profile.skillId)continue;
            let v=this.views.find(v=>v.id===h.id);
            if(!v) {v=this.views.find(v=>!v.id); if(!v)continue; v.id=h.id;v.burst=false;v.cancelled=0;}
            v.cue=h;v.seen=now;
        }
        for(const v of this.views) {
            v.embers.timeScale=rate;
            if(!v.id||!v.cue)continue;
            const art=this.profile,h=v.cue, p=waveSample(h,now,art), x=h.x*U,y=h.y*U;
            if(v.seen!==now&&now<h.endsAt&&!v.cancelled) v.cancelled=now;
            const cancel=v.cancelled?1-clamp01((now-v.cancelled)/180):1;
            v.tell.clear();for(const l of v.layers)l.setVisible(false);
            const draw=(i:number,frame:number,px:number,py:number,size:number,alpha:number,depth:number,angle=0)=>{
                v.layers[i]!.setFrame(frame).setPosition(px,py).setDisplaySize(size,size).setAlpha(alpha*cancel).setDepth(depth).setRotation(angle).setVisible(alpha*cancel>.001);
            };
            // Thin amber outline is the gameplay indicator, not the final shockwave artwork.
            if(p.warning) {
                v.tell.lineStyle(1,0xd3b178,.65*cancel).strokeCircle(x,y,h.radius*U);
                draw(0,12,x,y,100+18*p.charge,.12+.2*p.charge,-.61);
                draw(1,15,x,y-30,60+30*p.charge,Math.sin(p.charge*Math.PI)*.45,y+1);
            } else if(!v.cancelled||v.burst) {
                const age=p.age, rr=p.radius*U;
                if(p.live) {
                    // Radius remains linear. Organic texture evolves at 12fps independently of range.
                    const blend=(age/art.materialFrameMs)%1, fade=Math.min(1,(h.endsAt-now)/120);
                    draw(2,p.materialFrame,x,y,Math.max(1,rr*2),art.mainAlpha*(1-blend)*fade,-.58);
                    draw(7,(p.materialFrame+1)%4,x,y,Math.max(1,rr*2),art.mainAlpha*blend*fade,-.579);
                    draw(3,(p.materialFrame+2)%4,x,y,Math.max(1,rr*1.88),art.trailAlpha*fade,-.60,-.13);
                    v.tell.lineStyle(1,0xd6a077,.5*cancel).strokeCircle(x,y,rr);
                }
                if(age<art.impactMs) {
                    // A restrained textured flash; no full-screen bloom or custom shader dependency.
                    if(age<100){draw(1,15,x,y-25,90,.16*(1-age/100),y+1);v.layers[1]!.setBlendMode(this.s.game.renderer.type===Phaser.WEBGL?Phaser.BlendModes.SCREEN:Phaser.BlendModes.NORMAL);}
                    draw(4,p.impactFrame,x,y-20,165,Math.sin(clamp01(age/art.impactMs)*Math.PI),y+2);
                    v.layers[4]!.setTexture(art.impactAtlas,p.impactFrame);
                    if(!v.burst) {
                        v.burst=true;
                        // Late joins sample existing art but never replay an old burst or shake.
                        if(age<130) {v.embers.emitParticleAt(x,y,this.reduced?4:22);if(!this.reduced&&Phaser.Math.Distance.Between(safeCenter(this.s).x,safeCenter(this.s).y,x,y)<600)this.s.cameras.main.shake(95,.0018);}
                    }
                }
                if(age>=art.smokeStartMs&&age<art.smokeEndMs){const duration=art.smokeEndMs-art.smokeStartMs,phase=(age-art.smokeStartMs)/(duration/4), frame=Math.min(3,Math.floor(phase)), blend=phase%1, a=.35*Math.sin(clamp01((age-art.smokeStartMs)/duration)*Math.PI), size=150+45*clamp01(age/art.smokeEndMs);
                    draw(5,4+frame,x,y-22,size,a*(1-blend),y+3);draw(8,4+Math.min(3,frame+1),x,y-22,size,a*blend,y+3.01);}
                if(age>=300&&p.tail<1)draw(6,12,x,y,145,.18*(1-p.tail)*clamp01((age-300)/200),-.62);
            }
            v.embers.setDepth(y+4);
            if(p.tail>=1||cancel<=0) {v.id='';v.cue=null;v.tell.clear();for(const l of v.layers)l.setVisible(false);v.embers.killAll();}
        }
    }
    reset(){for(const v of this.views){v.id='';v.cue=null;v.tell.clear();v.embers.killAll();for(const l of v.layers)l.setVisible(false);}}
    get stats(){return {views:this.views.filter(v=>v.id).length,particles:this.views.reduce((a,v)=>a+v.embers.getAliveParticleCount(),0),capacity:this.views.length,objects:this.views.length*11};}
    destroy(){for(const v of this.views){v.tell.destroy();for(const l of v.layers)l.destroy();v.embers.destroy();}this.views=[];}
}
function safeCenter(s:Phaser.Scene){return s.cameras.main.midPoint;}
