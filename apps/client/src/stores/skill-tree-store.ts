import { create } from 'zustand';

/** Skill tree window (K): open state and the tier tab being viewed (null = the current job tier). */
interface SkillTreeUi { open: boolean; tier: 1 | 2 | 3 | null; toggle: () => void; close: () => void; setTier: (tier: 1 | 2 | 3) => void }
export const useSkillTreeStore = create<SkillTreeUi>((set) => ({
  open: false, tier: null,
  toggle: () => set((s) => ({ open: !s.open, tier: null })),
  close: () => set({ open: false }),
  setTier: (tier) => set({ tier }),
}));
