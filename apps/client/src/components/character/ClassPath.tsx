import { SAMPLE_CLASS_PATH } from '@/game-data/sample-character';
import { useCharacterStore } from '@/stores/character-store';

/** Class progression as written in the skill database. Change-job conditions are not designed, so nothing here is actionable. */
export function ClassPath() {
  const jobLevel = useCharacterStore((s) => s.sheet.jobLevel);
  const p = SAMPLE_CLASS_PATH;
  return (
    <section className="sk-frame-10 sk-panel ch-path" aria-label="เส้นทางอาชีพ">
      <h4>เส้นทางอาชีพ <small className="sk-muted">Class path · {p.nation.th}</small></h4>
      <ol>
        <li data-state="current">
          <span className="ch-path-tier">๑</span>
          <div><b>{p.current.en}</b> <span className="sk-muted">{p.current.tier} · Job Lv. {jobLevel} · {p.current.skills} สกิล</span></div>
        </li>
        <li data-state="locked">
          <span className="ch-path-tier">๒</span>
          <div>
            <div className="sk-muted">เลือก 1 สาย (10 สกิล) แล้วต่ออาชีพที่ ๓ (5 สกิล) · เงื่อนไขเปลี่ยนอาชีพยังไม่ได้ออกแบบ</div>
            {p.branches.map((b) => <div key={b.id} className="ch-branch"><b>{b.th}</b> <span className="sk-muted">{b.en} → {b.third}</span></div>)}
          </div>
        </li>
      </ol>
    </section>
  );
}
