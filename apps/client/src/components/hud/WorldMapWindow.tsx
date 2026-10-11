'use client';
import { useEffect, useRef, useState } from 'react';
import { coverZoom, mapViewRect, MAP_ZOOMS, stepZoom, viewToWorld, type Position } from '@shaman/shared';
import { useActiveMap } from '@/stores/session-store';
import { useHudStore } from '@/stores/hud-store';
import { drawMapView } from './map-canvas';
import { MapFooter } from './MapFooter';
import { useMapData } from './use-map-data';

const MAX_ZOOM = MAP_ZOOMS[MAP_ZOOMS.length - 1] ?? 4;
/** Fill the view on open when showing the whole map would leave more than about a third of it empty. */
const COVER_THRESHOLD = 1.5;

/**
 * World map window (M, the แผนที่ menu or the minimap's expand button): the whole map with landmark names.
 * Drag to pan, wheel / pinch / buttons to zoom; it follows the player until panned, "ตำแหน่งฉัน" re-centres.
 */
export function WorldMapWindow() {
  const MAP = useActiveMap();
  const close = useHudStore((s) => s.toggleMap);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Position | null>(null); // null = follow the player
  const pointers = useRef(new Map<number, Position>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const { art, players } = useMapData();
  const aspect = size.h > 0 ? size.w / size.h : 4 / 3;
  const focus = center ?? players.self ?? MAP.spawn;
  const rect = mapViewRect(MAP, focus, zoom, aspect);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      // Open showing the whole city, unless the view's shape would leave large empty bars (phones): then fill it.
      // The user can still zoom out to the whole map.
      if (first && el.clientHeight > 0) {
        first = false;
        const cover = coverZoom(MAP, el.clientWidth / el.clientHeight);
        setZoom(cover > COVER_THRESHOLD ? Math.min(MAX_ZOOM, cover) : 1);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (el && size.w > 0) drawMapView(el, { map: MAP, art, rect, width: size.w, height: size.h, players, labels: true });
  });

  // Zoom keeping the world point under (vx, vy) fixed on screen.
  const zoomAt = (next: number, vx: number, vy: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(1, next));
    const anchor = viewToWorld(rect, { x: vx, y: vy }, size.w, size.h);
    const after = mapViewRect(MAP, focus, clamped, aspect);
    const w = after.w, h = after.h;
    setCenter({ x: anchor.x - (vx / size.w - 0.5) * w, y: anchor.y - (vy / size.h - 0.5) * h });
    setZoom(clamped);
  };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(stepZoom(zoom, e.deltaY < 0 ? 1 : -1), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom };
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const r = e.currentTarget.getBoundingClientRect();
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      zoomAt(pinch.current.zoom * (d / pinch.current.dist), (a!.x + b!.x) / 2 - r.left, (a!.y + b!.y) / 2 - r.top);
      return;
    }
    // Drag pans: move the centre opposite to the finger, in world units.
    const dx = ((e.clientX - prev.x) / size.w) * rect.w, dy = ((e.clientY - prev.y) / size.h) * rect.h;
    if (dx !== 0 || dy !== 0) setCenter({ x: rect.x + rect.w / 2 - dx, y: rect.y + rect.h / 2 - dy });
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <section className="hud-panel hud-worldmap sk-center-window pointer-events-auto" role="dialog" aria-label={`แผนที่ ${MAP.name}`}>
      <header className="hud-map-head">
        <div className="hud-map-zoom" role="group" aria-label="ซูมแผนที่">
          <button type="button" className="hud-mini-btn" onClick={() => zoomAt(stepZoom(zoom, -1), size.w / 2, size.h / 2)} disabled={zoom <= 1} aria-label="ซูมออก">−</button>
          <span className="hud-map-zoom-label">{Math.round(zoom * 100)}%</span>
          <button type="button" className="hud-mini-btn" onClick={() => zoomAt(stepZoom(zoom, 1), size.w / 2, size.h / 2)} disabled={zoom >= MAX_ZOOM} aria-label="ซูมเข้า">+</button>
        </div>
        <img className="hud-map-compass sk-pixel" src="/assets/ui/hud/fold/map.png" alt="" width={32} height={32} />
        <div className="hud-map-zoom">
          <button type="button" className="hud-map-btn" onClick={() => setCenter(null)} aria-pressed={center === null} title="กลับไปที่ตำแหน่งของคุณ">⌖ ตำแหน่งฉัน</button>
          <button type="button" className="hud-mini-btn" onClick={close} aria-label="ปิดแผนที่">✕</button>
        </div>
      </header>
      <canvas ref={canvas} className="hud-worldmap-canvas" role="img" aria-label="แผนที่เมือง ลากเพื่อเลื่อน ใช้ล้อเมาส์หรือสองนิ้วเพื่อซูม"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} />
      <div className="hud-map-legend" aria-hidden>
        <span><i className="hud-lg-self" />คุณ</span><span><i className="hud-lg-other" />ผู้เล่นอื่น</span>
        <span><i className="hud-lg-place" />สถานที่</span><span><i className="hud-lg-shop" />ร้านค้า</span>
        <span className="hud-map-hint">ลากเพื่อเลื่อน · ล้อเมาส์/สองนิ้วเพื่อซูม</span>
      </div>
      <MapFooter map={MAP} players={players} />
    </section>
  );
}
