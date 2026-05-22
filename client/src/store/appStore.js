import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activePatientId: null,
  setActivePatientId: (id) => set({ activePatientId: id }),
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

