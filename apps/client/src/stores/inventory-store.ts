import { create } from 'zustand';
import type { InventoryFilter, InventorySort } from '@shaman/shared';

/** Inventory window UI state only; item data lives with its source (sample data until the server has it). */
interface InventoryUi {
  open: boolean;
  category: InventoryFilter;
  search: string;
  sort: InventorySort;
  page: number;
  selected: string | null;
  hovered: string | null;
  toggle: () => void;
  close: () => void;
  setCategory: (c: InventoryFilter) => void;
  setSearch: (s: string) => void;
  setSort: (s: InventorySort) => void;
  setPage: (p: number) => void;
  select: (uid: string | null) => void;
  hover: (uid: string | null) => void;
}

export const useInventoryStore = create<InventoryUi>((set) => ({
  open: false, category: 'all', search: '', sort: 'newest', page: 1, selected: null, hovered: null,
  toggle: () => set((s) => ({ open: !s.open, hovered: null })),
  close: () => set({ open: false, hovered: null }),
  // Changing what is listed resets to the first page.
  setCategory: (category) => set({ category, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  select: (selected) => set((s) => ({ selected: s.selected === selected ? null : selected })),
  hover: (hovered) => set({ hovered }),
}));
