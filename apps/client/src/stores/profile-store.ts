import { create } from 'zustand';
import { SERVICE_ERROR_TH, type PlayerProfile } from '@shaman/shared';
import { useHudStore } from './hud-store';

/**
 * The player's server-owned data (silver, bag, storage, skills, quests). The server sends it after joining and after
 * every NPC service; the client never edits it. `send` is set by the scene while connected.
 */
interface ProfileState {
  profile: PlayerProfile | null;
  busy: boolean;
  send: ((type: string, message: unknown) => void) | null;
  setSender: (send: ((type: string, message: unknown) => void) | null) => void;
  receive: (data: { profile: PlayerProfile; result?: { ok: boolean; note?: string; error?: string } }) => void;
  /** Frequent combat update of HP/SP/level/EXP (the full profile only comes with notes and services). */
  vitals: (v: Pick<PlayerProfile, 'hp' | 'hpMax' | 'sp' | 'spMax' | 'level' | 'exp'>) => void;
  /** Ask an NPC for a service; the answer arrives as a new profile plus a result toast. */
  npc: (npc: string, action: string, extra?: Record<string, unknown>) => void;
  equip: (slot: string, itemId: string | null) => void;
  /** Learn / raise a skill from the skill tree window (server checks tier, branch, points, prerequisites). */
  learn: (skillId: string) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null, busy: false, send: null,
  setSender: (send) => set(send ? { send } : { send: null, profile: null, busy: false }),
  receive: ({ profile, result }) => {
    set({ profile, busy: false });
    if (!result) return;
    const notify = useHudStore.getState().notify;
    if (result.ok && result.note) notify(result.note, 'good');
    if (!result.ok) notify(SERVICE_ERROR_TH[result.error as keyof typeof SERVICE_ERROR_TH] ?? 'ทำรายการไม่สำเร็จ', 'warn');
  },
  vitals: (v) => set((s) => (s.profile ? { profile: { ...s.profile, ...v } } : {})),
  npc: (npc, action, extra = {}) => {
    const send = get().send;
    if (!send) { useHudStore.getState().notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    set({ busy: true });
    send('npc', { npc, action, ...extra });
  },
  equip: (slot, itemId) => {
    const send = get().send;
    if (!send || get().busy) return;
    set({ busy: true }); send('equipment', { slot, itemId });
  },
  learn: (skillId) => {
    const send = get().send;
    if (!send) { useHudStore.getState().notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (get().busy) return;
    set({ busy: true }); send('skill:learn', { skillId });
  },
}));
