'use client';
import { useSessionStore } from '@/stores/session-store';

/** Short portal transition: the scene fades the world out, this names the destination until the new map joins. */
export function TravelOverlay() {
  const travelling = useSessionStore((s) => s.travelling);
  if (!travelling) return null;
  return (
    <div className="hud-travel" role="status" aria-live="polite">
      <span>กำลังเดินทาง</span>
      <b>{travelling}</b>
    </div>
  );
}
