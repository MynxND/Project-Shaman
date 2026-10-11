import { useState } from 'react';
import { NORSE_RUNES, RUNE_ART, RUNE_TH, type NorseRune } from '@shaman/shared';
import { useProfileStore } from '@/stores/profile-store';
import { useRuneStore } from '@/stores/rune-store';

// Rune Seer queue (Rune Cast): the server's queue, front rune first. During Cast the Lots the three front runes can be
// reordered (tap two to swap); with Rune Mastery the front rune can be changed once every 10 s. The server validates.
const art = (r: NorseRune) => `/assets/skills/norway-v1/${RUNE_ART[r]}.png`;

export function RuneQueue() {
  const { runes, statuses } = useRuneStore();
  const profile = useProfileStore((s) => s.profile);
  const send = useProfileStore((s) => s.send);
  const [picked, setPicked] = useState<number | null>(null);
  if (!runes.length || profile?.branch !== 'rune-seer') return null;
  const lots = statuses.includes('cast-the-lots');
  const mastery = (profile.skills['rune-mastery'] ?? 0) > 0;
  const tap = (i: number) => {
    if (!lots || i > 2 || !send) return;
    if (picked === null) { setPicked(i); return; }
    const order = [0, 1, 2];
    [order[picked], order[i]] = [order[i]!, order[picked]!];
    send('rune:order', { order });
    setPicked(null);
  };
  return (
    <section className="hud-runes pointer-events-auto" aria-label="คิวรูน">
      <small>{lots ? 'ทอยรูน: แตะ 2 อันเพื่อสลับ' : 'คิวรูน · เวทถัดไปกินอันซ้ายสุด'}</small>
      <ol>
        {runes.map((r, i) => (
          <li key={i}>
            <button type="button" className="hud-rune" data-front={i === 0} data-picked={picked === i} disabled={!lots || i > 2}
              title={`${i === 0 ? 'รูนหน้าสุด · ' : ''}${RUNE_TH[r]}`} aria-label={`${i + 1}. ${RUNE_TH[r]}`} onClick={() => tap(i)}>
              <img className="sk-pixel" src={art(r)} alt="" width={24} height={32} />
            </button>
          </li>
        ))}
      </ol>
      {mastery && send && <div className="hud-rune-set" aria-label="ชำนาญรูน: เปลี่ยนรูนหน้าสุด">
        {NORSE_RUNES.map((r) => <button key={r} type="button" title={`เปลี่ยนรูนหน้าสุดเป็น ${RUNE_TH[r]} (ทุก 10 วินาที)`} onClick={() => send('rune:set', { rune: r })}>
          <img className="sk-pixel" src={art(r)} alt={RUNE_TH[r]} width={12} height={16} />
        </button>)}
      </div>}
    </section>
  );
}
