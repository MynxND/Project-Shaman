import { create } from 'zustand';
export const useUiStore = create<{ menuOpen: boolean; toggleMenu: () => void }>((set) => ({ menuOpen: false, toggleMenu: () => set(s => ({ menuOpen: !s.menuOpen })) }));
