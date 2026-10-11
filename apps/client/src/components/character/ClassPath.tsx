import { findBranch, JOB_PROGRESSION } from '@shaman/shared';
import { SAMPLE_CLASS_PATH } from '@/game-data/sample-character';
import { useCharacterStore } from '@/stores/character-store';
import { useProfileStore } from '@/stores/profile-store';
import { openSkillTree } from '@/components/hud/windows';

/** Class progression from the server profile (job-progression.ts); the sample path only shows while offline. */
export function ClassPath() {
  const profile = useProfileStore((s) => s.profile);
  const sampleJob = useCharacterStore((s) => s.sheet.jobLevel);
  if (!profile) {
    const p = SAMPLE_CLASS_PATH;
    return (
      <section className="sk-frame-10 sk-panel ch-path" aria-label="เส้นทางอาชีพ">
        <h4>เส้นทางอาชีพ <small className="sk-muted">ตัวอย่าง · ยังไม่เชื่อมเซิร์ฟเวอร์</small></h4>
        <ol><li data-state="current"><span className="ch-path-tier">๑</span><div><b>{p.current.en}</b> <span className="sk-muted">Job Lv. {sampleJob}</span></div></li></ol>
      </section>
    );
  }
  const branch = profile.branch ? findBranch(profile.branch) : undefined;
  const tiers = [
    { tier: 1, name: 'ร่างทรงฝึกหัด · Apprentice Shaman', detail: 'สกิล Medium 10 สกิล' },
    { tier: 2, name: branch ? `${branch.info.thai} · ${branch.info.name}` : 'สายวิชาของชาติ (เลือก 1 จาก 10 สาย)', detail: `ปลดที่ Job Lv ${JOB_PROGRESSION.advanceAt[1]} + บททดสอบร่างทรงฝึกหัด` },
    { tier: 3, name: branch ? branch.info.tier3 : 'อาชีพขั้นสูงของสาย', detail: `ปลดที่ Job Lv ${JOB_PROGRESSION.advanceAt[2]} ของขั้น ๒ + บททดสอบประจำสาย` },
  ];
  return (
    <section className="sk-frame-10 sk-panel ch-path" aria-label="เส้นทางอาชีพ">
      <h4>เส้นทางอาชีพ <small className="sk-muted">Base Lv {profile.level} · Job Lv {profile.jobLevel} · แต้มสกิล {profile.skillPoints}</small></h4>
      <ol>
        {tiers.map((t) => (
          <li key={t.tier} data-state={t.tier === profile.jobTier ? 'current' : t.tier < profile.jobTier ? 'done' : 'locked'}>
            <span className="ch-path-tier">{['๑', '๒', '๓'][t.tier - 1]}</span>
            <div><b>{t.name}</b> <span className="sk-muted">{t.tier === profile.jobTier ? `กำลังฝึก · Job Lv ${profile.jobLevel}` : t.tier < profile.jobTier ? 'ผ่านแล้ว' : t.detail}</span></div>
          </li>
        ))}
      </ol>
      <button type="button" className="sk-link" onClick={openSkillTree}>เปิดคัมภีร์สกิล (K)</button>
    </section>
  );
}
