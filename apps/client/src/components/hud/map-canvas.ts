import { facingAngle, worldToView, type MapDefinition, type Rect } from '@shaman/shared';
import type { PlayersSnapshot } from '@/game/runtime/local-player';

const GROUND: Record<string, string> = { 'dark-earth': '#3a3027', 'basalt-cobble': '#625c54', 'dark-grass': '#33452f', 'ritual-paving': '#8a7655' };

export interface MapDrawOptions {
  map: MapDefinition;
  /** Map picture from the scene (null until it is rendered): falls back to flat ground and footprints. */
  art: HTMLImageElement | null;
  rect: Rect;
  /** View size in CSS px; the canvas backing store is this times devicePixelRatio. */
  width: number;
  height: number;
  players: PlayersSnapshot;
  /** Draw landmark names (world map) or only their markers (minimap). */
  labels: boolean;
}

/** Fallback when the scene has not produced the map picture yet: ground regions and object footprints. */
function drawFlat(ctx: CanvasRenderingContext2D, map: MapDefinition) {
  ctx.fillStyle = GROUND[map.ground.base] ?? '#3a3027';
  ctx.fillRect(0, 0, map.width, map.height);
  for (const r of map.ground.regions) { ctx.fillStyle = GROUND[r.material] ?? '#4a4038'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  ctx.fillStyle = '#1d1714';
  for (const o of map.objects) if (o.footprint) ctx.fillRect(o.x - o.footprint.w / 2, o.y - o.footprint.h, o.footprint.w, o.footprint.h);
}

/** Draws one frame of a map view: picture, landmarks, other players and the local player's arrow. */
export function drawMapView(canvas: HTMLCanvasElement, o: MapDrawOptions) {
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.max(1, Math.round(o.width * dpr)), ph = Math.max(1, Math.round(o.height * dpr));
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#1a1512';
  ctx.fillRect(0, 0, pw, ph);

  // World layer: one canvas unit = one world unit.
  const k = (o.width / o.rect.w) * dpr;
  ctx.setTransform(k, 0, 0, k, -o.rect.x * k, -o.rect.y * k);
  if (o.art) {
    // Smooth when shrinking the picture, pixel-crisp when enlarging it.
    ctx.imageSmoothingEnabled = k < o.art.width / o.map.width;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(o.art, 0, 0, o.map.width, o.map.height);
  } else drawFlat(ctx, o.map);

  // Marker layer in CSS px.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const at = (p: { x: number; y: number }) => worldToView(o.rect, p, o.width, o.height);
  // Labels in list order; one that would overlap an earlier label is skipped (it appears when zoomed in).
  const placed: { l: number; t: number; r: number; b: number }[] = [];
  for (const l of o.map.landmarks ?? []) {
    const p = at(l);
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#25201d'; ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = l.kind === 'shop' || l.kind === 'market' ? '#5f9d8b' : '#c4573f'; ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = '#f3dfb0'; ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.restore();
    if (o.labels) {
      ctx.font = `700 12px ${getComputedStyle(canvas).getPropertyValue('--sk-font') || 'sans-serif'}`;
      const half = ctx.measureText(l.name.th).width / 2 + 3;
      const box = { l: p.x - half, r: p.x + half, t: p.y - 24, b: p.y - 6 };
      if (placed.some((q) => box.l < q.r && q.l < box.r && box.t < q.b && q.t < box.b)) continue;
      placed.push(box);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = '#120f0d'; ctx.lineJoin = 'round';
      ctx.strokeText(l.name.th, p.x, p.y - 8);
      ctx.fillStyle = '#f6e7c1'; ctx.fillText(l.name.th, p.x, p.y - 8);
    }
  }
  // Town NPCs: yellow "!" for quest givers, small amber dots for everyone else.
  for (const n of o.map.npcs ?? []) {
    const p = at(n);
    if (n.role === 'quest') {
      ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = '#120f0d'; ctx.strokeText('!', p.x, p.y - 2);
      ctx.fillStyle = '#ffd84a'; ctx.fillText('!', p.x, p.y - 2);
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#120f0d'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#f3b54a'; ctx.fill();
    }
  }
  for (const other of o.players.others) {
    const p = at(other);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#120f0d'; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#8fd8ff'; ctx.fill();
  }
  const self = o.players.self;
  if (self) {
    const p = at(self);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((facingAngle(self.facing) * Math.PI) / 180);
    // Arrowhead pointing east before rotation.
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = '#120f0d'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#f3d27a'; ctx.fill();
    ctx.restore();
  }
}
