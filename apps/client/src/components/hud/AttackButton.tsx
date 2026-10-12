'use client';
import { useEffect, useRef } from 'react';
import { engageTarget } from '@/game/runtime/local-player';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';

// Basic attack: its own large button in the bottom-right corner, apart from the skills (desktop: bottom-right with the
// Q key; touch: the right-thumb corner, with the skill arc around it). It attacks the selected monster, else the
// nearest living one (the scene walks into reach; the server decides every hit).
export function AttackButton({ touch }: { touch: boolean }) {
  const profile = useProfileStore((s) => s.profile);
  const notify = useHudStore((s) => s.notify);
  const attack = () => {
    if (!profile) { notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (!engageTarget()) notify('ไม่มีมอนสเตอร์อยู่ใกล้ ๆ', 'info');
  };
  const latest = useRef(attack);
  latest.current = attack;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.code !== 'KeyQ') return;
      e.preventDefault();
      latest.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <button type="button" className="hud-attack-big pointer-events-auto" data-touch={touch} data-disabled={!profile} onClick={attack}
      aria-label="โจมตีปกติ (Q)" aria-keyshortcuts="Q" title="โจมตีปกติ · เป้าที่เลือก หรือมอนสเตอร์ที่ใกล้ที่สุด (Q)">
      <img className="hud-attack-icon sk-pixel" src="/assets/ui/skill-book/cat-attack.png" alt="" draggable={false} />
      <img className="hud-attack-ring sk-pixel" src="/assets/ui/v2/frame/skill.png" alt="" draggable={false} />
      <span className="hud-attack-label">โจมตี</span>
      {!touch && <span className="hud-attack-key">Q</span>}
    </button>
  );
}
