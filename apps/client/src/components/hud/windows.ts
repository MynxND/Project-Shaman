import { useCharacterStore } from '@/stores/character-store';
import { useHudStore } from '@/stores/hud-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useMarketStore } from '@/stores/market-store';
import { useNpcStore } from '@/stores/npc-store';
import { useHeadStore } from '@/stores/head-store';
import { useSkillTreeStore } from '@/stores/skill-tree-store';

// Inventory, character, market and world map all sit centre-screen, so opening one closes the others.
const closeAll = () => {
  useInventoryStore.getState().close(); useCharacterStore.getState().close(); useMarketStore.getState().close(); useHudStore.getState().closeMap(); useNpcStore.getState().close(); useHeadStore.getState().close(); useSkillTreeStore.getState().close();
};
const toggleExclusive = (isOpen: boolean, toggle: () => void) => { const wasOpen = isOpen; closeAll(); if (!wasOpen) toggle(); };

export function openInventory() { toggleExclusive(useInventoryStore.getState().open, useInventoryStore.getState().toggle); }
export function openCharacter() { toggleExclusive(useCharacterStore.getState().open, useCharacterStore.getState().toggle); }
export function openMarket() { toggleExclusive(useMarketStore.getState().open, useMarketStore.getState().toggle); }
export function openAppearance() { toggleExclusive(useHeadStore.getState().open, useHeadStore.getState().toggle); }
export function openWorldMap() { toggleExclusive(useHudStore.getState().mapOpen, useHudStore.getState().toggleMap); }
export function openSkillTree() { toggleExclusive(useSkillTreeStore.getState().open, useSkillTreeStore.getState().toggle); }
