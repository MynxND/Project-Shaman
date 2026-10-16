interface RingCue { radius: number; width: number; startsAt: number; endsAt: number }
/** World units, matching the server's swept contact interval. Never changes gameplay. */
export function sweptRingRadii(h: RingCue, now: number, startRadius: number, padding: number, stepMs: number) {
  const at = (t: number) => startRadius + (h.radius-startRadius)*Math.max(0,Math.min(1,(t-h.startsAt)/Math.max(1,h.endsAt-h.startsAt)));
  const previous = now-Math.max(1,Number.isFinite(stepMs)?stepMs:1000/30);
  return { inner:Math.max(0,at(previous)-h.width-padding), outer:at(now)+h.width+padding };
}
