import { ProgressBar } from '@/components/ui-kit';
import { SAMPLE_CLASS_PATH } from '@/game-data/sample-character';
import { useCharacterStore } from '@/stores/character-store';
import { useProfileStore } from '@/stores/profile-store';
import { expToNext } from '@shaman/shared';

const pct = (v: { current: number; next: number }) => `${((v.current / v.next) * 100).toFixed(1)}%`;

/** Name plate, levels and HP/SP/EXP — the heading of the spirit record. */
export function VitalsPanel() {
  const sample = useCharacterStore((st) => st.sheet);
  const profile = useProfileStore((st) => st.profile);
  const s = profile ? { ...sample, baseLevel:profile.level, hp:{current:profile.hp,max:profile.hpMax}, sp:{current:profile.sp,max:profile.spMax}, baseExp:{current:profile.exp,next:expToNext(profile.level)} } : sample;
  return (
    <section className="sk-frame-10 sk-panel ch-vitals" aria-label="ระดับและพลังชีวิต">
      <div className="ch-nameplate">
        <div className="ch-seal" aria-label={`Base Level ${s.baseLevel}`}><small>Lv</small>{s.baseLevel}</div>
        <div>
          <h4>{s.name}</h4>
          <div className="sk-muted">{SAMPLE_CLASS_PATH.current.en} · {SAMPLE_CLASS_PATH.current.th} · {SAMPLE_CLASS_PATH.nation.th}</div>
        </div>
      </div>
      <div className="ch-levels">
        <div><span className="sk-muted">Base Lv.</span><b>{s.baseLevel}</b></div>
        <div><span className="sk-muted">Job Lv. {profile && '(ตัวอย่าง)'}</span><b>{s.jobLevel}</b></div>
      </div>
      <dl className="ch-bars">
        <dt>HP</dt><dd><ProgressBar label="HP" value={s.hp.current} max={s.hp.max} color="var(--sk-crimson)" /></dd>
        <dt>SP</dt><dd><ProgressBar label="SP" value={s.sp.current} max={s.sp.max} color="var(--sk-jade)" /></dd>
        <dt>Base<small>{pct(s.baseExp)}</small></dt><dd><ProgressBar label="Base EXP" value={s.baseExp.current} max={s.baseExp.next} color="var(--sk-bronze)" /></dd>
        <dt>Job<small>{pct(s.jobExp)}</small></dt><dd><ProgressBar label="Job EXP" value={s.jobExp.current} max={s.jobExp.next} color="#c9a86a" /></dd>
      </dl>
    </section>
  );
}
