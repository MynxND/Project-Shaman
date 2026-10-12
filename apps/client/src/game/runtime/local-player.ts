import type { Facing, Position } from '@shaman/shared';

// Read-only access to player positions for HUD widgets (minimap, world map, coordinates). Positions change every
// frame, so they are not put in Zustand; widgets poll this at a low rate instead.
export interface PlayersSnapshot {
  self: (Position & { facing: Facing }) | null;
  others: Position[];
  /** Players in the room, including the local player. */
  count: number;
}

let probe: (() => PlayersSnapshot) | null = null;

export function setPlayersProbe(fn: (() => PlayersSnapshot) | null) { probe = fn; }
export function readPlayers(): PlayersSnapshot { return probe?.() ?? { self: null, others: [], count: 0 }; }
export function readLocalPlayer(): Position | null { const s = readPlayers().self; return s ? { x: s.x, y: s.y } : null; }

// Read-only monster lookup for the HUD target frame (polled at a low rate, like the players probe).
export interface MonsterSnapshot { kind: string; hp: number; hpMax: number; dead: boolean }
let monsterProbe: ((id: string) => MonsterSnapshot | null) | null = null;
export function setMonsterProbe(fn: ((id: string) => MonsterSnapshot | null) | null) { monsterProbe = fn; }
export function readMonster(id: string): MonsterSnapshot | null { return monsterProbe?.(id) ?? null; }

// Attack button / Q: the scene engages the selected monster, else the nearest living one (walks into reach first).
// Returns false when there is nothing to attack.
let attackProbe: (() => boolean) | null = null;
export function setAttackProbe(fn: (() => boolean) | null) { attackProbe = fn; }
export function engageTarget(): boolean { return attackProbe?.() ?? false; }
