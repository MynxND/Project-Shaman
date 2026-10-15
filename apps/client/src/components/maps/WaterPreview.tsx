'use client';
import {useEffect,useRef,useState} from 'react';
import {MAPS} from '@shaman/shared';
import {waterDefaults,type WaterMode} from '@/game/world/water-model';
import type {WaterPreviewControls,WaterPreviewReport} from './water-preview-scene';
import './water-preview.css';
const initial:WaterPreviewReport={ready:false,seconds:0,fps:0,waterPixels:0,mapId:'umbral-capital',zoom:1,viewW:0,viewH:0,covered:true,renderer:''};
export function WaterPreview(){
 const host=useRef<HTMLDivElement>(null),controls=useRef<WaterPreviewControls>({...waterDefaults(),mapId:'umbral-capital',mode:'river',zoom:1.5,panX:0,panY:0,fallback:false});
 const [state,setState]=useState({...controls.current}),[report,setReport]=useState(initial),[error,setError]=useState('');
 const change=(patch:Partial<WaterPreviewControls>)=>{Object.assign(controls.current,patch);setState({...controls.current});};
 useEffect(()=>{let disposed=false;let runtime:{destroy:()=>void}|undefined;controls.current.fallback=new URLSearchParams(location.search).get('renderer')==='canvas';void import('./water-preview-scene').then(({createWaterPreview})=>{if(!disposed&&host.current)runtime=createWaterPreview(host.current,controls.current,r=>{if(!disposed)setReport(r);});}).catch(e=>{if(!disposed)setError(String(e));});return()=>{disposed=true;runtime?.destroy();};},[]);
 return <main className="water-review"><header><h1>น้ำเคลื่อนไหว · Phaser ในเกม</h1><p>ใช้ MapRenderer และ WaterLayer จริง · หน้าตรวจภาพ ไม่ใช่ห้องต่อสู้ · ขอบชนและแมพเดิม</p><a href="/?villageReview=overview">กลับไปดูแมพในเกม</a></header>
 <div className="water-layout"><aside aria-label="เครื่องมือตรวจน้ำ">
 <label>แมพ<select value={state.mapId} onChange={e=>change({mapId:e.target.value})}>{Object.values(MAPS).map(m=><option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></label>
 <label>ชนิดน้ำ<select value={state.mode} onChange={e=>change({mode:e.target.value as WaterMode|'map',panX:0,panY:0})}><option value="river">น้ำไหล</option><option value="pond">บ่อน้ำ</option><option value="swamp">หนองน้ำคำสาป</option><option value="waterfall">น้ำตก · artwork เดิมสำหรับตรวจ</option><option value="map">ตามพื้นที่แมพจริง</option></select></label>
 <label>ความเร็ว<input type="number" min="0" max="4" step=".25" value={state.speed} onChange={e=>change({speed:Math.max(0,Number(e.target.value))})}/></label>
 <label>ความแรงระลอก<input type="number" min="0" max="1" step=".1" value={state.ripple} onChange={e=>change({ripple:Math.max(0,Math.min(1,Number(e.target.value)))})}/></label>
 <label>สีผิวน้ำ<input type="color" defaultValue="#1a3d40" onChange={e=>{const v=e.target.value;change({color:[parseInt(v.slice(1,3),16)/255,parseInt(v.slice(3,5),16)/255,parseInt(v.slice(5,7),16)/255]});}}/></label>
 <label>ทิศไหล<select defaultValue="map" onChange={e=>change({flow:({'map':[0,0],'down':[0,1],'right':[1,0],'up':[0,-1],'left':[-1,0]} as Record<string,[number,number]>)[e.target.value]!})}><option value="map">ตามแนวคลอง</option><option value="down">ลง</option><option value="right">ขวา</option><option value="up">ขึ้น</option><option value="left">ซ้าย</option></select></label>
 <label><input type="checkbox" checked={state.shore} onChange={e=>change({shore:e.target.checked})}/>เอฟเฟกต์ขอบน้ำ</label>
 <button aria-pressed={state.paused} onClick={()=>change({paused:!state.paused})}>{state.paused?'เล่นต่อ':'หยุดน้ำ'}</button>
 <button onClick={()=>change({paused:true,step:controls.current.step+.125})}>เลื่อนเวลา 0.125 วินาที</button>
 <button aria-pressed={state.before} onClick={()=>change({before:!state.before})}>{state.before?'ดูหลังปรับ':'ดูก่อนปรับ'}</button>
 <label>ซูม<input type="number" min=".01" max="3" step=".25" value={state.zoom} onChange={e=>change({zoom:Math.max(.01,Number(e.target.value))})}/></label>
 <div className="water-pan">{[['←',-3,0],['↑',0,-3],['↓',0,3],['→',3,0]].map(([label,x,y])=><button key={String(label)} aria-label={'เลื่อนกล้อง '+label} onClick={()=>change({panX:state.panX+Number(x),panY:state.panY+Number(y)})}>{label}</button>)}</div>
 <output aria-live="off" data-water-map={report.mapId} data-water-time={report.seconds.toFixed(3)} data-water-fps={report.fps.toFixed(1)} data-water-covered={report.covered} data-water-zoom={report.zoom}>{report.ready?`${report.renderer} · ${report.fps.toFixed(1)} FPS · เวลา ${report.seconds.toFixed(3)} s · น้ำ ${report.waterPixels} pixels · ${report.covered?'กล้องอยู่ในแมพ':'กล้องเกินขอบ'}`:'กำลังโหลด Phaser…'}</output>
 <p>น้ำตกเป็นการตรวจ asset แนวตั้งเดิม ไม่ได้เพิ่มน้ำตกหรือเปลี่ยนทางเดินในเกม</p>
 </aside><div ref={host} className="water-stage" role="region" aria-label="ภาพน้ำจาก renderer เกม"/>
 </div>{error&&<p role="alert">{error}</p>}</main>;
}
