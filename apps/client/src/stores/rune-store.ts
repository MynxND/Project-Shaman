import { create } from 'zustand';
import type { NorseRune } from '@shaman/shared';

/** The local player's synced Rune Seer queue (front first) and buff ids, mirrored from PlayerState for the HUD. */
interface RuneUi { runes: NorseRune[]; statuses: string[]; sync: (runes: string, statuses: string) => void }
let lastRunes = '', lastStatuses = '';
export const useRuneStore = create<RuneUi>((set) => ({
  runes: [], statuses: [],
  sync: (runes, statuses) => {
    if (runes === lastRunes && statuses === lastStatuses) return;
    lastRunes = runes; lastStatuses = statuses;
    set({ runes: (runes ? runes.split(',') : []) as NorseRune[], statuses: statuses ? statuses.split(',') : [] });
  },
}));
