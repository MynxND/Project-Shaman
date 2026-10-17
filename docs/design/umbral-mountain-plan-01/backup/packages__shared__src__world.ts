// World coordinates, map data and movement rules shared by the authoritative server and the client renderer.
import { facingFromVector, type Facing } from './character.js';
import { NPC_FOOTPRINT, type NpcDefinition } from './npc.js';
import type { MovementInput } from './index.js';

/** Pixels per world unit when rendering. Rules and ranges use world units only. */
export const WORLD_UNIT_PX = 32;
/** Map asset sprites are drawn at 2x, so one asset pixel is 2 world pixels (16 asset pixels per unit). */
export const MAP_ASSET_SCALE = 2;

export interface Rect { x: number; y: number; w: number; h: number }

/** A ground material painted over a rectangle (world units). Later regions draw on top. */
export interface GroundRegion extends Rect { material: string }

/**
 * A building or prop. (x, y) is the centre of its base on the ground; the sprite stands up from there.
 * footprint is the blocking rectangle centred on x and extending footprint.h units up from y.
 */
export interface MapObject { id: string; asset: string; x: number; y: number; footprint: { w: number; h: number } | null; /** Mirror the sprite left-right (visual only). */ flip?: boolean;
  /** Draw the sprite this many units above its base (visual only, e.g. a lantern hung from an eave); depth and
   *  footprint still use (x, y). */
  lift?: number }

/** One stroke of terrain paint on the vertex grid: every map vertex inside the shape gets `terrain`. */
export type TerrainPaint =
  | { terrain: string; shape: 'rect'; x: number; y: number; w: number; h: number }
  | { terrain: string; shape: 'circle'; x: number; y: number; r: number }
  /** A winding path: every vertex within `r` of the polyline through `points` ([x, y] pairs). */
  | { terrain: string; shape: 'path'; points: [number, number][]; r: number };

/** Distance from (px, py) to the segment a-b. */
function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Tile-based ground (Umbral Capital v2): one terrain id per map vertex (width+1 x height+1), painted in order over
 * `base`. The client draws each 1x1 cell with the Wang tile matching its four corner terrains.
 */
export interface TerrainLayer { base: string; paint: TerrainPaint[] }

/** A flat ground sprite (mosaic, engraved disc) drawn under every standing thing; (x, y) is its centre. */
export interface MapDecal { id: string; asset: string; x: number; y: number }

/** A named place shown on the minimap and world map (world units, the label's anchor). */
export interface MapLandmark { id: string; name: { th: string; en: string }; x: number; y: number; kind: 'temple' | 'plaza' | 'school' | 'shop' | 'market' | 'gate' | 'garden' | 'quarter' | 'village' | 'forest' | 'shrine' }

export interface MapDefinition {
  id: string;
  name: string;
  /** English sub-name for UI captions. */
  nameEn?: string;
  /** Named places for the map UI; provisional names, see the map's design doc. */
  landmarks?: MapLandmark[];
  /** Optional tile terrain; when present it is drawn instead of `ground`. */
  terrain?: TerrainLayer;
  /** Optional flat ground sprites. */
  decals?: MapDecal[];
  /** Town NPCs (static; their small bases are collision). */
  npcs?: NpcDefinition[];
  /** Full map size in world units. */
  width: number;
  height: number;
  spawn: { x: number; y: number };
  ground: { base: string; regions: GroundRegion[] };
  objects: MapObject[];
  /** Invisible blocking rectangles, e.g. gate pillars where the sprite itself must stay passable. */
  blockers: Rect[];
  /** Walk-in travel triggers to another map (server-validated). */
  portals?: MapPortal[];
  /** Areas where monsters never spawn, chase or attack (arrival village, portals). */
  safeZones?: Rect[];
  /** Explicit monster spawn regions; monsters never spawn outside them. */
  spawnRegions?: SpawnRegion[];
}

/** Stepping into `area` sends the player to `to` on another map. `arrival` is where players coming back land. */
export interface MapPortal {
  id: string;
  area: Rect;
  to: { mapId: string; portalId: string };
  /** Safe arrival point for players arriving through this portal (outside `area`, so no loop). */
  arrival: Position;
  label: { th: string; en: string };
}

/** A monster spawn region (world units). Spawn points are picked inside `area` and must be walkable. */
export interface SpawnRegion {
  id: string;
  area: Rect;
  monsters: { kind: string; count: number }[];
  /** Respawn delay after a death (ms). */
  respawnMs: number;
}

