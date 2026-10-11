import { create } from 'zustand';
import { DEFAULT_HEAD, sanitizeHead, type ExpressionId, type HeadAppearance } from '@shaman/shared';

// Character V3 head choice (hair, colour, default face). Remembered per browser as a convenience; the server
// validates and syncs it to everyone. Emotes are fire-and-forget requests; the server times them out.
const STORAGE = 'shaman.head.v1';
function load(): HeadAppearance {
  try { const raw = localStorage.getItem(STORAGE); return raw ? sanitizeHead(JSON.parse(raw)) : DEFAULT_HEAD; } catch { return DEFAULT_HEAD; }
}
type Send = (type: 'head' | 'emote', message: unknown) => void;
interface HeadState {
  /** Appearance window visibility. */
  open: boolean;
  toggle: () => void;
  close: () => void;
  head: HeadAppearance;
  /** Set by the scene while connected; null offline. */
  send: Send | null;
  setHead: (patch: Partial<HeadAppearance>) => void;
  emote: (face: ExpressionId) => void;
  bind: (send: Send | null) => void;
}
export const useHeadStore = create<HeadState>((set, get) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  head: typeof window === 'undefined' ? DEFAULT_HEAD : load(),
  send: null,
  setHead: (patch) => {
    const head = sanitizeHead({ ...get().head, ...patch });
    set({ head });
    try { localStorage.setItem(STORAGE, JSON.stringify(head)); } catch { /* storage unavailable: keep in memory */ }
    get().send?.('head', head);
  },
  emote: (face) => get().send?.('emote', { face }),
  bind: (send) => set({ send }),
}));
