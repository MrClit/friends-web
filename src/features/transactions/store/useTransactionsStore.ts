import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';
import type { Event, EventParticipant } from '../../events/types';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';

interface TransactionsState {
  // ============================================================
  // STATE
  // ============================================================
  transactions: Transaction[];

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  /** Creates a new transaction */
  addExpense: (expense: Omit<Transaction, 'id'>) => void;
  /** Updates an existing transaction */
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => void;
  /** Removes a single transaction */
  removeTransaction: (id: string) => void;
  /** Deletes all transactions for a specific event (cascade delete) */
  deleteTransactionsByEvent: (eventId: string) => void;
  /** Clears participant ID from all their transactions in an event */
  clearParticipantFromEventTransactions: (eventId: string, participantId: string) => void;

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================
  /** Returns all transactions for a specific event */
  getTransactionsByEvent: (eventId: string) => Transaction[];

  // ============================================================
  // HELPERS - POT UTILITIES
  // ============================================================
  /** Checks if a transaction is a pot expense */
  isPotExpense: (transaction: Transaction) => boolean;
  /** Returns pot expenses total for an event, or null if no pot expenses */
  getPotExpensesData: (eventId: string) => { participantId: string; total: number } | null;

  // ============================================================
  // AGGREGATIONS - BY EVENT (returns single number)
  // ============================================================
  /** Total expenses in an event (includes participant + pot expenses) */
  getTotalExpensesByEvent: (eventId: string) => number;
  /** Total contributions in an event */
  getTotalContributionsByEvent: (eventId: string) => number;
  /** Total compensations in an event */
  getTotalCompensationsByEvent: (eventId: string) => number;
  /** Total pot expenses in an event (only expenses made by the pot) */
  getTotalPotExpensesByEvent: (eventId: string) => number;
  /** 
   * Pot balance for an event
   * Formula: contributions - compensations - all expenses (participant + pot)
   */
  getPotBalanceByEvent: (eventId: string) => number;
  /** 
   * Pending to compensate in an event (what participants spent and haven't been reimbursed)
   * Formula: participant expenses - compensations (excludes pot expenses)
   */
  getPendingToCompensateByEvent: (eventId: string) => number;

  // ============================================================
  // AGGREGATIONS - BY PARTICIPANT (returns array of participant data)
  // ============================================================
  /** Total expenses per participant (excludes pot expenses) */
  getTotalExpensesByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  /** Total contributions per participant */
  getTotalContributionsByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  /** 
   * Pending to compensate per participant
   * Formula: participant expenses - compensations (excludes pot expenses)
   */
  getPendingToCompensateByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
  /** 
   * Balance per participant
   * Formula: contributions - expenses - compensations
   */
  getBalanceByParticipant: (event: Event) => { participant: EventParticipant; total: number }[];
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      // ============================================================
      // STATE
      // ============================================================
      transactions: [],

      // ============================================================
      // CRUD OPERATIONS
      // ============================================================
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

      // ============================================================
      // QUERY OPERATIONS
      // ============================================================
      getTransactionsByEvent: (eventId) =>
        get().transactions.filter((e) => e.eventId === eventId),

      // ============================================================
      // HELPERS - POT UTILITIES
      // ============================================================
      isPotExpense: (transaction) => 
        transaction.paymentType === 'expense' && transaction.participantId === POT_PARTICIPANT_ID,

      getPotExpensesData: (eventId) => {
        const total = get().getTotalPotExpensesByEvent(eventId);
        if (total === 0) return null;
        return {
          participantId: POT_PARTICIPANT_ID,
          total
        };
      },

      // ============================================================
      // AGGREGATIONS - BY EVENT
      // ============================================================
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

      getPotBalanceByEvent: (eventId) => {
        const totalContributions = get().getTotalContributionsByEvent(eventId);
        const totalCompensations = get().getTotalCompensationsByEvent(eventId);
        const totalExpenses = get().getTotalExpensesByEvent(eventId);
        return totalContributions - totalCompensations - totalExpenses;
      },

      getPendingToCompensateByEvent: (eventId) => {
        const totalExpenses = get().getTotalExpensesByEvent(eventId) - get().getTotalPotExpensesByEvent(eventId);
        const totalCompensations = get().getTotalCompensationsByEvent(eventId);
        return totalExpenses - totalCompensations;
      },

      // ============================================================
      // AGGREGATIONS - BY PARTICIPANT
      // ============================================================
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
    }),
    {
      name: 'transactions-storage',
    }
  )
);
