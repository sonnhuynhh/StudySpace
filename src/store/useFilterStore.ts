import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Filters } from '../types';
export const initialFilters: Filters = {
  search: '',
  building: '',
  minCapacity: 0,
  amenities: [],
  availableOnly: false,
};
export const useFilterStore = create<{
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  reset: () => void;
}>()(
  persist(
    (set) => ({
      filters: initialFilters,
      update: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
      reset: () => set({ filters: initialFilters }),
    }),
    {
      name: 'studyspace-preferences-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ filters: state.filters }),
    },
  ),
);
