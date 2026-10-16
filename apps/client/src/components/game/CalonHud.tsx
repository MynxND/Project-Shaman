'use client';
import {useEffect,useState} from 'react';
import {CALON_SKILLS,FACINGS} from '@shaman/shared';
import art from '../../../public/assets/boss/calon-arang/manifest.json';
import './calon-hud.css';
type Snapshot={hp:number;hpMax:number;phase:number;mode:string;skill:string;hint:string;stage:number;countered:boolean;uncut:number;infection:number;purify:number;nearWell:boolean;nearSource:boolean;vfx:{cpuP95:number;views:number;cap:number;frameP95:number;samples:number;renderer:string;objects:number}};
const send=(detail:object)=>window.dispatchEvent(new CustomEvent('calon:command',{detail}));
export default function CalonHud(){const[s,set]=useState<Snapshot|null>(null),[review,R]=useState(false),[skill,K]=useState('plague-bloom');
  useEffect(()=>{R(process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).get('calonReview')==='1');const on=(e:Event)=>set((e as CustomEvent).detail);window.addEventListener('calon:snapshot',on);return()=>window.removeEventListener('calon:snapshot',on);},[]);
  if(!s)return null;
  return <div className="calon-hud"><section className="calon-hp" aria-label="Calon Arang boss"><strong>จาลน อารัง · ระยะ {s.phase}</strong><progress aria-label="Calon HP" value={s.hp} max={s.hpMax}/><small>{Math.ceil(s.hp).toLocaleString()} / {s.hpMax.toLocaleString()} · {CALON_SKILLS[s.skill as keyof typeof CALON_SKILLS]?.name??s.mode}</small></section>
    <aside className="calon-help" onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}><strong>เครือข่ายโรคระบาด · เหลือ {s.uncut} เส้น</strong><p>{s.hint}</p><small>เชื้อสะสม {s.infection}/3 · ชำระแท่น {Math.round(s.purify*100)}%</small>
      {s.nearWell&&<button onClick={()=>send({action:'interact',kind:'cleanse'})}>ชำระเชื้อ (E)</button>}
      {s.nearSource&&!s.uncut&&<button onClick={()=>send({action:'interact',kind:'purify'})}>เริ่มพิธีชำระแท่น (E)</button>}
      {!!s.stage&&<p>ราตรีพันคำสาป {s.stage}/5 · ตัดเส้นเชื่อมและชำระแท่น หรือหลบวงทองด้านใต้</p>}
      {review&&<details><summary>ทดสอบในเกมจริง · DEV guest</summary><button onClick={()=>send({action:'prepare'})}>เตรียมทดสอบ</button><button onClick={()=>send({action:'auto'})}>เริ่ม AI</button><div>{[1,2,3].map(phase=><button key={phase} onClick={()=>send({action:'phase',phase})}>ระยะ {phase}</button>)}</div><select aria-label="สกิลทดสอบ Calon" value={skill} onChange={e=>K(e.target.value)}>{Object.entries(CALON_SKILLS).map(([id,a])=><option key={id} value={id} disabled={!Object.hasOwn(art.materials,id)}>{a.name}{!Object.hasOwn(art.materials,id)?' · ASSET_REQUIRED':''}</option>)}</select><select aria-label="ตำแหน่งทดสอบ 8 ทิศ" defaultValue="south" onChange={e=>{const a=Math.PI/2-FACINGS.indexOf(e.target.value as typeof FACINGS[number])*Math.PI/4;send({action:'arrange',x:24+Math.cos(a)*6,y:20+Math.sin(a)*6});}}>{FACINGS.map(f=><option key={f}>{f}</option>)}</select><button onClick={()=>send({action:'skill',skill})}>ใช้สกิล</button><output>VFX CPU p95 {s.vfx.cpuP95.toFixed(3)}ms · {s.vfx.views}/{s.vfx.cap} · frame p95 {(s.vfx.frameP95??0).toFixed(2)}ms · {s.vfx.renderer} · objects {s.vfx.objects} · samples {s.vfx.samples}</output>{!!art.temporaryMissingDirections.length&&<p>งานระหว่างทำ: motion พร้อมเฉพาะทิศใต้ ยังไม่ใช่งานครบ 8 ทิศ</p>}</details>}
    </aside></div>;
}
