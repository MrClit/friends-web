import { create } from 'zustand';

export interface DeletingState {
  isDeleting: boolean;
  setDeleting: (deleting: boolean) => void;
  reset: () => void;
}

export const useDeletingStore = create<DeletingState>((set) => ({
  isDeleting: false,
  setDeleting: (deleting: boolean) => set({ isDeleting: deleting }),
  reset: () => set({ isDeleting: false }),
}));
