'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CharacterCreator } from '@/components/character/CharacterCreator';
import { AccountGate, ReplacedNotice } from '@/components/account/AccountGate';
import { useAccountStore } from '@/stores/account-store';
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
const CalonHud=dynamic(()=>import('./CalonHud'),{ssr:false});
const KoscheiHud=dynamic(()=>import('./KoscheiHud'),{ssr:false});
const MaiyarapHud = dynamic(() => import('./MaiyarapHud'), { ssr: false });
const BossHud=dynamic(()=>import('./BossHud'),{ssr:false});
const PhaserHost = dynamic(() => import('./PhaserHost'), { ssr: false });
const RangedReview = process.env.NODE_ENV === 'development' ? dynamic(() => import('./RangedReview'), { ssr: false }) : null;
const CombatReview = process.env.NODE_ENV === 'development' ? dynamic(() => import('./CombatReview'), { ssr: false }) : null;

export function GameShell() {
  const [created, setCreated] = useState<boolean | null>(null);
  const [carryReview, setCarryReview] = useState(false);
  useEffect(() => { setCarryReview(process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('carryReview') === '1'); }, []);
  const account = useAccountStore();
  useEffect(() => { void useAccountStore.getState().check(); }, []);
  useEffect(() => {
    // A signed-in account with a saved character goes straight in; otherwise the (local) character creator runs first.
    if (account.status === 'signed-in' && account.character) { setCreated(true); return; }
    try { setCreated(localStorage.getItem('shaman.character.created.v1') === 'yes'); }
    catch { setCreated(false); }
  }, [account.status, account.character]);
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
  // Development art board returns before FoundationScene opens a room; no account or saved character is needed.
  if (carryReview) return <main className="game-shell relative isolate overflow-hidden"><PhaserHost /></main>;
  if (account.status === 'checking') return <main className="cc-page" role="status">กำลังตรวจบัญชี…</main>;
  if (account.status === 'signed-out') return <AccountGate />;
  if (account.status === 'replaced') return <ReplacedNotice />;
  if (created === null) return <main className="cc-page" role="status">กำลังโหลดตัวละคร…</main>;
  if (!created) return <CharacterCreator onEnter={() => setCreated(true)}/>;
  return <main className="game-shell relative isolate overflow-hidden">
    <PhaserHost/><div className="world-vignette"/>
    <div className="hud pointer-events-none absolute inset-0">
      <MainHud />
      {CombatReview && <CombatReview />}
      {RangedReview && <RangedReview />}
      <BossHud />
      <MaiyarapHud />
      <CalonHud/><KoscheiHud />
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
