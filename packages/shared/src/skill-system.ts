/** Central presentation policy; never authorizes client-side combat execution. */
export type SkillBehavior = 'ACTIVE_CAST' | 'ACTIVE_INSTANT' | 'ACTIVE_CHANNEL' | 'PASSIVE_STAT' | 'PASSIVE_TRIGGER' | 'PASSIVE_AURA' | 'TOGGLE_BUFF';
export type VfxFamily = 'yantra' | 'spirit' | 'binding';
export const VFX_FAMILIES = {
  yantra: { color: 0xd6b46c, geometry: 'ritual-circle-v1' },
  spirit: { color: 0x77b99b, geometry: 'ritual-circle-v1' },
  binding: { color: 0xb55058, geometry: 'ritual-circle-v1' },
} as const;
export const SKILL_BEHAVIOR_POLICY = {
  ACTIVE_CAST: { castPose: true, circle: true, release: true, aura: false, hotbar: true, generateVfx: true },
  ACTIVE_INSTANT: { castPose: false, circle: false, release: true, aura: false, hotbar: true, generateVfx: true },
  ACTIVE_CHANNEL: { castPose: true, circle: true, release: true, aura: false, hotbar: true, generateVfx: true },
  PASSIVE_STAT: { castPose: false, circle: false, release: false, aura: false, hotbar: false, generateVfx: false },
  PASSIVE_TRIGGER: { castPose: false, circle: false, release: true, aura: false, hotbar: false, generateVfx: true },
  PASSIVE_AURA: { castPose: false, circle: false, release: false, aura: true, hotbar: false, generateVfx: true },
  TOGGLE_BUFF: { castPose: false, circle: false, release: true, aura: true, hotbar: true, generateVfx: true },
} as const satisfies Record<SkillBehavior, { castPose: boolean; circle: boolean; release: boolean; aura: boolean; hotbar: boolean; generateVfx: boolean }>;
export interface SkillPresentation {
  skillId: string; behavior: SkillBehavior; family: VfxFamily; castTimeMs: number | null;
  circle: 'ritual-circle-v1' | null; releaseEffect: string | null; aura: { asset: string; priority: number } | null;
}
const presentation = (skillId: string, behavior: SkillBehavior, family: VfxFamily, castTimeMs: number | null): SkillPresentation => ({ skillId, behavior, family, castTimeMs, circle: SKILL_BEHAVIOR_POLICY[behavior].circle ? 'ritual-circle-v1' : null, releaseEffect: SKILL_BEHAVIOR_POLICY[behavior].release ? skillId : null, aura: null });
export const MEDIUM_PRESENTATION: Readonly<Record<string, SkillPresentation>> = {
  'spirit-bolt': presentation('spirit-bolt','ACTIVE_CAST','spirit',1500),
  'soul-heal': presentation('soul-heal','ACTIVE_CAST','spirit',2000),
  'amulet-blast': presentation('amulet-blast','ACTIVE_CAST','yantra',1000),
  'ghost-sight': presentation('ghost-sight','ACTIVE_INSTANT','spirit',0),
  'binding-thread': presentation('binding-thread','ACTIVE_CAST','binding',500),
  'spirit-sense': presentation('spirit-sense','PASSIVE_STAT','spirit',null),
  'amulet-mastery': presentation('amulet-mastery','PASSIVE_STAT','yantra',null),
  meditation: presentation('meditation','PASSIVE_STAT','spirit',null),
  'vessel-body': presentation('vessel-body','PASSIVE_STAT','yantra',null),
  'soul-resonance': presentation('soul-resonance','PASSIVE_STAT','spirit',null),
};
/** Visual test fixture only. Never added to gameplay catalog or player progression. */
export const LAB_PASSIVE_AURA: SkillPresentation = {
  skillId: 'prototype-spirit-aura', behavior: 'PASSIVE_AURA', family: 'spirit', castTimeMs: null,
  circle: null, releaseEffect: null, aura: { asset: 'ritual-circle-neutral', priority: 1 },
};
/** Medium v2 release composition. All artistic elements come from PixelLab. */
export interface ReleaseEffectStyle {
  placement: 'feet' | 'head' | 'body' | 'projectile';
  scale: number; nativeAngle: number; groundPulse: boolean; groundScale: number;
  impactFrame?: number; omitReturnFrames?: number;
}
export const MEDIUM_RELEASE_STYLE: Readonly<Record<string, ReleaseEffectStyle>> = {
  'spirit-bolt': { placement:'projectile',scale:1,nativeAngle:0,groundPulse:false,groundScale:1,impactFrame:6,omitReturnFrames:2 },
  'soul-heal': { placement:'feet',scale:1,nativeAngle:0,groundPulse:true,groundScale:1.2 },
  'amulet-blast': { placement:'feet',scale:1,nativeAngle:0,groundPulse:false,groundScale:1 },
  'ghost-sight': { placement:'head',scale:.8,nativeAngle:0,groundPulse:false,groundScale:1 },
  'binding-thread': { placement:'feet',scale:1,nativeAngle:0,groundPulse:true,groundScale:1 },
};
export function validateSkillPresentation(def: SkillPresentation): readonly string[] {
  const p = SKILL_BEHAVIOR_POLICY[def.behavior];
  const errors: string[] = [];
  if (p.circle !== (def.circle !== null)) errors.push('circle-policy');
  if (!p.release && def.releaseEffect !== null) errors.push('release-policy');
  if (!p.aura && def.aura !== null) errors.push('aura-policy');
  if (p.aura && def.aura === null) errors.push('missing-aura');
  if (def.behavior === 'ACTIVE_CAST' && !(def.castTimeMs !== null && Number.isFinite(def.castTimeMs) && def.castTimeMs > 0)) errors.push('cast-duration');
  if (def.behavior === 'ACTIVE_INSTANT' && def.castTimeMs !== 0) errors.push('instant-duration');
  if (def.behavior.startsWith('PASSIVE') && def.castTimeMs !== null) errors.push('passive-cast');
  return errors;
}
/** Cast pose playback rate (frames per second); constant so the pose never crawls on long cast times. */
export const CAST_POSE_FPS = 12;
/**
 * Which cast-pose frame to show. The pose sheet is split into intro (gather), channel and release (open palms, settle
 * back to stance). Intro plays at CAST_POSE_FPS, squeezed into 70% of short cast times; the channel frames ping-pong
 * until the server releases; the release frames then play once. Returns null when no pose should show (finished,
 * or released past the last frame). `sinceReleaseMs` is null while still casting.
 */
