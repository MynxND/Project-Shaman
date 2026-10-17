import type { LayerFrame, RigAction } from './ModularRig';
import type { BodyType, Facing } from '@shaman/shared';

export const LEGACY_OFFHAND_REVIEW_KEY = 'legacy-offhand-review';
export interface LegacyOffhandReview {
  version: 'legacy-offhand-review/1'; body: 'female'; visualApproved: false;
  frames: Partial<Record<RigAction, Partial<Record<Facing, Array<{ grip: [number, number]; tip: [number, number]; front: boolean }>>>>>;
}

/** Opt-in development evidence only. Missing entries preserve the existing rig; no copied V3 joints/fallbacks. */
export function withLegacyOffhand(frame: LayerFrame | undefined, candidate: LegacyOffhandReview | undefined, body: BodyType, action: RigAction | null, facing: Facing, index: number): LayerFrame | undefined {
  if (!frame || body !== 'female' || !action || candidate?.version !== 'legacy-offhand-review/1' || candidate.body !== body || candidate.visualApproved !== false) return frame;
  const off = candidate.frames?.[action]?.[facing]?.[index];
  if (!off || typeof off.front !== 'boolean' || !Array.isArray(off.grip) || off.grip.length !== 2 || !Array.isArray(off.tip) || off.tip.length !== 2 || ![...off.grip, ...off.tip].every(n => Number.isFinite(n) && n >= 0 && n < 128)) return frame;
  return { ...frame, off: { grip: off.grip, tip: off.tip }, offFront: off.front };
}
