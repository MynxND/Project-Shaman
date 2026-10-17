// Automatic completeness/consistency checks. A pass here is technical only, never visual approval.
import {SIZE,bounds,opaqueCount} from './common.mjs';
import {diff} from './process.mjs';

const check=(id,label,status,detail,value)=>({id,label,status,detail,value});

export function runQa({idle,frames,selected,meta,loop}){
  const out=[];const sel=selected.map(i=>frames[i]);
  const ib=bounds(idle),ia=opaqueCount(idle);

  out.push(sel.length>=4&&sel.every(f=>f.full.w===SIZE&&f.full.h===SIZE)
    ?check('complete','ครบจำนวนเฟรม/ขนาด','pass',`${sel.length} เฟรม ขนาด ${SIZE}px`,sel.length)
    :check('complete','ครบจำนวนเฟรม/ขนาด','fail',`ได้ ${sel.length} เฟรม (ต้องมีอย่างน้อย 4)`,sel.length));

  const empty=sel.filter(f=>opaqueCount(f.full)<ia*0.4).length;
  out.push(check('empty','เฟรมว่าง/ตัวละครหาย',empty?'fail':'pass',empty?`${empty} เฟรมมีพิกเซลตัวละครน้อยกว่า 40% ของ idle`:'ทุกเฟรมมีตัวละครครบ',empty));

  const startErr=diff(frames[0].full,idle);
  out.push(check('start','เฟรมแรกตรงกับ idle',startErr<18?'pass':startErr<35?'warn':'fail',`ค่าต่างเฉลี่ย ${startErr.toFixed(1)} (0 = เหมือนเป๊ะ)`,startErr));

  if(loop){const endErr=diff(frames[frames.length-1].full,idle);out.push(check('loop','จบกลับท่า idle (ลูป)',endErr<22?'pass':endErr<40?'warn':'fail',`ค่าต่างเฟรมสุดท้าย ${endErr.toFixed(1)}`,endErr));}

  const hs=sel.map(f=>bounds(f.full)?.h||0),hDrift=Math.max(...hs.map(h=>Math.abs(h-ib.h)/ib.h));
  out.push(check('scale','ขนาดตัวคงที่ (ไม่ซูม)',hDrift<0.12?'pass':hDrift<0.22?'warn':'fail',`ความสูงต่างจาก idle สูงสุด ${(hDrift*100).toFixed(0)}% (ท่าก้ม/ล้มอาจต่างได้)`,hDrift));

  const cx=sel.map(f=>{const b=bounds(f.full);return b?(b.x0+b.x1)/2:0;}),cxr=Math.max(...cx)-Math.min(...cx);
  out.push(check('drift','ตัวไม่ลอยเลื่อนซ้ายขวา',cxr<10?'pass':cxr<18?'warn':'fail',`ศูนย์กลางแนวนอนเลื่อน ${cxr.toFixed(1)}px`,cxr));

  const edge=sel.filter(f=>{const b=bounds(f.full);return b&&(b.x0===0||b.y0===0||b.x1===SIZE-1);}).length;
  out.push(check('clip','ไม่หลุดขอบภาพ',edge?'warn':'pass',edge?`${edge} เฟรมชนขอบ ${SIZE}px`:'อยู่ในกรอบทุกเฟรม',edge));

  const off=Math.max(...meta.map(m=>m.offPaletteShare));
  out.push(check('palette','สีตรงกับพาเลตต้นฉบับ',off<0.08?'pass':off<0.2?'warn':'fail',`พิกเซลที่สีห่างจากพาเลต idle สูงสุด ${(off*100).toFixed(0)}% (ถูกบังคับเข้าพาเลตแล้ว)`,off));

  const hm=Math.max(...sel.map(f=>f.matchError));
  out.push(check('head','ติดตามหัวต้นฉบับได้',hm<30?'pass':hm<55?'warn':'fail',`ค่าต่างการจับหัวสูงสุด ${hm} — สูงแปลว่าหัวถูกบัง/หันผิด ต้องตรวจตา`,hm));

  const islands=Math.max(...meta.map(m=>m.islands));
  out.push(check('noise','ไม่มีเศษพิกเซลหลุด',islands<40?'pass':'warn',`ลบเศษพิกเซลเล็กสูงสุด ${islands} px ต่อเฟรม`,islands));

  // silhouette overlap between neighbouring sprite frames: ~1 = frozen, low = popping
  const iou=(a,b)=>{let i=0,u=0;for(let k=3;k<a.d.length;k+=4){const x=a.d[k]>127,y=b.d[k]>127;if(x&&y)i++;if(x||y)u++;}return u?i/u:1;};
  const steps=sel.slice(1).map((f,i)=>({d:diff(f.full,sel[i].full),o:iou(f.full,sel[i].full)})),still=steps.filter(s=>s.d<3).length,pop=Math.min(1,...steps.map(s=>s.o));
  out.push(check('motion','มีการเคลื่อนไหวต่อเนื่อง',still>sel.length/2?'fail':pop<0.55?'warn':'pass',`เฟรมนิ่ง ${still}/${steps.length}, ซ้อนทับต่ำสุดระหว่างเฟรม ${(pop*100).toFixed(0)}% (ต่ำ = กระตุก)`,{still,minOverlap:pop}));

  const worst=out.some(c=>c.status==='fail')?'fail':out.some(c=>c.status==='warn')?'warn':'pass';
  return{status:worst,checks:out,note:'ผ่าน QA = ผ่านการตรวจทางเทคนิคเท่านั้น ยังต้องให้คนดูและกดอนุมัติ'};
}
