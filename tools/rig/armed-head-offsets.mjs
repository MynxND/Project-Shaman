export const frameKey=f=>[f.id,f.action,f.direction,f.index].join('/');
export function validateHeadOffsets(packet,report,fingerprint){
 if(packet?.version!==1||packet.sourceFingerprint!==fingerprint||!Array.isArray(packet.offsets)||packet.offsets.length>1200)throw Error('ชุดภาพเปลี่ยนหรือข้อมูลไม่ถูกต้อง กรุณาโหลดใหม่');
 const frames=new Map(report.frames.map(f=>[frameKey(f),f])),seen=new Set();
 for(const row of packet.offsets){
  const f=frames.get(row.key);
  if(!f||seen.has(row.key)||row.sha256!==f.sha256||![row.dx,row.dy].every(v=>Number.isInteger(v)&&Math.abs(v)<=24)||!['manual','accepted'].includes(row.status))throw Error('พิกัดหรือ hash ไม่ถูกต้อง');
  if(![f.neck.x+row.dx,f.neck.y+row.dy].every(v=>v>=0&&v<128))throw Error('จุดคออยู่นอกเฟรม');
  seen.add(row.key);
 }
 const orders=packet.orders??[],clips=new Map();
 for(const f of report.frames){const k=[f.id,f.action,f.direction].join('/');if(!clips.has(k))clips.set(k,[]);clips.get(k).push(f.index);}
 const orderSeen=new Set();if(!Array.isArray(orders)||orders.length>192)throw Error('Invalid frame orders');
 for(const o of orders){const expected=clips.get(o.key);if(!expected||orderSeen.has(o.key)||!Array.isArray(o.indices)||o.indices.length!==expected.length||new Set(o.indices).size!==expected.length||o.indices.some(i=>!expected.includes(i)))throw Error('ลำดับเฟรมต้องใช้ทุกเฟรมครั้งเดียว');orderSeen.add(o.key);}
 return {version:1,sourceFingerprint:fingerprint,scope:'six male armed draft only',offsets:packet.offsets.map(({key,sha256,dx,dy,status})=>({key,sha256,dx,dy,status})),orders:orders.map(o=>({key:o.key,indices:[...o.indices]}))};
}
export function applyHeadOffsets(manifest,report,packet){
 const offsets=new Map(packet.offsets.map(v=>[v.key,v]));let count=0;
 for(const f of report.frames){
  const o=manifest.outfits.find(o=>o.id===f.id+'-armed'||o.id===f.id+'-detail');if(!o)throw Error('Missing draft outfit');
  const d=o.directions[f.direction],p=f.action==='idle'?d.idle:d[f.action].find(p=>p.sha256===f.sha256);
  if(!p)throw Error('Runtime frame missing');
  if(p.sha256!==f.sha256)throw Error('Runtime body hash changed');
  const v=offsets.get(frameKey(f));p.neck={x:f.neck.x+(v?.dx??0),y:f.neck.y+(v?.dy??0)};
  if(v)count++;
 }
 // Rebuild from source identities every time: repeated applies are idempotent.
 const clips=new Map();for(const f of report.frames)if(f.action!=='idle'){const k=[f.id,f.action,f.direction].join('/');if(!clips.has(k))clips.set(k,[]);clips.get(k).push(f);}
 const orders=new Map((packet.orders??[]).map(o=>[o.key,o.indices]));
 for(const [key,frames]of clips){const f=frames[0],o=manifest.outfits.find(o=>o.id===f.id+'-armed'||o.id===f.id+'-detail'),d=o.directions[f.direction],byHash=new Map(d[f.action].map(p=>[p.sha256,p]));const sequence=orders.get(key)??frames.map(f=>f.index).sort((a,b)=>a-b);d[f.action]=sequence.map(i=>byHash.get(frames.find(f=>f.index===i).sha256));}
 return count;
}
