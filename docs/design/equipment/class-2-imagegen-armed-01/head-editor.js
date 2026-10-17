import {trackNeck} from '/head-tracking.mjs';
const $=id=>document.getElementById(id),stage=$('stage'),ctx=stage.getContext('2d');
const names={santet:'อินโดนีเซีย — Santet',keris:'อินโดนีเซีย — Keris',onmyoji:'ญี่ปุ่น — Onmyoji',miko:'ญี่ปุ่น — Miko ชาย','rune-seer':'นอร์เวย์ — Rune Seer','ullr-hunter':'นอร์เวย์ — Ullr'};
const weapons={santet:'wand-santet',keris:'keris',onmyoji:'fan-onmyoji',miko:'gohei-miko','rune-seer':'staff-rune-seer','ullr-hunter':'bow-ullr'};
const dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
const images=new Map(),pixels=new Map(),offsets=new Map(),proposals=new Map(),seeds=new Map(),orders=new Map();
let data,clip=[],index=0,playing=false,last=0,serial=0,drag=null;
const current=()=>clip[index],clipKey=()=>[$('class').value,$('action').value,$('direction').value].join('/');
const value=f=>(f?offsets.get(f.key):null)??{dx:0,dy:0};
const message=t=>$('status').textContent=t;
const packet=()=>({version:1,sourceFingerprint:data.sourceFingerprint,baseRevision:data.revision,offsets:[...offsets.values()],orders:[...orders].map(([key,indices])=>({key,indices}))});
function persist(){try{localStorage.setItem('shaman-armed-head-v1-'+data.sourceFingerprint,JSON.stringify(packet()));}catch{message('พื้นที่ร่างในเบราว์เซอร์เต็ม กรุณาบันทึกลงโครงการ');}}
async function image(url){if(!images.has(url)){const p=new Promise((ok,fail)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>fail(Error('โหลดภาพไม่ได้ '+url));im.src=url;});images.set(url,p);}return images.get(url);}
async function bodyPixels(f){if(!pixels.has(f.key)){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(await image('/'+f.url),0,0);pixels.set(f.key,x.getImageData(0,0,128,128).data);}return pixels.get(f.key);}
function paint(c,f,v,alpha=1){
 c.save();c.globalAlpha=alpha;c.imageSmoothingEnabled=false;c.drawImage(f.body,0,0,128,128);
 if($('showhead').checked)c.drawImage(f.head,f.translation.x+v.dx,f.translation.y+v.dy,128,128);c.restore();
}
function draw(){
 const f=current();if(!f)return;const v=value(f);ctx.save();ctx.setTransform(4,0,0,4,0,0);ctx.fillStyle='#243a34';ctx.fillRect(0,0,128,128);
 if($('onion').checked&&clip.length>1){const prev=clip[(index+clip.length-1)%clip.length];paint(ctx,prev,value(prev),.22);}
 paint(ctx,f,v);
 const p=proposals.get(f.key);
 if(p){ctx.save();ctx.globalAlpha=.35;ctx.drawImage(f.head,f.translation.x+p.dx,f.translation.y+p.dy,128,128);ctx.restore();ctx.strokeStyle='#faad53';ctx.strokeRect(f.neck.x+p.dx-6,f.neck.y+p.dy-5,12,10);}
 if($('guides').checked){const x=f.neck.x+v.dx,y=f.neck.y+v.dy;ctx.strokeStyle='#70e6bf';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();}
 if($('grid').checked){ctx.strokeStyle='#ffffff25';ctx.lineWidth=.15;ctx.beginPath();for(let n=0;n<=128;n++){ctx.moveTo(n,0);ctx.lineTo(n,128);ctx.moveTo(0,n);ctx.lineTo(128,n);}ctx.stroke();}ctx.restore();
 $('x').value=v.dx;$('y').value=v.dy;$('frame').value=index;
 $('detail').textContent='ตำแหน่ง '+index+' · เฟรมต้นฉบับ '+f.index+' · คอ '+(f.neck.x+v.dx)+','+(f.neck.y+v.dy)+' · '+(offsets.has(f.key)?'ยืนยันแล้ว':'ค่าตั้งต้น')+(p?' · ข้อเสนอ '+p.dx+','+p.dy+' ความคล้าย '+Math.round((p.confidence??0)*100)+'% — '+p.reason:'')+' · เฟรมที่แก้ทั้งหมด '+offsets.size;
 for(const [k,b]of [...$('strip').children].entries()){const x=b.querySelector('canvas').getContext('2d');x.fillStyle='#243a34';x.fillRect(0,0,128,128);paint(x,clip[k],value(clip[k]));b.classList.toggle('selected',k===index);b.lastChild.textContent=k+' ← #'+clip[k].index+(offsets.has(clip[k].key)?' ✓':'')+(proposals.has(clip[k].key)?' ?':'');}
 $('orderleft').disabled=index===0;$('orderright').disabled=index===clip.length-1;
 $('accept').disabled=!clip.some(f=>proposals.get(f.key)?.accepted&&!offsets.has(f.key));
}
function stop(){playing=false;$('play').textContent='เล่น';}
function select(k){stop();index=k;draw();}
function change(dx,dy){if(!current())return;stop();const f=current();dx=Math.round(dx);dy=Math.round(dy);if(![dx,dy].every(Number.isFinite))return;
 dx=Math.max(-24,Math.min(24,dx));dy=Math.max(-24,Math.min(24,dy));
 offsets.set(f.key,{key:f.key,sha256:f.sha256,dx,dy,status:'manual'});proposals.delete(f.key);persist();draw();message('แก้ไขแล้ว ยังไม่บันทึกลงโครงการ');}
