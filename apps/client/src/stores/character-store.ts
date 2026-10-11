import { create } from 'zustand';
import { applyStatPoints, type BaseStat, type CharacterSheet, type EquipSlot } from '@shaman/shared';
import { SAMPLE_SHEET } from '@/game-data/sample-character';

const FACINGS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'] as const;
export type PreviewFacing = (typeof FACINGS)[number];

/**
 * Character window UI state. The sheet is a local sample copy: allocating points here changes only this browser
 * session (there is no server character yet) and the window says so.
 */
interface CharacterUi {
  open: boolean;
  sheet: CharacterSheet;
  pending: Partial<Record<BaseStat, number>>;
  facing: number;
  selectedSlot: EquipSlot | null;
  toggle: () => void;
  close: () => void;
  addPending: (stat: BaseStat, delta: 1 | -1) => void;
  resetPending: () => void;
  commitPending: () => void;
  rotate: (step: 1 | -1) => void;
  selectSlot: (slot: EquipSlot | null) => void;
}

export const previewFacing = (i: number): PreviewFacing => FACINGS[((i % 8) + 8) % 8] ?? 'south';

export const useCharacterStore = create<CharacterUi>((set) => ({
  open: false, sheet: SAMPLE_SHEET, pending: {}, facing: 0, selectedSlot: null,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  addPending: (stat, delta) => set((s) => {
    const next = { ...s.pending, [stat]: Math.max(0, (s.pending[stat] ?? 0) + delta) };
    // Only keep the change if the whole allocation would still be valid (points, cap).
    return applyStatPoints(s.sheet, next).ok ? { pending: next } : {};
  }),
  resetPending: () => set({ pending: {} }),
  commitPending: () => set((s) => {
    const r = applyStatPoints(s.sheet, s.pending);
    return r.ok ? { sheet: r.sheet, pending: {} } : {};
  }),
  rotate: (step) => set((s) => ({ facing: s.facing + step })),
  selectSlot: (slot) => set((s) => ({ selectedSlot: s.selectedSlot === slot ? null : slot })),
}));
