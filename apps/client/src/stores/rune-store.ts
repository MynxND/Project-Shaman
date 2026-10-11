import { create } from 'zustand';
import type { GogyoElement, NorseRune } from '@shaman/shared';

/** The local player's synced job state for the HUD, mirrored from PlayerState: Rune Seer queue (front first), Onmyoji
 *  held talismans (oldest first) and buff/debuff ids. */
interface JobUi { runes: NorseRune[]; held: GogyoElement[]; statuses: string[]; gaugeKind: string; gauge: number; sync: (runes: string, statuses: string, held?: string, gaugeKind?: string, gauge?: number) => void }
let last = '';
export const useRuneStore = create<JobUi>((set) => ({
  runes: [], held: [], statuses: [], gaugeKind: '', gauge: 0,
  sync: (runes, statuses, held = '', gaugeKind = '', gauge = 0) => {
    const key = runes + '|' + statuses + '|' + held + '|' + gaugeKind + gauge;
    if (key === last) return;
    last = key;
    const list = (v: string) => (v ? v.split(',') : []);
    set({ runes: list(runes) as NorseRune[], statuses: list(statuses), held: list(held) as GogyoElement[], gaugeKind, gauge });
  },
}));
