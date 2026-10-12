'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  castRule, combatSpec, findBranch, JOB_PROGRESSION, jobExpToNext, learnError, NATION_SKILL_INDEX, SERVICE_ERROR_TH, skillElement,
  skillLevelText, skillRange, type JobTier, type PlayerProfile, type TreeSkill,
} from '@shaman/shared';
import { PlayerPortrait } from '@/components/character/PlayerPortrait';
import { inGame, isActive, jobTitle, jobTrees, NATION_TH, useSkillTexts, type SkillEffect, type SkillText } from '@/game-data/skill-catalog';
import { useProfileStore } from '@/stores/profile-store';
import { useSkillTreeStore } from '@/stores/skill-tree-store';
import './skill-tree.css';

// Skill book (K): carved-frame window with a category rail, job-tier tabs over a banner with the player's current model,
// a board of framed skill icons with level-gem rails, and a detail page (release VFX preview, numbers, per-level text in
// Ragnarok style: damage as % of ATK/MATK). Learning sends 'skill:learn'; the server checks every rule.

// Skill book v1 art (PixelLab, docs/design/ui/skill-book-v1.json).
const ART = '/assets/ui/skill-book';
const TIER_TH: Readonly<Record<JobTier, string>> = { 1: 'ขั้น ๑', 2: 'ขั้น ๒', 3: 'ขั้น ๓' };
type Category = 'all' | 'attack' | 'passive' | 'support' | 'ready';
const BANNER_NATIONS = new Set(['th', 'id', 'ru', 'jp', 'no']);
const sec = (ms: number) => `${+(ms / 1000).toFixed(1)} s`;
const formulaOf = (id: string, text?: SkillText) => text?.formula ?? NATION_SKILL_INDEX[id]?.formula ?? '';
const isAttack = (k: TreeSkill, text?: SkillText) => isActive(k) && (/DMG|ดาเมจ|DOT/.test(formulaOf(k.id, text)) || combatSpec(k.id)?.target === 'enemy');

function SkillIcon({ k, text, size }: { k: TreeSkill; text?: SkillText; size: number }) {
  return text?.icon
    ? <img className="sk-pixel" src={text.icon} alt="" width={size} height={size} />
    : <span className="sb-icon-empty" aria-hidden>{k.thaiName.slice(0, 2)}</span>;
}

