import { create } from 'zustand';
import type { Event, EventParticipant } from '@/features/events/types';

type State = {
  open: boolean;
  event: Event | null;
  showConfirm: boolean;
  isLoading: boolean;
  onSubmit?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void;
  openModal: (opts?: {
    event?: Event | undefined;
    onSubmit?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void;
  }) => void;
  closeModal: () => void;
  setShowConfirm: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setEvent: (e?: Event | null) => void;
  setOnSubmit: (fn?: (event: { id?: string; title: string; participants: EventParticipant[] }) => void) => void;
  reset: () => void;
};

export const useEventFormModalStore = create<State>((set) => ({
  open: false,
  event: null,
  showConfirm: false,
  isLoading: false,
  onSubmit: undefined,
  openModal: ({ event, onSubmit } = {}) =>
    set(() => ({ open: true, event: event ?? null, onSubmit: onSubmit ?? undefined })),
  closeModal: () => set(() => ({ open: false, event: null, showConfirm: false, isLoading: false })),
  setShowConfirm: (v) => set(() => ({ showConfirm: v })),
  setLoading: (v) => set(() => ({ isLoading: v })),
  setEvent: (e) => set(() => ({ event: e ?? null })),
  setOnSubmit: (fn) => set(() => ({ onSubmit: fn })),
  reset: () => set(() => ({ open: false, event: null, showConfirm: false, isLoading: false, onSubmit: undefined })),
}));

export default useEventFormModalStore;
