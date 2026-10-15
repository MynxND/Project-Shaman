import type { MapDefinition, Position, Rect } from './world.js';
export interface ElevationTransition extends Rect { id: string; axis: 'x'|'y'; start: number; end: number; kind: 'stairs'|'ramp'; middleLanding?: number }
export type TerrainPolygon = readonly (readonly [number, number])[];
/** Boundary-inclusive containment; coordinates are world units, never projected pixels. */
export function pointInTerrainPolygon(x: number, y: number, points: TerrainPolygon): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j]!, b = points[i]!;
    const cross = (x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
    if (Math.abs(cross) < 1e-8 && x >= Math.min(a[0],b[0]) && x <= Math.max(a[0],b[0]) && y >= Math.min(a[1],b[1]) && y <= Math.max(a[1],b[1])) return true;
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export interface ElevationDefinition { transitions: ElevationTransition[]; terraces: Array<Rect & { level: number }>; risePx: number; artPass?: boolean;
  /** Opt-in polygon terrain. Regions are ordered highest/most specific first. */
  regions?: Array<{ id: string; level: number; points: TerrainPolygon }>;
}
export function terrainHeight(map: MapDefinition, x: number, y: number): number {
  if (!map.elevation) return 0;
  const t = map.elevation.transitions.find(t => x >= t.x && x <= t.x+t.w && y >= t.y && y <= t.y+t.h);
  if (t) {
    const p = t.axis==='y' ? (y-t.y)/t.h : (x-t.x)/t.w;
    const landing = t.middleLanding ?? 0, firstEnd = (1-landing)/2, secondStart = (1+landing)/2;
    const progress = landing ? (p<firstEnd ? p/(1-landing) : p<secondStart ? .5 : .5+(p-secondStart)/(1-landing)) : p;
    return t.start+(t.end-t.start)*progress;
  }
  return map.elevation.regions?.find(r => pointInTerrainPolygon(x,y,r.points))?.level
    ?? map.elevation.terraces.find(r => x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h)?.level ?? 0;
}
export function elevationPassage(map: MapDefinition, a: Position, b: Position): boolean {
  if (!map.elevation) return true;
  const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/0.025));
  let prev=a, h=terrainHeight(map,a.x,a.y);
  for(let i=1;i<=n;i++) {
    const p={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};
    const next=terrainHeight(map,p.x,p.y);
    if(Math.abs(next-h)>0.035) return false;
    // Transition side walls remain closed except at the endpoint landing lines.
    for(const t of map.elevation.transitions) {
      const inside=(q:Position)=>q.x>t.x&&q.x<t.x+t.w&&q.y>t.y&&q.y<t.y+t.h;
      if(inside(prev)!==inside(p)) {
        const q=inside(p)?p:prev,progress=t.axis==='y'?(q.y-t.y)/t.h:(q.x-t.x)/t.w;
        if(progress>0.015&&progress<0.985)return false;
      }
    }
    prev=p;h=next;
  }
  return true;
}
export function projectedY(map: MapDefinition,x:number,y:number):number { return y*32-terrainHeight(map,x,y)*(map.elevation?.risePx??0); }
