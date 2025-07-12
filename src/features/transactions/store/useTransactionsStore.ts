import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';

interface TransactionsState {
  transactions: Transaction[];
  addExpense: (expense: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => void;
  removeTransaction: (id: string) => void;
  getTransactionsByEvent: (eventId: string) => Transaction[];
  getTotalExpensesByEvent: (eventId: string) => number;
  getTotalContributionsByEvent: (eventId: string) => number;
  getTotalCompensationsByEvent: (eventId: string) => number;
  deleteMovementsByEvent: (eventId: string) => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addExpense: (expense) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...expense, id: crypto.randomUUID() },
          ],
        })),
      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((e) => e.id !== id),
        })),
      getTransactionsByEvent: (eventId) =>
        get().transactions.filter((e) => e.eventId === eventId),
      getTotalExpensesByEvent: (eventId) =>
        get()
          .transactions.filter(
            (e) => e.eventId === eventId && e.paymentType === 'expense'
          )
          .reduce((sum, e) => sum + e.amount, 0),
      getTotalContributionsByEvent: (eventId) =>
        get()
          .transactions.filter(
            (e) => e.eventId === eventId && e.paymentType === 'contribution'
          )
          .reduce((sum, e) => sum + e.amount, 0),
      getTotalCompensationsByEvent: (eventId) =>
        get()
          .transactions.filter(
            (e) => e.eventId === eventId && e.paymentType === 'compensation'
          )
          .reduce((sum, e) => sum + e.amount, 0),
      deleteMovementsByEvent: (eventId) =>
        set((state) => ({
          transactions: state.transactions.filter((e) => e.eventId !== eventId),
        })),
    }),
    {
      name: 'transactions-storage',
    }
  )
);
