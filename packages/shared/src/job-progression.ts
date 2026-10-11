import { findBranch, SKILL_TREE, type JobTier } from './skill-registry.js';

// Ragnarok-inspired job progression (user 2026-10-11): Base Level and Job Level are separate. Tier 1 Apprentice Shaman
// (Medium) → at Job Lv 10 + advancement quest, pick a nation branch (tier 2, Job Lv resets to 1) → at tier-2 Job Lv 40 +
// branch quest, advance to tier 3 (Job Lv resets to 1). Base Level never resets. 1 skill point per Job Level gained.
// Learned skills and their points are kept across tiers; each tier has its own tree; nothing unlocks automatically.
// All thresholds are configurable (provisional values).

export const JOB_PROGRESSION = {
  maxJobLevel: { 1: 10, 2: 50, 3: 50 } as Readonly<Record<JobTier, number>>,
  /** Job Level needed (in the current tier) to advance to the next tier. */
  advanceAt: { 1: 10, 2: 40 } as Readonly<Record<1 | 2, number>>,
  skillPointsPerJobLevel: 1,
  /** Job EXP from a monster when its definition has no explicit jobExp: base EXP × this. */
  jobExpRatio: 0.75,
  /** Job EXP curve base per tier (provisional): next(level) = base × level^1.4. */
  jobExpBase: { 1: 12, 2: 40, 3: 90 } as Readonly<Record<JobTier, number>>,
} as const;

/** Profile version for save-data migrations (1 = before job progression). */
export const PROFILE_VERSION = 2;

/** The job fields a profile carries (kept separate from base level / EXP). */
export interface JobProfile {
  profileVersion: number;
  jobTier: JobTier; nation: string | null; branch: string | null;
  jobLevel: number; jobExp: number;
  skillPoints: number; skills: Record<string, number>;
  quests: Record<string, { step: number; done: boolean; count?: number }>;
}

export function jobExpToNext(tier: JobTier, level: number): number {
  return Math.max(1, Math.round(JOB_PROGRESSION.jobExpBase[tier] * Math.pow(level, 1.4)));
}

/** Fills job fields on profiles saved before job progression (version 1). Idempotent; never touches learned skills. */
export function migrateJobProfile<T extends Partial<JobProfile> & { skillPoints: number; skills: Record<string, number> }>(p: T): T & JobProfile {
  const q = p as T & JobProfile;
  if ((q.profileVersion ?? 1) >= PROFILE_VERSION) return q;
  q.jobTier ??= 1; q.nation ??= null; q.branch ??= null; q.jobLevel ??= 1; q.jobExp ??= 0; q.quests ??= {};
  q.profileVersion = PROFILE_VERSION;
  return q;
}

/** Adds Job EXP and applies job level-ups (1 skill point each), capped at the tier's max Job Level. Mutates `p`. */
export function gainJobExp(p: JobProfile, amount: number): number {
  let gained = 0;
  const max = JOB_PROGRESSION.maxJobLevel[p.jobTier];
  if (p.jobLevel >= max) return 0;
  p.jobExp += Math.max(0, Math.round(amount));
  while (p.jobLevel < max && p.jobExp >= jobExpToNext(p.jobTier, p.jobLevel)) {
    p.jobExp -= jobExpToNext(p.jobTier, p.jobLevel);
    p.jobLevel += 1; gained += 1;
    p.skillPoints += JOB_PROGRESSION.skillPointsPerJobLevel;
  }
  if (p.jobLevel >= max) p.jobExp = 0;
  return gained;
}

/** Quest id required to leave a tier: the apprentice trial (tier 1) or the branch trial (tier 2). */
export function advancementQuest(p: Pick<JobProfile, 'jobTier' | 'branch'>): string | null {
  return p.jobTier === 1 ? 'job-apprentice-trial' : p.jobTier === 2 && p.branch ? `job-trial-${p.branch}` : null;
}

export type JobError = 'max-tier' | 'job-level-low' | 'job-quest-missing' | 'bad-branch';
export function advanceError(p: JobProfile, branch?: string): JobError | null {
  if (p.jobTier === 3) return 'max-tier';
  if (p.jobLevel < JOB_PROGRESSION.advanceAt[p.jobTier]) return 'job-level-low';
  const quest = advancementQuest(p);
  if (!quest || !p.quests[quest]?.done) return 'job-quest-missing';
  if (p.jobTier === 1 && (!branch || !findBranch(branch))) return 'bad-branch';
  return null;
}
/** Advances one tier (Job Level → 1, Job EXP → 0; Base Level, skills and unspent points stay). Returns a new profile. */
export function advanceJob<T extends JobProfile>(p: T, branch?: string): { ok: true; profile: T } | { ok: false; error: JobError } {
  const error = advanceError(p, branch);
  if (error) return { ok: false, error };
  const q = structuredClone(p);
  if (q.jobTier === 1) { const b = findBranch(branch!)!; q.nation = b.nation; q.branch = b.branch; }
  q.jobTier = (q.jobTier + 1) as JobTier; q.jobLevel = 1; q.jobExp = 0;
  return { ok: true, profile: q };
}

export type LearnError = 'unknown-skill' | 'skill-locked' | 'skill-max' | 'no-skill-points' | 'prerequisite';
/** Why a skill cannot be learned/raised now (null = it can): its tier must be unlocked and on the player's branch. */
export function learnError(p: JobProfile, skillId: string): LearnError | null {
  const k = SKILL_TREE[skillId];
  if (!k) return 'unknown-skill';
  if (k.tier > p.jobTier || (k.tier > 1 && k.branch !== p.branch)) return 'skill-locked';
  if ((p.skills[skillId] ?? 0) >= k.maxLevel) return 'skill-max';
  if (p.skillPoints <= 0) return 'no-skill-points';
  if (k.requires.some((r) => (p.skills[r.skillId] ?? 0) < r.level)) return 'prerequisite';
  return null;
}
