import type { Facing } from '@shaman/shared';

// Presentation-only resting carry (RO-style readable weapons) per equipment category and facing. Gameplay never reads
// it. `tilt` leans the item away from the body around its grip (radians), `view` borrows another facing's art
// (side views are edge-on strips), `layer` overrides the hand's side. Never translate a grip away from the hand.
// Attack frames blend out of this pose and back into it (carryWeight in v3-weapon.ts), so idle → attack never snaps.

export type CarryLayer = 'front' | 'back';
export interface CarryPose { view?: Facing; tilt?: number; layer?: CarryLayer }
export interface CarryProfile { scale: number; poses: Partial<Record<Facing, CarryPose>> }

export const CARRY_PROFILES: Readonly<Record<string, CarryProfile>> = {
  axe: { scale: 1.2, poses: {
    'south-east': { tilt: 0.45 }, east: { view: 'south-east', tilt: 0.3 }, 'north-east': { tilt: 0.3 }, north: { tilt: 0.25 },
    'north-west': { tilt: 0.3 }, west: { view: 'south-west', tilt: 0.3 }, 'south-west': { tilt: 0.45 },
  } },
  shield: { scale: 1.15, poses: {
    east: { view: 'south-east', tilt: 0.25 }, west: { view: 'south-west', tilt: 0.25 },
  } },
  'axe-twohand': { scale: 1.15, poses: {
    'south-east': { tilt: 0.45 }, east: { view: 'south-east', tilt: 0.25 }, 'north-east': { tilt: 0.25 }, north: { tilt: 0.2 },
    'north-west': { tilt: 0.25 }, west: { view: 'south-west', tilt: 0.25 }, 'south-west': { tilt: 0.45 },
  } },
  // Long items in the far hand on the camera diagonals lean out past the body instead of hiding behind it.
  staff: { scale: 1.05, poses: { 'south-east': { tilt: 0.35 }, 'south-west': { tilt: 0.35 } } },
  wand: { scale: 1.1, poses: { 'south-east': { tilt: 0.4 }, 'south-west': { tilt: 0.4 } } },
  bow: { scale: 1, poses: { 'south-east': { tilt: 0.45 }, east: { view: 'south-east', tilt: 0.2 }, west: { view: 'south-west', tilt: 0.2 }, 'south-west': { tilt: 0.5 } } },
  // Short items cannot lean clear of the body, so on the views that hide them they are carried in front.
  fan: { scale: 1.3, poses: {
    'south-east': { layer: 'front' }, east: { view: 'south-east', layer: 'front' }, west: { view: 'south-west', layer: 'front' }, 'south-west': { layer: 'front' },
  } },
  knife: { scale: 1.3, poses: {
    'south-east': { layer: 'front', tilt: 0.2 }, east: { view: 'south-east', layer: 'front', tilt: 0.2 }, west: { view: 'south-west', layer: 'front', tilt: 0.2 }, 'south-west': { layer: 'front', tilt: 0.2 },
  } },
  dagger: { scale: 1.25, poses: {
    'south-east': { layer: 'front' }, east: { layer: 'front' }, west: { layer: 'front' }, 'south-west': { layer: 'front' },
  } },
};

const NONE: CarryProfile = { scale: 1, poses: {} };
export const carryProfile = (category: string | undefined): CarryProfile => (category && CARRY_PROFILES[category]) || NONE;

/** Keep the approved south size, and keep the same size throughout each facing's attack. */
export const carryScale = (category: string | undefined, facing: Facing | undefined): number =>
  facing && facing !== 'south' ? carryProfile(category).scale : 1;

/** Rotate around the grip over the shortest arc (including authored angles across ±PI). */
export function carryRotation(swing: number, rest: number, weight: number): number {
  const delta = Math.atan2(Math.sin(rest - swing), Math.cos(rest - swing));
  return swing + delta * weight;
}
