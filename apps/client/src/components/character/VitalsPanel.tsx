import { ProgressBar } from '@/components/ui-kit';
import { SAMPLE_CLASS_PATH } from '@/game-data/sample-character';
import { jobTitle, NATION_TH } from '@/game-data/skill-catalog';
import { usePlayerName } from '@/stores/account-store';
import { useCharacterStore } from '@/stores/character-store';
import { useProfileStore } from '@/stores/profile-store';
import { expToNext, findBranch, JOB_PROGRESSION, jobExpToNext } from '@shaman/shared';

const pct = (v: { current: number; next: number }) => `${v.next > 0 ? ((v.current / v.next) * 100).toFixed(1) : '100.0'}%`;

/** Name plate, levels and HP/SP/EXP — the heading of the spirit record. Server profile when connected, sample offline. */
export function VitalsPanel() {
  const sample = useCharacterStore((st) => st.sheet);
  const profile = useProfileStore((st) => st.profile);
  const name = usePlayerName();
  let s = sample;
  let classLine = `${SAMPLE_CLASS_PATH.current.en} · ${SAMPLE_CLASS_PATH.current.th} · ${SAMPLE_CLASS_PATH.nation.th}`;
  if (profile) {
    const maxJob = JOB_PROGRESSION.maxJobLevel[profile.jobTier];
    const jobNext = profile.jobLevel >= maxJob ? 0 : jobExpToNext(profile.jobTier, profile.jobLevel);
    s = { ...sample, name, baseLevel: profile.level, jobLevel: profile.jobLevel,
      hp: { current: profile.hp, max: profile.hpMax }, sp: { current: profile.sp, max: profile.spMax },
      baseExp: { current: profile.exp, next: expToNext(profile.level) }, jobExp: { current: profile.jobExp, next: jobNext } };
    const title = jobTitle(profile);
    const branch = profile.branch ? findBranch(profile.branch) : undefined;
    classLine = [title.th, title.en, branch ? `ประเทศ${NATION_TH[branch.nation] ?? ''}` : 'ยังไม่เลือกประเทศ'].join(' · ');
  }
  return (
    <section className="sk-frame-10 sk-panel ch-vitals" aria-label="ระดับและพลังชีวิต">
      <div className="ch-nameplate">
        <div className="ch-seal" aria-label={`Base Level ${s.baseLevel}`}><small>Lv</small>{s.baseLevel}</div>
        <div>
          <h4>{s.name}</h4>
          <div className="sk-muted">{classLine}</div>
        </div>
      </div>
      <div className="ch-levels">
        <div><span className="sk-muted">Base Lv.</span><b>{s.baseLevel}</b></div>
        <div><span className="sk-muted">Job Lv.</span><b>{s.jobLevel}</b></div>
      </div>
      <dl className="ch-bars">
        <dt>HP</dt><dd><ProgressBar label="HP" value={s.hp.current} max={s.hp.max} color="var(--sk-crimson)" /></dd>
        <dt>SP</dt><dd><ProgressBar label="SP" value={s.sp.current} max={s.sp.max} color="var(--sk-jade)" /></dd>
        <dt>Base<small>{pct(s.baseExp)}</small></dt><dd><ProgressBar label="Base EXP" value={s.baseExp.current} max={Math.max(1, s.baseExp.next)} color="var(--sk-bronze)" /></dd>
        <dt>Job<small>{pct(s.jobExp)}</small></dt><dd><ProgressBar label="Job EXP" value={s.jobExp.next > 0 ? s.jobExp.current : 1} max={Math.max(1, s.jobExp.next)} color="#c9a86a" /></dd>
      </dl>
    </section>
  );
}
