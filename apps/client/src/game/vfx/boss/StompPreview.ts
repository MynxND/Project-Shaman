import Phaser from 'phaser';
import { preloadShuten } from '../../world/ShutenLayer';
import { StompVfx } from './StompVfx';
import type { WaveCue } from './stomp-timeline';
import kit from '../../../../public/assets/umbral/japan-01/manifest.json';

export type PreviewControl={legacy:boolean;paused:boolean;speed:number;restart:number};
export function createStompPreview(parent:HTMLElement, control:()=>PreviewControl, metrics:(text:string)=>void) {
    class Lab extends Phaser.Scene {
        private fx!:StompVfx;private old!:Phaser.GameObjects.Graphics;private oldArt!:Phaser.GameObjects.Sprite;
        private boss!:Phaser.GameObjects.Sprite;private age=0;private serial=0;private lastRestart=0;
        private samples:number[]=[];private intervals:number[]=[];private reportAt=0;private peak=0;
        preload(){preloadShuten(this);this.load.spritesheet('boss','/assets/monsters/shuten/armored.png',{frameWidth:256,frameHeight:256});this.load.image('ground-source','/assets/umbral/japan-01/source.png');}
        create(){
            const f=kit.frames.road,t=this.textures.createCanvas('lab-stone',192,192)!;
            t.context.imageSmoothingEnabled=false;t.context.drawImage(this.textures.get('ground-source').getSourceImage() as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,192,192);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.add.tileSprite(0,0,1100,760,'lab-stone').setOrigin(0).setDepth(-2).setTint(0x777780);
            this.boss=this.add.sprite(550,320,'boss',0).setOrigin(.5,240/256).setDisplaySize(210,210).setDepth(320);
            this.fx=new StompVfx(this);this.old=this.add.graphics().setDepth(-.58);this.oldArt=this.add.sprite(0,0,'oe:impact').setVisible(false).setDepth(321);
            this.cameras.main.setRoundPixels(true);this.fit();this.scale.on('resize',this.fit,this);
            this.events.once('shutdown',()=>{this.scale.off('resize',this.fit,this);this.fx.destroy();});
        }
        private fit(){this.cameras.main.setZoom(Math.min(this.scale.width/1100,this.scale.height/760)).centerOn(550,380);}
        update(_time:number,delta:number){
            const start=performance.now(),c=control();
            if(c.restart!==this.lastRestart){this.lastRestart=c.restart;this.age=0;this.serial++;this.fx.reset();this.samples=[];this.intervals=[];this.peak=0;}
            if(!c.paused)this.age+=delta*c.speed;
            if(this.age>4300){this.age=0;this.serial++;this.fx.reset();}
            const cues:WaveCue[]=[0,1].map(i=>({id:`${this.serial}-${i}`,skill:'mountain-stomp',x:550/32,y:320/32,radius:8,width:.65,warnAt:0,startsAt:1100+i*450,endsAt:2600+i*450}));
            this.old.clear();this.oldArt.setVisible(false);
            if(c.legacy)for(const h of cues){
                if(this.age<h.startsAt)this.old.lineStyle(2,0xffb86c,.9).strokeCircle(550,320,256);
                else if(this.age<h.endsAt){const p=(this.age-h.startsAt)/1500,r=256*p;this.old.lineStyle(41.6,0xff8053,.8).strokeCircle(550,320,r).lineStyle(2,0xffdab0,.9).strokeCircle(550,320,r);const w=Math.max(20,Math.min(70,r*.4));this.oldArt.setVisible(true).setPosition(550,320+r).setFrame(Math.min(7,Math.floor(p*8))).setDisplaySize(w,w*.6).setAlpha(.55);}
            }
            this.fx.update(c.legacy?[]:cues,this.age,c.paused?0:c.speed);
            this.boss.setTexture(this.age<1100?'oe:armored-windup':this.age<1450?'oe:armored-strike':'boss',0);
            this.samples.push(performance.now()-start);this.intervals.push(delta);if(this.samples.length>1800){this.samples.shift();this.intervals.shift();}
            this.peak=Math.max(this.peak,this.fx.stats.particles);
            if(_time-this.reportAt>300){this.reportAt=_time;const pct=(a:number[],p:number)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*p)]??0;
                metrics(`${c.legacy?'BEFORE':'AFTER'} · ${this.game.renderer.type===Phaser.WEBGL?'WebGL':'Canvas'} · samples ${this.samples.length} · frame p50 ${pct(this.intervals,.5).toFixed(2)}ms / p95 ${pct(this.intervals,.95).toFixed(2)}ms · VFX update p95 ${pct(this.samples,.95).toFixed(3)}ms · particles ${this.fx.stats.particles} peak ${this.peak}/128 · pool ${this.fx.stats.views}/4 · ${Math.round(this.age)}ms`);}
        }
    }
    const game=new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:'#151b20',pixelArt:true,scale:{mode:Phaser.Scale.NONE,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight)},scene:Lab});
    // Parent-driven resize prevents zero-size WebGL attachments during orientation/HMR layout.
    const observer=new ResizeObserver(()=>{const w=Math.round(parent.clientWidth),h=Math.round(parent.clientHeight);if(w>0&&h>0&&game.isBooted&&(game.scale.width!==w||game.scale.height!==h))game.scale.resize(w,h);});
    observer.observe(parent);
    return {destroy(remove:boolean){observer.disconnect();game.destroy(remove);}};
}
