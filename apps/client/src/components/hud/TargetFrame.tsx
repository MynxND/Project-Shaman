'use client';
import { useEffect, useState } from 'react';
import { MONSTERS } from '@shaman/shared';
import { ProgressBar } from '@/components/ui-kit';
import { readMonster, type MonsterSnapshot } from '@/game/runtime/local-player';
import { useTargetStore } from '@/stores/target-store';

/** The selected monster: name, level and HP (polled from the scene; the server owns the numbers). */
export function TargetFrame() {
  const targetId = useTargetStore((s) => s.targetId);
  const select = useTargetStore((s) => s.select);
  const [snap, setSnap] = useState<MonsterSnapshot | null>(null);
  useEffect(() => {
    if (!targetId) { setSnap(null); return; }
    const tick = () => setSnap(readMonster(targetId));
    tick();
    const timer = window.setInterval(tick, 120);
    return () => window.clearInterval(timer);
  }, [targetId]);
  if (!targetId || !snap) return null;
  const def = MONSTERS[snap.kind];
  return (
    <section className="hud-panel hud-target pointer-events-auto" aria-label="เป้าหมาย">
      <div className="hud-target-head">
        <b>{def?.name.th ?? snap.kind}</b>
        <small>Lv. {def?.level ?? '?'} · {def?.behavior === 'passive' ? 'ไม่โจมตีก่อน' : 'ดุร้าย'}</small>
        <button type="button" className="hud-mini-btn" onClick={() => select(null)} aria-label="ยกเลิกเป้าหมาย">×</button>
      </div>
      <ProgressBar label="HP เป้าหมาย" value={snap.dead ? 0 : snap.hp} max={snap.hpMax} color="var(--sk-crimson)" />
    </section>
  );
}
