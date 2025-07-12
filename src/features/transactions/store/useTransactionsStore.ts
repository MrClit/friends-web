import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';
import type { Event, EventParticipant } from '../../events/types';

interface TransactionsState {
  transactions: Transaction[];
  addExpense: (expense: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => void;
  removeTransaction: (id: string) => void;
  deleteTransactionsByEvent: (eventId: string) => void;
  getTransactionsByEvent: (eventId: string) => Transaction[];
  
  getTotalExpensesByEvent: (eventId: string) => number;
  getTotalContributionsByEvent: (eventId: string) => number;
  getTotalCompensationsByEvent: (eventId: string) => number;
  getPotBalanceByEvent: (eventId: string) => number;
  getPendingToCompensateByEvent: (eventId: string) => number;

  getTotalExpensesByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getTotalContributionsByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getPendingToCompensateByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getBalanceByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
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
      deleteTransactionsByEvent: (eventId) =>
        set((state) => ({
          transactions: state.transactions.filter((e) => e.eventId !== eventId),
        })),
      getTransactionsByEvent: (eventId) =>
        get().transactions.filter((e) => e.eventId === eventId),

      // Functions to get totals by event
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
      getPotBalanceByEvent: (eventId) => {
        const totalContributions = get().getTotalContributionsByEvent(eventId);
        const totalCompensations = get().getTotalCompensationsByEvent(eventId);
        return totalContributions - totalCompensations;
      },
      getPendingToCompensateByEvent: (eventId) => {
        const totalExpenses = get().getTotalExpensesByEvent(eventId);
        const totalCompensations = get().getTotalCompensationsByEvent(eventId);
        return totalExpenses - totalCompensations;
      },

      // Functions to get totals by participant
      getTotalExpensesByParticipant: (event) => {
        const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'expense');
        return event.participants.map(p => {
          const total = txs.filter(t => t.payer === p.name).reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
      },
      getTotalContributionsByParticipant: (event) => {
        const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'contribution');
        return event.participants.map(p => {
          const total = txs.filter(t => t.payer === p.name).reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
      },
      getPendingToCompensateByParticipant: (event) => {
        const expenses = get().getTotalExpensesByParticipant(event);
        const compensations = event.participants.map(p => {
          const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'compensation' && e.payer === p.name);
          const total = txs.reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
        return event.participants.map((p, idx) => ({
          participant: p,
          total: expenses[idx].total - compensations[idx].total
        }));
      },
      getBalanceByParticipant: (event) => {
        const contributions = get().getTotalContributionsByParticipant(event);
        const expenses = get().getTotalExpensesByParticipant(event);
        const compensations = event.participants.map(p => {
          const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'compensation' && e.payer === p.name);
          const total = txs.reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
        return event.participants.map((p, idx) => ({
          participant: p,
          total: contributions[idx].total - expenses[idx].total - compensations[idx].total
        }));
      }
    }),
    {
      name: 'transactions-storage',
    }
  )
);
