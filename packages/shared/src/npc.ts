// Service NPCs stay at authored map positions; their footprints participate in shared collision.
// Services run on the server against a session-only profile. Economy and progression remain provisional.
// Ambient citizens use the separate citizen simulation and have no interaction or collision footprint.
import type { Position } from './world.js';

export type NpcRole =
  | 'guide' | 'quest' | 'trainer' | 'shop-consumable' | 'shop-equipment' | 'exchange'
  | 'storage' | 'refine' | 'teleport' | 'guard' | 'save'
  /** Heals only (outpost healers; the save point stays at the capital's shrine). */
  | 'healer';

export interface NpcDefinition {
  id: string;
  /** Sprite id in the client map manifest. */
  sprite: string;
  name: { th: string; en: string };
  /** Short title shown under the name, e.g. "ร้านยา". */
  title: string;
  role: NpcRole;
  x: number;
  y: number;
  /** Opening line of the dialog. */
  greeting: string;
}

/** Players must stand this close (world units) to talk to an NPC. */
export const NPC_TALK_RANGE = 2.6;
/** Collision half-size of an NPC (they stand on a small base like props). */
export const NPC_FOOTPRINT = { w: 0.8, h: 0.5 };

/** Nearest NPC within NPC_TALK_RANGE of `p`, or null. */
export function nearestNpc(npcs: readonly NpcDefinition[], p: Position, range = NPC_TALK_RANGE): NpcDefinition | null {
  let best: NpcDefinition | null = null;
  let bestD = range;
  for (const n of npcs) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d <= bestD) { best = n; bestD = d; }
  }
  return best;
}
