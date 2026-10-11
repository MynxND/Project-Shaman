import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { combatSpec, heldSpell, NATION_SKILL_INDEX, TRAP_RUNE_TH, type TrapRune, type TreeSkill } from '@shaman/shared';
import { useRuneStore } from '@/stores/rune-store';
import { hotbarSkills, skillLabel, useSkillTexts } from '@/game-data/skill-catalog';
import { useHudStore } from '@/stores/hud-store';
import { useProfileStore } from '@/stores/profile-store';
import { useSkillStore } from '@/stores/skill-store';
import { openSkillTree } from './windows';
import { RoundButton } from './RoundButton';

// The current job's learned active skills (Medium, then the branch's tier 2 and 3; shared registry). A cast goes to
// the server (cast time, walking interrupts, cooldown, SP) at the selected monster; numbers are provisional.
/** Keys for the slots, in order. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
/** Touch arc: the first skill sits in the corner, the rest on two quarter circles around it (px from that button). */
const ARC = [...[180, 210, 240, 270].map((a) => ({ a, r: 124 })), ...[228, 249, 270].map((a) => ({ a, r: 196 }))];
const NOTE = 'คลิกมอนสเตอร์เพื่อเลือกเป้าหมาย · K เปิดหน้าต่างสกิล · ตัวเลขทดลอง';
const TOUCH_NOTE = 'แตะมอนสเตอร์เพื่อเล็ง';
const RUNE_LETTER: Readonly<Record<TrapRune, string>> = { snare: 'ᚾ', freeze: 'ᛁ', blast: 'ᚦ', flash: 'ᛞ' };

/** The Invoke slot (not a tree skill: Onmyō Seal unlocks it). */
const INVOKE: TreeSkill = { id: 'invoke', name: 'Invoke', thaiName: 'อัญเชิญคาถา', maxLevel: 1, tier: 2, behavior: 'ACTIVE_INSTANT', nation: 'jp', branch: 'onmyoji', requires: [] };

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

