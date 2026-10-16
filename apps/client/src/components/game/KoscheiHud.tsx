'use client';
import {useEffect,useState} from 'react';
import {KOSCHEI_RELICS,KOSCHEI_SKILLS} from '@shaman/shared';
import './koschei-hud.css';
type Snapshot={participants:number;hp:number;hpMax:number;phase:number;mode:string;skill:string;relicStage:number;hint:string;exposed:boolean;broken:boolean;healing:boolean;stage:number;countered:boolean;nearby:string|null;vfx:{cpuP95:number;views:number;cap:number}};
const send=(detail:object)=>window.dispatchEvent(new CustomEvent('koschei:command',{detail}));
export default function KoscheiHud(){const[s,set]=useState<Snapshot|null>(null),[review,R]=useState(false),[skill,K]=useState('gravefrost-spear');
  useEffect(()=>{R(process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).get('koscheiReview')==='1');const on=(e:Event)=>set((e as CustomEvent).detail);window.addEventListener('koschei:snapshot',on);return()=>window.removeEventListener('koschei:snapshot',on);},[]);
  if(!s)return null;const node=KOSCHEI_RELICS[s.relicStage];
  return <div className="kos-hud"><section className="kos-hp" aria-label="Koschei boss"><strong>คอชเชย์ · ระยะ {s.phase}</strong><progress aria-label="Koschei HP" value={s.hp} max={s.hpMax}/><small>{Math.ceil(s.hp).toLocaleString()} / {s.hpMax.toLocaleString()} · {KOSCHEI_SKILLS[s.skill as keyof typeof KOSCHEI_SKILLS]?.name??s.mode}</small></section>
    <aside className="kos-help" onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}><strong>{s.broken?'เข็มมรณะแตกแล้ว':'ความตายถูกซ่อนอยู่'}</strong><p>ทีม 3–10 คน · {s.participants||'รอเริ่ม / QA'} · กดดันบอส / เปิดวัตถุ / คุ้มกันผู้เปิด</p><p>{s.hint}</p><small>โอ๊ก → หีบ → กระต่าย → เป็ด → ไข่</small>
      {node&&s.nearby===node.id&&<button onClick={()=>send({action:'relic',relic:node.id})}>เปิด{node.name} (E)</button>}
      {s.exposed&&<p>โจมตีเข็มกลางลาน · บอสเปิดช่องสวนกลับ</p>}{s.healing&&<p>กำลังคืนชีพ! เปิดผนึกชั้นถัดไปเพื่อหยุด</p>}
      {s.stage>0&&<p>เข็มสุดท้าย {s.stage}/5 · {s.countered?'ขัดขวางสำเร็จ':'เปิดวัตถุตามลำดับแล้วทำลายเข็ม · วัตถุที่ยังไม่เปิดจะระเบิด'}</p>}
      {review&&<details><summary>ทดสอบในเกมจริง · DEV guest</summary><button onClick={()=>send({action:'prepare'})}>เตรียมทดสอบ</button><button onClick={()=>send({action:'auto'})}>เริ่ม AI</button><div>{[1,2,3].map(phase=><button key={phase} onClick={()=>send({action:'phase',phase})}>ระยะ {phase}</button>)}</div><select aria-label="สกิลทดสอบ Koschei" value={skill} onChange={e=>K(e.target.value)}>{Object.entries(KOSCHEI_SKILLS).map(([id,v])=><option key={id} value={id}>{v.name}</option>)}</select><button onClick={()=>send({action:'skill',skill})}>ใช้สกิล</button><output>VFX CPU p95 {s.vfx.cpuP95.toFixed(3)}ms · {s.vfx.views}/{s.vfx.cap}</output></details>}
    </aside></div>;
}
