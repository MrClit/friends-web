import { create } from 'zustand';
import type { Event, EventFormData } from '@/features/events/types';

type State = {
  open: boolean;
  event: Event | null;
  onSubmit?: (event: EventFormData) => void;
  openModal: (opts?: { event?: Event | undefined; onSubmit?: (event: EventFormData) => void }) => void;
  closeModal: () => void;
  setEvent: (e?: Event | null) => void;
  reset: () => void;
};

export const useEventFormModalStore = create<State>((set) => ({
  open: false,
  event: null,
  onSubmit: undefined,
  openModal: ({ event, onSubmit } = {}) =>
    set(() => ({ open: true, event: event ?? null, onSubmit: onSubmit ?? undefined })),
  closeModal: () => set(() => ({ open: false, event: null })),
  setEvent: (e) => set(() => ({ event: e ?? null })),
  reset: () => set(() => ({ open: false, event: null, onSubmit: undefined })),
}));

export default useEventFormModalStore;
