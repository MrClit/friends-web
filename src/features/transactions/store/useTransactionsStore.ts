import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';
import type { Event, EventParticipant } from '../../events/types';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';

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

  getTotalPotExpensesByEvent: (eventId: string) => number;
  isPotExpense: (transaction: Transaction) => boolean;
  getPotExpensesData: (eventId: string) => { participantId: string; total: number } | null;

  getTotalExpensesByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getTotalContributionsByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getPendingToCompensateByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  getBalanceByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  clearParticipantFromEventTransactions: (eventId: string, participantId: string) => void;

}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      // Helper para identificar gastos del bote
      isPotExpense: (transaction) => 
        transaction.paymentType === 'expense' && transaction.participantId === POT_PARTICIPANT_ID,
      
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
      getTotalPotExpensesByEvent: (eventId) =>
        get()
          .transactions.filter(
            (e) => e.eventId === eventId && 
                  e.paymentType === 'expense' && 
                  e.participantId === POT_PARTICIPANT_ID
          )
          .reduce((sum, e) => sum + e.amount, 0),
      getPotExpensesData: (eventId) => {
        const total = get().getTotalPotExpensesByEvent(eventId);
        if (total === 0) return null;
        return {
          participantId: POT_PARTICIPANT_ID,
          total
        };
      },
      getPotBalanceByEvent: (eventId) => {
        const totalContributions = get().getTotalContributionsByEvent(eventId);
        const totalCompensations = get().getTotalCompensationsByEvent(eventId);
        const totalExpenses = get().getTotalExpensesByEvent(eventId);
        return totalContributions - totalCompensations - totalExpenses;
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
          const total = txs.filter(t => t.participantId === p.id).reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
      },
      getTotalContributionsByParticipant: (event) => {
        const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'contribution');
        return event.participants.map(p => {
          const total = txs.filter(t => t.participantId === p.id).reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
      },
      getPendingToCompensateByParticipant: (event) => {
        const expenses = get().getTotalExpensesByParticipant(event);
        const compensations = event.participants.map(p => {
          const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'compensation' && e.participantId === p.id);
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
          const txs = get().transactions.filter(e => e.eventId === event.id && e.paymentType === 'compensation' && e.participantId === p.id);
          const total = txs.reduce((sum, t) => sum + t.amount, 0);
          return { participant: p, total };
        });
        return event.participants.map((p, idx) => ({
          participant: p,
          total: contributions[idx].total - expenses[idx].total - compensations[idx].total
        }));
      },
      clearParticipantFromEventTransactions: (eventId, participantId) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.eventId === eventId && 
            tx.participantId === participantId && 
            participantId !== POT_PARTICIPANT_ID
              ? { ...tx, participantId: "" }
              : tx
          ),
        })),
    }),
    {
      name: 'transactions-storage',
    }
  )
);
