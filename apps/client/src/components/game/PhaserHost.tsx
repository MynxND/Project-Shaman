'use client';
import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
export default function PhaserHost() {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let game: Phaser.Game | undefined;
    let observer: ResizeObserver | undefined;
    import('@/game/create-game').then(({createGame}) => {
      if (disposed || !host.current) return;
      game = createGame(host.current);
      observer = new ResizeObserver(() => {
        const el = host.current;
        if (disposed || !game || !el || !el.clientWidth || !el.clientHeight) return;
        game.scale.resize(el.clientWidth, el.clientHeight);
      });
      observer.observe(host.current);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; observer?.disconnect(); game?.destroy(true); };
  }, []);
  return <div ref={host} className="absolute inset-0 touch-none">{error && <p className="p-6">ไม่สามารถโหลดฉากเกมได้ กรุณาโหลดหน้าใหม่</p>}</div>;
}
