import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {calonHit} from '../../../packages/shared/dist/index.js';
let checks=0;const check=(v,s)=>{assert(v,s);checks++;};
const base={shape:'disk',x:24,y:24,toX:30,toY:24,radius:2.3,width:.6,angle:0,arc:Math.PI/2,startsAt:1000,endsAt:1900};
check(calonHit(base,{x:26.579,y:24},1000),'disk inside padded edge');check(!calonHit(base,{x:26.581,y:24},1000),'disk outside padded edge');
for(let i=0;i<8;i++){const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a),h={...base,shape:'capsule',toX:24+c*6,toY:24+s*6};check(calonHit(h,{x:24+c*3-s*.879,y:24+s*3+c*.879},1000),'rotated lane inside');check(!calonHit(h,{x:24+c*3-s*.881,y:24+s*3+c*.881},1000),'rotated lane outside');check(calonHit(h,{x:h.toX+c*.879,y:h.toY+s*.879},1000),'capsule rounded end');check(!calonHit(h,{x:h.toX+c*.881,y:h.toY+s*.881},1000),'capsule end outside');
 const sector={...base,shape:'sector',radius:16,angle:a};check(calonHit(sector,{x:24+c*10,y:24+s*10},1000),'sector central ray');check(!calonHit(sector,{x:24-c*10,y:24-s*10},1000),'sector safe back');}
const ring={...base,shape:'ring',radius:10,width:.65};check(!calonHit(ring,{x:24,y:24},1800,1500),'annulus center stays safe');check(calonHit(ring,{x:29,y:24},1500,1000),'variable-step ring crosses point');check(!calonHit(ring,{x:29,y:24},1900,1800),'passed ring no stale disk');
const charge={...base,shape:'charge',toX:36,endsAt:1500};check(calonHit(charge,{x:30,y:24},1500,1000),'swept charge cannot tunnel');check(!calonHit(charge,{x:30,y:24},1500,1500),'passed charge no whole-lane damage');
const finale={...base,shape:'finale',radius:24};check(!calonHit(finale,{x:24,y:35},1700),'refuge center');check(!calonHit(finale,{x:24,y:38.079},1700),'refuge padded inside');check(calonHit(finale,{x:24,y:38.081},1700),'refuge outside');
writeFileSync('docs/design/bosses/calon-arang/evidence/geometry.json',JSON.stringify({status:'pass',checks,allowance:.28,edges:'±.001 world units',variableSweeps:true},null,2));console.log('PASS',checks,'geometry checks');
