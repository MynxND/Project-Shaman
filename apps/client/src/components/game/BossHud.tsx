'use client';
import {useEffect,useState}from'react';
import{SHUTEN_SKILLS,FACINGS}from'@shaman/shared';
import styles from'./BossHud.module.css';
type Snapshot={hp:number;hpMax:number;phase:number;mode:string;name:string;altars:number;sealed:boolean;seal:number;stage:number;stagger:number;head:string;hazards:number;drums:number;vfx?:{active:number;pooled:number;particles:number;peakParticles:number;cpuP95:number}};
const command=(detail:object)=>window.dispatchEvent(new CustomEvent('boss:command',{detail}));
const modes:Record<string,string>={windup:'เตรียมโจมตี',active:'โจมตี',recovery:'ช่องสวนกลับ',stagger:'เสียหลัก',transition:'เปลี่ยนร่าง',dead:'ปราบสำเร็จ',dormant:'รอผู้ท้าชิง'};
export default function BossHud(){
 const[s,set]=useState<Snapshot|null>(null),[review,R]=useState(false),[skill,K]=useState('oni-crusher'),[face,F]=useState('south'),[loading,L]=useState('กำลังเตรียมฉากบอส…');
 useEffect(()=>{R(process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).get('bossReview')==='1');const f=(e:Event)=>set((e as CustomEvent).detail);window.addEventListener('boss:snapshot',f);return()=>window.removeEventListener('boss:snapshot',f);},[]);
 useEffect(()=>{const load=(e:Event)=>L(String((e as CustomEvent).detail));window.addEventListener('boss:load',load);return()=>window.removeEventListener('boss:load',load);},[]);
 if(!s)return review?<aside aria-label="สถานะโหลดบอส" className={styles.controls}>{loading}</aside>:null;
 const selected=SHUTEN_SKILLS[skill as keyof typeof SHUTEN_SKILLS]?.phase<=s.phase?skill:"oni-crusher";
 return <><section aria-label="Shuten-doji boss" className={styles.bar}>
  <strong>SHUTEN-DŌJI · ระยะ {s.phase}</strong>
  <div role="progressbar" aria-label="Boss HP" aria-valuenow={s.hp} aria-valuemin={0} aria-valuemax={s.hpMax} className={styles.meter}><div style={{height:'100%',width:100*s.hp/s.hpMax+'%',background:'#a2383b'}}/></div>
  <div>{Math.ceil(s.hp).toLocaleString()} / {s.hpMax.toLocaleString()} · {modes[s.mode]??s.mode} {s.name}</div>
  <div>แท่นสาเก {s.altars}/3 · {s.sealed?'ผนึกแล้ว':s.stage?'อัลติเมต '+s.stage+'/5':'เสียหลัก '+Math.round(s.stagger*100)+'%'}</div>
 </section><aside className={styles.controls} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
  <div>{s.phase===3?'ทำลายแท่นทั้ง 3 แล้วยืนวงผนึกด้านใต้':'ทำลายแท่นสาเกเพื่อลดพลังอัลติเมต'}</div>
  {s.drums>0&&<div>ทำลายกลองอัญเชิญ {s.drums} ใบ เพื่อหยุดกำลังเสริม</div>}
  {s.stage>0&&<div>{['','จันทร์โลหิต · เศียรลอยสูง','วิญญาณโอนิล้อมสนาม','ออกจากวงเพลิงที่ทำเครื่องหมาย','หลบด้านข้างลมหายใจ','หลบคลื่นกระแทกสามระลอก'][s.stage]}</div>}
  {s.phase===3&&<button className={styles.seal} disabled={s.altars>0||s.sealed||s.mode==='dead'} onClick={()=>command({action:'seal'})}>ผนึกเศียร {s.seal?Math.round(s.seal*100)+'%':'(ร่าย 2 วินาที)'}</button>}
  {review&&<details><summary>ตรวจบอสในเกมจริง · DEV</summary><div className={styles.row}>{[1,2,3].map(phase=><button key={phase} onClick={()=>command({action:'phase',phase})}>ระยะ {phase}</button>)}<button onClick={()=>command({action:'prepare'})}>เตรียมทดสอบ</button><button onClick={()=>command({action:'ai'})}>เริ่ม AI</button></div>
  <select aria-label="Boss skill" value={selected} onChange={e=>K(e.target.value)}>{Object.entries(SHUTEN_SKILLS).filter(([,v])=>v.phase<=s.phase).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select><button onClick={()=>command({action:'skill',skill:selected})}>ใช้สกิล</button>
  <div><select aria-label="ทิศทดสอบในเกม" value={face} onChange={e=>F(e.target.value)}>{FACINGS.map(f=><option key={f} value={f}>{f}</option>)}</select><button onClick={()=>command({action:'aim',face,skill:selected})}>จัดตำแหน่งทดสอบ</button></div>
  <div>คำเตือนที่ซิงก์ {s.hazards} · {s.head}</div>{s.vfx&&<output style={{fontSize:10,display:'block'}}>VFX CPU p95 {s.vfx.cpuP95.toFixed(2)}ms · views {s.vfx.active}/{s.vfx.pooled} · particles {s.vfx.particles} peak {s.vfx.peakParticles}/96</output>}</details>}
 </aside></>;
}
