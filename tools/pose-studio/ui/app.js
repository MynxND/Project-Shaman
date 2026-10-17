// Pose Studio browser UI (no build step). All state lives on the local server.
const $=s=>document.querySelector(s);
const api=async(path,opts={})=>{const r=await fetch(path,{...opts,headers:{'Content-Type':'application/json'}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);return j;};
const STATUS={queued:'ในคิว',generating:'กำลังสร้าง',processing:'กำลังแปลง',review:'รอตรวจ',approved:'อนุมัติแล้ว',rejected:'ไม่ผ่าน',failed:'ล้มเหลว',cancelled:'ยกเลิก',cancelling:'กำลังหยุด'};
const QA={pass:'ผ่าน',warn:'ควรดู',fail:'ไม่ผ่าน'};
const LAYOUT=['north-west','north','north-east','west',null,'east','south-west','south','south-east'];
const DIR_TH={south:'ใต้ (หน้า)','south-east':'ใต้-ขวา',east:'ขวา','north-east':'บน-ขวา',north:'บน (หลัง)','north-west':'บน-ซ้าย',west:'ซ้าย','south-west':'ใต้-ซ้าย'};
let catalog,jobs=[],current=null,action='walk',dirs=new Set(['south']),player=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const asset=(id,p)=>`/jobs/${encodeURIComponent(id)}/${p}`;

async function init(){
  catalog=await api('/api/catalog');
  $('#character').innerHTML=catalog.characters.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#character').onchange=renderCompass;
  $('#presets').innerHTML=Object.entries(catalog.actions).map(([k,a])=>`<button type="button" data-a="${k}">${esc(a.label)}</button>`).join('');
  $('#presets').onclick=e=>{const b=e.target.closest('button');if(!b)return;action=b.dataset.a;applyPreset();};
  $('#allDirs').onclick=()=>{dirs=new Set(catalog.directions);renderCompass();};
  $('#noDirs').onclick=()=>{dirs.clear();renderCompass();};
  $('#submit').onclick=submit;$('#filter').onchange=renderJobs;
  window.addEventListener('hashchange',()=>openFromHash());
  applyPreset();renderCompass();await refresh();openFromHash();
  setInterval(refresh,4000);setInterval(status,10000);status();
}
function applyPreset(){const a=catalog.actions[action];document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.a===action));$('#frames').value=a.frames;$('#length').value=a.length;$('#loop').checked=a.loop;$('#fps').value=action==='cast'?12:a.loop?8:16;}
function renderCompass(){const c=$('#character').value;$('#compass').innerHTML=LAYOUT.map(d=>d?`<button type="button" class="${dirs.has(d)?'on':''}" data-d="${d}" aria-pressed="${dirs.has(d)}"><img alt="" src="/idle/${c}/${d}.png">${DIR_TH[d]}</button>`:`<div class="center">${dirs.size} ทิศ</div>`).join('');
  $('#compass').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset.d;dirs.has(d)?dirs.delete(d):dirs.add(d);renderCompass();};}

async function submit(){
  const msg=$('#orderMsg');if(!dirs.size){msg.textContent='เลือกอย่างน้อย 1 ทิศ';return;}
  $('#submit').disabled=true;msg.textContent='กำลังส่ง…';
  try{const seed=$('#seed').value;const made=[];
    for(const direction of catalog.directions.filter(d=>dirs.has(d)))made.push(await api('/api/jobs',{method:'POST',body:JSON.stringify({character:$('#character').value,direction,action,custom:$('#custom').value,frames:+$('#frames').value,length:+$('#length').value,fps:+$('#fps').value,seed:seed===''?undefined:+seed,loop:$('#loop').checked,turbo:$('#turbo').checked,requestedBy:'web'})}));
    msg.textContent=`เพิ่ม ${made.length} งานเข้าคิวแล้ว`;await refresh();if(made[0])location.hash=`job=${made[0].id}`;
  }catch(e){msg.textContent=`ส่งไม่สำเร็จ: ${e.message}`;}finally{$('#submit').disabled=false;}
}

async function status(){try{const s=await api('/api/status');const g=s.comfy.devices?.[0];
  $('#status').innerHTML=(s.comfy.ok?`<span class="chip ok">ComfyUI พร้อม</span><span class="chip">VRAM ว่าง ${g?.vramFreeGB??'?'}/${g?.vramTotalGB??'?'} GB</span><span class="chip">RAM ว่าง ${s.comfy.ramFreeGB} GB</span>`:`<span class="chip bad">ComfyUI ไม่ทำงาน — เปิด run_nvidia_gpu.bat</span>`)+`<span class="chip">คิว ${s.queue.length}${s.running?' · กำลังรัน 1':''}</span>`;}catch{$('#status').innerHTML='<span class="chip bad">เซิร์ฟเวอร์ Pose Studio ไม่ตอบ</span>';}}

