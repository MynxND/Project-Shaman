'use strict';
const DATA=window.OUTFIT_PREVIEW_DATA,$=id=>document.getElementById(id);
const outfits=[['achan','อาจารย์ไสยเวท · ไทย'],['juggernaut','Juggernaut · รัสเซีย'],['santet-detail','Santet · อินโดนีเซีย'],['keris-detail','Keris · อินโดนีเซีย'],['onmyoji-detail','Onmyoji · ญี่ปุ่น'],['miko-detail','Miko · ญี่ปุ่น'],['rune-seer-detail','Rune Seer · นอร์เวย์'],['ullr-hunter-detail','Ullr Hunter · นอร์เวย์']];
const directions=[['south','หน้า · S'],['south-east','เฉียงหน้า–ขวา · SE'],['east','ขวา · E'],['north-east','เฉียงหลัง–ขวา · NE'],['north','หลัง · N'],['north-west','เฉียงหลัง–ซ้าย · NW'],['west','ซ้าย · W'],['south-west','เฉียงหน้า–ซ้าย · SW']];
const state={frame:0,playing:false,timer:null,revision:0,records:{},dirty:false},cache=new Map(),drafts=new Map();
function trialMode(){return $('walk-trial').value==='trial'}
function runeMode(){return $('walk-trial').value==='rune'}
function runeTrial(){return runeMode()&&$('outfit').value==='rune-seer-detail'&&$('action').value==='walk'}
function modeId(){return runeMode()?'rune-seer-autosprite-01':trialMode()?'juggernaut-walk-03':'original'}
function trial(){return trialMode()&&$('outfit').value==='juggernaut'&&$('action').value==='walk'&&['east','west'].includes($('direction').value)}
function storageKey(){return 'shaman.outfit-preview.fit.v1.'+DATA.fingerprint+(runeMode()?'.rune-seer-autosprite-01.'+window.RUNE_SEER_WALK.fingerprint:trialMode()?'.juggernaut-walk-03':'')}
const defaults=()=>({dx:0,dy:0,scale:1,hair:'natural-short',face:'neutral'});
function baseKey(){return $('outfit').value+'|'+$('direction').value}
function frameKey(){return baseKey()+'|'+$('action').value+'|'+state.frame}
function key(){return $('fit-scope').value==='frame'?frameKey():baseKey()}
function config(){return state.records[frameKey()]||state.records[baseKey()]||defaults()}
function editedConfig(){return state.records[key()]||state.records[baseKey()]||defaults()}
function packet(){return {schema:'shaman-outfit-preview-fit/1',fingerprint:DATA.fingerprint,mode:modeId(),...(runeMode()?{walkFingerprint:window.RUNE_SEER_WALK.fingerprint}:{}),headEnabled:$('head-enabled').checked,records:state.records}}
function validate(value){
 if(!value||value.schema!=='shaman-outfit-preview-fit/1'||value.fingerprint!==DATA.fingerprint||(value.mode||'original')!==modeId()||(runeMode()&&value.walkFingerprint!==window.RUNE_SEER_WALK.fingerprint)||!value.records||typeof value.records!=='object'||Array.isArray(value.records)||typeof value.headEnabled!=='boolean')throw Error('รูปแบบหรือรุ่นข้อมูลชุด/หัวไม่ตรงกัน');
 const result={};const entries=Object.entries(value.records);if(entries.length>4096)throw Error('จำนวนค่ามากเกินไป');
 for(const [k,v]of entries){const [o,d,a,f,...extra]=k.split('|'),max=runeMode()&&o==='rune-seer-detail'&&a==='walk'?(window.RUNE_SEER_WALK.directions[d]?.length||0)-1:trialMode()&&o==='juggernaut'&&a==='walk'&&['east','west'].includes(d)?19:a==='idle'?0:7;if(!outfits.some(x=>x[0]===o)||!directions.some(x=>x[0]===d)||extra.length||(a!==undefined&&(!['idle','walk','attack','cast'].includes(a)||!/^\d+$/.test(f)||Number(f)>max)))throw Error('ขอบเขตค่าไม่ถูกต้อง');
  if(!v||![v.dx,v.dy,v.scale].every(Number.isFinite)||Math.abs(v.dx)>64||Math.abs(v.dy)>64||v.scale<.5||v.scale>1.8||!DATA.hairs.some(h=>h[0]===v.hair)||!DATA.faces.some(h=>h[0]===v.face))throw Error('ตำแหน่ง ขนาด ผม หรือหน้าไม่ถูกต้อง');result[k]={dx:v.dx,dy:v.dy,scale:v.scale,hair:v.hair,face:v.face};
 }return result;
}
function message(text,bad=false){$('save-status').textContent=text;$('save-status').className=bad?'error':''}
for(const [v,t]of outfits)$('outfit').add(new Option(t,v));for(const [v,t]of directions)$('direction').add(new Option(t,v));for(const [v,t]of DATA.hairs)$('hair').add(new Option(t,v));for(const [v,t]of DATA.faces)$('face').add(new Option(t,v));
for(const [id,title]of outfits){const a=document.createElement('a');a.href='downloads/'+id+'.zip';a.download=id+'.zip';a.textContent=title+' · ZIP';$('downloads').append(a)}
function loadFit(){state.records={};state.dirty=false;try{const saved=localStorage.getItem(storageKey());if(saved){const p=JSON.parse(saved);state.records=validate(p);$('head-enabled').checked=p.headEnabled;message('โหลดค่าที่บันทึกไว้แล้ว')}else message('ยังไม่มีค่าบันทึกสำหรับโหมดนี้')}catch(e){message('อ่านค่าบันทึกไม่ได้: '+e.message,true)}}loadFit();
function count(){return runeTrial()?window.RUNE_SEER_WALK.directions[$('direction').value].length:trial()?20:$('action').value==='idle'?1:8}
function url(frame,hands=false){if(runeTrial())return 'rune-seer-autosprite-01/'+$('direction').value+'-'+frame+'.png';if(trial())return 'juggernaut-walk-03/'+$('direction').value+'-'+frame+'.png';const name=(hands?'hands-':'')+$('direction').value+($('action').value==='idle'?'':'-'+frame)+'.png';return DATA.bodyBase+$('outfit').value+'/'+$('action').value+'/'+name}
function image(src){if(!cache.has(src)){cache.set(src,new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i);i.onerror=()=>{cache.delete(src);reject(Error(src))};i.src=src}));}return cache.get(src)}
function stop(){state.playing=false;clearInterval(state.timer);state.timer=null;$('play').textContent='เล่น';$('play').setAttribute('aria-pressed','false')}
function fields(){const c=editedConfig();$('head-x').value=c.dx;$('head-y').value=c.dy;$('head-scale').value=Math.round(c.scale*100);$('hair').value=c.hair;$('face').value=c.face;$('fit-context').textContent='ปรับ: '+key()+(state.records[frameKey()]?' · เฟรมนี้มีค่าเฉพาะ':'')}
async function render(){
 const rev=++state.revision,src=url(state.frame);$('head').hidden=true;$('hands').hidden=true;$('frame').value=state.frame;$('status').className='wide';$('status').textContent='เฟรม '+(state.frame+1)+' / '+count()+($('action').value==='idle'?' · ภาพนิ่ง':'');$('file').textContent=src;for(const [i,b]of [...$('strip').children].entries())b.setAttribute('aria-current',String(i===state.frame));fields();
 try{const outfit=DATA.outfits.find(o=>o.id===$('outfit').value),d=outfit.directions[$('direction').value],frame=runeTrial()?window.RUNE_SEER_WALK.directions[$('direction').value][state.frame]:trial()?window.JUGGERNAUT_WALK_TRIAL[$('direction').value][state.frame]:$('action').value==='idle'?d.idle:d[$('action').value][state.frame],c=config(),headSrc=`heads/${c.hair}--${c.face}--${$('direction').value}.png`;
  const requests=[image(src)];if(frame.hands)requests.push(image(url(state.frame,true)));if($('head-enabled').checked)requests.push(image(headSrc));await Promise.all(requests);if(rev!==state.revision)return;
  $('sprite').src=src;if(frame.hands){$('hands').src=url(state.frame,true);$('hands').hidden=false}
  if($('head-enabled').checked){const b=DATA.base.find(b=>b.direction===$('direction').value),dx=frame.neck.x+d.headOffset.x-(b.neckPivot.x-b.headPivot.x)-b.neckPivot.x+c.dx,dy=frame.neck.y+d.headOffset.y-(b.neckPivot.y-b.headPivot.y)-b.neckPivot.y+c.dy;
   $('head').src=headSrc;$('head').style.transformOrigin=`${b.neckPivot.x/128*100}% ${b.neckPivot.y/128*100}%`;$('head').style.transform=`translate(${dx/128*100}%,${dy/128*100}%) scale(${c.scale})`;$('head').hidden=false;
  }
 }catch(e){if(rev!==state.revision)return;stop();$('head').hidden=true;$('hands').hidden=true;$('status').textContent='โหลดภาพไม่สำเร็จ: '+e.message;$('status').className='wide error'}
}
function selection(){stop();state.frame=0;$('frame').max=count()-1;$('frame').disabled=count()===1;for(const id of ['play','previous','next'])$(id).disabled=count()===1;$('strip').replaceChildren();for(let n=0;n<count();n++){const b=document.createElement('button');b.className='thumb';b.setAttribute('aria-label','ดูเฟรม '+(n+1));const i=new Image;i.src=url(n);i.alt='เฟรม '+(n+1);b.append(i);b.onclick=()=>{stop();state.frame=n;render()};$('strip').append(b)}$('scope').textContent=['achan','juggernaut'].includes($('outfit').value)?'ชุดที่เชื่อมกับเกมแล้ว · ไม่รวมอาวุธแยก':'ชุด detail สำหรับตรวจงาน · มีอาวุธวาดรวมในบางเฟรม';render()}
$('play').onclick=()=>{if(state.playing){stop();return}state.playing=true;$('play').textContent='หยุด';$('play').setAttribute('aria-pressed','true');state.timer=setInterval(()=>{state.frame=(state.frame+1)%count();render()},1000/Number($('fps').value))};
for(const id of ['outfit','direction','action'])$(id).onchange=selection;
$('fps').onchange=()=>{const playing=state.playing;stop();if(playing)$('play').click()};$('frame').oninput=()=>{stop();state.frame=Number($('frame').value);render()};$('previous').onclick=()=>{stop();state.frame=(state.frame+count()-1)%count();render()};$('next').onclick=()=>{stop();state.frame=(state.frame+1)%count();render()};
$('zoom').onchange=()=>document.documentElement.style.setProperty('--sprite-size',$('zoom').value+'px');$('background').onchange=()=>document.querySelector('.stage').style.background=$('background').value==='check'?'':$('background').value;
function edit(){stop();const c={dx:$('head-x').valueAsNumber,dy:$('head-y').valueAsNumber,scale:$('head-scale').valueAsNumber/100,hair:$('hair').value,face:$('face').value};try{validate({...packet(),headEnabled:true,records:{[key()]:c}})}catch(e){message(e.message,true);return}state.records[key()]=c;state.dirty=true;message('มีค่าปรับที่ยังไม่ได้บันทึก');render()}
for(const id of ['head-x','head-y','head-scale'])$(id).oninput=edit;for(const id of ['hair','face'])$(id).onchange=edit;
$('fit-scope').onchange=()=>{stop();fields()};$('head-enabled').onchange=()=>{state.dirty=true;message('โหมดหัวเปลี่ยนแล้ว · กดบันทึกเพื่อจำค่านี้');render()};
$('save-fit').onclick=()=>{try{localStorage.setItem(storageKey(),JSON.stringify(packet()));state.dirty=false;message('บันทึกในเบราว์เซอร์แล้ว · '+Object.keys(state.records).length+' ขอบเขต')}catch(e){message('บันทึกไม่สำเร็จ กรุณาส่งออก JSON: '+e.message,true)}};
$('export-fit').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(packet(),null,2)],{type:'application/json'}));a.href=u;a.download='shaman-outfit-head-fit.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);message('ส่งออก JSON แล้ว · หากต้องการจำในเบราว์เซอร์ให้กดบันทึกด้วย')};
$('import-fit').onclick=()=>$('import-file').click();$('import-file').onchange=async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>2000000)throw Error('ไฟล์ใหญ่เกินไป');const p=JSON.parse(await file.text()),records=validate(p);state.records=records;$('head-enabled').checked=p.headEnabled;state.dirty=true;stop();render();message('นำเข้าค่าแล้ว · กดบันทึกเพื่อเก็บในเบราว์เซอร์')}catch(e){message('นำเข้าไม่สำเร็จ: '+e.message,true)}finally{$('import-file').value=''}};
$('reset-fit').onclick=()=>{stop();delete state.records[key()];state.dirty=true;message('คืนค่าเฉพาะขอบเขตนี้แล้ว · ยังไม่ได้บันทึก');render()};document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);selection();
const originalSelection=selection;selection=function(){originalSelection();if(runeTrial())$('scope').textContent='Rune Seer · AutoSprite · เดินมือเปล่าครบ 8 ทิศ · ต่อหัวเดิมและบันทึกแยกโหมดได้ · ยังไม่ใช้ในเกม';else if(runeMode())$('scope').textContent+=' · ท่านี้ใช้ชุดเดิม; AutoSprite ใช้เฉพาะ Rune Seer ตอนเดิน';else if(trial())$('scope').textContent='ทดลอง Juggernaut จากภาพชุดล่าสุด · 20 เฟรมมือเปล่า · ยังไม่ใช้ในเกม · ปรับหัวได้และบันทึกแยกจากโหมดเดิม';else if(trialMode())$('scope').textContent+=' · ท่าเดินทดลองมีเฉพาะ Juggernaut ขวา/ซ้าย';};
for(const id of ['outfit','direction','action'])$(id).onchange=selection;
let previousMode=$('walk-trial').value;
$('walk-trial').onchange=()=>{stop();drafts.set(previousMode,{records:state.records,dirty:state.dirty,headEnabled:$('head-enabled').checked});previousMode=$('walk-trial').value;const saved=drafts.get(previousMode);if(saved){state.records=saved.records;state.dirty=saved.dirty;$('head-enabled').checked=saved.headEnabled;message(state.dirty?'มีค่าปรับที่ยังไม่ได้บันทึก':'คืนค่าของโหมดนี้แล้ว')}else loadFit();if(runeMode()){$('outfit').value='rune-seer-detail';$('action').value='walk'}else if(trialMode()){$('outfit').value='juggernaut';$('action').value='walk';if(!['east','west'].includes($('direction').value))$('direction').value='east'}$('fps').value=runeMode()?'16':trialMode()?'25':'8';selection()};
$('outfit').value='rune-seer-detail';$('direction').value='east';$('fps').value='16';selection();


