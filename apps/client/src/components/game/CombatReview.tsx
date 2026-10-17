'use client';
import { useEffect, useRef, useState } from 'react';
import { NATION_BRANCHES, SKILL_TREE, type PlayerProfile } from '@shaman/shared';
import { useAccountStore } from '@/stores/account-store';
import { useProfileStore } from '@/stores/profile-store';
import { useSkillStore } from '@/stores/skill-store';

/** Opt-in guest-only development controls. All changes still go through the real room validators. */
export default function CombatReview() {
  const [enabled, setEnabled] = useState(false);
  const [branch, setBranch] = useState(NATION_BRANCHES[0]!.branch);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const profile = useProfileStore(s => s.profile);
  const guest = useAccountStore(s => s.status === 'guest');
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setEnabled(params.get('combatReview') === '1');
    const selected = params.get('reviewBranch');
    if (NATION_BRANCHES.some(b => b.branch === selected)) setBranch(selected!);
    return () => pending.current?.();
  }, []);
  if (!enabled || !guest) return null;
  const request = (type: string, message: unknown, done: (p: PlayerProfile) => boolean) => new Promise<void>((resolve, reject) => {
    const sender = useProfileStore.getState().send;
    if (!sender) { reject(new Error('ยังไม่เชื่อมต่อ')); return; }
    const finish = (error?: Error) => { clearTimeout(timer); unsubscribe(); pending.current = null; if (error) reject(error); else resolve(); };
    const unsubscribe = useProfileStore.subscribe(s => { if (s.profile && done(s.profile)) finish(); });
    const timer = setTimeout(() => finish(new Error(`ไม่มีคำตอบ: ${type}`)), 5000);
    pending.current = () => finish(new Error('ยกเลิก QA'));
    sender(type, message);
  });
  async function prepare() {
    setBusy(true); setNote('กำลังเตรียมบน server…');
    try {
      let p = useProfileStore.getState().profile;
      if (!p) throw new Error('ยังไม่เชื่อมต่อ');
      if (p.branch && p.branch !== branch) throw new Error('เปลี่ยนสายทดสอบ: โหลดหน้าใหม่เพื่อเริ่ม guest ใหม่');
      await request('dev:level', {}, q => q.level >= 60 && q.hp === q.hpMax);
      if (p.jobTier === 1) {
        await request('dev:job', {}, q => q.jobLevel >= 10);
        await request('dev:advance', {branch}, q => q.branch === branch && q.jobTier === 2);
      }
      p = useProfileStore.getState().profile!;
      if (p.jobTier === 2) {
        await request('dev:job', {}, q => q.jobLevel >= 40);
        await request('dev:advance', {}, q => q.jobTier === 3);
      }
      for (const skill of Object.values(SKILL_TREE).filter(k => k.branch === branch)) {
        if ((useProfileStore.getState().profile?.skills[skill.id] ?? 0) > 0) continue;
        await request('skill:learn', {skillId:skill.id}, q => (q.skills[skill.id] ?? 0) > 0);
      }
      setNote('พร้อม: Tier 3 · สกิลทุกอัน Lv 1 · ตัวเลขไม่ใช่ผลบาลานซ์');
    } catch (error) { setNote(error instanceof Error ? error.message : 'เตรียมไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  const send = (type: string, message: unknown) => useProfileStore.getState().send?.(type, message);
  return <details style={{position:'absolute',top:'24%',left:8,zIndex:100,pointerEvents:'auto',maxWidth:'min(340px, 90vw)',maxHeight:'55dvh',overflow:'auto',background:'#122724ee',color:'#ece3bf',padding:8,fontSize:12,border:'1px solid #b89955'}}>
    <summary>Combat QA · guest · {profile?.branch ?? 'Medium'}</summary>
    <label>สายทดสอบ <select aria-label="สายทดสอบ" value={branch} disabled={busy} onChange={e => setBranch(e.target.value)} style={{background:'#18312e'}}>{NATION_BRANCHES.map(b => <option key={b.branch} value={b.branch}>{b.branch}</option>)}</select></label>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBlock:8}}>
      <button disabled={busy || !profile} onClick={() => void prepare()}>เตรียมสายทดสอบ</button>
      <button onClick={() => send('dev:level', {})}>ฟื้น HP/SP</button>
      <button onClick={() => send('dev:warp', {x:16,y:38})}>จุดฝึก 16,38</button>
      <button onClick={() => send('attack:stop', {})}>หยุดโจมตี</button>
    </div>
    <p role="status">{note}</p>
    <p>Base {profile?.level} · Tier {profile?.jobTier} · Points {profile?.skillPoints}</p>
    <p>Weapon: {profile?.equipment.weapon ?? 'none'}</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{Object.values(SKILL_TREE).filter(k => k.branch === profile?.branch && !k.behavior.startsWith('PASSIVE')).map(k => <button key={k.id} disabled={busy || !(profile?.skills[k.id])} onClick={() => useSkillStore.getState().cast(k.id)}>{k.name}</button>)}</div>
  </details>;
}
