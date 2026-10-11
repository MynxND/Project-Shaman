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
import { openAppearance, openCharacter, openInventory, openSkillTree, openWorldMap } from '@/components/hud/windows';
import { SkillTreeWindow } from '@/components/skills/SkillTreeWindow';
import { useSkillTreeStore } from '@/stores/skill-tree-store';
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
  const skillTreeOpen = useSkillTreeStore((s) => s.open);
  // I inventory, C character status, M world map, V appearance, K skill tree; ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if (typing || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      // Physical key positions (e.code), so the shortcuts also work with a Thai keyboard layout.
      if (e.code === 'KeyI') openInventory();
      if (e.code === 'KeyC') openCharacter();
      if (e.code === 'KeyM') openWorldMap();
      if (e.code === 'KeyV') openAppearance();
      if (e.code === 'KeyK') openSkillTree();
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
      {skillTreeOpen && <SkillTreeWindow />}
      {menuOpen && <WorldGuide />}
      <TalkPrompt />
      {talking && <NpcDialog npcId={talking} />}
    </div>
  </main>;
}
