import { QUESTS } from '@shaman/shared';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';
import { RoundButton } from './RoundButton';

/** Quest tracker: the player's quests from the server profile (accepted at หลวงตาธรรม in front of the temple). */
export function QuestTracker() {
  const open = useHudStore((s) => s.questOpen);
  const toggle = useHudStore((s) => s.toggleQuest);
  const quests = useProfileStore((s) => s.profile?.quests);
  if (!open) return <RoundButton className="hud-quest hud-fold" icon="/assets/ui/hud/fold/quest.png" label="เปิดเควสต์" onClick={toggle} />;
  const active = Object.entries(quests ?? {}).filter(([, p]) => !p.done);
  return (
    <section className="hud-panel hud-quest pointer-events-auto" aria-label="ติดตามเควสต์">
      <header>
        <h2>เควสต์</h2>
        <button type="button" className="hud-mini-btn" onClick={toggle} aria-expanded="true" aria-label="ย่อเควสต์เป็นไอคอน">▾</button>
      </header>
      {active.length === 0
        ? <small>{quests === undefined ? 'ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์' : 'ไม่มีภารกิจ · คุยกับหลวงตาธรรมหน้าวิหาร (!)'}</small>
        : active.map(([id, p]) => {
          const q = QUESTS[id];
          if (!q) return null;
          return (
            <div key={id}>
              <b>{q.title}</b>
              <ul>{q.steps.map((st, i) => <li key={i} data-done={p.step > i}>{p.step > i ? '✓' : '◇'} {st.label}{st.kind === 'kill' && p.step === i ? ` ${p.count ?? 0}/${st.count}` : ''}</li>)}</ul>
            </div>
          );
        })}
    </section>
  );
}
