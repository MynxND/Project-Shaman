'use client';
import {useState,useRef,useEffect} from 'react';
import {MAPS} from '@shaman/shared';
import atlas from '../hud/world-atlas-data.json';
import detailData from './world-art-details.json';
import './illustrated-world-atlas.css';

interface Detail{climate:string;landmark:string;activities:string;residents:string[];proposedResidents:string[];npcs:string[];connections:{id:string;status:string}[];source:string}
const details=detailData as Record<string,Detail>;
// Cartographic preview anchors align the painting; no gameplay/world-unit coordinates change.
const positions:Record<string,[number,number]>={
 'umbral-capital':[565,345],'whispering-spiritwood':[590,470],'lantern-paddy':[675,488],'moon-mangrove':[760,507],'monsoon-marsh':[842,485],'mountain-spirit-sanctuary':[885,432],
 'storm-seal-plateau':[460,610],'broken-seal-sanctum':[590,665]
 ,'amber-grassland':[95,190],'red-wind-canyon':[190,205],'salt-mirror-basin':[95,330],'sunken-oasis':[225,385]
};
const countries:Record<string,[number,number]>={thailand:[725,445],china:[830,255],japan:[1060,305],korea:[1040,140],norway:[565,85],russia:[800,75],usa:[140,145],ireland:[370,205],mexico:[140,290],haiti:[260,505],indonesia:[900,595],philippines:[1070,510]};
// Compact overview country labels are separated without moving map/portal coordinates.
const compactCountries:Record<string,[number,number]>={usa:[150,75],ireland:[365,250],mexico:[155,365],haiti:[225,610],norway:[545,55],russia:[825,55],korea:[1040,180],china:[850,305],japan:[1040,405],thailand:[675,465],philippines:[1035,565],indonesia:[850,710]};
const nodes=atlas.maps.map(m=>({...m,x:positions[m.id]?.[0]??m.x,y:positions[m.id]?.[1]??m.y}));
const live=(id:string)=>Object.hasOwn(MAPS,id);
const liveCount=nodes.filter(m=>live(m.id)).length;
export function IllustratedWorldAtlas({current='umbral-capital',embedded=false}:{current?:string;embedded?:boolean}){
 const [selected,setSelected]=useState(nodes.some(m=>m.id===current)?current:'umbral-capital'),[nation,setNation]=useState('all'),[routes,setRoutes]=useState(true),[zoom,setZoom]=useState(1),[detailOpen,setDetailOpen]=useState(false),[viewSize,setViewSize]=useState({w:1200,h:780});
 const viewport=useRef<HTMLDivElement>(null);
 const detailPanel=useRef<HTMLElement>(null),reveal=useRef(false);
 const node=nodes.find(n=>n.id===selected)!,info=details[selected]!,country=atlas.nations.find(n=>n.id===node.nation);
 const choose=(id:string)=>{setDetailOpen(true);reveal.current=!embedded;setSelected(id);const next=nodes.find(m=>m.id===id)!;if(nation!=='all'&&next.nation!==nation)setNation('all');if(id===selected&&!embedded){reveal.current=false;detailPanel.current?.scrollIntoView({block:'start',behavior:'smooth'});}};
 // Size from the available viewport, not a hard-coded minimum artwork width.
 useEffect(()=>{const el=viewport.current;if(!el)return;const observer=new ResizeObserver(()=>setViewSize({w:el.clientWidth,h:el.clientHeight}));observer.observe(el);return()=>observer.disconnect();},[]);
 const fit=Math.min(viewSize.w/1200,viewSize.h/780),scale=Math.max(.01,fit)*zoom;
 const showNames=scale>=.55;
 const overview=()=>{setZoom(1);setNation('all');setDetailOpen(false);viewport.current?.scrollTo({left:0,top:0});};
 useEffect(()=>{if(reveal.current){reveal.current=false;detailPanel.current?.scrollIntoView({block:'start',behavior:'smooth'});}},[selected]);
 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  if(nation==='all'&&zoom===1){el.scrollTo({left:0,top:0});return;}
  const x=nation==='all'?node.x:(countries[nation]?.[0]??node.x),y=nation==='all'?node.y:(countries[nation]?.[1]??node.y);
  el.scrollTo({left:Math.max(0,x*scale-el.clientWidth/2),top:Math.max(0,y*scale-el.clientHeight/2)});
 },[nation,selected,zoom,scale]);
 return <main className={`painted-atlas${embedded?' painted-atlas-embedded':''}`}>
  <header className="painted-head"><div><p>PROJECT SHAMAN · WORLD ATLAS</p><h1>แผนโลกหมอผี</h1><span>12 ประเทศ · 30 แมพ · ภูมิศาสตร์และชื่อใหม่ยังเป็นข้อเสนอ</span></div><div className="painted-status">{liveCount} แมพเล่นได้<br/>{nodes.length-liveCount} แมพในแผน</div></header>
  <nav className="painted-controls" aria-label="ควบคุมแผนโลก"><label>ภูมิภาค <select value={nation} onChange={e=>{const value=e.target.value;setNation(value);if(value!=='all'){setSelected(nodes.find(m=>m.nation===value)!.id);setZoom(Math.max(zoom,Math.min(4,.7/Math.max(.01,fit))));}else setZoom(1);}}><option value="all">ทั้งโลก</option>{atlas.nations.map(n=><option value={n.id} key={n.id}>{n.name}</option>)}</select></label><label>เลือกแมพ <select value={selected} onChange={e=>choose(e.target.value)}>{nodes.filter(m=>nation==='all'||m.nation===nation||m.nation==='global').map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label><button type="button" onClick={()=>setRoutes(v=>!v)} aria-pressed={routes}>เส้นทาง {routes?'เปิด':'ปิด'}</button><button type="button" onClick={()=>setZoom(v=>Math.max(1,v-.5))} disabled={zoom<=1} aria-label="ซูมออก">−</button><button type="button" onClick={overview}>ภาพรวม</button><span>{zoom.toFixed(1)}×</span><button type="button" onClick={()=>setZoom(v=>Math.min(4,v+.5))} disabled={zoom>=4} aria-label="ซูมเข้า">+</button>{!embedded&&<a href="/">กลับเกม</a>}</nav>
  <p className="painted-hint">จุดทอง = เล่นได้ · จุดโปร่ง = ในแผน · ซูมเพื่ออ่านชื่อและเลื่อนภาพ · เลือกแมพเพื่อดูข้อมูล</p>
  <div className="painted-map" data-overview={zoom===1} ref={viewport}><svg viewBox="0 0 1200 780" style={{width:1200*scale,height:780*scale,minWidth:1200*scale}} role="group" aria-label="แผนโลกภาพวาด 12 ประเทศ 30 แมพ">
   <defs><clipPath id="atlas-paper"><rect x="32" y="22" width="1128" height="736" rx="10"/></clipPath></defs>
   <rect width="1200" height="780" fill="#131c18"/>
   <image className="painted-terrain" href="/assets/world-atlas/art-01/terrain.png" width="1200" height="780" preserveAspectRatio="none" clipPath="url(#atlas-paper)"/>
   {routes&&atlas.links.map(l=>{const a=nodes.find(m=>m.id===l.from)!,b=nodes.find(m=>m.id===l.to)!;return <path key={l.from+l.to} d={`M${a.x},${a.y} L${b.x},${b.y}`} fill="none" stroke={l.status==='live'?'#ffcd69':'#d7dec8'} strokeWidth={l.status==='live'?3:1.5} strokeDasharray={l.status==='live'?undefined:'5 7'} opacity={nation==='all'||a.nation===nation||b.nation===nation?(l.status==='live'?1:((l.from===selected||l.to===selected)?.85:.38)):.08}/>;})}
   {atlas.nations.map(n=>{const p=(scale<.35&&zoom===1?compactCountries:countries)[n.id]!,title=n.id==='usa'?'สหรัฐฯ':n.id==='russia'?'รัสเซีย':n.name,font=Math.max(20,14/scale),width=Math.max(110,title.length*font*.62+20);return <g key={n.id} opacity={nation==='all'||nation===n.id?1:.4}><rect x={p[0]-width/2} y={p[1]-font-8} width={width} height={font+12} rx="3" fill="#e3c795" stroke="#6e462b"/><text x={p[0]} y={p[1]-3} textAnchor="middle" fill="#352217" className="painted-country-name" fontSize={font} fontWeight="normal">{title}</text></g>;})}
   {nodes.map(m=>{const siblings=nodes.filter(n=>n.nation===m.nation),index=siblings.findIndex(n=>n.id===m.id);const labelY=m.y+(index%2===0?27:-32),labelWidth=Math.min(184,Math.max(110,m.name.length*8+22)),labelX=Math.max(labelWidth/2+34,Math.min(1160-labelWidth/2,m.x));return <g key={m.id} className="painted-location" role="button" tabIndex={0} aria-label={`${m.name} · ${live(m.id)?'เล่นได้':'อยู่ในแผน'}`} aria-pressed={selected===m.id} onClick={()=>choose(m.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(m.id);}}} opacity={nation==='all'||m.nation===nation||m.nation==='global'?1:.3}>
     <circle cx={m.x} cy={m.y} r="20" fill="transparent"/>
     <circle cx={m.x} cy={m.y} r={selected===m.id?10:7} fill={live(m.id)?'#d6b467':'#17332c'} stroke={selected===m.id?'#ffdf91':'#e5c582'} strokeWidth={selected===m.id?4:2}/>
     {(showNames||(selected===m.id&&viewSize.w>=600))&&<><path d={`M${m.x},${m.y} L${labelX},${labelY}`} stroke="#bda679" strokeWidth="1"/>
     <rect x={labelX-labelWidth/2} y={labelY-13} width={labelWidth} height="26" rx="4" fill={selected===m.id?'#d6b467':'#0d2020'} stroke={live(m.id)?'#e1bc72':'#77908a'} strokeDasharray={live(m.id)?undefined:'4 3'}/>
     <text x={labelX} y={labelY+5} textAnchor="middle" fill={selected===m.id?'#142421':'#fff1ce'} fontWeight="600" fontSize="18">{m.name}</text></>}
   </g>;})}
  </svg></div>
  <div className="painted-selection"><strong>{node.name}</strong><span>{live(selected)?'เล่นได้':'อยู่ในแผน'}</span><button type="button" onClick={()=>setDetailOpen(true)}>ดูรายละเอียด</button></div>
  {(!embedded||detailOpen)&&<section className="painted-detail" ref={detailPanel} aria-label="รายละเอียดแมพ" aria-live="polite">
   {embedded&&<button className="painted-detail-close" type="button" onClick={()=>setDetailOpen(false)}>ปิดรายละเอียด</button>}
   <div className="painted-thumb" aria-hidden="true"><svg viewBox={`${node.x-100} ${node.y-65} 200 130`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><image href="/assets/world-atlas/art-01/terrain.png" width="1200" height="780" preserveAspectRatio="none"/></svg></div>
   <div><p className="painted-eyebrow">{country?.name??'ศูนย์กลางร่วม'} · {live(selected)?'เล่นได้ในเกม':'แผนระยะ '+node.phase}</p><h2>{node.name}</h2><p>Lv.{node.levels.join('–')} <small>(ช่วงเลเวลเสนอ ยังไม่ใช่สมดุลที่ยืนยัน)</small></p><p>{info.climate} · {country?.theme??'ศูนย์รวมหมอผีทั้ง12ประเทศ'}</p><dl><dt>จุดเด่น</dt><dd>{info.landmark}</dd><dt>กิจกรรม</dt><dd>{info.activities}</dd><dt>มอนสเตอร์ที่มีจริง</dt><dd>{info.residents.join(' · ')||(live(selected)?'ไม่มีมอนสเตอร์ในแมพนี้':'ยังไม่มีมอนสเตอร์ที่เล่นได้ (อยู่ในแผน)')}</dd>{info.proposedResidents.length>0&&<><dt>มอนสเตอร์ในข้อเสนอ</dt><dd>{info.proposedResidents.join(' · ')} (ยังไม่ยืนยัน)</dd></>}{info.npcs.length>0&&<><dt>NPC</dt><dd>{info.npcs.join(' · ')}</dd></>}</dl></div>
   <div className="painted-connections"><h3>เส้นทางเชื่อม</h3>{info.connections.map(c=><button key={c.id} type="button" onClick={()=>choose(c.id)}>{nodes.find(n=>n.id===c.id)?.name}<span>{c.status==='live'?'เชื่อมจริง':'เส้นทางในแผน'}</span></button>)}<small>ปุ่มนี้เปิดข้อมูล ไม่ได้วาร์ป</small><button type="button" onClick={overview}>กลับไปดูแผนโลก</button></div>
  </section>}
  <details className="painted-list" hidden={embedded}><summary>รายชื่อครบ 30 แมพและลำดับพัฒนา</summary><div>{atlas.nations.map(n=><section key={n.id}><h3>{n.name}</h3>{nodes.filter(m=>m.nation===n.id).map(m=><button type="button" key={m.id} onClick={()=>choose(m.id)}>{m.name} · {live(m.id)?'เล่นได้':'ระยะ '+m.phase}</button>)}</section>)}<section><h3>ศูนย์กลางและปลายทางร่วม</h3>{nodes.filter(m=>m.nation==='global').map(m=><button key={m.id} type="button" onClick={()=>{setNation('all');choose(m.id);}}>{m.name}</button>)}</section></div></details>
 </main>;
}
