'use client';
import { useEffect } from 'react';
import {
  findBranch, JOB_PROGRESSION, jobExpToNext, learnError, SERVICE_ERROR_TH, type JobTier, type PlayerProfile,
} from '@shaman/shared';
import { Button, Chip, ProgressBar, Tabs, Window } from '@/components/ui-kit';
import { inGame, isActive, jobTitle, jobTrees, skillLabel, useSkillTexts } from '@/game-data/skill-catalog';
import { useProfileStore } from '@/stores/profile-store';
import { useSkillTreeStore } from '@/stores/skill-tree-store';
import './skill-tree.css';

// Skill tree window (K): one tab per job tier (Medium · nation branch · advanced job). Learning sends 'skill:learn';
// the server checks tier, branch, points and prerequisites (job-progression.ts) and answers with the new profile.

const TIER_TH: Readonly<Record<JobTier, string>> = { 1: 'ขั้น ๑', 2: 'ขั้น ๒', 3: 'ขั้น ๓' };

export function SkillTreeWindow() {
  const { close, tier: picked, setTier } = useSkillTreeStore();
  const profile = useProfileStore((s) => s.profile);
  const learn = useProfileStore((s) => s.learn);
  const busy = useProfileStore((s) => s.busy);
  const texts = useSkillTexts();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  if (!profile) {
    return <Window labelId="skilltree-title" className="st-window sk-center-window pointer-events-auto" title="คัมภีร์สกิล" subtitle="Skill Tree" onClose={close}>
      <p className="sk-muted st-empty">ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์</p>
    </Window>;
  }
  const trees = jobTrees(profile);
  const tier = (picked && trees.some((t) => t.tier === picked) ? picked : profile.jobTier) as JobTier;
  const tree = trees.find((t) => t.tier === tier)!;
  const branch = profile.branch ? findBranch(profile.branch) : undefined;
  const title = jobTitle(profile);
  const maxJob = JOB_PROGRESSION.maxJobLevel[profile.jobTier];
  const next = profile.jobLevel >= maxJob ? 0 : jobExpToNext(profile.jobTier, profile.jobLevel);
  const tabs = trees.map((t) => ({
    id: String(t.tier) as '1' | '2' | '3',
    label: `${TIER_TH[t.tier]} ${t.tier === 1 ? 'Medium' : t.tier === 2 ? branch?.info.thai ?? '' : branch?.info.tier3 ?? ''}`,
    sub: t.unlocked ? `${t.skills.filter((k) => (profile.skills[k.id] ?? 0) > 0).length}/${t.skills.length} สกิล` : 'ยังไม่ปลดล็อก',
    icon: t.unlocked ? '✦' : '🔒',
  }));
  return (
    <Window labelId="skilltree-title" className="st-window sk-center-window pointer-events-auto" title="คัมภีร์สกิล" subtitle={`${title.th} · ${title.en}`} onClose={close}
      actions={<Chip label="แต้มสกิลคงเหลือ" icon={<span aria-hidden>✦</span>}>แต้มสกิล {profile.skillPoints}</Chip>}>
      <div className="st-body">
        <div className="st-job">
          <span>Base Lv <b>{profile.level}</b></span>
          <span>Job Lv <b>{profile.jobLevel}</b> / {maxJob}</span>
          <div className="st-jobexp"><ProgressBar label="Job EXP" value={profile.jobExp} max={Math.max(1, next)} color="#b98cff" /><small>{next ? `Job EXP ${profile.jobExp} / ${next}` : 'Job Level สูงสุดของขั้นนี้'}</small></div>
          <small className="sk-muted">ได้แต้มสกิล 1 แต้มต่อ Job Level · เปลี่ยนอาชีพที่อาจารย์คง สำนักฝึกคาถา</small>
        </div>
        {trees.length > 1 && <Tabs label="ขั้นอาชีพ" items={tabs} value={String(tier) as '1' | '2' | '3'} onChange={(id) => setTier(Number(id) as JobTier)} />}
        {!tree.unlocked && <p className="st-locked">ต้องเปลี่ยนอาชีพเป็น{tier === 3 ? branch?.info.tier3 : 'ขั้นถัดไป'}ก่อน (Job Lv {JOB_PROGRESSION.advanceAt[(tier - 1) as 1 | 2]} ในขั้นปัจจุบัน + ผ่านบททดสอบอาชีพ) · ดูสกิลล่วงหน้าได้</p>}
        <ul className="st-list">
          {tree.skills.map((k) => {
            const lv = profile.skills[k.id] ?? 0;
            const err = learnError(profile, k.id);
            const text = texts[k.id];
            const active = isActive(k);
            return (
              <li key={k.id} className="st-skill" data-learned={lv > 0} data-locked={!tree.unlocked}>
                {text?.icon ? <img className="sk-pixel st-icon" src={text.icon} alt="" width={44} height={44} /> : <span className="st-icon st-icon-empty" aria-hidden>{k.name.slice(0, 2)}</span>}
                <div className="st-info">
                  <b>{skillLabel(k)}</b>
                  <small>{active ? 'Active' : 'Passive'} · Lv {lv} / {k.maxLevel}{active && !inGame(k) ? ' · ยังไม่เปิดใช้ในเกม (รอ slice ของสายนี้)' : ''}</small>
                  {text?.thai && <p>{text.thai}</p>}
                  {text?.formula && <p className="st-formula">{text.formula}</p>}
                </div>
                <Button variant={err ? 'secondary' : 'primary'} disabled={busy || !!err} title={err ? SERVICE_ERROR_TH[err] : 'เรียน / เพิ่มเลเวล'} onClick={() => learn(k.id)}>
                  {lv >= k.maxLevel ? 'สูงสุด' : lv > 0 ? '+1' : 'เรียน'}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </Window>
  );
}
