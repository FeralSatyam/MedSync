import { create } from 'zustand';

/** UI-only: selected patient for dashboard */
export const useMedicineStore = create((set) => ({
  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));
