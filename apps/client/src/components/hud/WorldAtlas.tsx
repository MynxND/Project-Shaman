'use client';
import {useState,useRef,useEffect} from 'react';
import {MAPS} from '@shaman/shared';
import atlas from './world-atlas-data.json';
import './world-atlas.css';

export function WorldAtlas({current='umbral-capital'}:{current?:string}){
  const [selected,setSelected]=useState(current),[nation,setNation]=useState('all');
  const scroll=useRef<HTMLDivElement>(null);
  const nodes=atlas.maps.map(m=>m.nation==='thailand'?{...m,x:600+atlas.nations[0]!.maps.indexOf(m.id)*90,y:490}:m);
  const info=nodes.find(m=>m.id===selected)??nodes[0]!;
  const live=(id:string)=>Object.hasOwn(MAPS,id);
  useEffect(()=>{
    const el=scroll.current;if(!el)return;
    const x=nation==='all'?(nodes.find(m=>m.id===selected)?.x??565):(atlas.nations.find(n=>n.id===nation)?.x??565);
    el.scrollTo({left:Math.max(0,x/1200*el.scrollWidth-el.clientWidth/2)});
  },[nation,selected]);
  return <div className="shaman-atlas">
    <header><strong>โลกหมอผี · 12 ประเทศ · 30 แมพ</strong><span>{nodes.filter(m=>live(m.id)).length} แมพเล่นได้ · {nodes.filter(m=>!live(m.id)).length} อยู่ในแผน</span></header>
    <p>ภูมิศาสตร์แดนวิญญาณ ชื่อใหม่ และช่วงเลเวลเป็นข้อเสนอ · เส้นทึบเชื่อมจริง เส้นประอยู่ในแผน</p>
    <label>ดูภูมิภาค <select value={nation} onChange={e=>setNation(e.target.value)}><option value="all">ทั้งโลก</option>{atlas.nations.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label><p>มือถือเลื่อนแผนผังซ้าย–ขวาได้ · เลือกจุดเพื่อดูรายละเอียด</p>
    <div className="atlas-scroll" ref={scroll}><svg viewBox="0 0 1200 780" aria-label="แผนที่เครือข่ายโลกหมอผี 30 แมพ" role="group">
      <rect width="1200" height="780" fill="#0a2024"/>
      <path d="M48 160 Q120 85 210 110 L365 170 Q470 245 405 330 L300 400 Q260 510 350 600 L240 675 Q120 640 80 500 L35 300Z" fill="#233b35" stroke="#57705b"/>
      <path d="M450 110 Q600 10 840 75 L1140 145 Q1170 280 1080 400 L1160 530 Q1140 680 950 715 L775 600 Q650 690 500 570 L430 330Z" fill="#243c34" stroke="#57705b"/>
      {atlas.links.map(l=>{const a=nodes.find(m=>m.id===l.from)!,b=nodes.find(m=>m.id===l.to)!;return <path key={l.from+l.to} d={`M${a.x},${a.y} L${b.x},${b.y}`} fill="none" stroke={l.status==='live'?'#d6b46c':'#6b837b'} strokeWidth={l.status==='live'?3:1} strokeDasharray={l.status==='live'?undefined:'5 8'} opacity={l.status==='live'?1:.4}/>;})}
      {atlas.nations.map(n=><text key={n.id} x={n.x} y={n.y-25} textAnchor="middle" fill="#d6b46c" fontSize="17" opacity={nation==='all'||nation===n.id?1:.25}>{n.name}</text>)}
      {nodes.map(m=><g key={m.id} role="button" tabIndex={0} aria-label={`${m.name} · ${live(m.id)?'เล่นได้':'อยู่ในแผน'}`} onClick={()=>setSelected(m.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(m.id);}}} opacity={nation==='all'||m.nation===nation||m.nation==='global'?1:.15}>
        <circle cx={m.x} cy={m.y} r={m.id===selected?12:8} fill={live(m.id)?'#77b99b':'#354b48'} stroke={m.id===current?'#f5df94':'#d6b46c'} strokeWidth={m.id===current?4:1}/>
        <text x={m.x} y={m.y+22} textAnchor="middle" fill="#ece3bf" fontSize="11">{m.name}</text>
      </g>)}
      <text x="600" y="760" textAnchor="middle" fill="#a6b5ad" fontSize="13">เครือข่ายภูมิภาคสมมติ · ไม่ใช่แผนที่โลกจริง · เลือกจุดเพื่อดูรายละเอียด ไม่มีวาร์ปจากหน้าจอนี้</text>
    </svg></div>
    <aside aria-live="polite"><strong>{info.name}</strong><span>{atlas.nations.find(n=>n.id===info.nation)?.name??'ศูนย์กลางร่วม'} · Lv.{info.levels.join('–')} (เสนอ) · {live(info.id)?'เล่นได้ในเกม':'แผนพัฒนาระยะ '+info.phase}</span><p>{info.biome}</p><p>{atlas.nations.find(n=>n.id===info.nation)?.theme??'ศูนย์รวมเส้นทางหมอผี'}</p></aside>
    <details><summary>รายชื่อครบ30แมพและลำดับพัฒนา</summary><ol>{nodes.map(m=><li key={m.id}><button type="button" onClick={()=>setSelected(m.id)}>{m.name}</button> · {live(m.id)?'เล่นได้':'ระยะ '+m.phase} · Lv.{m.levels.join('–')}</li>)}</ol></details>
  </div>;
}
