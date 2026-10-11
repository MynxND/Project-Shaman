'use client';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { InventoryWindow } from '@/components/inventory/InventoryWindow';
import { useCharacterStore } from '@/stores/character-store';
import { CharacterWindow } from '@/components/character/CharacterWindow';
import { MainHud } from '@/components/hud/MainHud';
import { MarketWindow } from '@/components/market/MarketWindow';
import { useMarketStore } from '@/stores/market-store';
import { WorldGuide } from '@/components/hud/WorldGuide';
import { openAppearance, openCharacter, openInventory, openWorldMap } from '@/components/hud/windows';
import { AppearanceWindow } from '@/components/character/AppearanceWindow';
import { useHeadStore } from '@/stores/head-store';
import { WorldMapWindow } from '@/components/hud/WorldMapWindow';
import { useHudStore } from '@/stores/hud-store';
import { NpcDialog } from '@/components/npc/NpcDialog';
import { TalkPrompt } from '@/components/npc/TalkPrompt';
import { useNpcStore } from '@/stores/npc-store';
const PhaserHost = dynamic(() => import('./PhaserHost'), { ssr: false });

export function GameShell() {
  const menuOpen = useUiStore((s) => s.menuOpen);
  const inventoryOpen = useInventoryStore((s) => s.open);
  const characterOpen = useCharacterStore((s) => s.open);
  const marketOpen = useMarketStore((s) => s.open);
  const mapOpen = useHudStore((s) => s.mapOpen);
  const appearanceOpen = useHeadStore((s) => s.open);
  const talking = useNpcStore((s) => s.talking);
  // I inventory, C character status, M world map, V appearance; ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if (typing || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'i' || e.key === 'I') openInventory();
      if (e.key === 'c' || e.key === 'C') openCharacter();
      if (e.key === 'm' || e.key === 'M') openWorldMap();
      if (e.key === 'v' || e.key === 'V') openAppearance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <main className="game-shell relative isolate overflow-hidden">
    <PhaserHost/><div className="world-vignette"/>
    <div className="hud pointer-events-none absolute inset-0">
      <MainHud />
      {inventoryOpen && <InventoryWindow />}
      {characterOpen && <CharacterWindow />}
      {marketOpen && <MarketWindow />}
      {mapOpen && <WorldMapWindow />}
      {appearanceOpen && <AppearanceWindow />}
      {menuOpen && <WorldGuide />}
      <TalkPrompt />
      {talking && <NpcDialog npcId={talking} />}
    </div>
  </main>;
}