async function load(){const run=++serial;stop();clip=[];message('กำลังโหลดเฟรม…');const id=$('class').value,a=$('action').value,d=$('direction').value;
 const sequence=orders.get(clipKey());const frames=data.frames.filter(f=>f.id===id&&f.action===a&&f.direction===d).sort((a,b)=>sequence?sequence.indexOf(a.index)-sequence.indexOf(b.index):a.index-b.index);
 const head=await image(data.heads.find(h=>h.direction===d).url);
 const next=await Promise.all(frames.map(async f=>({...f,body:await image('/'+f.url),head})));
 if(run!==serial)return;clip=next;index=0;$('frame').max=clip.length-1;$('strip').replaceChildren();
 for(let k=0;k<clip.length;k++){const b=document.createElement('button'),c=document.createElement('canvas'),label=document.createElement('span');c.width=c.height=128;b.append(c,label);b.onclick=()=>select(k);b.setAttribute('aria-label','เฟรม '+k);$('strip').append(b);}
 $('phaser').href='http://localhost:3000/?carryReview=1&outfit=1&outfitDraft=1&outfitBaked=1'+(data.runtimeQuery??'')+'&weapon='+weapons[id];draw();message('พร้อมจัดหัว — ตั้งเฟรมหลักก่อนเสนอจุดคอ');
}
async function save(apply){try{const r=await fetch(apply?'/head-apply':'/head-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(packet())});if(!r.ok)throw Error(await r.text());const result=await r.json();data.revision=result.revision;persist();message('บันทึก '+result.saved+' เฟรมแล้ว'+(apply?' และใช้ใน Phaser พรีวิวแล้ว กรุณาเปิดหรือโหลดหน้า Phaser ใหม่':' — ยังไม่เปลี่ยน Phaser'));}catch(e){message('บันทึกไม่สำเร็จ: '+e.message);}}
for(const id of ['class','action','direction'])$(id).onchange=()=>load().catch(e=>message(e.message));
$('play').onclick=()=>{if(!clip.length)return;playing=!playing;$('play').textContent=playing?'หยุด':'เล่น';};$('frame').oninput=()=>select(Number($('frame').value));
for(const id of ['onion','grid','guides','showhead'])$(id).onchange=draw;
$('x').onchange=()=>change(Number($('x').value),value(current()).dy);$('y').onchange=()=>change(value(current()).dx,Number($('y').value));
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.move.split(',').map(Number),v=value(current());change(v.dx+x,v.dy+y);});
stage.onkeydown=e=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(m){e.preventDefault();const v=value(current());change(v.dx+m[0],v.dy+m[1]);}else if(e.key==='['||e.key===']'){e.preventDefault();select((index+(e.key===']'?1:clip.length-1))%clip.length);}else if(e.code==='Space'){e.preventDefault();$('play').click();}};
stage.onpointerdown=e=>{if(!current())return;stop();stage.focus();stage.setPointerCapture(e.pointerId);const v=value(current());drag={x:e.clientX,y:e.clientY,dx:v.dx,dy:v.dy,width:stage.getBoundingClientRect().width};};
stage.onpointermove=e=>{if(drag)change(drag.dx+(e.clientX-drag.x)*128/drag.width,drag.dy+(e.clientY-drag.y)*128/drag.width);};stage.onpointerup=stage.onpointercancel=()=>drag=null;
$('seed').onclick=()=>{if(!current())return;change(value(current()).dx,value(current()).dy);seeds.set(clipKey(),current().key);message('ตั้งเฟรม '+index+' เป็นหลักแล้ว');};
$('track').onclick=async()=>{try{
 stop();const key=clipKey(),run=serial,seed=clip.find(f=>f.key===seeds.get(key));if(!seed){message('จัดหัวและกดตั้งเฟรมนี้เป็นหลักก่อนครับ');return;}
 const v=value(seed),ref=await bodyPixels(seed);let count=0,confident=0;
 for(const f of clip){if(offsets.has(f.key))continue;const p=trackNeck(ref,await bodyPixels(f),{x:seed.neck.x+v.dx,y:seed.neck.y+v.dy},{x:f.neck.x+v.dx,y:f.neck.y+v.dy});if(run!==serial)return;
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const dx=p.x-f.neck.x,dy=p.y-f.neck.y;if(Math.abs(dx)>24||Math.abs(dy)>24)continue;
  proposals.set(f.key,{...p,dx,dy});count++;if(p.accepted)confident++;
 }draw();message('เสนอ '+count+' เฟรม / ผ่านเกณฑ์ '+confident+' เฟรม — ตรวจภาพก่อนรับข้อเสนอ ตัวเลขความคล้ายไม่ใช่ความถูกต้องทางกายวิภาค');
 }catch(e){message(e.message);}};
