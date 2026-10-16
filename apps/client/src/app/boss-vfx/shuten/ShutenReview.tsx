'use client';
import {useEffect,useRef,useState} from 'react';
import {FACINGS,SHUTEN_SKILLS} from '@shaman/shared';
import type {ShutenControls} from '../../../game/vfx/boss/ShutenPreview';
const faces=['ใต้','ตะวันออกเฉียงใต้','ตะวันออก','ตะวันออกเฉียงเหนือ','เหนือ','ตะวันตกเฉียงเหนือ','ตะวันตก','ตะวันตกเฉียงใต้'];
export default function ShutenReview({initialSkill='oni-crusher'}:{initialSkill?:string}){
    const host=useRef<HTMLDivElement>(null),ctrl=useRef<ShutenControls>({skill:initialSkill,face:'south',paused:false,speed:1,restart:0,scrub:0,seek:0,zoom:1});
    const [skill,S]=useState(initialSkill),[face,F]=useState('south'),[paused,P]=useState(false),[stats,T]=useState('กำลังโหลดภาพ…'),[progress,G]=useState(0);
    useEffect(()=>{let gone=false,game:{destroy:(remove:boolean)=>void}|undefined;void import('../../../game/vfx/boss/ShutenPreview').then(m=>{if(!gone&&host.current)game=m.createShutenPreview(host.current,()=>ctrl.current,(s,p)=>{T(s);G(p);});});return()=>{gone=true;game?.destroy(true);};},[]);
    return <main className="shuten-review" style={{background:'#111b1b',color:'#e4d6b8',minHeight:'100dvh',padding:12,fontFamily:'Tahoma,sans-serif'}}>
        <style>{`.shuten-review button,.shuten-review select{min-height:42px;padding:7px 10px;background:#21312e;color:#e4d6b8;border:1px solid #786749;border-radius:4px;font:14px Tahoma,sans-serif}.shuten-review select{max-width:100%}.shuten-review button:focus-visible{outline:2px solid #dfb575}.shuten-review a{color:#dfb575}`}</style>
        <h1 style={{fontSize:22,margin:'0 0 10px'}}>SHUTEN-DŌJI · ทุกสกิลและการเปลี่ยนร่าง</h1>
        <nav style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <label>ท่า <select aria-label="สกิลบอส" value={skill} onChange={e=>{S(e.target.value);ctrl.current.skill=e.target.value;}}>{Object.entries(SHUTEN_SKILLS).map(([k,v])=><option key={k} value={k}>{v.phase} · {v.name}</option>)}<option value="phase-2">เปลี่ยนร่างระยะ 2</option><option value="phase-3">ตัดเศียรระยะ 3</option><option value="death">ปราบบอส / สลายวิญญาณ</option></select></label>
            <label>ทิศเป้าหมาย <select aria-label="ทิศเป้าหมาย" value={face} onChange={e=>{F(e.target.value);ctrl.current.face=e.target.value as typeof FACINGS[number];}}>{FACINGS.map((f,i)=><option key={f} value={f}>{faces[i]}</option>)}</select></label>
            <button onClick={()=>{ctrl.current.paused=!paused;P(!paused);}}>{paused?'เล่นต่อ':'หยุดภาพ'}</button>
            <button onClick={()=>{ctrl.current.restart++;}}>เริ่มใหม่</button>
            <label>ความเร็ว <select defaultValue="1" onChange={e=>{ctrl.current.speed=Number(e.target.value);}}><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1">1×</option></select></label>
            <label>มุมมอง <select aria-label="ขยายภาพ" defaultValue="1" onChange={e=>{ctrl.current.zoom=Number(e.target.value);}}><option value="1">ภาพรวม</option><option value="1.5">1.5×</option><option value="2">2× รายละเอียด</option></select></label>
        </nav>
        <p style={{fontSize:13}}>ข้อมูลจังหวะจาก CombatSystem จริง · พรีวิวนี้ไม่ทำดาเมจ · รอยอาคมสีชาดคือเขตอันตราย ขอบทองเรืองเต็มก่อนโจมตี · ควันและสะเก็ดเป็นภาพตกแต่ง</p>
        <div ref={host} style={{height:'clamp(300px,65vw,68dvh)',width:'100%',overflow:'hidden',border:'1px solid #786749'}}/>
        <label style={{display:'block',marginTop:10}}>ตำแหน่งเวลา <input aria-label="ตำแหน่งเวลา" type="range" min="0" max="1" step=".001" value={progress} style={{width:'min(650px,90vw)'}} onChange={e=>{const p=Number(e.target.value);G(p);ctrl.current.scrub=p;ctrl.current.seek++;ctrl.current.paused=true;P(true);}}/></label>
        <output style={{fontSize:12,display:'block',overflowWrap:'anywhere'}}>{stats}</output>
        <p><a href="/?map=mount-oe-fortress&bossReview=1">ทดสอบในเกมจริง</a> · <a href="/boss-review/shuten-complete/index.html">ภาพตรวจในเกมจริง / ก่อน–หลัง</a></p>
    </main>;
}
