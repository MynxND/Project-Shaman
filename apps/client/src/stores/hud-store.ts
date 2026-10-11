import { create } from 'zustand';

export type ChatTab = 'all' | 'party' | 'guild' | 'system';
export interface HudMessage { id: number; at: number; text: string; tone?: 'info' | 'good' | 'warn' }

const MAX_LOG = 50;
const TOAST_MS = 4000;
let nextId = 1;

/**
 * Main HUD state: panel toggles, the local system log (shown in the chat "ระบบ" tab) and short-lived toasts.
 * Messages come only from things that really happened in this client (connection changes, local actions).
 */
interface HudUi {
  chatTab: ChatTab;
  chatOpen: boolean;
  questOpen: boolean;
  minimapOpen: boolean;
  /** World map window (centre screen). */
  mapOpen: boolean;
  log: HudMessage[];
  /** System messages that arrived while the chat was folded (badge on the chat button). */
  unread: number;
  toasts: HudMessage[];
  setChatTab: (tab: ChatTab) => void;
  toggleChat: () => void;
  toggleQuest: () => void;
  toggleMinimap: () => void;
  toggleMap: () => void;
  closeMap: () => void;
  notify: (text: string, tone?: HudMessage['tone']) => void;
  dismiss: (id: number) => void;
}

export const useHudStore = create<HudUi>((set, get) => ({
  chatTab: 'system', chatOpen: true, questOpen: true, minimapOpen: true, mapOpen: false, log: [], unread: 0, toasts: [],
  setChatTab: (chatTab) => set({ chatTab }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen, unread: 0 })),
  toggleQuest: () => set((s) => ({ questOpen: !s.questOpen })),
  toggleMinimap: () => set((s) => ({ minimapOpen: !s.minimapOpen })),
  toggleMap: () => set((s) => ({ mapOpen: !s.mapOpen })),
  closeMap: () => set({ mapOpen: false }),
  notify: (text, tone = 'info') => {
    const msg: HudMessage = { id: nextId++, at: Date.now(), text, tone };
    // The same message still on screen is ignored entirely (e.g. repeated taps on an unusable skill).
    if (get().toasts.some((t) => t.text === text)) return;
    set((s) => ({ log: [...s.log, msg].slice(-MAX_LOG), toasts: [...s.toasts, msg].slice(-3), unread: s.chatOpen ? 0 : Math.min(99, s.unread + 1) }));
    window.setTimeout(() => get().dismiss(msg.id), TOAST_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
