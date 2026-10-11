import { create } from 'zustand';
import { DEFAULT_MAP_ID, getMap, type ConnectionStatus, type MapDefinition } from '@shaman/shared';

/** Connection summary for the HUD: status, the active map and a travel transition. Entity positions stay in Phaser. */
interface SessionState {
  bodyType: 'male' | 'female';
  setBodyType: (bodyType: 'male' | 'female') => void;
  status: ConnectionStatus;
  mapId: string;
  /** Destination label while a portal transition is running, else null. */
  travelling: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setMap: (mapId: string) => void;
  setTravelling: (label: string | null) => void;
}
export const useSessionStore = create<SessionState>((set) => ({
  bodyType: 'male', setBodyType: (bodyType) => set({ bodyType }),
  status: 'offline', mapId: DEFAULT_MAP_ID, travelling: null,
  setStatus: (status) => set({ status }),
  setMap: (mapId) => set({ mapId }),
  setTravelling: (travelling) => set({ travelling }),
}));
/** The map the player is on (HUD maps, NPC dialogs). */
export const useActiveMap = (): MapDefinition => getMap(useSessionStore((s) => s.mapId));
