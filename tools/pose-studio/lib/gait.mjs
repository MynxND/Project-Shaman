export const PHASES=['left contact','down-left','passing-left','up-left','right contact','down-right','passing-right','up-right'];
export const FACINGS=['east','south-east','south','south-west','west','north-west','north','north-east'];
export function directionFor(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid movement');if(!x&&!y)return null;return FACINGS[(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8];}
export function normalizedMovement(x,y){const n=Math.hypot(x,y);return n>1?{x:x/n,y:y/n}:{x,y};}
export function advancePhase(phase,dt,speed,stride){if(!(stride>0)||dt<0||speed<0)throw Error('Invalid timing');return ((phase+dt*speed/stride)%1+1)%1;}
// Times must be authored from visible footfalls, not guessed from equal sample spacing.
export function phaseFrames(times,{sourceFps=24,frameCount}){if(!Array.isArray(times)||times.length!==8||times.some((t,i)=>!Number.isFinite(t)||t<0||(i&&t<=times[i-1])))throw Error('Eight increasing gait timestamps required');const indices=times.map(t=>Math.round(t*sourceFps));if(indices.some(i=>i>=frameCount)||new Set(indices).size!==8)throw Error('Gait timestamps must identify eight distinct source frames');return indices;}
