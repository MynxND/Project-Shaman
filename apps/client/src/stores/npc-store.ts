import { create } from 'zustand';

/**
 * NPC interaction UI state: which NPC is close enough to talk to (set by the scene when it changes, not per frame)
 * and which dialog is open.
 */
interface NpcUi {
  nearby: string | null;
  talking: string | null;
  setNearby: (id: string | null) => void;
  talk: (id: string) => void;
  close: () => void;
}

export const useNpcStore = create<NpcUi>((set) => ({
  nearby: null, talking: null,
  setNearby: (nearby) => set((s) => (s.nearby === nearby ? s : { nearby })),
  talk: (talking) => set({ talking }),
  close: () => set({ talking: null }),
}));