$('accept').onclick=()=>{for(const f of clip){const p=proposals.get(f.key);if(!p?.accepted||offsets.has(f.key))continue;offsets.set(f.key,{key:f.key,sha256:f.sha256,dx:p.dx,dy:p.dy,status:'accepted'});proposals.delete(f.key);}persist();draw();message('รับข้อเสนอที่ผ่านเกณฑ์ในท่านี้แล้ว — ตรวจและบันทึกเมื่อพร้อม');};
$('clear').onclick=()=>{for(const f of clip)proposals.delete(f.key);draw();};$('reset').onclick=()=>{if(!current())return;offsets.delete(current().key);proposals.delete(current().key);persist();draw();message('คืนค่าตั้งต้นเฟรมนี้แล้ว ยังไม่บันทึกลงโครงการ');};
$('save').onclick=()=>save(false);$('apply').onclick=()=>save(true);
function moveOrder(delta){stop();const next=index+delta;if(next<0||next>=clip.length)return;[clip[index],clip[next]]=[clip[next],clip[index]];index=next;orders.set(clipKey(),clip.map(f=>f.index));persist();draw();message('เปลี่ยนลำดับแล้ว หัวติดตามเฟรมต้นฉบับ — กรุณาบันทึก');}
 $('orderleft').onclick=()=>moveOrder(-1);$('orderright').onclick=()=>moveOrder(1);$('orderreset').onclick=()=>{stop();const key=current()?.key;clip.sort((a,b)=>a.index-b.index);orders.delete(clipKey());index=Math.max(0,clip.findIndex(f=>f.key===key));persist();draw();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(packet(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='shaman-armed-head-offsets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function tick(t){if(playing&&clip.length&&t-last>=1000/Number($('fps').value)){last=t;index=(index+1)%clip.length;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
try{
 const r=await fetch('/head-data');if(!r.ok)throw Error(await r.text());data=await r.json();let restored=data.saved;
 try{const p=JSON.parse(localStorage.getItem('shaman-armed-head-v1-'+data.sourceFingerprint)??localStorage.getItem('shaman-armed-head-v1'));if(p?.sourceFingerprint===data.sourceFingerprint&&Array.isArray(p.offsets)){
  const merged=new Map((data.saved?.offsets??[]).map(v=>[v.key,v]));
  for(const v of p.offsets)if(v.status==='manual'||!merged.has(v.key))merged.set(v.key,v);
  restored={...p,offsets:[...merged.values()]};
 }}catch{}
 const valid=new Map(data.frames.map(f=>[f.key,f]));
 for(const o of data.saved?.orders??[])orders.set(o.key,o.indices);
 if(restored?.baseRevision===data.revision)for(const o of restored.orders??[])orders.set(o.key,o.indices);
 for(const v of restored?.offsets??[]){const f=valid.get(v.key);if(f&&f.sha256===v.sha256&&[v.dx,v.dy].every(x=>Number.isInteger(x)&&Math.abs(x)<=24)&&['manual','accepted'].includes(v.status))offsets.set(v.key,v);}
 for(const p of data.tracking?.proposals??[]){const f=valid.get(p.key);if(f&&f.sha256===p.sha256&&!offsets.has(p.key)&&[p.dx,p.dy].every(Number.isInteger)&&Math.abs(p.dx)<=24&&Math.abs(p.dy)<=24)proposals.set(p.key,p);}
 for(const[id,name]of Object.entries(names)){const o=new Option(name,id);$('class').append(o);}for(const d of dirs)$('direction').append(new Option(d,d));await load();
}catch(e){message(e.message);}
