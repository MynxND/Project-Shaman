'use client';
import { useEffect, useState } from 'react';
import { NATION_BRANCHES } from '@shaman/shared';
import { jobTitle, NATION_TH } from '@/game-data/skill-catalog';
import { useProfileStore } from '@/stores/profile-store';

// Admin tools (server: GameRoom admin:*): instant job change to any branch and tier, Base Level, skill points and a
// full heal. Shown only when the server says this session is an admin (development, or SHAMAN_ADMINS in production);
// the server re-checks every request, so hiding the panel is convenience, not security.
export function AdminPanel() {
  const admin = useProfileStore((s) => s.admin);
  const profile = useProfileStore((s) => s.profile);
  const send = useProfileStore((s) => s.send);
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<2 | 3>(2);
  const [level, setLevel] = useState(60);
  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!admin || !profile || !send) return null;
  const nations = [...new Set(NATION_BRANCHES.map((b) => b.nation))];
  const current = jobTitle(profile);
  return (
    <div className="hud-admin">
      <button className="hud-mini-btn hud-admin-toggle" onClick={() => setOpen(!open)} aria-expanded={open} title="เครื่องมือแอดมิน">แอด</button>
      {open && (
        <div className="hud-panel hud-admin-panel" role="dialog" aria-label="เครื่องมือแอดมิน">
          <div className="hud-admin-head">
            <h2>เครื่องมือแอดมิน</h2>
            <button className="hud-mini-btn" onClick={() => setOpen(false)} aria-label="ปิดเครื่องมือแอดมิน" title="ปิด (Esc)">✕</button>
          </div>
          <p className="hud-admin-now">ตอนนี้: {current.th} · ขั้น {profile.jobTier} · Base Lv {profile.level} · แต้มสกิล {profile.skillPoints}</p>
          <div className="hud-admin-row">
            <span>ขั้นอาชีพ</span>
            {([2, 3] as const).map((t) => <button key={t} className={tier === t ? 'on' : ''} onClick={() => setTier(t)}>ขั้น {t}</button>)}
            <button onClick={() => send('admin:job', { branch: null, tier: 1 })}>กลับเป็น Medium</button>
          </div>
          {nations.map((n) => (
            <div key={n} className="hud-admin-row">
              <span>{NATION_TH[n] ?? n}</span>
              {NATION_BRANCHES.filter((b) => b.nation === n).map((b) => (
                <button key={b.branch} className={profile.branch === b.branch && profile.jobTier === tier ? 'on' : ''}
                  onClick={() => send('admin:job', { branch: b.branch, tier })} title={b.info.name}>
                  {tier === 3 ? b.info.tier3 : b.info.thai}
                </button>
              ))}
            </div>
          ))}
          <div className="hud-admin-row">
            <span>Base Lv</span>
            <input type="number" min={1} max={99} value={level} onChange={(e) => setLevel(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
            <button onClick={() => send('admin:stats', { level })}>ตั้งเลเวล</button>
            <button onClick={() => send('admin:stats', { skillPoints: 20 })}>+20 แต้มสกิล</button>
            <button onClick={() => send('admin:stats', { heal: true })}>ฟื้น HP/SP</button>
          </div>
        </div>
      )}
    </div>
  );
}
