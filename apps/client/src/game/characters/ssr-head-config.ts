import type { ExpressionId, HairstyleId } from '@shaman/shared';

// Phaser-free SSR head settings shared by the game (SsrHead) and the React appearance window.
/** Game hairstyle -> SSR hair part. Styles without an SSR part keep the legacy head. */
export const SSR_HAIR: Partial<Record<HairstyleId, string>> = {
  'natural-short': 'hairFront.default', 'side-sweep': 'hairFront.side-sweep',
  'golden-part': 'hairFront.golden-part', 'kid-clean': 'hairFront.kid-clean',
  'face-fit-short': 'hairFront.face-fit-short', 'eye-veil': 'hairFront.eye-veil',
  'korean-wolf': 'hairFront.korean-wolf', 'swept-spikes': 'hairFront.swept-spikes',
  'curtain-gold': 'hairFront.curtain-gold',
};
export const SSR_HAIRSTYLES = Object.keys(SSR_HAIR) as HairstyleId[];
/** Expressions drawn as SSR face parts (neutral = no face layer; closed is also the blink). */
export const SSR_FACES: readonly ExpressionId[] = ['neutral', 'cold', 'sad', 'closed', 'violet-sharp', 'teal-soft', 'cold-detached'];
export const SSR_BODY = 'body.medium-novice', SSR_SKIN = 'headBase.skin';

/** Phase 4 switch, default on. Off: ?rig=legacy in the URL or localStorage "shaman.rig" = "legacy". */
export function ssrEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (new URLSearchParams(window.location.search).get('rig') === 'legacy') return false;
    return window.localStorage.getItem('shaman.rig') !== 'legacy';
  } catch { return true; }
}
