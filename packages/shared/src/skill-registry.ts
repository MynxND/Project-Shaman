import { MEDIUM_SKILLS } from './catalog.js';
import { MEDIUM_PRESENTATION, type SkillBehavior } from './skill-system.js';
import { THAILAND_SKILLS, THAI_BRANCHES, type BranchInfo, type NationSkill } from './skills-thailand.js';
import { INDONESIA_SKILLS, INDO_BRANCHES } from './skills-indonesia.js';
import { RUSSIA_SKILLS, RUS_BRANCHES } from './skills-russia.js';
import { JAPAN_SKILLS, JAPAN_BRANCHES } from './skills-japan.js';
import { NORWAY_SKILLS, NORWAY_BRANCHES } from './skills-norway.js';

// One registry of every learnable skill tree (user 2026-10-11, GAME_INTEGRATION_PLAN.md phase 1): Medium is job tier 1
// (shared by every nation); each nation branch has a tier-2 tree (its class-2 skills) and a tier-3 tree (its ultimates).
// Data comes from the approved catalogues unchanged; Japan's invoked spells are not tree skills (cast through Invoke).

export type JobTier = 1 | 2 | 3;
export interface SkillPrerequisite { skillId: string; level: number }
export interface TreeSkill {
  id: string; name: string; thaiName: string; maxLevel: number; tier: JobTier; behavior: SkillBehavior;
  /** null for Medium (every nation). */
  nation: string | null; branch: string | null;
  /** Skills that must reach a level first. None are defined by the source tree yet; the check is in place. */
  requires: readonly SkillPrerequisite[];
}
export interface NationBranch { nation: string; branch: string; info: BranchInfo }

const NATIONS: readonly { nation: string; skills: readonly NationSkill[]; branches: Readonly<Record<string, BranchInfo>> }[] = [
  { nation: 'th', skills: THAILAND_SKILLS as readonly NationSkill[], branches: THAI_BRANCHES as Readonly<Record<string, BranchInfo>> },
  { nation: 'id', skills: INDONESIA_SKILLS, branches: INDO_BRANCHES as Readonly<Record<string, BranchInfo>> },
  { nation: 'ru', skills: RUSSIA_SKILLS, branches: RUS_BRANCHES as Readonly<Record<string, BranchInfo>> },
  { nation: 'jp', skills: JAPAN_SKILLS, branches: JAPAN_BRANCHES as Readonly<Record<string, BranchInfo>> },
  { nation: 'no', skills: NORWAY_SKILLS, branches: NORWAY_BRANCHES as Readonly<Record<string, BranchInfo>> },
];
/** Branches that are not playable classes (Japan's invoked-spell list). */
const NOT_A_CLASS = new Set(['onmyoji-spells']);

/** Provisional prerequisites by skill id (add as the design defines them; validated by learnable checks and tests). */
const PREREQUISITES: Readonly<Record<string, readonly SkillPrerequisite[]>> = {};

export const NATION_BRANCHES: readonly NationBranch[] = NATIONS.flatMap(({ nation, branches }) =>
  Object.entries(branches).filter(([b]) => !NOT_A_CLASS.has(b)).map(([branch, info]) => ({ nation, branch, info })));

export const SKILL_TREE: Readonly<Record<string, TreeSkill>> = Object.fromEntries([
  ...MEDIUM_SKILLS.map((k): [string, TreeSkill] => [k.id, {
    id: k.id, name: k.name, thaiName: k.name, maxLevel: k.maxLevel, tier: 1, behavior: MEDIUM_PRESENTATION[k.id]?.behavior ?? 'PASSIVE_STAT',
    nation: null, branch: null, requires: PREREQUISITES[k.id] ?? [] }]),
  ...NATIONS.flatMap(({ nation, skills }) => skills.filter((k) => !NOT_A_CLASS.has(k.branch)).map((k): [string, TreeSkill] => [k.id, {
    id: k.id, name: k.name, thaiName: k.thaiName, maxLevel: k.maxLevel, tier: (k.jobTier === 3 ? 3 : 2) as JobTier, behavior: k.behavior,
    nation, branch: k.branch, requires: PREREQUISITES[k.id] ?? [] }])),
]);

/** The tree of one tier: Medium for tier 1, else the given branch's tier-2 or tier-3 skills. */
export function skillTree(tier: JobTier, branch: string | null): TreeSkill[] {
  return Object.values(SKILL_TREE).filter((k) => k.tier === tier && (tier === 1 || k.branch === branch));
}
export function findBranch(branch: string): NationBranch | undefined { return NATION_BRANCHES.find((b) => b.branch === branch); }
/** Every nation catalogue entry by skill id (cast/cooldown/duration, placement, formula text). */
export const NATION_SKILL_INDEX: Readonly<Record<string, NationSkill & { nation: string }>> = Object.fromEntries(
  NATIONS.flatMap(({ nation, skills }) => skills.map((k) => [k.id, { ...k, nation }])));