async function refresh(){try{jobs=await api('/api/jobs');}catch{return;}renderJobs();if(current){const j=jobs.find(j=>j.id===current.id);if(j&&(j.status!==current.status||JSON.stringify(j.progress)!==JSON.stringify(current.progress)||j.processedAt!==current.processedAt))showJob(j,j.processedAt===current.processedAt);}}
function renderJobs(){const f=$('#filter').value,list=jobs.filter(j=>!f||j.status===f);
  $('#jobs').innerHTML=list.length?list.map(j=>`<li data-id="${esc(j.id)}" class="${current?.id===j.id?'sel':''}"><img alt="" src="${j.status==='review'||j.status==='approved'||j.status==='rejected'?asset(j.id,'sprite/preview.gif')+`?t=${j.processedAt}`:`/idle/${j.character}/${j.direction}.png`}"><div><b>${esc(j.character)} · ${esc(DIR_TH[j.direction]||j.direction)} · ${esc(catalog.actions[j.action]?.label||j.action)}</b><span class="badge s-${j.status}">${STATUS[j.status]||j.status}</span> ${j.qa?`<span class="badge s-${j.qa.status}">QA ${QA[j.qa.status]}</span>`:''}<br><span>${j.progress?.phase?esc(j.progress.phase):j.queuePosition?`ลำดับคิว ${j.queuePosition}`:new Date(j.createdAt).toLocaleString('th-TH')}</span></div></li>`).join(''):'<li class="empty">ยังไม่มีงาน</li>';
  $('#jobs').onclick=e=>{const li=e.target.closest('li[data-id]');if(li)location.hash=`job=${li.dataset.id}`;};}
function openFromHash(){const id=new URLSearchParams(location.hash.slice(1)).get('job');const j=id&&jobs.find(j=>j.id===id);if(j)showJob(j);}