export const pointInRect = (p: Position, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Players stay this far inside the map edge. */
export const MAP_EDGE_MARGIN = 0.5;

/** World units per second. */
export const WALK_SPEED = 4;

export interface Position { x: number; y: number }

export function footprintRect(object: MapObject): Rect | null {
  if (!object.footprint) return null;
  const { w, h } = object.footprint;
  return { x: object.x - w / 2, y: object.y - h, w, h };
}

/** True when a point (a character's feet) cannot stand there: off the map or inside a footprint. */
export function isBlocked(map: MapDefinition, x: number, y: number): boolean {
  if (x < MAP_EDGE_MARGIN || y < MAP_EDGE_MARGIN || x > map.width - MAP_EDGE_MARGIN || y > map.height - MAP_EDGE_MARGIN) return true;
  const inside = (r: Rect | null) => r !== null && x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  const npc = (n: NpcDefinition): Rect => ({ x: n.x - NPC_FOOTPRINT.w / 2, y: n.y - NPC_FOOTPRINT.h, w: NPC_FOOTPRINT.w, h: NPC_FOOTPRINT.h });
  return map.objects.some((object) => inside(footprintRect(object))) || map.blockers.some(inside) || (map.npcs ?? []).some((n) => inside(npc(n)));
}

/** Largest correction a client stop may apply: about 0.25 s of walking, enough to cover network latency. */
export const MAX_STOP_CORRECTION = WALK_SPEED * 0.25;

/**
 * Where the server should rest a player that sent a stop with a predicted resting point: the client's point
 * when it is within MAX_STOP_CORRECTION of the server position and walkable, otherwise the server position.
 */
export function acceptStopAt(server: Position, stopAt: Position | undefined, map: MapDefinition): Position {
  const here = { x: server.x, y: server.y };
  if (!stopAt) return here;
  if (Math.hypot(stopAt.x - here.x, stopAt.y - here.y) > MAX_STOP_CORRECTION) return here;
  return isBlocked(map, stopAt.x, stopAt.y) ? here : { x: stopAt.x, y: stopAt.y };
}

/**
 * Advances a position by one movement input over dtSeconds. Diagonals are normalised so they are
 * never faster than straight movement. A blocked move slides along the obstacle (x-only, then
 * y-only) or stops. Returns the facing implied by the input, or null when the input is idle.
 */
export function stepMovement(position: Position, input: MovementInput, dtSeconds: number, map: MapDefinition): { position: Position; facing: Facing | null } {
  // Copy fields explicitly: callers pass Colyseus schema instances whose x/y are prototype getters,
  // which object spread would drop.
  const here = { x: position.x, y: position.y };
  const length = Math.hypot(input.x, input.y);
  if (length === 0) return { position: here, facing: null };
  const scale = WALK_SPEED * dtSeconds / Math.max(1, length);
  const dx = input.x * scale, dy = input.y * scale;
  const candidates: Position[] = [
    { x: here.x + dx, y: here.y + dy },
    { x: here.x + dx, y: here.y },
    { x: here.x, y: here.y + dy },
  ];
  const next = candidates.find((c) => (c.x !== here.x || c.y !== here.y) && !isBlocked(map, c.x, c.y)) ?? here;
  return { position: next, facing: facingFromVector(input.x, input.y) };
}

/** Terrain id at every vertex of the map grid, row by row ((width + 1) * (height + 1) entries). */
export function terrainVertices(map: Pick<MapDefinition, 'width' | 'height' | 'terrain'>): string[] {
  const w = map.width + 1, h = map.height + 1;
  const out = new Array<string>(w * h).fill(map.terrain?.base ?? '');
  for (const p of map.terrain?.paint ?? []) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const inside = p.shape === 'rect'
          ? x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h
          : p.shape === 'circle'
            ? (x - p.x) ** 2 + (y - p.y) ** 2 <= p.r * p.r
            : p.points.some((a, i) => { const b = p.points[i + 1] ?? a; return segmentDistance(x, y, a[0], a[1], b[0], b[1]) <= p.r; });
        if (inside) out[y * w + x] = p.terrain;
      }
    }
  }
  return out;
}

/** The four corner terrains [NW, NE, SW, SE] of cell (cx, cy). */
export function cellCorners(vertices: readonly string[], width: number, cx: number, cy: number): [string, string, string, string] {
  const w = width + 1;
  const at = (x: number, y: number) => vertices[y * w + x] ?? '';
  return [at(cx, cy), at(cx + 1, cy), at(cx, cy + 1), at(cx + 1, cy + 1)];
}

