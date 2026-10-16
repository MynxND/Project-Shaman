/** Presentation only. Linear radius is deliberately identical to the server annulus. */
export interface WaveCue { id:string; skill:string; x:number; y:number; radius:number; width:number; warnAt:number; startsAt:number; endsAt:number }
export const clamp01 = (n:number) => Math.max(0,Math.min(1,n));
export function waveSample(h:WaveCue, now:number, art={materialFrameMs:83.333,impactFrameMs:41.667,residueMs:650}) {
    const age=now-h.startsAt, span=Math.max(1,h.endsAt-h.startsAt);
    return { age, radius:h.radius*clamp01(age/span), warning:now<h.startsAt,
        charge:clamp01((now-h.warnAt)/Math.max(1,h.startsAt-h.warnAt)),
        live:age>=0&&age<=span, tail:clamp01((now-h.endsAt)/art.residueMs),
        materialFrame:Math.floor(Math.max(0,age)/art.materialFrameMs)%4,
        impactFrame:Math.min(7,Math.floor(Math.max(0,age)/art.impactFrameMs)) };
}
