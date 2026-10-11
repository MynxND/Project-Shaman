'use client';
import { useEffect, useRef, useState } from 'react';
import { clampStick, stickDirection } from '@shaman/shared';
import { setTouchDirection } from '@/game/input/touch-stick';

/** Knob travel in CSS px; the knob art is centred and can move this far from the centre. */
const RADIUS = 40;
const IDLE = { dx: 0, dy: 0 };

/**
 * On-screen movement stick for touch devices. One finger drives it (pointer capture keeps tracking outside the
 * ring); the offset is snapped to 8 directions and read by the movement controller like a held key.
 */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState(IDLE);

  const release = () => {
    pointer.current = null;
    setKnob(IDLE);
    setTouchDirection({ x: 0, y: 0 });
  };
  const track = (clientX: number, clientY: number) => {
    const r = base.current?.getBoundingClientRect();
    if (!r) return;
    const { dx, dy } = clampStick(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2), RADIUS);
    setKnob({ dx, dy });
    setTouchDirection(stickDirection(dx, dy, RADIUS));
  };

  // Never leave the character walking: stop when the page hides or loses focus, and on unmount.
  useEffect(() => {
    const stop = () => { if (pointer.current !== null) release(); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => { window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', stop); setTouchDirection({ x: 0, y: 0 }); };
  }, []);

  return (
    <div ref={base} className="hud-stick pointer-events-auto" data-active={pointer.current !== null} role="application" aria-label="จอยสติ๊กเดิน ลากเพื่อเดิน 8 ทิศ"
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
        track(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => { if (e.pointerId === pointer.current) track(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (e.pointerId === pointer.current) release(); }}
      onPointerCancel={(e) => { if (e.pointerId === pointer.current) release(); }}
      onLostPointerCapture={(e) => { if (e.pointerId === pointer.current) release(); }}
      onContextMenu={(e) => e.preventDefault()}>
      <img className="hud-stick-base sk-pixel" src="/assets/ui/v2/touch/stick-base.png" alt="" width={96} height={96} draggable={false} />
      <img className="hud-stick-knob sk-pixel" src="/assets/ui/v2/touch/stick-knob.png" alt="" width={40} height={40} draggable={false}
        style={{ transform: `translate(calc(-50% + ${knob.dx}px), calc(-50% + ${knob.dy}px))` }} />
    </div>
  );
}
