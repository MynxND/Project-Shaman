// Local patch comparison; proposals only. Integer translation, never image deformation.
export function trackPatch(reference,target,anchor,expected,{radius=8,halfWidth=6,halfHeight=5}={}){
 const samples=[];
 for(let y=-halfHeight;y<=halfHeight;y++)for(let x=-halfWidth;x<=halfWidth;x++){
  const xx=anchor.x+x,yy=anchor.y+y;if(xx<0||yy<0||xx>=128||yy>=128)continue;
  const i=(yy*128+xx)*4;if(reference[i+3]>127)samples.push([x,y,i]);
 }
 if(samples.length<20)return {accepted:false,reason:'บริเวณตัวอย่างมีพิกเซลทึบน้อยเกินไป'};
 const candidates=[];
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  const cx=expected.x+dx,cy=expected.y+dy;let error=0;
  for(const[x,y,i]of samples){const xx=cx+x,yy=cy+y;
   if(xx<0||yy<0||xx>=128||yy>=128){error+=1;continue;}
   const j=(yy*128+xx)*4;
   error+=(Math.abs(reference[i]-target[j])+Math.abs(reference[i+1]-target[j+1])+Math.abs(reference[i+2]-target[j+2])+Math.abs(reference[i+3]-target[j+3]))/1020;
  }
  candidates.push({x:cx,y:cy,error:error/samples.length});
 }
 candidates.sort((a,b)=>a.error-b.error||Math.hypot(a.x-expected.x,a.y-expected.y)-Math.hypot(b.x-expected.x,b.y-expected.y));
 const best=candidates[0],other=candidates.find(c=>Math.abs(c.x-best.x)+Math.abs(c.y-best.y)>2);
 const confidence=Math.max(0,1-best.error),margin=(other?.error??best.error)-best.error;
 return {...best,confidence,margin,accepted:confidence>=.75&&margin>=.015,reason:confidence<.75?'คอเปลี่ยนรูปหรือถูกบัง':margin<.015?'มีตำแหน่งคล้ายกันหลายจุด':'ข้อเสนอ — ต้องตรวจและยอมรับก่อน'};
}

// Independent patch sizes and round-trip agreement reduce ambiguous collar matches.
// Confidence describes image similarity only; deformation/occlusion still need review.
export function trackNeck(reference,target,anchor,expected,{radius=18}={}){
 const sizes=[[4,3],[6,5],[9,7]];
 const votes=sizes.map(([halfWidth,halfHeight])=>trackPatch(reference,target,anchor,expected,{radius,halfWidth,halfHeight})).filter(p=>Number.isFinite(p.x));
 if(votes.length!==3)return {accepted:false,reason:'ข้อมูลคอไม่พอสำหรับเทียบหลายขนาด'};
 const median=k=>[...votes].map(p=>p[k]).sort((a,b)=>a-b)[1];
 const x=median('x'),y=median('y');
 const spread=Math.max(...votes.map(p=>Math.hypot(p.x-x,p.y-y)));
 const reverse=trackPatch(target,reference,{x,y},anchor,{radius:6});
 const roundTrip=Number.isFinite(reverse.x)?Math.hypot(reverse.x-anchor.x,reverse.y-anchor.y):Infinity;
 const confidence=Math.min(...votes.map(p=>p.confidence));
 const accepted=spread<=1.5&&roundTrip<=1&&votes.every(p=>p.accepted);
 return {x,y,confidence,spread,roundTrip,votes,accepted,reason:spread>1.5?'ตำแหน่งจากหลายขนาดไม่ตรงกัน':roundTrip>1?'ตรวจย้อนกลับไม่ตรงต้นแบบ':!accepted?'คอเปลี่ยนรูปหรือจุดคล้ายกัน — ตรวจด้วยตา':'หลายขนาดและตรวจย้อนกลับตรงกัน — ตรวจภาพก่อนรับ'};
}
