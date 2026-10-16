import { clamp01 } from './stomp-timeline';
export const SHUTEN_ATLASES=['wave','sweep','sake','roar','portal','fist','breath','impact','smoke','liquid'] as const;
export type ShutenMaterial=typeof SHUTEN_ATLASES[number];
export interface ShutenCue {
    id:string;skill:string;actor:string;shape:string;effect:string;
    x:number;y:number;toX:number;toY:number;radius:number;angle:number;arc:number;width:number;
    warnAt:number;startsAt:number;endsAt:number;
}
// Authored native atlas ports, in FACINGS order. Back views emit behind hair, not from the foot anchor.
const HEAD_MOUTHS=[[128,164],[154,164],[179,157],[172,145],[128,141],[84,145],[77,157],[102,164]] as const;
const BODY_MOUTHS=[[128,64],[142,65],[160,63],[150,60],[128,58],[106,60],[96,63],[114,65]] as const;
export function shutenMouthPort(h:Pick<ShutenCue,'angle'|'actor'>,phase=1){
    const i=((Math.round((Math.PI/2-h.angle)/(Math.PI/4))%8)+8)%8;
    if(h.actor==='head'){const p=HEAD_MOUTHS[i]!;return {x:(p[0]-128)*.48,y:(p[1]-240)*.48-72};}
    const p=phase===3?[128,98]:BODY_MOUTHS[i]!;return {x:(p[0]!-128)*.92,y:(p[1]!-240)*.92};
}
export function shutenMaterial(h:ShutenCue):ShutenMaterial {
    if(h.shape==='ring')return 'wave';
    if(h.effect==='sake')return 'liquid';
    if(h.effect==='violet')return 'sake';
    if(h.effect==='portal')return 'portal';
    if(h.effect==='roar'||h.effect==='faces'||h.effect==='bite')return 'roar';
    if(h.effect==='breath')return 'breath';
    if(h.effect==='fist')return 'fist';
    return h.effect==='sweep'?'sweep':'impact';
}
export function sampleShutenCue(h:ShutenCue,now:number){
    const age=now-h.startsAt,span=Math.max(1,h.endsAt-h.startsAt),p=clamp01(age/span),material=shutenMaterial(h);
    const looping=material==='wave'||material==='sake'||material==='portal'||material==='breath';
    // Contact art starts on the actual hit, not halfway through a slow generic burst.
    const first=material==='fist'||material==='sweep'||material==='roar'?4:0;
    const cursor=looping?Math.max(0,age)*24/1000:first+Math.max(0,age)*(16-first)/Math.min(span,650);
    const frame=looping?Math.floor(cursor)%16:Math.min(15,Math.floor(cursor));
    return {age,p,material,frame,next:looping?(frame+1)%16:Math.min(15,frame+1),blend:cursor%1,
        warning:age<0,live:age>=0&&age<=span,charge:clamp01((now-h.warnAt)/Math.max(1,h.startsAt-h.warnAt)),
        radius:h.shape==='ring'?h.radius*p:h.radius,
        x:h.shape==='line'?h.x+(h.toX-h.x)*p:h.x,y:h.shape==='line'?h.y+(h.toY-h.y)*p:h.y,
        tail:clamp01((now-h.endsAt)/600)};
}
/** A charge's warning covers its future lane; active contact follows the head's current swept segment. */
export function shutenActiveTell(h:ShutenCue,now:number):ShutenCue{
    if(h.shape!=='line')return h;
    const previous=sampleShutenCue(h,Math.max(h.startsAt,now-1000/30)),current=sampleShutenCue(h,now);
    return {...h,x:previous.x,y:previous.y,toX:current.x,toY:current.y};
}
/** Eight-sided sampling is never used for geometry: all tells retain the server's exact arc. */
export const smooth=(p:number)=>{const q=clamp01(p);return q*q*(3-2*q);};
