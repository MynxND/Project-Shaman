'use client';
import { useEffect, useRef, useState } from 'react';
import { mapViewRect, stepZoom } from '@shaman/shared';
import { useActiveMap } from '@/stores/session-store';
import { useHudStore } from '@/stores/hud-store';
import { drawMapView } from './map-canvas';
import { MapFooter } from './MapFooter';
import { RoundButton } from './RoundButton';
import { useMapData } from './use-map-data';
import { openWorldMap } from './windows';

const ASPECT = 4 / 3;

/** Corner minimap: follows the player, zooms with −/+ or the wheel, expands to the world map. */
export function MiniMap() {
  const MAP = useActiveMap();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(2);
  const [width, setWidth] = useState(0);
  const open = useHudStore((s) => s.minimapOpen);
  const toggle = useHudStore((s) => s.toggleMinimap);
  const { art, players } = useMapData();

  // Track the canvas CSS width so the backing store stays sharp at any panel size.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || width === 0) return;
    const center = players.self ?? MAP.spawn;
    drawMapView(el, { map: MAP, art, rect: mapViewRect(MAP, center, zoom, ASPECT), width, height: width / ASPECT, players, labels: false });
  }, [art, players, zoom, width, open]);

  // Wheel zoom without scrolling the page (needs a non-passive listener).
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom((z) => stepZoom(z, e.deltaY < 0 ? 1 : -1)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open]);

  if (!open) return <RoundButton className="hud-minimap hud-fold" icon="/assets/ui/hud/fold/map.png" label="เปิดแผนที่ย่อ" onClick={toggle} />;
  return (
    <section className="hud-panel hud-minimap pointer-events-auto" aria-label="แผนที่ย่อ">
      <header className="hud-map-head">
        <div className="hud-map-zoom" role="group" aria-label="ซูมแผนที่ย่อ">
          <button type="button" className="hud-mini-btn" onClick={() => setZoom((z) => stepZoom(z, -1))} disabled={zoom <= 1} aria-label="ซูมออก">−</button>
          <button type="button" className="hud-mini-btn" onClick={() => setZoom((z) => stepZoom(z, 1))} disabled={zoom >= 4} aria-label="ซูมเข้า">+</button>
        </div>
        <img className="hud-map-compass sk-pixel" src="/assets/ui/hud/fold/map.png" alt="" width={32} height={32} />
        <div className="hud-map-zoom">
          <button type="button" className="hud-mini-btn" onClick={openWorldMap} aria-label="ขยายเป็นแผนที่ใหญ่ (M)" title="แผนที่ใหญ่ (M)">⤢</button>
          <button type="button" className="hud-mini-btn" onClick={toggle} aria-expanded="true" aria-label="ย่อแผนที่เป็นไอคอน">▾</button>
        </div>
      </header>
      <canvas ref={canvas} className="hud-map-canvas" role="img" aria-label={`แผนที่ย่อ ซูม ${zoom} เท่า ลูกศรสีทองคือคุณ จุดสีฟ้าคือผู้เล่นอื่น`} />
      <MapFooter map={MAP} players={players} />
    </section>
  );
}
