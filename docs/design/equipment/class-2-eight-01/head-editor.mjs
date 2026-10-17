import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('../../../../apps/client/public/assets/character-v3/body-eight-02/manifest.json',import.meta.url),'utf8'));
const config=JSON.parse(await readFile(new URL('juggernaut-head-fit.json',root),'utf8'));
const data=[];
for(const [direction,target] of Object.entries(config.targets)){
 const f=manifest.frames.find(f=>f.direction===direction);
 const body=await readFile(new URL(`juggernaut/${direction}.png`,root));
 const head=await readFile(new URL('../../../../apps/client/public'+f.headUrl,import.meta.url));
 data.push({direction,body:'data:image/png;base64,'+body.toString('base64'),head:'data:image/png;base64,'+head.toString('base64'),x:target[0]-f.headPivot.x,y:target[1]-f.headPivot.y});
}
const html=`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ปรับตำแหน่งหัวรัสเซีย</title>
<style>body{margin:0;background:#142923;color:#f6ead3;font:16px system-ui}main{max-width:1150px;margin:auto;padding:20px}button,select,input{font:inherit;padding:9px;border-radius:6px;margin:4px}button{cursor:pointer;background:#e7d4ad;color:#162820;border:0}canvas{image-rendering:pixelated;max-width:100%;background:#263b35;touch-action:none;border:1px solid #638577}#stage{width:min(512px,100%)}.layout{display:flex;gap:24px;flex-wrap:wrap}.board{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:20px}.board canvas{width:100%;cursor:pointer}.selected{outline:3px solid #e6b65c}label{display:inline-block}#status{min-height:28px;color:#f4cb79}textarea{width:100%;height:100px}h1{font-size:24px}small{display:block;color:#bbd1c5}</style>
<main><h1>ปรับหัวรัสเซีย — 8 ทิศ</h1><p>เลือกทิศ แล้วลากบนภาพเพื่อเลื่อนหัว หรือใช้ลูกศรครั้งละ 1 พิกเซล • ลำตัวอยู่กับที่</p><small>ภาพทดลองแยกจากเกม เริ่มจากค่ารอบแรกที่คุณไม่ผ่าน บันทึกแล้วบอกผมให้ตรวจต่อได้ทันที</small>
<div class="layout"><canvas id="stage" width="512" height="512" tabindex="0" aria-label="ลากเพื่อเลื่อนหัว"></canvas><section><label>ทิศ <select id="facing"></select></label><div><label>X <input id="x" type="number" min="-24" max="24" step="1" style="width:70px"></label><label>Y <input id="y" type="number" min="-24" max="24" step="1" style="width:70px"></label></div><div><button data-move="0,-1">↑</button></div><div><button data-move="-1,0">←</button><button data-move="0,1">↓</button><button data-move="1,0">→</button></div><label><input type="checkbox" id="grid"> แสดงกริดพิกเซล</label><div><button id="reset">คืนค่าทิศนี้</button><button id="save">บันทึกให้ตรวจ</button><button id="export">ดาวน์โหลด JSON</button></div><p id="status" role="status">กำลังโหลดภาพ…</p><small>ค่าบวก X = ขวา / Y = ลง<br>เก็บร่างในเบราว์เซอร์อัตโนมัติ<br>ปุ่มบันทึกจะเขียนเฉพาะไฟล์ user-head-offsets.json</small></section></div><div class="board" id="board"></div></main>
<script>
const source=${JSON.stringify(data)};const labels=['หน้า','เฉียงขวาหน้า','ขวา','เฉียงขวาหลัง','หลัง','เฉียงซ้ายหลัง','ซ้าย','เฉียงซ้ายหน้า'];
const $=id=>document.getElementById(id),stage=$('stage');let selected=0,loaded=false;let values=source.map(d=>({direction:d.direction,x:d.x,y:d.y}));
try{const saved=JSON.parse(localStorage.getItem('shaman-russian-head-editor-v1'));if(Array.isArray(saved)&&saved.length===8&&saved.every((v,i)=>v.direction===source[i].direction&&Number.isInteger(v.x)&&Number.isInteger(v.y)&&Math.abs(v.x)<=24&&Math.abs(v.y)<=24))values=saved;}catch{}
const imgs=source.map(d=>{const b=new Image(),h=new Image();b.src=d.body;h.src=d.head;return {b,h}});
const thumbnails=source.map((d,i)=>{const o=document.createElement('option');o.value=i;o.textContent=labels[i];$('facing').append(o);const c=document.createElement('canvas');c.width=128;c.height=128;c.title=labels[i];c.onclick=()=>choose(i);$('board').append(c);return c});
function draw(canvas,i,zoom){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#263b35';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(imgs[i].b,0,0,128*zoom,128*zoom);ctx.drawImage(imgs[i].h,values[i].x*zoom,values[i].y*zoom,128*zoom,128*zoom);if(canvas===stage&&$('grid').checked){ctx.strokeStyle='#ffffff25';ctx.beginPath();for(let n=0;n<=128;n++){ctx.moveTo(n*zoom,0);ctx.lineTo(n*zoom,512);ctx.moveTo(0,n*zoom);ctx.lineTo(512,n*zoom)}ctx.stroke()}}
function render(){if(!loaded)return;draw(stage,selected,4);thumbnails.forEach((c,i)=>{draw(c,i,1);c.classList.toggle('selected',i===selected)});$('x').value=values[selected].x;$('y').value=values[selected].y;$('facing').value=selected}
function choose(i){selected=i;render()}
function change(x,y){values[selected].x=Math.max(-24,Math.min(24,Math.round(x)));values[selected].y=Math.max(-24,Math.min(24,Math.round(y)));try{localStorage.setItem('shaman-russian-head-editor-v1',JSON.stringify(values))}catch{}$('status').textContent='ร่างแก้ไขแล้ว — กดบันทึกให้ตรวจเมื่อพร้อม';render()}
$('facing').onchange=e=>choose(Number(e.target.value));$('x').onchange=()=>change(Number($('x').value),values[selected].y);$('y').onchange=()=>change(values[selected].x,Number($('y').value));$('grid').onchange=render;
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.move.split(',').map(Number);change(values[selected].x+x,values[selected].y+y)});
stage.onkeydown=e=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(m){e.preventDefault();change(values[selected].x+m[0],values[selected].y+m[1])}};
let drag;stage.onpointerdown=e=>{stage.focus();stage.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:values[selected].x,oy:values[selected].y,width:stage.getBoundingClientRect().width}};stage.onpointermove=e=>{if(drag)change(drag.ox+(e.clientX-drag.x)*128/drag.width,drag.oy+(e.clientY-drag.y)*128/drag.width)};stage.onpointerup=stage.onpointercancel=()=>drag=null;
$('reset').onclick=()=>change(source[selected].x,source[selected].y);
const packet=()=>({version:1,scope:'juggernaut male static preview only',offsets:values});
$('save').onclick=async()=>{try{const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(packet())});if(!r.ok)throw Error(await r.text());$('status').textContent='บันทึกแล้ว — บอกผมให้ตรวจตำแหน่งที่คุณปรับได้เลยครับ'}catch(e){$('status').textContent='บันทึกไม่สำเร็จ: '+e.message}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(packet(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='juggernaut-user-head-offsets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
Promise.all(imgs.flatMap(({b,h})=>[b.decode(),h.decode()])).then(()=>{loaded=true;render();$('status').textContent='พร้อมปรับหัวแล้ว'}).catch(()=>{$('status').textContent='โหลดภาพไม่สำเร็จ'});
</script></html>`;
const server=createServer(async(req,res)=>{
 if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 if(req.method==='POST'&&req.url==='/save'){
  if(req.headers.origin!=='http://127.0.0.1:8766'){res.writeHead(403);res.end('Origin refused');return;}
  let raw='';try{for await(const c of req){raw+=c;if(raw.length>10000)throw Error('Too large')}
   const p=JSON.parse(raw);if(p.version!==1||!Array.isArray(p.offsets)||p.offsets.length!==8||!p.offsets.every((v,i)=>v.direction===data[i].direction&&Number.isInteger(v.x)&&Number.isInteger(v.y)&&Math.abs(v.x)<=24&&Math.abs(v.y)<=24))throw Error('Invalid offsets');
   await writeFile(new URL('user-head-offsets.json',root),JSON.stringify({version:1,scope:'juggernaut male static preview only',offsets:p.offsets},null,2)+'\n');res.end('saved');
  }catch(e){res.writeHead(400);res.end(e.message)}return;
 }res.writeHead(404);res.end('Not found');
});
server.listen(8766,'127.0.0.1',()=>console.log('Head editor ready: http://127.0.0.1:8766'));