function showJob(j,keepSelection=false){
  const prevSel=keepSelection&&current?.id===j.id?current.pick:null;current={...j,pick:prevSel||new Set(j.selected||[])};renderJobs();
  const el=$('#detail');el.replaceChildren($('#detailTpl').content.cloneNode(true));
  const q=s=>el.querySelector(s);
  q('.title').textContent=`${j.character} · ${DIR_TH[j.direction]||j.direction} · ${catalog.actions[j.action]?.label||j.action}`;
  q('.status').textContent=STATUS[j.status]||j.status;q('.status').className=`badge status s-${j.status}`;
  q('.meta').textContent=`${j.id} · seed ${j.params.seed} · วิดีโอ ${j.params.length} เฟรม · sprite ${j.params.frames} เฟรม${j.params.loop?' · ลูป':''}${j.comfy?` · GPU ${j.comfy.seconds}s`:''}${j.review?` · ${j.review.decision} โดย ${j.review.by}${j.review.note?`: ${j.review.note}`:''}`:''}`;
  if(j.progress){q('.progress').hidden=false;const pc=j.progress.steps?Math.round(100*j.progress.step/j.progress.steps):8;q('.bar').style.width=pc+'%';q('.progress span').textContent=`${j.progress.phase||''}${j.progress.elapsed?` · ${j.progress.elapsed}s`:''}`;}
  if(j.error){q('.error').hidden=false;q('.error').textContent=j.error;}
  q('.prompt').textContent=j.prompt;
  q('.files').innerHTML=j.frameCount?`<a href="${asset(j.id,'sprite/sheet.png')}" target="_blank">sheet.png</a> · <a href="${asset(j.id,'sprite/preview.gif')}" target="_blank">preview.gif</a> · <a href="${asset(j.id,'raw-sheet.png')}" target="_blank">เฟรมดิบจากวิดีโอ</a> · <a href="${asset(j.id,'sprite/manifest.json')}" target="_blank">manifest</a>`:'ยังไม่มีไฟล์ผลลัพธ์';
  drawIdle(q('.idle'),j);
  if(j.qa){q('.qa').textContent=QA[j.qa.status];q('.qa').className=`badge qa s-${j.qa.status}`;q('.checks').innerHTML=j.qa.checks.map(c=>`<li><span class="badge s-${c.status}">${QA[c.status]}</span><span>${esc(c.label)}</span><em>${esc(c.detail)}</em></li>`).join('');q('.qanote').textContent=j.qa.note;}else q('.checks').innerHTML='<li><span></span><em>ยังไม่มีผล QA</em></li>';
  if(j.frameCount){q('.strip').innerHTML=Array.from({length:j.frameCount},(_,i)=>`<button type="button" class="${current.pick.has(i)?'on':''}" data-i="${i}" title="เฟรม ${i}"><img alt="" loading="lazy" src="${asset(j.id,`native/${String(i).padStart(3,'0')}.png`)}?t=${j.processedAt}"><i>${i}</i></button>`).join('');
    q('.strip').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;current.pick.has(i)?current.pick.delete(i):current.pick.add(i);b.classList.toggle('on');startPlayer(el,j);};}
  q('.pfps').value=j.params.fps;if(innerWidth<520)q('.zoom').value='2';
  const busy=['queued','generating','processing'].includes(j.status),ready=!!j.frameCount;
  q('.approve').disabled=!ready||busy;q('.reject').disabled=busy;q('.saveSel').disabled=!ready||busy;q('.evenSel').disabled=!ready||busy;q('.cancel').hidden=!busy;q('.retry').disabled=busy;q('.remove').disabled=busy;
  const act=async(fn,ok)=>{try{await fn();await refresh();const n=jobs.find(x=>x.id===j.id);if(n)showJob(n);if(ok)ok();}catch(e){alert(e.message);}};
  q('.approve').onclick=()=>act(()=>api(`/api/jobs/${j.id}/review`,{method:'POST',body:JSON.stringify({decision:'approved',note:q('.note').value,by:'user-web'})}));
  q('.reject').onclick=()=>act(()=>api(`/api/jobs/${j.id}/review`,{method:'POST',body:JSON.stringify({decision:'rejected',note:q('.note').value,by:'user-web'})}));
  q('.retry').onclick=()=>act(async()=>{const n=await api(`/api/jobs/${j.id}/retry`,{method:'POST',body:'{}'});location.hash=`job=${n.id}`;});
  q('.cancel').onclick=()=>act(()=>api(`/api/jobs/${j.id}/cancel`,{method:'POST'}));
  q('.remove').onclick=()=>{if(confirm('ลบงานนี้และไฟล์ทั้งหมดของงาน?'))act(()=>api(`/api/jobs/${j.id}`,{method:'DELETE'}),()=>{location.hash='';$('#detail').innerHTML='<p class="empty">ลบแล้ว</p>';current=null;});};
  q('.saveSel').onclick=()=>act(()=>api(`/api/jobs/${j.id}/select`,{method:'POST',body:JSON.stringify({selected:[...current.pick].sort((a,b)=>a-b)})}));
  q('.evenSel').onclick=()=>{const n=j.frameCount,k=j.params.frames,loop=j.params.loop;current.pick=new Set(Array.from({length:Math.min(k,n)},(_,i)=>loop?Math.round(i*(n-1)/k):Math.round(i*(n-1)/Math.max(1,k-1))));showJob({...j},true);};
  for(const s of['.onion','.pfps','.zoom'])q(s).onchange=()=>startPlayer(el,j);
  q('.toggle').onclick=()=>{player.paused=!player.paused;q('.toggle').textContent=player.paused?'▶ เล่น':'⏸ หยุด';};
  startPlayer(el,j);
}

const img=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
async function drawIdle(c,j){const z=+(c.closest('#detail').querySelector('.zoom').value);c.width=c.height=128*z;const i=await img(`/idle/${j.character}/${j.direction}.png`);const x=c.getContext('2d');x.imageSmoothingEnabled=false;if(i)x.drawImage(i,0,0,c.width,c.height);}
async function startPlayer(el,j){
  if(player)cancelAnimationFrame(player.raf);const c=el.querySelector('.play'),z=+el.querySelector('.zoom').value;c.width=c.height=128*z;drawIdle(el.querySelector('.idle'),j);
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  const sel=[...current.pick].sort((a,b)=>a-b);const frames=j.frameCount?await Promise.all(sel.map(i=>img(asset(j.id,`native/${String(i).padStart(3,'0')}.png`)+`?t=${j.processedAt}`))):[];
  const idle=await img(`/idle/${j.character}/${j.direction}.png`);const me=player={paused:false,raf:0};let k=0,last=0;
  const tick=t=>{if(player!==me)return;const fps=+el.querySelector('.pfps').value||8;if(!me.paused&&t-last>1000/fps){last=t;ctx.clearRect(0,0,c.width,c.height);
      if(el.querySelector('.onion').checked&&idle){ctx.globalAlpha=.35;ctx.drawImage(idle,0,0,c.width,c.height);ctx.globalAlpha=1;}
      const f=frames[k%Math.max(1,frames.length)];if(f)ctx.drawImage(f,0,0,c.width,c.height);el.querySelector('.frameNo').textContent=frames.length?`${k%frames.length+1}/${frames.length} (วิดีโอเฟรม ${sel[k%frames.length]})`:'';k++;}
    me.raf=requestAnimationFrame(tick);};
  me.raf=requestAnimationFrame(tick);
}
init();
