import Phaser from 'phaser';

type Point = { x: number; y: number };
type Ritual = 'koschei' | 'maiyarap' | 'calon';
export interface RitualFootprint {
  shape: string; x: number; y: number; ex: number; ey: number;
  radius: number; width: number; angle: number; arc: number;
}

/** Cosmetic clipping only; combat continues to use the shared server policy. */
export function insideRitual(h: RitualFootprint, p: Point): boolean {
  if (h.shape === 'capsule' || h.shape === 'charge') {
    const dx = h.ex - h.x, dy = h.ey - h.y;
    const t = Math.max(0, Math.min(1, ((p.x - h.x) * dx + (p.y - h.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p.x - h.x - dx * t, p.y - h.y - dy * t) <= h.width;
  }
  if (Math.hypot(p.x - h.x, p.y - h.y) > h.radius) return false;
  return h.shape !== 'sector' || Math.abs(Math.atan2(Math.sin(Math.atan2(p.y - h.y, p.x - h.x) - h.angle), Math.cos(Math.atan2(p.y - h.y, p.x - h.x) - h.angle))) <= h.arc / 2;
}

/** Ground ornament only: inputs are the already padded authoritative footprint in pixels. */
export function ritualPerimeter(h: RitualFootprint): Point[] {
  const p: Point[] = [];
  const arc = (x: number, y: number, r: number, start: number, sweep: number, count: number) => {
    for (let i = 0; i <= count; i++) {
      const a = start + sweep * i / count;
      p.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
    }
  };
  if (h.shape === 'capsule' || h.shape === 'charge') {
    const a = Math.atan2(h.ey - h.y, h.ex - h.x);
    arc(h.ex, h.ey, h.width, a - Math.PI / 2, Math.PI, 24);
    arc(h.x, h.y, h.width, a + Math.PI / 2, Math.PI, 24);
  } else if (h.shape === 'sector') {
    p.push({ x: h.x, y: h.y });
    arc(h.x, h.y, h.radius, h.angle - h.arc / 2, h.arc, 64);
  } else arc(h.x, h.y, h.radius, 0, Math.PI * 2, 96);
  return p;
}

/** No organic effects, local timers or new GameObjects. The fixed outer edge remains untouched. */
export function drawRitualWarning(g: Phaser.GameObjects.Graphics, h: RitualFootprint, theme: Ritual, charge: number) {
  const p = ritualPerimeter(h), cold = theme === 'koschei';
  const ink = cold ? 0x111c29 : 0x102b27, metal = cold ? 0xb6c8ce : 0xd2b775;
  const accent = cold ? 0x718da6 : theme==='calon'?0x8a9b66:0x72a68e;
  const t = Math.max(0, Math.min(1, charge));
  const line = (a: Point, b: Point, color: number, alpha: number, width = 1.5) => {
    // Inset joins and motifs must not cross a sector's safe wedge or capsule end.
    if (![0, .25, .5, .75, 1].every(q => insideRitual(h, { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q }))) return;
    g.lineStyle(width, color, alpha).beginPath().moveTo(a.x, a.y).lineTo(b.x, b.y).strokePath();
  };
  const motif = (points: Point[], color: number, alpha: number, width = 1.5) => {
    for (let i = 0; i < points.length; i++) line(points[i]!, points[(i + 1) % points.length]!, color, alpha, width);
  };
  let total = 0;
  for (let i = 0; i < p.length; i++) total += Math.hypot(p[(i + 1) % p.length]!.x - p[i]!.x, p[(i + 1) % p.length]!.y - p[i]!.y);
  let distance = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!, b = p[(i + 1) % p.length]!, length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < .001) continue;
    const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
    // Positive winding: left normal points inside, including the radial edges of wide sectors.
    const at = (d: number, inset: number): Point => ({ x: a.x + ux * d - uy * inset, y: a.y + uy * d + ux * inset });
    line(at(0, 4), at(length, 4), ink, .8, 5);
    line(at(0, 5), at(length, 5), accent, .48);
    const traced = Math.max(0, Math.min(length, total * t - distance));
    if (traced > 0) line(at(0, 3), at(traced, 3), metal, .9, 2);
    for (let d = (28 - distance % 28) % 28; d < length; d += 28) {
      const points = cold
        ? [at(d - 4, 7), at(d, 4), at(d + 4, 7), at(d, 10)]
        : [at(d - 5, 6), at(d, 11), at(d + 5, 6), at(d, 3)];
      motif(points, metal, .55 + .35 * t);
      if (cold) line(at(d, 11), at(d, 17), accent, .7);
      else line(at(d - 4, 12), at(d + 4, 12), accent, .7);
    }
    distance += length;
  }
  // Finale uses the established refuge mark; never stamp over the safe pocket.
  if (h.shape === 'finale' || h.shape === 'ring') return;
  const lane = h.shape === 'capsule' || h.shape === 'charge';
  const a = lane ? Math.atan2(h.ey - h.y, h.ex - h.x) : h.shape === 'sector' ? h.angle : 0;
  const cx = lane ? (h.x + h.ex) / 2 : h.x + Math.cos(a) * h.radius * .66;
  const cy = lane ? (h.y + h.ey) / 2 : h.y + Math.sin(a) * h.radius * .66;
  const size = Math.min(24, lane ? h.width * .45 : h.radius * .16);
  if (size < 5) return;
  const pt = (x: number, y: number): Point => ({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) });
  if (cold) {
    // Needle through a chained lozenge: mortality imprisoned, not Japanese ofuda.
    motif([pt(-size, 0), pt(0, -size * .55), pt(size, 0), pt(0, size * .55)], metal, .8, 2);
    line(pt(-size * 1.3, 0), pt(size * 1.3, 0), metal, .9, 2);
    line(pt(size * .95, -4), pt(size * 1.3, 0), accent, .9);
    line(pt(size * .95, 4), pt(size * 1.3, 0), accent, .9);
  } else if(theme==='calon'){
    // Original Javanese-inspired six-petal floral ward, not borrowed Thai lotus script.
    for(let j=0;j<6;j++){const q=j*Math.PI/3,tip=pt(Math.cos(q)*size,Math.sin(q)*size);line(pt(0,0),tip,metal,.65);const left=pt(Math.cos(q-.25)*size*.65,Math.sin(q-.25)*size*.65),right=pt(Math.cos(q+.25)*size*.65,Math.sin(q+.25)*size*.65);motif([pt(0,0),left,tip,right],accent,.8);}
  } else {
    // Woven four-petal lotus seal, kept small enough to leave actor silhouettes readable.
    for (let j = 0; j < 4; j++) {
      const q = j * Math.PI / 2;
      const petal = (x: number, y: number) => pt(x * Math.cos(q) - y * Math.sin(q), x * Math.sin(q) + y * Math.cos(q));
      motif([petal(0, 0), petal(size * .6, -size * .3), petal(size, 0), petal(size * .6, size * .3)], metal, .8);
    }
    g.fillStyle(accent, .65).fillCircle(cx, cy, 3);
  }
}
