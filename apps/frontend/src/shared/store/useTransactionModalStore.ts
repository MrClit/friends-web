import { create } from 'zustand';
import type { Event } from '@/features/events/types';
import type { Transaction } from '@/features/transactions/types';

type State = {
  open: boolean;
  event: Event | null;
  transaction: Transaction | null;
  showDeleteConfirm: boolean;
  isLoading: boolean;
  openModal: (event: Event, transaction?: Transaction) => void;
  closeModal: () => void;
  setShowDeleteConfirm: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
};

export const useTransactionModalStore = create<State>((set) => ({
  open: false,
  event: null,
  transaction: null,
  showDeleteConfirm: false,
  isLoading: false,
  openModal: (event, transaction) => set(() => ({ open: true, event, transaction: transaction ?? null })),
  closeModal: () => set(() => ({ open: false, showDeleteConfirm: false, isLoading: false })),
  setShowDeleteConfirm: (v) => set(() => ({ showDeleteConfirm: v })),
  setLoading: (v) => set(() => ({ isLoading: v })),
  reset: () =>
    set(() => ({
      open: false,
      event: null,
      transaction: null,
      showDeleteConfirm: false,
      isLoading: false,
    })),
}));
