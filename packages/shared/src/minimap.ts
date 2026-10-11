// Map UI geometry shared by the minimap and the world map window: which part of the map is visible at a zoom
// level, and where world points land in the view. Pure so it can be tested without a browser.
import type { Facing } from './character.js';
import type { Position, Rect } from './world.js';

/** Zoom steps; 1 shows the whole map, larger numbers show a smaller area around the centre. */
export const MAP_ZOOMS = [1, 1.5, 2, 3, 4] as const;

/**
 * Visible area (world units) of a `aspect` = width / height viewport at `zoom`, centred on `center` and kept inside
 * the map. At zoom 1 the whole map fits (letterboxed on the longer axis), so that axis is centred instead.
 */
export function mapViewRect(map: { width: number; height: number }, center: Position, zoom: number, aspect: number): Rect {
  const fitW = Math.max(map.width, map.height * aspect);
  const w = fitW / Math.max(1, zoom);
  const h = w / aspect;
  const axis = (c: number, size: number, limit: number) => (size >= limit ? (limit - size) / 2 : Math.min(Math.max(c - size / 2, 0), limit - size));
  return { x: axis(center.x, w, map.width), y: axis(center.y, h, map.height), w, h };
}

/** Zoom at which the map fills a view of `aspect` with no letterbox bars (at least 1). */
export function coverZoom(map: { width: number; height: number }, aspect: number): number {
  return Math.max(map.width, map.height * aspect) / Math.min(map.width, map.height * aspect);
}

/** Next zoom step in `dir` (+1 in, -1 out), clamped to MAP_ZOOMS; an off-list zoom snaps to the nearest step first. */
export function stepZoom(zoom: number, dir: 1 | -1): number {
  let i = 0;
  MAP_ZOOMS.forEach((z, k) => { if (Math.abs(z - zoom) < Math.abs((MAP_ZOOMS[i] ?? 1) - zoom)) i = k; });
  return MAP_ZOOMS[Math.min(MAP_ZOOMS.length - 1, Math.max(0, i + dir))] ?? 1;
}

/** World point -> view pixel for a view of `viewW` x `viewH` px showing `rect`. */
export function worldToView(rect: Rect, p: Position, viewW: number, viewH: number): Position {
  return { x: ((p.x - rect.x) / rect.w) * viewW, y: ((p.y - rect.y) / rect.h) * viewH };
}

/** View pixel -> world point (inverse of worldToView). */
export function viewToWorld(rect: Rect, p: Position, viewW: number, viewH: number): Position {
  return { x: rect.x + (p.x / viewW) * rect.w, y: rect.y + (p.y / viewH) * rect.h };
}

/** Screen angle in degrees (0 = east, 90 = south, y down) for a facing, for the player arrow. */
export function facingAngle(facing: Facing): number {
  const angles: Record<Facing, number> = { east: 0, 'south-east': 45, south: 90, 'south-west': 135, west: 180, 'north-west': 225, north: 270, 'north-east': 315 };
  return angles[facing];
}
