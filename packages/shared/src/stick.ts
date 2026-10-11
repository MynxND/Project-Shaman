// Virtual joystick → movement intent. The stick is snapped to the same 8 directions the keyboard produces, so the
// server rules, facing and 8-direction animations behave identically for touch and keyboard players.

export interface StickVector { x: -1 | 0 | 1; y: -1 | 0 | 1 }

/** Clockwise from east, screen y pointing down. */
const SECTORS: readonly StickVector[] = [
  { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
  { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
];

/**
 * Direction for a knob offset (dx, dy) in pixels from the stick centre. Offsets shorter than `deadzone` × `radius`
 * mean "no input"; otherwise the angle is rounded to the nearest of 8 directions (45° sectors).
 */
export function stickDirection(dx: number, dy: number, radius: number, deadzone = 0.25): StickVector {
  if (!(radius > 0) || Math.hypot(dx, dy) < radius * deadzone) return { x: 0, y: 0 };
  const sector = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  return SECTORS[sector] ?? { x: 0, y: 0 };
}

/** Clamps a knob offset to the stick radius, keeping its direction. */
export function clampStick(dx: number, dy: number, radius: number): { dx: number; dy: number } {
  const len = Math.hypot(dx, dy);
  return len <= radius || len === 0 ? { dx, dy } : { dx: (dx / len) * radius, dy: (dy / len) * radius };
}
