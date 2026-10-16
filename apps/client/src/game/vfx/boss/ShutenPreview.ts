import Phaser from 'phaser';
import {FACINGS} from '@shaman/shared';
import type {BossEncounterState,MonsterState} from '@shaman/schema';
import kit from '../../../../public/assets/umbral/japan-01/manifest.json';
import {preloadShuten} from '../../world/ShutenLayer';
import {ShutenCombatVfx} from './ShutenCombatVfx';
import {ShutenPresentation} from './ShutenPresentation';
import type {ShutenCue} from './shuten-vfx-model';
type Actor={id:string;kind:string;x:number;y:number;facing:string;state:string};
type Snapshot={at:number;phase:number;mode:string;skill:string;actionAt:number;endsAt:number;headId:string;headSkill:string;headAt:number;headUntil:number;rejoinedUntil:number;ultimateStage:number;sealed:boolean;hp:number;damageMask:number;actors:Actor[]};
type Clip={id:string;face:string;duration:number;player:{x:number;y:number};cues:ShutenCue[];frames:Snapshot[]};
export type ShutenControls={skill:string;face:typeof FACINGS[number];paused:boolean;speed:number;restart:number;scrub:number;seek:number;zoom:number};
export function createShutenPreview(parent:HTMLElement,controls:()=>ShutenControls,onStats:(s:string,progress:number)=>void){
    class Lab extends Phaser.Scene{
        private fx!:ShutenCombatVfx;private pose!:ShutenPresentation;private sprites=new Map<string,Phaser.GameObjects.Sprite>();private age=0;private serial=-1;private seek=-1;private chosen='';private report=0;private samples:number[]=[];private fixtures!:Record<string,Clip>;private zoom=1;
        preload(){preloadShuten(this);this.load.json('oe-clips','/assets/vfx/boss/shuten-complete/clips.json');this.load.image('lab-ground-source','/assets/umbral/japan-01/source.png');this.load.spritesheet('monster:shuten-doji','/assets/monsters/shuten/armored.png',{frameWidth:256,frameHeight:256});this.load.spritesheet('monster:shuten-head','/assets/monsters/shuten/head.png',{frameWidth:256,frameHeight:256});this.load.spritesheet('monster:oe-elite-oni','/assets/monsters/shuten/elite.png',{frameWidth:256,frameHeight:256});}
        create(){this.fixtures=this.cache.json.get('oe-clips').clips;
            const f=kit.frames.road,t=this.textures.createCanvas('oe-lab-stone',192,192)!;t.context.imageSmoothingEnabled=false;t.context.drawImage(this.textures.get('lab-ground-source').getSourceImage() as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,192,192);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.add.tileSprite(0,0,1600,1500,'oe-lab-stone').setOrigin(0).setDepth(-2).setTint(0x777780);
            this.fx=new ShutenCombatVfx(this);this.pose=new ShutenPresentation(this);this.fit();this.scale.on('resize',this.fit,this);
            this.events.once('shutdown',()=>{this.scale.off('resize',this.fit,this);this.fx.destroy();this.pose.destroy();});
        }
        private fit(){this.cameras.main.setZoom(Math.min(this.scale.width/1180,this.scale.height/1050)*controls().zoom).centerOn(768,controls().zoom>1?640:720).setRoundPixels(true);}
        update(time:number,delta:number){if(!this.fx)return;const c=controls(),id=c.skill+':'+c.face,clip=this.fixtures[id];if(!clip)return;if(this.zoom!==c.zoom){this.zoom=c.zoom;this.fit();}
            if(this.chosen!==id||c.restart!==this.serial){this.fx.reset();this.pose.destroy();this.pose=new ShutenPresentation(this);this.age=0;this.chosen=id;this.serial=c.restart;this.samples=[];}
            if(c.seek!==this.seek){this.seek=c.seek;this.age=c.scrub*clip.duration;this.fx.reset();}
            if(!c.paused)this.age+=Math.min(delta,100)*c.speed;
            if(this.age>clip.duration){this.age=0;this.fx.reset();this.pose.destroy();this.pose=new ShutenPresentation(this);}
            const frame=[...clip.frames].reverse().find(s=>s.at<=this.age)??clip.frames[0]!;
            for(const s of this.sprites.values())s.setVisible(false);
            for(const a of frame.actors){let s=this.sprites.get(a.id);if(!s){s=this.add.sprite(a.x*32,a.y*32,'monster:'+a.kind).setOrigin(.5,240/256);this.sprites.set(a.id,s);}
                s.setPosition(a.x*32,a.y*32).setScale(a.kind==='shuten-head'?.48:a.kind==='oe-elite-oni'?.42:.92).setFrame(Math.max(0,FACINGS.indexOf(a.facing as typeof FACINGS[number]))).setDepth(a.y*32).setAlpha(a.state==='dead'?0:1).setVisible(true);}
            const active=clip.cues.filter(h=>this.age>=h.warnAt&&this.age<=h.endsAt);
            const b={...frame,hazards:new Map(active.map(h=>[h.id,h])),now:this.age} as unknown as BossEncounterState;
            this.pose.update(b,frame.actors.map(a=>[a.id,a as unknown as MonsterState]),{spriteOf:id=>this.sprites.get(id)},this.age);
            this.fx.update(active,this.age,c.paused?0:c.speed,frame.phase);
            this.samples.push(delta);if(this.samples.length>1200)this.samples.shift();
            if(time-this.report>250){this.report=time;const ds=[...this.samples].sort((a,b)=>a-b),stats=this.fx.stats;
                const body=frame.actors.find(a=>a.kind==='shuten-doji'),sprite=body?this.sprites.get(body.id):undefined;
                onStats(`${this.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas'} · phase ${frame.phase} / ${frame.mode} · ${frame.ultimateStage?`ultimate ${frame.ultimateStage}/5 · `:''}frame p95 ${(ds[Math.floor(ds.length*.95)]??0).toFixed(2)}ms · VFX CPU p95 ${stats.cpuP95.toFixed(3)}ms · views ${stats.active}/${stats.pooled}/${stats.capacity} · particles ${stats.particles} peak ${stats.peakParticles}/96 · ${Math.round(this.age)}/${clip.duration}ms · pose ${sprite?.texture.key??'-'} α${sprite?.alpha.toFixed(2)??'-'}`,this.age/clip.duration);}
        }
    }
    const game=new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:'#111c20',pixelArt:true,scale:{mode:Phaser.Scale.NONE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight)},scene:Lab});
    const observer=new ResizeObserver(()=>{const w=Math.round(parent.clientWidth),h=Math.round(parent.clientHeight);if(w>0&&h>0&&game.isBooted&&(game.scale.width!==w||game.scale.height!==h))game.scale.resize(w,h);});observer.observe(parent);
    return {destroy(remove:boolean){observer.disconnect();game.destroy(remove);}};
}
