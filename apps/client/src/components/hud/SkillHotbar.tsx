import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MEDIUM_SKILLS, MEDIUM_PRESENTATION, SKILL_BEHAVIOR_POLICY } from '@shaman/shared';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';
import { useSkillStore } from '@/stores/skill-store';
import { RoundButton } from './RoundButton';

// Medium skills from docs/design/skill-database-source.txt. A learned skill casts through the server (cast time,
// walking interrupts, cooldown, SP) at the selected monster. Damage and healing use provisional numbers (combat.ts).
const SKILLS = MEDIUM_SKILLS.filter(skill => SKILL_BEHAVIOR_POLICY[MEDIUM_PRESENTATION[skill.id]!.behavior].hotbar);
/** Touch arc: the first skill sits in the corner, the rest on a quarter circle around it (px from that button). */
const ARC_RADIUS = 124;
const ARC_ANGLES = [180, 210, 240, 270];
const NOTE = 'คลิกมอนสเตอร์เพื่อเลือกเป้าหมาย · ตัวเลขทดลอง';
const TOUCH_NOTE = 'แตะมอนสเตอร์เพื่อเล็ง';

/** performance.now(), refreshed every animation frame while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let frame = requestAnimationFrame(function tick() { setNow(performance.now()); frame = requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return now;
}

/** Skill buttons share the carved ring (RoundButton): a quarter arc on touch screens, a row in a HUD panel otherwise. */
export function SkillHotbar({ touch }: { touch: boolean }) {
  const notify = useHudStore((s) => s.notify);
  const profile = useProfileStore((s) => s.profile);
  const { casting, readyAt, cast } = useSkillStore();
  const cooling = Object.values(readyAt).some((t) => t > performance.now());
  const now = useNow(casting !== null || cooling);

  const use = (s: (typeof SKILLS)[number]) => {
    if (!profile) { notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (!((profile.skills[s.id] ?? 0) > 0)) { notify(`${s.name} · ยังไม่ได้เรียน เรียนได้ที่อาจารย์คง สำนักฝึกคาถา`, 'info'); return; }
    cast(s.id);
  };
  const latest = useRef(use);
  latest.current = use;

  // Number keys 1-5 cast the matching slot (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const skill = SKILLS[Number(e.key) - 1];
      if (skill && /^[1-9]$/.test(e.key)) { e.preventDefault(); latest.current(skill); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const button = (s: (typeof SKILLS)[number], i: number, className: string, style?: CSSProperties) => {
    const level = profile?.skills[s.id] ?? 0;
    const learned = level > 0;
    const castProgress = casting?.skillId === s.id && casting.castMs > 0 ? Math.min(1, (now - casting.startedAt) / casting.castMs) : null;
    const remaining = Math.max(0, (readyAt[s.id] ?? 0) - now);
    const label = !profile ? `${s.name} — ออฟไลน์` : learned ? `${s.name} Lv ${level} · กด ${i + 1}` : `${s.name} — ยังไม่ได้เรียน`;
    return (
      <RoundButton key={s.id} className={className} icon={`/assets/skills/medium-v1/${s.id}-icon.png`} label={label}
        style={{ ...style, ...(castProgress !== null ? { '--cast': castProgress } : {}) } as CSSProperties}
        disabled={!profile || !learned} onClick={() => use(s)}>
        <span className="hud-slot-key">{i + 1}</span>
        {profile && !learned && <span className="hud-skill-lock" aria-hidden>🔒</span>}
        {castProgress !== null && <span className="hud-skill-cast" aria-hidden />}
        {remaining > 0 && <span className="hud-skill-cooldown" aria-hidden>{Math.ceil(remaining / 1000)}</span>}
      </RoundButton>
    );
  };
  if (touch) {
    return (
      <section className="hud-skill-arc" aria-label="ปุ่มสกิล Medium">
        <span className="hud-skill-note">{TOUCH_NOTE}</span>
        {SKILLS.map((s, i) => {
          const angle = ((ARC_ANGLES[i - 1] ?? 0) * Math.PI) / 180;
          const style = i === 0 ? undefined : { '--dx': `${Math.round(-Math.cos(angle) * ARC_RADIUS)}px`, '--dy': `${Math.round(-Math.sin(angle) * ARC_RADIUS)}px` } as CSSProperties;
          return button(s, i, i === 0 ? 'hud-skill hud-skill-main' : 'hud-skill', style);
        })}
      </section>
    );
  }
  return (
    <section className="hud-panel hud-hotbar pointer-events-auto" aria-label="แถบสกิล Medium">
      <div className="hud-hotbar-row">{SKILLS.map((s, i) => button(s, i, 'hud-skill-slot'))}</div>
      <small>{NOTE}</small>
    </section>
  );
}
