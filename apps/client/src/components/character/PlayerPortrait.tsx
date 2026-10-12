'use client';
import { useEffect, useState } from 'react';
import { useHeadStore } from '@/stores/head-store';
import { AppearancePreview, loadAppearanceAssets, type AppearanceAssets } from './AppearanceWindow';

// The player's current Character V3 model (body + chosen hair, colour and face), drawn by the same composer as the
// appearance window and the world. Used by the status panel, the spirit record and the skill book.
let assets: Promise<AppearanceAssets> | null = null;
const loadOnce = () => (assets ??= loadAppearanceAssets().catch((e) => { assets = null; throw e; }));

export function PlayerPortrait({ facing = 'south', className }: { facing?: string; className?: string }) {
  const head = useHeadStore((s) => s.head);
  const [ready, setReady] = useState<AppearanceAssets | null>(null);
  useEffect(() => {
    let live = true;
    void loadOnce().then((a) => { if (live) setReady(a); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return <span className={`player-portrait ${className ?? ''}`}>{ready && <AppearancePreview assets={ready} head={head} facing={facing} />}</span>;
}
