import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleHeadRequest} from './head-api.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),before=fileURLToPath(new URL('../class-2-imagegen-motion-01/',import.meta.url));
const html=`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Class2 — อาวุธติดมือในเฟรม</title><style>
body{margin:0;background:#182d28;color:#eee4c9;font:16px system-ui}main{max-width:1500px;margin:auto;padding:20px}h1,h2{color:#d5bc7c}button,select{padding:9px;background:#314b41;color:#fff3cf;border:1px solid #978455;border-radius:5px;font:inherit}nav{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0;align-items:center}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cell{background:#243a34;padding:8px;text-align:center}canvas,img{width:100%;height:auto;image-rendering:pixelated}a{color:#e1c477}p{line-height:1.6}.note{background:#354139;padding:12px}details{margin-top:18px}@media(max-width:650px){.grid{grid-template-columns:1fr}main{padding:12px}}
</style><main><h1>อาวุธวาดพร้อมมือ — 6สายคลาส2</h1><p>ซ้าย: อาวุธชิ้นแยกเดิม · ขวา: ภาพใหม่ที่สร้างตัวชุด มือ และอาวุธพร้อมกัน</p><p class="note">ภาพชุดร่างสำหรับตรวจความสวยและจังหวะ หัวเดิมยังแยกได้ อาวุธชิ้นแยกถูกปิดเฉพาะชุดร่างนี้ ไม่ใช้เครดิต PixelLab</p><nav><select id="class"></select><select id="action"><option value="idle">ยืน</option><option value="walk" selected>เดิน</option><option value="attack">โจมตี</option><option value="cast">ร่าย</option></select><button id="play">หยุด</button><label>เฟรม <input id="frame" type="range" min="0" max="7" value="0"></label><label>ความเร็ว <select id="fps"><option>8</option><option selected>12</option><option>16</option><option>4</option></select>fps</label></nav><p id="status">กำลังโหลด</p><p><a id="phaser" href="#">เปิดชุดนี้ใน Phaser จริง</a></p><div class="grid" id="board"></div><details><summary>ภาพทุกเฟรมของท่านี้</summary><img id="sheet"></details><p><a href="/export-report.json">รายงานการส่งออก</a> · <a href="http://127.0.0.1:8769/">หน้ารุ่นอาวุธแยกเดิม</a></p></main><script>
const names={santet:'อินโดนีเซีย — Santet Master',keris:'อินโดนีเซีย — Keris Master',onmyoji:'ญี่ปุ่น — Onmyoji',miko:'ญี่ปุ่น — Miko ชาย','rune-seer':'นอร์เวย์ — Rune Seer','ullr-hunter':'นอร์เวย์ — Ullr Hunter'},weapons={santet:'wand-santet',keris:'keris',onmyoji:'fan-onmyoji',miko:'gohei-miko','rune-seer':'staff-rune-seer','ullr-hunter':'bow-ullr'},dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
const el=id=>document.getElementById(id);let data,step=0,playing=true,rows=[],serial=0,last=0;
function draw(){el('frame').value=step;for(const r of rows){const c=r.canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#243a34';c.fillRect(0,0,512,176);const f=r.frames[step];if(!f)continue;c.drawImage(f.before,0,0);c.drawImage(f.after,256+128-(f.meta.bodyOrigin.x+.5),144-(f.meta.bodyOrigin.y+1));c.strokeStyle='#b19b61';c.beginPath();c.moveTo(256,0);c.lineTo(256,176);c.stroke();}}
const image=src=>new Promise((ok,fail)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>fail(Error('โหลดไม่ได้ '+src));im.src=src;});
const transition=[['idle',0],['walk',0],['walk',3],['walk',7],['idle',0],['attack',0],['attack',3],['attack',7],['idle',0],['cast',0],['cast',3],['cast',7],['idle',0]];
const transitionOption=document.createElement('option');transitionOption.value='transition';transitionOption.textContent='เทียบรอยต่อ ยืน → เดิน / โจมตี / ร่าย';el('action').append(transitionOption);
async function load(){
 const run=++serial,id=el('class').value,a=el('action').value;
 const sequence=a==='transition'?transition:Array.from({length:8},(_,k)=>[a,a==='idle'?0:k]);
 rows=[];step=0;el('frame').max=sequence.length-1;el('board').replaceChildren();el('status').textContent='กำลังโหลด '+names[id];
 el('phaser').href='http://localhost:3000/?carryReview=1&outfit=1&outfitDraft=1&outfitBaked=1&weapon='+weapons[id];
 const next=await Promise.all(dirs.map(async d=>{
  const box=document.createElement('div');box.className='cell';const title=document.createElement('p');title.textContent=d+' · ก่อน / หลัง';
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=176;box.append(title,canvas);el('board').append(box);
  const frames=await Promise.all(sequence.map(async([action,index])=>{
   const f=data.frames.find(f=>f.id===id&&f.action===action&&f.direction===d&&f.index===index);if(!f)throw Error('ชุดนี้ยังไม่ครบ');
   const [old,now]=await Promise.all([image('/before/'+id+'/equipment/'+action+'/'+d+'-'+index+'.png'),image('/'+f.url.replace('.png','-with-head.png'))]);
   return {before:old,after:now,meta:f};
  }));return {canvas,frames};
 }));
 if(run!==serial)return;rows=next;el('status').textContent=names[id]+' · '+a+' · อาวุธและนิ้วกำอยู่ในภาพเดียวกัน · ตรวจจังหวะก่อนนำไปใช้จริง';
 el('sheet').hidden=a==='transition';if(a!=='transition')el('sheet').src='/'+id+'/'+a+'-head-sheet.png';draw();
}
fetch('/export-report.json').then(r=>r.json()).then(d=>{data=d;for(const[id,name]of Object.entries(names)){const o=document.createElement('option');o.value=id;o.textContent=name;el('class').append(o);}for(const id of ['class','action'])el(id).onchange=()=>load().catch(e=>el('status').textContent=e.message);el('play').onclick=()=>{playing=!playing;el('play').textContent=playing?'หยุด':'เล่น';};el('frame').oninput=()=>{playing=false;el('play').textContent='เล่น';step=Number(el('frame').value);draw();};return load();}).catch(e=>el('status').textContent=e.message);
function tick(t){if(playing&&rows.length&&t-last>=1000/Number(el('fps').value)){last=t;step=(step+1)%rows[0].frames.length;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script></html>`;
createServer(async(req,res)=>{try{
 const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 if(await handleHeadRequest(req,res,p))return;
 if(p==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html.replace('<nav>','<p><a href="/head-editor">เปิดเครื่องมือจัดหัวรายเฟรมและติดตามคอ →</a></p><nav>'));return;}
 const old=p.startsWith('/before/'),base=old?before:root,path=resolve(base,old?p.slice(8):p.slice(1));
 if(!path.startsWith(resolve(base)+sep)||!['.json','.png'].includes(extname(path))){res.writeHead(404);res.end();return;}
 const bytes=await readFile(path);res.writeHead(200,{'Content-Type':extname(path)==='.png'?'image/png':'application/json','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}}).listen(8770,'127.0.0.1',()=>console.log('Armed frame review: http://127.0.0.1:8770/'));
