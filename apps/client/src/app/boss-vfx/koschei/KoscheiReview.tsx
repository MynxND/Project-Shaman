'use client';
import { useEffect, useRef, useState } from 'react';
import { FACINGS, KOSCHEI_SKILLS, type KoscheiSkill } from '@shaman/shared';
import type { KoscheiPreviewControl } from '../../../game/vfx/boss/KoscheiPreview';
export default function KoscheiReview() {
  const host = useRef<HTMLDivElement>(null), control = useRef<KoscheiPreviewControl>({ skill: 'gravefrost-spear', facing: 'south', paused: false, speed: 1, restart: 0, seek: 0, zoom:1 });
  const [status, setStatus] = useState('กำลังโหลด…'), [paused, setPaused] = useState(false), [skill, setSkill] = useState('gravefrost-spear'), [seek,setSeek]=useState(0);
  useEffect(() => { let gone = false, game: { destroy(remove: boolean): void } | undefined; void import('../../../game/vfx/boss/KoscheiPreview').then(m => { if (!gone && host.current) game = m.createKoscheiPreview(host.current, () => control.current, setStatus); }); return () => { gone = true; game?.destroy(true); }; }, []);
  return <main style={{ minHeight: '100dvh', background: '#10211e', color: '#e8d7ae', padding: 16, fontFamily: 'Tahoma,sans-serif' }}>
    <style>{`.kos-review button,.kos-review select{min-height:44px;background:#213b32;color:#f2deaf;border:1px solid #877349;padding:8px;font:inherit}.kos-review a{color:#e4c17e}`}</style>
    <div className="kos-review"><h1 style={{ fontSize: 24 }}>คอชเชย์ · สุสานซ่อนมรณะ</h1>
      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select aria-label="สกิล Koschei" onChange={e => { control.current.skill = e.target.value as KoscheiSkill; setSkill(e.target.value); control.current.seek=0;setSeek(0);control.current.restart++; }}>{Object.entries(KOSCHEI_SKILLS).map(([id, s]) => <option key={id} value={id}>ระยะ {s.phase} · {s.name}</option>)}</select>
        <select aria-label="ทิศ Koschei" defaultValue="south" onChange={e => { control.current.facing = e.target.value; }}>{FACINGS.map(f => <option key={f}>{f}</option>)}</select>
        <button onClick={() => { control.current.paused = !paused; setPaused(!paused); }}>{paused ? 'เล่นต่อ' : 'หยุดภาพ'}</button>
        <button onClick={() => {control.current.seek=0;setSeek(0);control.current.restart++;}}>เริ่มใหม่</button>
        <select aria-label="ความเร็ว" defaultValue="1" onChange={e => { control.current.speed = Number(e.target.value); }}><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1">1×</option></select>
        <select aria-label="ซูมพรีวิว" defaultValue="1" onChange={e=>{control.current.zoom=Number(e.target.value);}}><option value="1">ภาพรวม</option><option value="1.5">ซูม 1.5×</option><option value="2">ซูม 2×</option></select>
        <a href="/?map=frozen-necropolis&koscheiReview=1">เข้าต่อสู้ในเกมจริง</a>
      </nav>
      <label>เวลา <input aria-label="เวลา preview" type="range" value={seek} min="0" max={skill==='the-last-needle'?38000:skill==='soul-severance'?9000:7000} step="20" onChange={e => { control.current.seek = Number(e.target.value);setSeek(Number(e.target.value)); control.current.paused = true; setPaused(true); }} /></label>
      <div ref={host} style={{ height: 'min(68dvh,700px)', minHeight: 280, width: '100%', marginTop: 12, border: '1px solid #74613e' }} />
      <output style={{ display: 'block', fontSize: 12, overflowWrap: 'anywhere' }}>{status}</output>
      <p>เล่นซ้ำ 88 คลิปจาก CombatSystem จริง · 11 ท่า × 8 ทิศ · ความละเอียด 50ms · ทดสอบการหลบและแก้มนตร์ในเกมจริง · การอนุมัติภาพยังรอผู้ใช้</p>
    </div>
  </main>;
}
