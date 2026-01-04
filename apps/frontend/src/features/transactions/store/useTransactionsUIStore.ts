import { create } from 'zustand';
import type { PaymentType } from '../types';

/**
 * Transactions UI State Store
 * Manages only UI-related state (no data persistence, no CRUD operations)
 * Server state is handled by React Query hooks in @/hooks/api/useTransactions.ts
 */
interface TransactionsUIState {
  // UI state (no persist)
  isModalOpen: boolean;
  filterType: PaymentType | 'all';
  selectedTransactionId: string | null;
  isEditMode: boolean;

  // UI actions
  openModal: () => void;
  closeModal: () => void;
  setFilterType: (type: PaymentType | 'all') => void;
  selectTransaction: (id: string) => void;
  clearSelection: () => void;
  setEditMode: (isEdit: boolean) => void;
}

export const useTransactionsUIStore = create<TransactionsUIState>()((set) => ({
  // Initial state
  isModalOpen: false,
  filterType: 'all',
  selectedTransactionId: null,
  isEditMode: false,

  // Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, isEditMode: false, selectedTransactionId: null }),
  setFilterType: (type) => set({ filterType: type }),
  selectTransaction: (id) => set({ selectedTransactionId: id }),
  clearSelection: () => set({ selectedTransactionId: null }),
  setEditMode: (isEdit) => set({ isEditMode: isEdit }),
}));
