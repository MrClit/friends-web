import { create } from 'zustand';

type State = {
  open: boolean;
  eventId: string | null;
  openModal: (eventId?: string) => void;
  closeModal: () => void;
  reset: () => void;
};

export const useEventFormModalStore = create<State>((set) => ({
  open: false,
  eventId: null,
  openModal: (eventId) => set({ open: true, eventId: eventId ?? null }),
  closeModal: () => set({ open: false, eventId: null }),
  reset: () => set({ open: false, eventId: null }),
}));
