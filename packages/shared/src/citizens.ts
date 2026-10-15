import { elevationPassage } from './elevation.js';
import { isBlocked, type MapDefinition, type Position } from './world.js';

/** Ambient townspeople are visual citizens, not service NPCs or collision obstacles. */
export interface CitizenDefinition {
  id: string;
  appearance: 'child' | 'elder';
  route: [Position, Position];
  speed: number;
  pause: number;
  startAtEnd?: boolean;
}

// Authored pedestrian lanes; keep entrances, NPC service spots and waterways clear.
export const UMBRAL_CITIZENS: readonly CitizenDefinition[] = [
  { id: 'plaza-child', appearance: 'child', route: [{ x: 34, y: 39.8 }, { x: 46, y: 39.8 }], speed: 1.8, pause: 1.4 },
  { id: 'school-child', appearance: 'child', route: [{ x: 11, y: 32.4 }, { x: 26, y: 32.4 }], speed: 1.65, pause: 2, startAtEnd: true },
  { id: 'market-child', appearance: 'child', route: [{ x: 55, y: 33.8 }, { x: 70, y: 33.8 }], speed: 1.7, pause: 1.8 },
  { id: 'brahmin-elder', appearance: 'elder', route: [{ x: 58, y: 20.5 }, { x: 70, y: 20.5 }], speed: 0.8, pause: 3, startAtEnd: true },
  { id: 'shaman-elder', appearance: 'elder', route: [{ x: 19, y: 47.2 }, { x: 29, y: 47.2 }], speed: 0.75, pause: 3.5 },
];

export interface CitizenMotion extends Position {
  facing: 'east' | 'west';
  moving: boolean;
  target: 0 | 1;
  wait: number;
}
export function createCitizenMotion(def: CitizenDefinition): CitizenMotion {
  const start = def.startAtEnd ? 1 : 0;
  return { ...def.route[start], target: start === 0 ? 1 : 0, wait: def.pause,
    facing: start === 0 ? 'east' : 'west', moving: false };
}

/** Server simulation; bounded substeps prevent crossing narrow blockers on a delayed tick. */
export function stepCitizen(def: CitizenDefinition, motion: CitizenMotion, delta: number, map: MapDefinition): CitizenMotion {
  const next = { ...motion };
  let remaining = Math.min(0.1, Math.max(0, Number.isFinite(delta) ? delta : 0));
  next.moving = false;
  if (next.wait > 0) {
    const used = Math.min(remaining, next.wait);
    next.wait -= used; remaining -= used;
  }
  while (remaining > 0) {
    const dt = Math.min(remaining, 0.025); remaining -= dt;
    const goal = def.route[next.target];
    const dx = goal.x - next.x, dy = goal.y - next.y, distance = Math.hypot(dx, dy);
    if (distance < 0.001) {
      next.target = next.target === 0 ? 1 : 0; next.wait = def.pause; break;
    }
    const travel = Math.min(distance, def.speed * dt);
    const x = next.x + dx / distance * travel, y = next.y + dy / distance * travel;
    if (isBlocked(map, x, y) || !elevationPassage(map, next, { x, y })) { next.wait = def.pause; break; }
    next.x = x; next.y = y; next.facing = dx >= 0 ? 'east' : 'west'; next.moving = true;
  }
  return next;
}

