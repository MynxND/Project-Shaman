'use client';
import {useEffect,useRef,useState} from 'react';
import type {PreviewControl} from '../../../game/vfx/boss/StompPreview';
export default function Page(){
    const host=useRef<HTMLDivElement>(null),control=useRef<PreviewControl>({legacy:false,paused:false,speed:1,restart:0});
    const [status,setStatus]=useState('กำลังโหลดภาพ…'),[legacy,setLegacy]=useState(false),[paused,setPaused]=useState(false);
    useEffect(()=>{let gone=false,game:{destroy:(remove:boolean)=>void}|undefined;void import('../../../game/vfx/boss/StompPreview').then(m=>{if(!gone&&host.current)game=m.createStompPreview(host.current,()=>control.current,setStatus);});return()=>{gone=true;game?.destroy(true);};},[]);
    return <main className="stomp-review" style={{background:'#111b1b',color:'#e4d6b8',minHeight:'100dvh',padding:12,fontFamily:'Tahoma,sans-serif'}}>
        <style>{`.stomp-review button,.stomp-review select{min-height:40px;padding:7px 12px;background:#21312e;color:#e4d6b8;border:1px solid #786749;border-radius:4px;font:14px Tahoma,sans-serif}.stomp-review button:focus-visible,.stomp-review select:focus-visible{outline:2px solid #dfb575}`}</style>
        <h1 style={{fontSize:22,margin:'0 0 8px'}}>ย่ำภูผา · Mountain Stomp VFX</h1>
        <nav style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
            <button onClick={()=>{control.current.legacy=!legacy;control.current.restart++;setLegacy(!legacy);}}>{legacy?'ดู AFTER':'ดู BEFORE'}</button>
            <button onClick={()=>{control.current.paused=!paused;setPaused(!paused);}}>{paused?'เล่นต่อ':'หยุดภาพ'}</button>
            <button onClick={()=>{control.current.restart++;}}>เริ่มใหม่</button>
            <label>ความเร็ว <select defaultValue="1" onChange={e=>{control.current.speed=Number(e.target.value);}}><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1">1×</option></select></label>
            <a href="/?map=mount-oe-fortress&bossReview=1" style={{color:'#dfb575'}}>ทดสอบในเกมจริง</a>
        </nav>
        <p style={{fontSize:13}}>พรีวิวภาพเท่านั้น · ชาร์จ 1.1 วินาที → คลื่นสองระลอกห่าง 450ms · ระยะ 8 ช่องโลก · ไม่จำลองดาเมจ</p>
        <div ref={host} style={{height:'clamp(280px,65vw,72dvh)',minHeight:280,width:'100%',overflow:'hidden',border:'1px solid #786749'}}/>
        <output style={{display:'block',fontSize:12,overflowWrap:'anywhere',marginTop:8}}>{status}</output>
        <p style={{fontSize:12}}>CPU เฉพาะ update พรีวิว ไม่ใช่เวลา GPU · BEFORE เป็นแบบจำลองภาพวงเดิม; ภาพเทียบในเกมจริงอยู่ในรายงาน · ภาพคลื่นยังเป็นชุด POC 4 เฟรมวน ไม่ใช่งานแอนิเมชันขั้นสุดท้าย</p>
    </main>;
}
