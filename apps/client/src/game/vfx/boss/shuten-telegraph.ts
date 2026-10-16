import Phaser from 'phaser';
import {WORLD_UNIT_PX as U,SHUTEN_CONTACT_PADDING} from '@shaman/shared';
import type {ShutenCue} from './shuten-vfx-model';

export const SHUTEN_TELL_KEY='oe3:telegraph';
type Point={x:number;y:number};
/** Identical combo footprints share one warning, displaying the earliest pending contact. */
export const shutenTellKey=(h:ShutenCue)=>[h.shape,h.x,h.y,h.toX,h.toY,h.radius,h.angle,h.arc,h.width].join(':');
/** Include the same player-body allowance as bossShapeHit; do not alter its angle or timing. */
export function shutenDangerFootprint(h:ShutenCue,r=h.radius):ShutenCue{
    return {...h,radius:r+SHUTEN_CONTACT_PADDING+(h.shape==='ring'?h.width:0),width:h.width+SHUTEN_CONTACT_PADDING};
}
/** Native world-space perimeter. Decorations inset from it; authority never reads this module. */
export function shutenTellPerimeter(h:ShutenCue,r=h.radius):Point[]{
    const points:Point[]=[],arc=(x:number,y:number,radius:number,a:number,b:number)=>{
        const n=Math.max(8,Math.ceil(Math.abs(b-a)*12));
        for(let i=0;i<=n;i++){const t=a+(b-a)*i/n;points.push({x:x+Math.cos(t)*radius,y:y+Math.sin(t)*radius});}
    };
    if(h.shape==='line'){
        const a=Math.atan2(h.toY-h.y,h.toX-h.x);
        arc(h.toX,h.toY,h.width,a-Math.PI/2,a+Math.PI/2);
        arc(h.x,h.y,h.width,a+Math.PI/2,a+Math.PI*1.5);
    }else if(h.shape==='cone'){
        points.push({x:h.x,y:h.y});arc(h.x,h.y,r,h.angle-h.arc/2,h.angle+h.arc/2);
    }else arc(h.x,h.y,r,0,Math.PI*2);
    return points;
}
export function prepareShutenTell(s:Phaser.Scene){
    const t=s.textures.get(SHUTEN_TELL_KEY);t.setFilter(Phaser.Textures.FilterMode.NEAREST);
    for(let i=0;i<4;i++)if(!t.has(String(i)))t.add(i,0,i*128,0,128,128);
}

