import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activePatientId: null,
  setActivePatientId: (id) => set({ activePatientId: id }),
}));

