import { create } from 'zustand';
import type { GogyoElement, NorseRune } from '@shaman/shared';

/** The local player's synced job state for the HUD, mirrored from PlayerState: Rune Seer queue (front first), Onmyoji
 *  held talismans (oldest first) and buff/debuff ids. */
interface JobUi { runes: NorseRune[]; held: GogyoElement[]; statuses: string[]; sync: (runes: string, statuses: string, held?: string) => void }
let last = '';
export const useRuneStore = create<JobUi>((set) => ({
  runes: [], held: [], statuses: [],
  sync: (runes, statuses, held = '') => {
    const key = runes + '|' + statuses + '|' + held;
    if (key === last) return;
    last = key;
    const list = (v: string) => (v ? v.split(',') : []);
    set({ runes: list(runes) as NorseRune[], statuses: list(statuses), held: list(held) as GogyoElement[] });
  },
}));