/** Geometric ritual indicators only. Organic flames/smoke remain authored flipbooks in ShutenCombatVfx. */
export function drawShutenTell(g:Phaser.GameObjects.Graphics,marks:Phaser.GameObjects.Sprite[],h:ShutenCue,
    radius:number,charge:number,warning:boolean,opacity:number,reduced:boolean){
    const danger=shutenDangerFootprint(h,radius),p=shutenTellPerimeter(danger,danger.radius),px=p.map(q=>({x:q.x*U,y:q.y*U}));
    const ink=0x32151c,red=h.effect==='violet'?0x974454:0xb34a40,gold=0xdfb77c;
    const pulse=warning&&!reduced?.92+.08*Math.sin(charge*Math.PI*2):1;
    const alpha=opacity*pulse,center=h.shape==='line'?{x:(h.x+h.toX)/2,y:(h.y+h.toY)/2}:{x:h.x,y:h.y};
    if(!warning&&h.shape==='ring'){
        // The moving damaging annulus has width, while the center behind it is safe.
        const inner=Math.max(0,radius-h.width-SHUTEN_CONTACT_PADDING),outer=danger.radius;
        g.lineStyle((outer-inner)*U,red,.12*alpha).strokeCircle(h.x*U,h.y*U,(inner+outer)*U/2);
        if(inner>0)g.lineStyle(1.5,red,.45*alpha).strokeCircle(h.x*U,h.y*U,inner*U);
    }
    // A fixed perimeter stays readable throughout the windup; charge never shrinks the danger area.
    if(warning)g.fillStyle(ink,.16*alpha).fillPoints(px,true);
    if(warning)g.fillStyle(red,(.035+.055*charge)*alpha).fillPoints(px,true);
    g.lineStyle(warning?9:4,ink,.72*alpha).strokePoints(px,true);
    g.lineStyle(warning?4:1.5,red,(warning?.85:.45)*alpha).strokePoints(px,true);
    if(warning){
        // Short bronze stitches, inward teeth and broken brush strokes replace the plain drafting line.
        let distance=0;
        for(let i=0;i<px.length;i++){
            const a=px[i]!,b=px[(i+1)%px.length]!,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
            for(let at=(18-distance%18)%18;at<length;at+=18){
                const x=a.x+dx*at/length,y=a.y+dy*at/length,n=Math.hypot(center.x*U-x,center.y*U-y)||1;
                const ix=(center.x*U-x)/n,iy=(center.y*U-y)/n;
                g.lineStyle(2,gold,(.42+.4*charge)*alpha).beginPath().moveTo(x,y).lineTo(x+ix*5,y+iy*5).strokePath();
                g.lineStyle(2,red,.55*alpha).beginPath().moveTo(x+ix*7,y+iy*7).lineTo(x+ix*11-dy/(length||1)*2,y+iy*11+dx/(length||1)*2).strokePath();
            }
            distance+=length;
        }
        // Trace a warm inner contour using normalized server windup time, not a tween or a local timer.
        const inner=px.map(q=>({x:q.x+(center.x*U-q.x)*.06,y:q.y+(center.y*U-q.y)*.06}));
        g.lineStyle(1.5,gold,(.3+.25*charge)*alpha).strokePoints(inner,true);
        let travel=distance*charge;
        g.lineStyle(1.5,gold,.65*alpha).beginPath().moveTo(px[0]!.x,px[0]!.y);
        for(let i=0;i<px.length&&travel>0;i++){const a=px[i]!,b=px[(i+1)%px.length]!,length=Math.hypot(b.x-a.x,b.y-a.y),t=Math.min(1,travel/(length||1));g.lineTo(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);travel-=length;}g.strokePath();
        const stamps:{x:number;y:number;a:number;frame:number;size:number}[]=[];
        if(h.shape==='cone'){
            for(let i=0;i<3;i++){const a=h.angle+(i-1)*h.arc*.34,rad=radius*.68;stamps.push({x:h.x+Math.cos(a)*rad,y:h.y+Math.sin(a)*rad,a:a-Math.PI/2,frame:i===1?0:1,size:Math.min(i===1?48:34,radius*U*.55)});}
        }else if(h.shape==='line'){
            const a=Math.atan2(h.toY-h.y,h.toX-h.x);
            for(let i=0;i<4;i++){const t=(i+1)/5;stamps.push({x:h.x+(h.toX-h.x)*t,y:h.y+(h.toY-h.y)*t,a:a+Math.PI/2,frame:i===3?3:i===0?2:1,size:Math.min(32,h.width*U*1.4)});}
        }else{
            for(let i=0;i<4;i++){const a=i*Math.PI/2,rad=radius*.76;stamps.push({x:h.x+Math.cos(a)*rad,y:h.y+Math.sin(a)*rad,a,frame:i%2===0?0:2,size:Math.min(56,radius*U*.55)});}
        }
        for(let i=0;i<stamps.length;i++){const t=stamps[i]!;marks[i+4]!.setTexture(SHUTEN_TELL_KEY,t.frame).setOrigin(.5).setPosition(t.x*U,t.y*U).setDisplaySize(t.size,t.size*.78).setRotation(t.a).setDepth(-.54).setAlpha((.65+.3*charge)*alpha).setBlendMode(Phaser.BlendModes.NORMAL).clearTint().setVisible(true);}
    }
}
