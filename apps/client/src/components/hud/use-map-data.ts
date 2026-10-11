'use client';
import { useEffect, useState } from 'react';
import { readPlayers, type PlayersSnapshot } from '@/game/runtime/local-player';
import { readMapArt, subscribeMapArt } from '@/game/runtime/minimap-art';

const POLL_MS = 100;

/** Map picture plus player positions polled at 10 Hz (positions stay out of Zustand, see local-player.ts). */
export function useMapData() {
  const [art, setArt] = useState<HTMLImageElement | null>(null);
  const [players, setPlayers] = useState<PlayersSnapshot>(() => ({ self: null, others: [], count: 0 }));
  useEffect(() => {
    setArt(readMapArt());
    const off = subscribeMapArt(setArt);
    const tick = () => setPlayers((prev) => {
      const next = readPlayers();
      // Skip renders when nothing visible moved.
      const same = prev.count === next.count && prev.others.length === next.others.length
        && prev.self?.facing === next.self?.facing
        && Math.abs((prev.self?.x ?? 0) - (next.self?.x ?? 0)) < 0.02 && Math.abs((prev.self?.y ?? 0) - (next.self?.y ?? 0)) < 0.02
        && prev.others.every((p, i) => Math.abs(p.x - (next.others[i]?.x ?? 0)) < 0.05 && Math.abs(p.y - (next.others[i]?.y ?? 0)) < 0.05);
      return same && !!prev.self === !!next.self ? prev : next;
    });
    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => { off(); window.clearInterval(id); };
  }, []);
  return { art, players };
}