/** Small line icons for the numbers row (drawn, not image assets). */
const NumIcon = ({ kind }: { kind: 'sp' | 'cast' | 'range' | 'cd' }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="sb-num-icon">
    {kind === 'sp' && <path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z" />}
    {kind === 'cast' && <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />}
    {kind === 'range' && <><circle cx="12" cy="12" r="7" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></>}
    {kind === 'cd' && <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" />}
  </svg>
);

/** Release VFX strip played with CSS steps, beside the player's model. */
function EffectPreview({ effect, k, text }: { effect: SkillEffect | null; k: TreeSkill; text?: SkillText }) {
  const scale = effect ? Math.min(1.4, 170 / effect.height, 240 / effect.width) : 1;
  const style = effect ? {
    width: effect.width * scale, height: effect.height * scale, backgroundImage: `url(${effect.url})`,
    backgroundSize: `${effect.width * effect.frames * scale}px ${effect.height * scale}px`,
    '--sb-fx-end': `-${effect.width * effect.frames * scale}px`, '--sb-fx-steps': effect.frames,
  } as CSSProperties : undefined;
  return (
    <div className="sb-preview" aria-hidden>
      <PlayerPortrait facing="east" className="sb-preview-caster" />
      {effect ? <span className="sb-preview-fx" style={style} /> : <span className="sb-preview-icon"><SkillIcon k={k} text={text} size={72} /></span>}
      <small className="sb-preview-note">{effect ? 'ภาพเอฟเฟกต์จริงของสกิล' : isActive(k) ? 'ยังไม่มีภาพเอฟเฟกต์' : 'สกิลติดตัว · ทำงานอัตโนมัติ'}</small>
    </div>
  );
}

/** One skill on the board: framed icon with level badge and learn mark, name, and a rail of level gems. */
function SkillNode({ k, profile, text, selected, locked, busy, onSelect, onLearn }: {
  k: TreeSkill; profile: PlayerProfile; text?: SkillText; selected: boolean; locked: boolean; busy: boolean; onSelect: () => void; onLearn: () => void;
}) {
  const lv = profile.skills[k.id] ?? 0;
  const canLearn = !learnError(profile, k.id) && !busy;
  return (
    <li className="sb-node" data-selected={selected} data-learned={lv > 0} data-max={lv >= k.maxLevel} data-locked={locked}>
      <button type="button" className="sb-node-icon" onClick={onSelect} aria-pressed={selected} aria-label={`${k.thaiName} เลเวล ${lv} จาก ${k.maxLevel}`}>
        <SkillIcon k={k} text={text} size={56} />
        <span className="sb-node-lv">{lv}/{k.maxLevel}</span>
      </button>
      {canLearn && <button type="button" className="sb-node-plus" onClick={onLearn} title={`เรียน ${k.thaiName} เลเวล ${lv + 1} (ใช้ 1 แต้ม)`} aria-label={`เพิ่มเลเวล ${k.thaiName}`}>+</button>}
      <div className="sb-node-body" onClick={onSelect}>
        <b>{k.thaiName}</b>
        <div className="sb-rail" data-count={k.maxLevel} aria-hidden>
          {Array.from({ length: k.maxLevel }, (_, i) => <i key={i} className="sb-gem" data-state={i < lv ? 'on' : i === lv && canLearn ? 'next' : 'off'} />)}
        </div>
      </div>
    </li>
  );
}

function SkillDetail({ k, profile, text, busy, onLearn }: { k: TreeSkill; profile: PlayerProfile; text?: SkillText; busy: boolean; onLearn: () => void }) {
  const lv = profile.skills[k.id] ?? 0;
  const err = learnError(profile, k.id);
  const active = isActive(k);
  const rule = active ? castRule(k.id, profile.skills) : undefined;
  const spec = active ? combatSpec(k.id) : undefined;
  const range = spec ? skillRange(k.id, profile.skills) : 0;
  const formula = formulaOf(k.id, text);
  const element = skillElement(formula);
  const durationMs = NATION_SKILL_INDEX[k.id]?.durationMs;
  const [allLevels, setAllLevels] = useState(false);
  return (
    <aside className="sb-detail" aria-live="polite">
      <header>
        <span className="sb-detail-icon"><SkillIcon k={k} text={text} size={72} /></span>
        <div>
          <h4>{k.thaiName}</h4>
          {k.name !== k.thaiName && <small>{k.name}</small>}
          <div className="sb-tags">
            <span data-kind={active ? 'active' : 'passive'}>{active ? 'Active' : 'Passive'}</span>
            <span>Lv {lv} / {k.maxLevel}</span>
            {element && <span data-kind="element">ธาตุ{element.th}</span>}
            {!!durationMs && <span data-kind="time">⏱ {sec(durationMs)}</span>}
          </div>
        </div>
      </header>
      <EffectPreview effect={text?.effect ?? null} k={k} text={text} />
      {rule && <dl className="sb-numbers">
        <div><NumIcon kind="sp" /><dt>SP</dt><dd>{spec?.sp ?? '—'}</dd></div>
        <div><NumIcon kind="cast" /><dt>ร่าย</dt><dd>{rule.castMs ? sec(rule.castMs) : 'ทันที'}</dd></div>
        <div><NumIcon kind="range" /><dt>ระยะ</dt><dd>{range > 0 ? `${+range.toFixed(1)} ช่อง` : 'ตัวเอง'}</dd></div>
        <div><NumIcon kind="cd" /><dt>คูลดาวน์</dt><dd>{rule.cooldownMs ? sec(rule.cooldownMs) : '—'}</dd></div>
      </dl>}
      {active && !inGame(k) && <p className="sb-warn">ยังไม่เปิดใช้ในเกม</p>}
      <div className="sb-desc">
        {text?.thai ? <p className="sb-desc-lead">{text.thai}</p> : <p className="sk-muted">กำลังโหลดคำอธิบาย…</p>}
        {formula && <>
          {lv > 0 && <p><em>Lv {lv}</em>{skillLevelText(formula, lv)}</p>}
          {lv < k.maxLevel && <p className="sb-next"><em>{lv > 0 ? `ถัดไป Lv ${lv + 1}` : 'Lv 1'}</em>{skillLevelText(formula, lv + 1)}</p>}
          <button type="button" className="sb-all-toggle" onClick={() => setAllLevels((v) => !v)} aria-expanded={allLevels}>{allLevels ? 'ซ่อนตารางเลเวล' : 'ดูผลทุกเลเวล'}</button>
          {allLevels && <ol className="sb-all">{Array.from({ length: k.maxLevel }, (_, i) => <li key={i} data-current={i + 1 === lv}><em>Lv {i + 1}</em>{skillLevelText(formula, i + 1)}</li>)}</ol>}
        </>}
      </div>
      <footer>
        <button type="button" className="sb-learn" disabled={busy || !!err} onClick={onLearn}>
          <span>{lv >= k.maxLevel ? 'เลเวลสูงสุดแล้ว' : lv > 0 ? `เพิ่มเป็น Lv ${lv + 1}` : 'เรียนสกิลนี้'}</span>
          {lv < k.maxLevel && <span className="sb-cost" title="ใช้แต้มสกิล">✦ 1</span>}
        </button>
        {err && err !== 'skill-max' && <small className="sb-why">{SERVICE_ERROR_TH[err]}</small>}
      </footer>
    </aside>
  );
}

export function SkillTreeWindow() {
  const { close, tier: picked, setTier } = useSkillTreeStore();
  const profile = useProfileStore((s) => s.profile);
  const learn = useProfileStore((s) => s.learn);
  const busy = useProfileStore((s) => s.busy);
  const texts = useSkillTexts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  const shell = (body: React.ReactNode, sub = 'Skill Book') => (
    <section className="sb-window sk-center-window pointer-events-auto" role="dialog" aria-labelledby="skillbook-title">
      <div className="sb-badge" aria-hidden><img className="sk-pixel" src={`${ART}/badge-skull.png`} alt="" width={128} height={128} /><b>สกิล</b><small>SKILL</small></div>
      <button type="button" className="sb-close" onClick={close} aria-label="ปิดคัมภีร์สกิล">✕</button>
      {body ?? <header className="sb-head"><div><h3 id="skillbook-title">คัมภีร์สกิล</h3><p>{sub}</p></div></header>}
    </section>
  );
  if (!profile) return shell(<><header className="sb-head"><div><h3 id="skillbook-title">คัมภีร์สกิล</h3><p>ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์</p></div></header></>);

  const trees = jobTrees(profile);
  const tier = (picked && trees.some((t) => t.tier === picked) ? picked : profile.jobTier) as JobTier;
  const tree = trees.find((t) => t.tier === tier)!;
  const branch = profile.branch ? findBranch(profile.branch) : undefined;
  const title = jobTitle(profile);
  const maxJob = JOB_PROGRESSION.maxJobLevel[profile.jobTier];
  const next = profile.jobLevel >= maxJob ? 0 : jobExpToNext(profile.jobTier, profile.jobLevel);
  const tierName = (t: JobTier) => t === 1 ? 'ร่างทรงฝึกหัด' : t === 2 ? branch?.info.thai ?? '' : branch?.info.tier3 ?? '';
  const emblem = tree.skills.find(isActive) ?? tree.skills[0]!;
  const CATS: { id: Category; th: string; en: string; match: (k: TreeSkill) => boolean }[] = [
    { id: 'all', th: 'สกิลทั้งหมด', en: 'All Skills', match: () => true },
    { id: 'attack', th: 'สกิลโจมตี', en: 'Attack Skills', match: (k) => isAttack(k, texts[k.id]) },
    { id: 'support', th: 'สกิลสนับสนุน', en: 'Support Skills', match: (k) => isActive(k) && !isAttack(k, texts[k.id]) },
    { id: 'passive', th: 'สกิลพาสซีฟ', en: 'Passive Skills', match: (k) => !isActive(k) },
    { id: 'ready', th: 'เรียนได้ตอนนี้', en: 'Ready to Learn', match: (k) => !learnError(profile, k.id) },
  ];
  // Banner of the player's nation (an apprentice without a branch sees the Thai one, where every Medium starts).
  const bannerNation = branch && BANNER_NATIONS.has(branch.nation) ? branch.nation : 'th';
  const cat = CATS.find((c) => c.id === category)!;
  const shown = tree.skills.filter(cat.match);
  const groups = [
    { id: 'active', th: 'สกิลแอคทีฟ', en: 'Active Skills', skills: shown.filter(isActive) },
    { id: 'passive', th: 'สกิลพาสซีฟ', en: 'Passive Skills', skills: shown.filter((k) => !isActive(k)) },
  ].filter((g) => g.skills.length);
  const selected = tree.skills.find((k) => k.id === selectedId) ?? shown[0] ?? tree.skills[0]!;
  const node = (k: TreeSkill) => <SkillNode key={k.id} k={k} profile={profile} text={texts[k.id]} selected={k.id === selected.id} locked={!tree.unlocked} busy={busy}
    onSelect={() => setSelectedId(k.id)} onLearn={() => { setSelectedId(k.id); learn(k.id); }} />;

  return shell(<>
    <header className="sb-head">
      <span className="sb-emblem"><SkillIcon k={emblem} text={texts[emblem.id]} size={56} /></span>
      <div className="sb-title">
        <h3 id="skillbook-title">คัมภีร์สกิล</h3>
        <p>{title.th} · {title.en}{branch ? ` · ${NATION_TH[branch.nation]}` : ''}</p>
      </div>
      <div className="sb-levels"><span>Base Lv <b>{profile.level}</b></span><span>Job Lv <b>{profile.jobLevel}</b> / {maxJob}</span></div>
      <div className="sb-exp">
        <div className="sb-exp-bar"><i style={{ width: `${next ? Math.min(100, (profile.jobExp / next) * 100) : 100}%` }} /><span>{next ? `${profile.jobExp} / ${next}` : 'MAX'}</span></div>
        <small>Job EXP · ได้ 1 แต้มสกิลต่อ Job Level</small>
      </div>
      <div className="sb-actions">
        <span className="sb-points" title="แต้มสกิลคงเหลือ"><span aria-hidden>✦</span> แต้มสกิล <b>{profile.skillPoints}</b></span>
        <button type="button" className="sb-help-btn" onClick={() => setHelp((v) => !v)} aria-expanded={help} aria-label="วิธีใช้คัมภีร์สกิล">?</button>
      </div>
    </header>

    <nav className="sb-cats" aria-label="หมวดสกิล">
      {CATS.map((c) => {
        const n = tree.skills.filter(c.match).length;
        return <button key={c.id} type="button" aria-pressed={c.id === category} onClick={() => setCategory(c.id)} disabled={n === 0 && c.id !== 'all'}>
          <img className="sb-cat-glyph sk-pixel" src={`${ART}/cat-${c.id}.png`} alt="" width={48} height={48} /><b>{c.th}</b><small>{c.en} · {n}</small>
        </button>;
      })}
    </nav>

    <div className="sb-tabsrow">
      <div className="sb-tabs" role="tablist" aria-label="ขั้นอาชีพ">
        {trees.map((t) => {
          const learned = t.skills.filter((k) => (profile.skills[k.id] ?? 0) > 0).length;
          return <button key={t.tier} type="button" role="tab" className="sb-tab" aria-selected={t.tier === tier} data-locked={!t.unlocked}
            onClick={() => { setTier(t.tier); setSelectedId(null); }}>
            <b>{TIER_TH[t.tier]}</b><span>{tierName(t.tier)}</span><small>{t.unlocked ? `${learned} / ${t.skills.length}` : '🔒'}</small>
          </button>;
        })}
      </div>
      <div className="sb-banner" aria-hidden style={{ backgroundImage: `url(${ART}/banner-${bannerNation}.png)` }}>
        <img className="sb-banner-tal sb-banner-tal-a sk-pixel" src={`${ART}/talisman-strip.png`} alt="" />
        <img className="sb-banner-tal sb-banner-tal-b sk-pixel" src={`${ART}/talisman-strip.png`} alt="" />
        <span className="sb-banner-name">{tier === 1 ? 'Apprentice Shaman' : tier === 2 ? branch?.info.name : branch?.info.tier3}</span>
        <PlayerPortrait facing="south-west" className="sb-banner-model" />
      </div>
    </div>

    <section className="sb-board" data-locked={!tree.unlocked} aria-label={`${cat.th} ${TIER_TH[tier]}`}>
      {help && <div className="sb-help" role="note">
        <b>วิธีใช้คัมภีร์สกิล</b>
        <p>ได้แต้มสกิล 1 แต้มทุกครั้งที่ Job Level ขึ้น · กดเครื่องหมาย + หรือปุ่มด้านขวาเพื่อเพิ่มเลเวลทีละ 1 · เพชรสีเขียวคือเลเวลที่เรียนแล้ว เพชรที่กะพริบคือเลเวลถัดไป</p>
        <p>สกิลขั้นถัดไปจะปลดล็อกเมื่อเปลี่ยนอาชีพที่อาจารย์ (Job Lv {JOB_PROGRESSION.advanceAt[1]} ในขั้น ๑ และ Job Lv {JOB_PROGRESSION.advanceAt[2]} ในขั้น ๒ พร้อมผ่านบททดสอบ) · ตัวเลขดาเมจแสดงเป็น % ของ ATK หรือ MATK แบบ Ragnarok</p>
      </div>}
      {!tree.unlocked && <p className="sb-locked">🔒 ต้องเปลี่ยนอาชีพเป็น{tier === 3 ? branch?.info.tier3 : 'ขั้นถัดไป'}ก่อน (Job Lv {JOB_PROGRESSION.advanceAt[(tier - 1) as 1 | 2]} + บททดสอบอาชีพ) · ดูสกิลล่วงหน้าได้</p>}
      {groups.length === 0 && <p className="sb-empty">ไม่มีสกิลในหมวดนี้</p>}
      {groups.map((g) => (
        <div key={g.id} className="sb-group">
          <h5><span aria-hidden>❖</span>{g.th}<small>{g.en}</small></h5>
          <ul>{g.skills.map(node)}</ul>
        </div>
      ))}
    </section>

    <SkillDetail key={selected.id} k={selected} profile={profile} text={texts[selected.id]} busy={busy} onLearn={() => learn(selected.id)} />
    <img className="sb-tassel sb-tassel-l sk-pixel" src={`${ART}/talisman-strip.png`} alt="" aria-hidden />
    <img className="sb-tassel sb-tassel-r sk-pixel" src={`${ART}/talisman-strip.png`} alt="" aria-hidden />
    <img className="sb-altar sk-pixel" src={`${ART}/altar-candles.png`} alt="" aria-hidden />
  </>);
}
