import Phaser from 'phaser';
import {FACINGS,OE_SEAL,WORLD_UNIT_PX as U} from '@shaman/shared';
import type {BossEncounterState,MonsterState} from '@shaman/schema';
import {smooth,sampleShutenCue} from './shuten-vfx-model';
import {clamp01} from './stomp-timeline';
type ActorSource={spriteOf(id:string):Phaser.GameObjects.Sprite|undefined};
/** Read-only pose choreography. It never moves a collider or awards combat results. */
export class ShutenPresentation {
    private veil:Phaser.GameObjects.Sprite;
    private ash:Phaser.GameObjects.Sprite;
    private blade:Phaser.GameObjects.Sprite;
    private ritual:Phaser.GameObjects.Sprite;
    private deathAt=-1;
    private reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    constructor(private s:Phaser.Scene){
        this.veil=s.add.sprite(0,0,'oe3:smoke').setVisible(false);
        this.ash=s.add.sprite(0,0,'oe3:impact').setVisible(false);
        this.blade=s.add.sprite(0,0,'oe:props',7).setVisible(false);
        this.ritual=s.add.sprite(OE_SEAL.x*U,OE_SEAL.y*U,'oe3:portal').setDepth(-.6).setDisplaySize(160,110).setVisible(false);
    }
    update(b:BossEncounterState,monsters:Iterable<[string,MonsterState]>,actors:ActorSource,now:number){
        this.veil.setVisible(false);this.ash.setVisible(false);this.blade.setVisible(false);
        const entries=[...monsters],body=entries.find(([,m])=>m.kind==='shuten-doji')?.[1];
        if(!body)return;
        this.ritual.setVisible(b.phase===3&&b.mode!=='dead').setFrame(Math.floor(now/80)%16).setAlpha(b.sealed?.3:b.sealProgress?.35+.2*b.sealProgress:.18).setTint(b.sealed?0x77b99b:0xd6b46c);
        if(b.mode!=='dead')this.deathAt=-1;else this.deathAt=b.actionAt;
        const transition=b.mode==='transition',t=now-b.actionAt,cut=transition&&b.phase===3;
        for(const [id,m]of entries){if(m.kind!=='shuten-doji'&&m.kind!=='shuten-head')continue;
            const s=actors.spriteOf(id);if(!s)continue;const f=Math.max(0,FACINGS.indexOf(m.facing as typeof FACINGS[number]));
            if(m.kind==='shuten-head'){
                if(m.state==='dead'){s.setVisible(false);continue;}
                s.anims.stop();s.setTexture('monster:shuten-head',f).setAngle(0).setVisible(b.rejoinedUntil<=now&&(!cut||t>=900));
                let x=m.x*U,y=m.y*U-72;
                const charge=[...b.hazards.values()].find(h=>h.skill==='cursed-head'&&now>=h.startsAt&&now<=h.endsAt);
                if(charge){const p=sampleShutenCue(charge,now);x=p.x*U;y=p.y*U-72;}
                if(cut&&t<1600){const p=smooth((t-900)/700);x=Phaser.Math.Linear(body.x*U,x,p);y=Phaser.Math.Linear(body.y*U-145,y,p);}
                s.setPosition(x,y-(this.reduced?0:Math.sin(now*.003)*3)).setDepth(m.y*U+2);continue;
            }
            s.anims.stop();const dead=b.mode==='dead'||m.state==='dead';
            let form=b.phase===1?'armored':b.phase===2||b.rejoinedUntil>now?'frenzy':'headless';
            if(transition&&t<900)form=b.phase===2?'armored':'frenzy';
            const bodyCues=[...b.hazards.values()].filter(h=>h.actor==='body');
            const next=bodyCues.filter(h=>h.startsAt>now).sort((a,b)=>a.startsAt-b.startsAt)[0];
            const previous=bodyCues.filter(h=>h.startsAt<=now).sort((a,b)=>b.startsAt-a.startsAt)[0];
            const hitAge=previous?now-previous.startsAt:Infinity;
            const wind=!dead&&(b.mode==='windup'||!!next&&next.startsAt-now<240),strike=!dead&&hitAge<230;
            s.setTexture(wind?'oe:'+form+'-windup':strike?'oe:'+form+'-strike':form==='armored'?'monster:shuten-doji':'oe:'+form,f);
            if(transition&&b.phase===2&&t>=200&&t<1100)s.setTexture('oe3:drinking',f);
            if(dead&&now-this.deathAt>150)s.setTexture('oe3:fallen',f);
            const baseScale=.92,breath=this.reduced||dead?0:Math.sin(now*.0022)*.002;
            let ox=0,oy=0,angle=0,scaleX=1,scaleY=1;
            if(wind&&!this.reduced){const p=smooth((now-b.actionAt)/Math.max(1,(next?.startsAt??b.actionAt+900)-b.actionAt));oy=3*p;scaleX=1+.018*p;scaleY=1-.018*p;}
            if(strike&&!this.reduced){const a=previous?.angle??0,k=Math.sin(clamp01(hitAge/230)*Math.PI);ox=Math.cos(a)*5*k;oy+=Math.sin(a)*4*k;angle=Math.sin(a)*2*k;}
            if(b.skill==='blood-moon-leap'&&now<b.actionAt+1400){
                const landing=bodyCues.find(h=>h.effect==='impact'),p=clamp01((t-650)/750);
                if(landing&&p>0){ox+=(landing.x-m.x)*U*smooth(p);oy+=(landing.y-m.y)*U*smooth(p)-(this.reduced?0:Math.sin(p*Math.PI)*95);}
            }
            if(b.mode==='stagger'&&!this.reduced)angle=Math.sin(now*.032)*2;
            if(dead){const p=clamp01((now-this.deathAt)/1050);s.setAlpha(1-smooth(p));scaleY=1-.08*p;oy=8*p;}
            s.setPosition(m.x*U+ox,m.y*U+oy).setScale(baseScale*scaleX,baseScale*(scaleY+breath)).setAngle(angle).setDepth(m.y*U);
        }
        if(transition){
            const age=t-700;
            if(age>=0&&age<1700){this.veil.setTexture('oe3:smoke',Math.min(15,Math.floor(age/75))).setPosition(body.x*U,body.y*U).setOrigin(.5,.9).setDisplaySize(280,320).setAlpha(Math.sin(clamp01(age/1700)*Math.PI)*.8).setDepth(body.y*U+4).setVisible(true);}
            if(cut&&t>350&&t<1150){const p=smooth((t-350)/800);this.blade.setPosition(body.x*U+75-150*p,body.y*U-160+30*p).setDisplaySize(160,160).setAngle(-45+100*p).setAlpha(Math.sin(p*Math.PI)).setDepth(body.y*U+5).setVisible(true);}
            if(age>=0&&age<650)this.ash.setTexture('oe3:impact',Math.min(15,Math.floor(age/41.667))).setPosition(body.x*U,body.y*U).setOrigin(.5,.65).setDisplaySize(240,240).setAlpha(1-age/650).setDepth(body.y*U+1).setVisible(true);
        }
        if(this.deathAt>=0){const p=clamp01((now-this.deathAt)/1500);if(p<1)this.veil.setTexture('oe3:smoke',Math.min(15,Math.floor(p*16))).setPosition(body.x*U,body.y*U).setOrigin(.5,.9).setDisplaySize(230,310).setAlpha(Math.sin(p*Math.PI)*.8).setDepth(body.y*U+4).setVisible(true);}
    }
    destroy(){this.veil.destroy();this.ash.destroy();this.blade.destroy();this.ritual.destroy();}
}
