import { create } from 'zustand';

export interface DeletingState {
  isDeleting: boolean;
  setDeleting: (deleting: boolean) => void;
}

export const useDeletingStore = create<DeletingState>((set) => ({
  isDeleting: false,
  setDeleting: (deleting: boolean) => set({ isDeleting: deleting }),
}));
