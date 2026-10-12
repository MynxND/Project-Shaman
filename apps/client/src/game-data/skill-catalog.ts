import { useEffect, useState } from 'react';
import {
  castRule, findBranch, NATION_SKILL_INDEX, SKILL_BEHAVIOR_POLICY, SKILL_TREE, skillTree, type JobTier, type PlayerProfile, type TreeSkill,
} from '@shaman/shared';

// Client view of the skill registry (game integration slice 1): what the hotbar and the skill tree window show, with
// icons and description text from the published skill manifests (/skills lab art). Rules stay in @shaman/shared.

const MEDIUM_BASE = '/assets/skills/medium-v1/';
const NATION_BASE: Readonly<Record<string, string>> = {
  th: '/assets/skills/thailand-v1/', id: '/assets/skills/indonesia-v1/', ru: '/assets/skills/russia-v1/', jp: '/assets/skills/japan-v1/', no: '/assets/skills/norway-v1/',
};
/** Release VFX strip (one row of frames) used as the skill book preview. */
export interface SkillEffect { url: string; width: number; height: number; frames: number }
export interface SkillText { icon: string | null; thai: string; formula: string; effect: SkillEffect | null }
type Texts = Record<string, SkillText>;

let loading: Promise<Texts> | null = null;
/** Icons + Thai description + formula text for every tree skill (loaded once per page). */
function loadTexts(): Promise<Texts> {
  loading ??= (async () => {
    const out: Texts = {};
    const medium = await fetch(`${MEDIUM_BASE}manifest.json`).then((r) => r.ok ? r.json() : { skills: [] }).catch(() => ({ skills: [] })) as { skills: { id: string; thai: string; formula: string; icon?: string; effect?: { image: string; width: number; height: number; frames: number } }[] };
    for (const k of medium.skills) out[k.id] = { icon: `${MEDIUM_BASE}${k.id}-icon.png`, thai: k.thai, formula: k.formula,
      effect: k.effect ? { url: `${MEDIUM_BASE}${k.effect.image}`, width: k.effect.width, height: k.effect.height, frames: k.effect.frames } : null };
    for (const [nation, base] of Object.entries(NATION_BASE)) {
      const m = await fetch(`${base}manifest.json`).then((r) => r.ok ? r.json() : {}).catch(() => ({})) as { icons?: Record<string, { image: string; packedAt?: number }>; effects?: Record<string, { image: string; width: number; height: number; frames: number; packedAt?: number }> };
      for (const k of Object.values(NATION_SKILL_INDEX).filter((x) => x.nation === nation)) {
        const ic = m.icons?.[k.id];
        const fx = m.effects?.[k.id];
        out[k.id] = { icon: ic ? `${base}${ic.image}?v=${ic.packedAt ?? 0}` : null, thai: k.thai, formula: k.formula,
          effect: fx ? { url: `${base}${fx.image}?v=${fx.packedAt ?? 0}`, width: fx.width, height: fx.height, frames: fx.frames } : null };
      }
    }
    return out;
  })();
  return loading;
}
export function useSkillTexts(): Texts {
  const [texts, setTexts] = useState<Texts>({});
  useEffect(() => { let live = true; void loadTexts().then((t) => { if (live) setTexts(t); }); return () => { live = false; }; }, []);
  return texts;
}

/** Display name: Thai name · English name (Medium skills have English names only). */
export const skillLabel = (k: TreeSkill) => k.thaiName === k.name ? k.name : `${k.thaiName} · ${k.name}`;
export const isActive = (k: TreeSkill) => SKILL_BEHAVIOR_POLICY[k.behavior].hotbar;
/** Whether the server can run this skill yet (its slice has landed). */
export const inGame = (k: TreeSkill) => !isActive(k) || !!castRule(k.id);

/** Trees the profile can see: Medium, then its branch's tier 2 and tier 3 (locked tiers stay visible but locked). */
export function jobTrees(profile: Pick<PlayerProfile, 'jobTier' | 'branch'>): { tier: JobTier; skills: TreeSkill[]; unlocked: boolean }[] {
  const tiers: JobTier[] = profile.branch ? [1, 2, 3] : [1];
  return tiers.map((tier) => ({ tier, skills: skillTree(tier, tier === 1 ? null : profile.branch), unlocked: tier <= profile.jobTier }));
}

/** Hotbar: every learned active of the current job (Medium first, then tier 2, tier 3), in tree order. */
export function hotbarSkills(profile: PlayerProfile | null): TreeSkill[] {
  if (!profile) return skillTree(1, null).filter(isActive);
  return jobTrees(profile).flatMap((t) => t.skills).filter((k) => isActive(k) && (profile.skills[k.id] ?? 0) > 0);
}
export const treeSkill = (id: string): TreeSkill | undefined => SKILL_TREE[id];

/** Job title for a profile: Apprentice Shaman, the branch, or its advanced (tier 3) job. */
export function jobTitle(p: Pick<PlayerProfile, 'jobTier' | 'branch'>): { th: string; en: string } {
  const b = p.branch ? findBranch(p.branch) : undefined;
  if (!b || p.jobTier === 1) return { th: 'ร่างทรงฝึกหัด', en: 'Apprentice Shaman' };
  return p.jobTier === 3 ? { th: b.info.tier3, en: `${b.info.name} · ขั้น ๓` } : { th: b.info.thai, en: b.info.name };
}

/** Nation names in Thai (skill registry nation codes). */
export const NATION_TH: Readonly<Record<string, string>> = { th: 'ไทย', id: 'อินโดนีเซีย', ru: 'รัสเซีย', jp: 'ญี่ปุ่น', no: 'นอร์เวย์' };
