import { create } from 'zustand';
import { useHudStore } from './hud-store';
import { useProfileStore } from './profile-store';

const ATTACK_ERROR_TH: Record<string, string> = {
  'too-far': 'เป้าหมายอยู่ไกลเกินไป เดินเข้าไปใกล้อีกหน่อย',
  'no-target': 'เป้าหมายหายไปแล้ว',
  dead: 'หมดสติอยู่ โจมตีไม่ได้',
  'safe-zone': 'เขตปลอดภัย ห้ามต่อสู้',
};

/**
 * The selected monster (click / tap it). Only the id lives here; positions and HP stay in Phaser and the synced
 * room state. Attacking sends an intent; the server decides reach, timing and damage.
 */
interface TargetState {
  targetId: string | null;
  select: (id: string | null) => void;
  attack: (id: string) => void;
  attackError: (error: string) => void;
}
export const useTargetStore = create<TargetState>((set) => ({
  targetId: null,
  select: (targetId) => set({ targetId }),
  attack: (id) => {
    set({ targetId: id });
    const send = useProfileStore.getState().send;
    if (send) send('attack', { monsterId: id });
  },
  attackError: (error) => useHudStore.getState().notify(ATTACK_ERROR_TH[error] ?? 'โจมตีไม่สำเร็จ', 'warn'),
}));
