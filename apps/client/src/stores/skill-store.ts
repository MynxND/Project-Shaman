import { create } from 'zustand';
import { combatSpec, SKILL_CAST_ERROR_TH, type SkillCastError, type SkillCastEvent } from '@shaman/shared';
import { useTargetStore } from './target-store';
import { readPlayers } from '@/game/runtime/local-player';
import { useHudStore } from './hud-store';
import { useProfileStore } from './profile-store';

/**
 * Local player's hotbar state, driven only by server cast events: which skill is casting and when each skill is
 * ready again (performance.now() ms). Other players' casts are drawn by the Phaser scene, not stored here.
 * `variants` holds the chosen variant per skill (Rune Trap Kit rune), sent with the cast request.
 */
interface SkillState {
  casting: { skillId: string; startedAt: number; castMs: number } | null;
  readyAt: Record<string, number>;
  variants: Record<string, string>;
  cast: (skillId: string) => void;
  /** Next variant for a skill with variants (Rune Trap Kit: snare → freeze → blast → flash). */
  cycleVariant: (skillId: string) => void;
  /** A cast event for the local player (start / release / cancel). */
  receive: (event: SkillCastEvent) => void;
  /** The server shortened a cooldown (Hunter's Patience). */
  setReady: (skillId: string, readyInMs: number) => void;
  reject: (error: string) => void;
  reset: () => void;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  casting: null, readyAt: {}, variants: {},
  cast: (skillId) => {
    const send = useProfileStore.getState().send;
    if (!send) { useHudStore.getState().notify('ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์', 'warn'); return; }
    if (get().casting) return;
    // Facing is what the player sees on screen; the server validates it and decides everything else.
    const aim = combatSpec(skillId)?.target;
    const targetId = aim === 'self' || aim === 'dash' ? null : useTargetStore.getState().targetId;
    const spec = combatSpec(skillId);
    const variant = spec?.variants ? get().variants[skillId] ?? spec.variants[0] : undefined;
    send('skill', { skillId, facing: readPlayers().self?.facing, ...(targetId ? { targetId } : {}), ...(variant ? { variant } : {}) });
  },
  cycleVariant: (skillId) => {
    const list = combatSpec(skillId)?.variants;
    if (!list) return;
    const current = get().variants[skillId] ?? list[0]!;
    set((s) => ({ variants: { ...s.variants, [skillId]: list[(list.indexOf(current) + 1) % list.length]! } }));
  },
  receive: (event) => {
    const now = performance.now();
    if (event.phase === 'start') set({ casting: { skillId: event.skillId, startedAt: now, castMs: event.castMs } });
    else if (event.phase === 'release') set((s) => ({ casting: null, readyAt: { ...s.readyAt, [event.skillId]: now + event.cooldownMs, ...(event.invoke ? { invoke: now + (event.invokeCdMs ?? 0) } : {}) } }));
    else { set({ casting: null }); useHudStore.getState().notify('การร่ายถูกขัดจังหวะ', 'warn'); }
  },
  setReady: (skillId, readyInMs) => set((s) => ({ readyAt: { ...s.readyAt, [skillId]: performance.now() + Math.max(0, readyInMs) } })),
  reject: (error) => useHudStore.getState().notify(SKILL_CAST_ERROR_TH[error as SkillCastError] ?? 'ร่ายสกิลไม่สำเร็จ', 'warn'),
  reset: () => set({ casting: null, readyAt: {} }),
}));
