import { create } from 'zustand';
import { SKILL_CAST_ERROR_TH, SKILL_COMBAT, type SkillCastError, type SkillCastEvent } from '@shaman/shared';
import { useTargetStore } from './target-store';
import { readPlayers } from '@/game/runtime/local-player';
import { useHudStore } from './hud-store';
import { useProfileStore } from './profile-store';

/**
 * Local player's hotbar state, driven only by server cast events: which skill is casting and when each skill is
 * ready again (performance.now() ms). Other players' casts are drawn by the Phaser scene, not stored here.
 */
interface SkillState {
  casting: { skillId: string; startedAt: number; castMs: number } | null;
  readyAt: Record<string, number>;
  cast: (skillId: string) => void;
  /** A cast event for the local player (start / release / cancel). */
  receive: (event: SkillCastEvent) => void;
  reject: (error: string) => void;
  reset: () => void;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  casting: null, readyAt: {},
  cast: (skillId) => {
    const send = useProfileStore.getState().send;
    if (!send) { useHudStore.getState().notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (get().casting) return;
    // Facing is what the player sees on screen; the server validates it and decides everything else.
    const targetId = SKILL_COMBAT[skillId]?.target === 'self' ? null : useTargetStore.getState().targetId;
    send('skill', { skillId, facing: readPlayers().self?.facing, ...(targetId ? { targetId } : {}) });
  },
  receive: (event) => {
    const now = performance.now();
    if (event.phase === 'start') set({ casting: { skillId: event.skillId, startedAt: now, castMs: event.castMs } });
    else if (event.phase === 'release') set((s) => ({ casting: null, readyAt: { ...s.readyAt, [event.skillId]: now + event.cooldownMs } }));
    else { set({ casting: null }); useHudStore.getState().notify('การร่ายถูกขัดจังหวะ', 'warn'); }
  },
  reject: (error) => useHudStore.getState().notify(SKILL_CAST_ERROR_TH[error as SkillCastError] ?? 'ร่ายสกิลไม่สำเร็จ', 'warn'),
  reset: () => set({ casting: null, readyAt: {} }),
}));
