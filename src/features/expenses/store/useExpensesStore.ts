import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense } from '../types';

interface ExpensesState {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  getExpensesByEvent: (eventId: string) => Expense[];
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            { ...expense, id: crypto.randomUUID() },
          ],
        })),
      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
      getExpensesByEvent: (eventId) =>
        get().expenses.filter((e) => e.eventId === eventId),
    }),
    {
      name: 'expenses-storage',
    }
  )
);