export function castPoseFrame(elapsedMs: number, castMs: number, frames: number, sinceReleaseMs: number | null): number | null {
  if (frames < 3 || castMs <= 0) return null;
  const introEnd = Math.max(1, Math.round(frames * 0.4));
  const releaseStart = Math.max(introEnd + 1, Math.round(frames * 0.65));
  const step = 1000 / CAST_POSE_FPS;
  if (sinceReleaseMs !== null) {
    const f = releaseStart + Math.floor(sinceReleaseMs / step);
    return f < frames ? f : null;
  }
  const introMs = Math.min(introEnd * step, castMs * 0.7);
  if (elapsedMs < introMs) return Math.min(introEnd - 1, Math.floor(elapsedMs / introMs * introEnd));
  // Channel: ping-pong over [introEnd, releaseStart) so the hands keep moving without a visible jump.
  const span = releaseStart - introEnd;
  if (span <= 1) return introEnd;
  const cycle = span * 2 - 2;
  const k = Math.floor((elapsedMs - introMs) / step) % cycle;
  return introEnd + (k < span ? k : cycle - k);
}
/** How long the release frames take after the server's release (ms). */
export function castReleaseMs(frames: number): number {
  return Math.max(0, frames - Math.max(Math.max(1, Math.round(frames * 0.4)) + 1, Math.round(frames * 0.65))) * 1000 / CAST_POSE_FPS;
}
/** Visual envelope around an authoritative cast; invocation takes 20% of actual CT. */
export function castingEnvelope(elapsedMs: number, castTimeMs: number, interruptedAtMs: number | null = null): { phase: 'invocation' | 'channeling' | 'release' | 'dissipation' | 'cancelled' | 'done'; alpha: number; release: boolean } {
  if (interruptedAtMs !== null && elapsedMs >= interruptedAtMs) {
    const initialAlpha = castingEnvelope(interruptedAtMs,castTimeMs).alpha;
    const alpha = Math.max(0, 1 - (elapsedMs - interruptedAtMs) / 180) * initialAlpha;
    return { phase: alpha > 0 ? 'cancelled' : 'done', alpha, release: false } as const;
  }
  if (!(castTimeMs > 0)) return { phase: 'done', alpha: 0, release: false } as const;
  if (elapsedMs < castTimeMs * .2) return { phase: 'invocation', alpha: Math.max(0, elapsedMs / (castTimeMs * .2)) * .5, release: false } as const;
  if (elapsedMs < castTimeMs) return { phase: 'channeling', alpha: .55 + .1 * Math.sin(elapsedMs / 180), release: false } as const;
  if (elapsedMs < castTimeMs + 80) return { phase: 'release', alpha: .85, release: true } as const;
  const alpha = Math.max(0, 1 - (elapsedMs - castTimeMs - 80) / 180) * .65;
  return { phase: alpha > 0 ? 'dissipation' : 'done', alpha, release: false } as const;
}
/** Pure stat rule; no new VFX, no activation. Combat caller must supply server-resolved race. */
export function spiritSenseDamageMultiplier(level: number, race: string): number {
  const learned = Number.isFinite(level) ? Math.max(0, Math.min(10, Math.floor(level))) : 0;
  return race === 'Undead' || race === 'Demon' ? 1 - learned * .02 : 1;
}
/** Deterministic visual budget: highest-priority active aura only. Never drives gameplay state. */
export function selectVisibleAuras(auras: readonly { id: string; active: boolean; priority: number }[], limit = 1) {
  return auras.filter(a=>a.active).sort((a,b)=>b.priority-a.priority || a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.floor(limit)));
}
