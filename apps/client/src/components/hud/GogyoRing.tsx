import { GOGYO_THAI, GOGYO_TINT, heldSpell, NATION_SKILL_INDEX, spellKind } from '@shaman/shared';
import { useProfileStore } from '@/stores/profile-store';
import { useRuneStore } from '@/stores/rune-store';

// Onmyoji talisman ring (synced from the server): the held elements, oldest first, and the spell Invoke would cast.
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const KIND_TH = { creation: 'คาถาสร้าง', destruction: 'คาถาทำลาย', shikigami: 'ชิกิงามิ' } as const;

export function GogyoRing() {
  const held = useRuneStore((s) => s.held);
  const profile = useProfileStore((s) => s.profile);
  if (profile?.branch !== 'onmyoji') return null;
  const spell = heldSpell(held), info = spell ? NATION_SKILL_INDEX[spell] : undefined, kind = spell ? spellKind(spell) : null;
  return (
    <section className="hud-gogyo pointer-events-auto" aria-label="ยันต์ที่ถือ">
      <ol>
        {held.length ? held.map((e, i) => <li key={i} style={{ borderColor: hex(GOGYO_TINT[e]), color: hex(GOGYO_TINT[e]) }} title={`ยันต์${GOGYO_THAI[e]}`}>{GOGYO_THAI[e]}</li>)
          : <li className="hud-gogyo-empty">ยังไม่ได้จารยันต์</li>}
      </ol>
      <small>{info && kind ? `Invoke → ${info.thaiName} · ${KIND_TH[kind]}` : 'จารยันต์ 2 ใบแล้วกด Invoke'}</small>
    </section>
  );
}
