const $=id=>document.getElementById(id),data=window.JUGGERNAUT_REVIEW;
let phase=0,playing=false,last=0,raf=0,ready=false;
const reference=new Image(),sprites=data.frames.map(url=>{const image=new Image();image.src=url;return image}),originals=data.originalFrames.map(url=>{const image=new Image();image.src=url;return image});reference.src='reference-user.png';
function draw(){if(!ready)return;const mirrored=$('direction').value==='west',r=Math.min(19,Math.floor(phase*20)),c=Math.min(data.frames.length-1,Math.floor(phase*data.frames.length));
 for(const [id,img,source,b]of [['reference',reference,{x:r%5*256,y:Math.floor(r/5)*256,w:256,h:256},data.referenceBounds[r]],['original',originals[c],{x:0,y:0,w:128,h:128},data.originalBounds[c]],['candidate',sprites[c],{x:0,y:0,w:128,h:128},data.bounds[c]]]){const ctx=$(id).getContext('2d');ctx.clearRect(0,0,320,320);ctx.imageSmoothingEnabled=false;ctx.save();if(mirrored){ctx.translate(320,0);ctx.scale(-1,1)}const scale=id==='reference'?1.18:data.displayScale;ctx.drawImage(img,source.x,source.y,source.w,source.h,160-b.centerX*scale,286-b.bottom*scale,source.w*scale,source.h*scale);ctx.restore();ctx.strokeStyle='#d9b968';ctx.beginPath();ctx.moveTo(12,287);ctx.lineTo(308,287);ctx.stroke()}
 $('phase').value=Math.floor(phase*160);$('status').textContent=`ต้นแบบ ${r+1}/20 · Juggernaut ${c+1}/${data.frames.length} · ${Math.round(phase*100)}% ของรอบ`;
}
function tick(time){if(!playing)return;phase=(phase+(time-last)/800*Number($('speed').value))%1;last=time;draw();raf=requestAnimationFrame(tick)}
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='เล่น'}
$('play').onclick=()=>{if(playing){stop();return}playing=true;last=performance.now();$('play').textContent='หยุด';raf=requestAnimationFrame(tick)};
for(const [id,step]of [['previous',-1],['next',1]])$(id).onclick=()=>{stop();const count=data.frames.length;phase=((Math.floor(phase*count)+step+count)%count)/count;draw()};
$('phase').oninput=()=>{stop();phase=Number($('phase').value)/160;draw()};$('direction').onchange=draw;window.addEventListener('pagehide',stop);
Promise.all([reference,...sprites,...originals].map(img=>new Promise((resolve,reject)=>{if(img.complete&&img.naturalWidth)return resolve();img.onload=resolve;img.onerror=reject}))).then(()=>{ready=true;draw()}).catch(()=>{$('status').textContent='โหลดภาพไม่สำเร็จ กรุณาเปิด review.html จากโฟลเดอร์ที่มีไฟล์ภาพครบ'});
