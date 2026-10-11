'use client';
import { useState } from 'react';
import './rig-lab.css';

/** Explicit review harness: resizing the same iframe exercises a real CSS viewport without remounting its game. */
export function ResponsiveRigReview() {
  const [portrait, setPortrait] = useState(true);
  const [world, setWorld] = useState(false);
  const width = portrait ? 390 : 844, height = portrait ? 844 : 390;
  return <main className="rig-lab">
    <a href="/characters">← กลับหน้าตัวละคร</a>
    <h1>ตรวจหน้าจอมือถือ</h1>
    <p>กรอบจำลอง viewport ในเบราว์เซอร์ · การเปลี่ยนแนวใช้หน้าเดิม · ยังไม่ใช่การทดสอบเครื่องจริง</p>
    <div className="rig-lab-controls">
      <button onClick={() => setPortrait(true)} aria-pressed={portrait}>แนวตั้ง 390×844</button>
      <button onClick={() => setPortrait(false)} aria-pressed={!portrait}>แนวนอน 844×390</button>
      <label>หน้าที่ตรวจ<select value={world ? 'world' : 'rig'} onChange={e => setWorld(e.target.value === 'world')}><option value="rig">ตัวละครและอุปกรณ์</option><option value="world">เกมจริง · session ทดสอบใหม่</option></select></label>
    </div>
    <p>{width} × {height}</p>
    <iframe title="หน้าจอมือถือสำหรับตรวจงาน" src={world ? '/' : '/characters'} width={width} height={height} style={{ display:'block', border:'1px solid #d6b46c', marginTop:12 }} />
  </main>;
}