/** Skill buttons share the carved ring (RoundButton): quarter arcs on touch screens, a row in a HUD panel otherwise. */
export function SkillHotbar({ touch }: { touch: boolean }) {
  const notify = useHudStore((s) => s.notify);
  const profile = useProfileStore((s) => s.profile);
  const { casting, readyAt, cast, variants, cycleVariant } = useSkillStore();
  const texts = useSkillTexts();
  const [page, setPage] = useState(0);
  const held = useRuneStore((s) => s.held);
  // Onmyoji: an Invoke slot after the talismans once Onmyō Seal is learned; it casts the spell the newest two talismans make.
  const sealed = (profile?.skills['onmyo-seal'] ?? 0) > 0;
  const all = sealed ? [...hotbarSkills(profile), INVOKE] : hotbarSkills(profile);
  const invokeSpell = heldSpell(held);
  // Touch arcs hold 8 buttons; more skills are paged with the swap button.
  const perPage = touch ? ARC.length + 1 : KEYS.length;
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const skills = all.slice((page % pages) * perPage, (page % pages) * perPage + perPage);
  const cooling = Object.values(readyAt).some((t) => t > performance.now());
  const now = useNow(casting !== null || cooling);

  const use = (s: TreeSkill) => {
    if (!profile) { notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (s.id !== 'invoke' && !((profile.skills[s.id] ?? 0) > 0)) { notify(`${skillLabel(s)} · ยังไม่ได้เรียน เปิดหน้าต่างสกิล (K)`, 'info'); return; }
    cast(s.id);
  };
  const latest = useRef({ use, skills });
  latest.current = { use, skills };

  // Number keys cast the matching slot (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      // Physical digit keys (Digit1..Digit0): a Thai layout types other characters on the number row.
      const i = e.code.startsWith('Digit') ? KEYS.indexOf(e.code.slice(5)) : e.code.startsWith('Numpad') ? KEYS.indexOf(e.code.slice(6)) : -1;
      const skill = i >= 0 ? latest.current.skills[i] : undefined;
      if (skill) { e.preventDefault(); latest.current.use(skill); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const button = (s: TreeSkill, i: number, className: string, style?: CSSProperties) => {
    const level = s.id === 'invoke' ? (sealed ? 1 : 0) : profile?.skills[s.id] ?? 0;
    const learned = level > 0;
    const castProgress = casting?.skillId === s.id && casting.castMs > 0 ? Math.min(1, (now - casting.startedAt) / casting.castMs) : null;
    const remaining = Math.max(0, (readyAt[s.id] ?? 0) - now);
    const variantsOf = combatSpec(s.id)?.variants as readonly TrapRune[] | undefined;
    const variant = variantsOf ? (variants[s.id] as TrapRune | undefined) ?? variantsOf[0]! : undefined;
    const spell = s.id === 'invoke' && invokeSpell ? NATION_SKILL_INDEX[invokeSpell] : undefined;
    const name = s.id === 'invoke' ? (spell ? `Invoke → ${spell.thaiName}` : 'Invoke · ถือยันต์ 2 ใบก่อน') : skillLabel(s);
    const label = !profile ? `${name} — ออฟไลน์` : learned ? `${name} Lv ${level} · กด ${KEYS[i] ?? ''}${variant ? ` · รูน ${TRAP_RUNE_TH[variant]}` : ''}` : `${name} — ยังไม่ได้เรียน`;
    const icon = (s.id === 'invoke' ? texts[invokeSpell ?? 'onmyo-seal']?.icon ?? texts['onmyo-seal']?.icon : texts[s.id]?.icon) ?? `/assets/skills/medium-v1/${s.id}-icon.png`;
    return (
      <span key={s.id} className={'hud-skill-wrap ' + className} style={style}>
        <RoundButton className="hud-skill-btn" icon={icon} label={label}
          style={(castProgress !== null ? { '--cast': castProgress } : {}) as CSSProperties}
          disabled={!profile || !learned} onClick={() => use(s)}>
          {KEYS[i] && !touch && <span className="hud-slot-key">{KEYS[i]}</span>}
          {profile && !learned && <span className="hud-skill-lock" aria-hidden>🔒</span>}
          {castProgress !== null && <span className="hud-skill-cast" aria-hidden />}
          {remaining > 0 && <span className="hud-skill-cooldown" aria-hidden>{Math.ceil(remaining / 1000)}</span>}
        </RoundButton>
        {variant && <button type="button" className="hud-skill-variant pointer-events-auto" title={`เปลี่ยนรูนกับดัก (ตอนนี้ ${TRAP_RUNE_TH[variant]})`}
          aria-label={`เปลี่ยนรูนกับดัก ตอนนี้ ${TRAP_RUNE_TH[variant]}`} onClick={() => cycleVariant(s.id)}>{RUNE_LETTER[variant]}</button>}
      </span>
    );
  };
  if (touch) {
    return (
      <section className="hud-skill-arc" aria-label="ปุ่มสกิล">
        <span className="hud-skill-note">{TOUCH_NOTE}</span>
        {skills.map((s, i) => {
          const slot = ARC[i - 1];
          const angle = ((slot?.a ?? 0) * Math.PI) / 180;
          const style = i === 0 || !slot ? undefined : { '--dx': `${Math.round(-Math.cos(angle) * slot.r)}px`, '--dy': `${Math.round(-Math.sin(angle) * slot.r)}px` } as CSSProperties;
          return button(s, i, i === 0 ? 'hud-skill hud-skill-main' : 'hud-skill', style);
        })}
        <button type="button" className="hud-skill-tree-btn pointer-events-auto" onClick={openSkillTree} aria-label="เปิดหน้าต่างสกิล">สกิล</button>
        {pages > 1 && <button type="button" className="hud-skill-page-btn pointer-events-auto" onClick={() => setPage((n) => (n + 1) % pages)} aria-label={`สลับชุดสกิล หน้า ${(page % pages) + 1} จาก ${pages}`}>⟳ {(page % pages) + 1}/{pages}</button>}
      </section>
    );
  }
  return (
    <section className="hud-panel hud-hotbar pointer-events-auto" aria-label="แถบสกิล">
      <div className="hud-hotbar-row">
        {skills.map((s, i) => button(s, i, 'hud-skill-slot'))}
        {skills.length === 0 && <span className="sk-muted">ยังไม่มีสกิลใช้งาน · กด K เพื่อเรียน</span>}
      </div>
      <small>{NOTE}</small>
    </section>
  );
}
