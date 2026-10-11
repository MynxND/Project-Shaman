import type { StickVector } from '@shaman/shared';

// Direction held on the on-screen joystick (a React HUD control). The movement controller reads it every frame,
// like a held key; it is not put in Zustand because it changes at pointer rate.
let direction: StickVector = { x: 0, y: 0 };

export function setTouchDirection(next: StickVector) { direction = next; }
export function readTouchDirection(): StickVector { return direction; }
