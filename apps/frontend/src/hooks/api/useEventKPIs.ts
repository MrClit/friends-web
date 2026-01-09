import { useMemo } from 'react';
import { useTransactionsByEvent } from './useTransactions';
import type { Transaction } from '@/api/types';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';

/**
 * Computed KPIs based on event transactions
 */
export interface EventKPIs {
  totalExpenses: number;
  totalContributions: number;
  totalCompensations: number;
  potBalance: number;
  pendingToCompensate: number;
  participantBalances: Record<string, number>;
  participantContributions: Record<string, number>;
  participantExpenses: Record<string, number>;
  participantCompensations: Record<string, number>;
  participantPending: Record<string, number>;
  potExpenses: number;
}

/**
 * Hook to compute KPIs from event transactions
 * Uses React Query to fetch transactions and useMemo to compute KPIs
 * @param eventId - Event ID
 * @returns Object with computed KPIs and loading state
 */
export function useEventKPIs(eventId: string) {
  const { data: transactions, isLoading } = useTransactionsByEvent(eventId);

  const kpis = useMemo<EventKPIs | null>(() => {
    if (!transactions) return null;

    // Initialize KPI values
    let totalExpenses = 0;
    let totalContributions = 0;
    let totalCompensations = 0;
    let potExpenses = 0;

    const participantBalances: Record<string, number> = {};
    const participantContributions: Record<string, number> = {};
    const participantExpenses: Record<string, number> = {};
    const participantCompensations: Record<string, number> = {};

    // Calculate KPIs from transactions
    transactions.forEach((transaction: Transaction) => {
      const { participantId, paymentType, amount } = transaction;
      // Ensure amount is a number (in case backend sends string)
      const numAmount = Number(amount);

      // Skip pot participant for balance calculations (pot is special)
      if (participantId !== POT_PARTICIPANT_ID) {
        // Initialize participant balances if not exists
        if (!participantBalances[participantId]) {
          participantBalances[participantId] = 0;
          participantContributions[participantId] = 0;
          participantExpenses[participantId] = 0;
          participantCompensations[participantId] = 0;
        }

        // Update balances based on payment type
        switch (paymentType) {
          case 'contribution':
            totalContributions += numAmount;
            participantContributions[participantId] += numAmount;
            participantBalances[participantId] += numAmount;
            break;
          case 'expense':
            totalExpenses += numAmount;
            participantExpenses[participantId] += numAmount;
            participantBalances[participantId] -= numAmount;
            break;
          case 'compensation':
            totalCompensations += numAmount;
            participantCompensations[participantId] += numAmount;
            participantBalances[participantId] -= numAmount;
            break;
        }
      } else if (paymentType === 'expense') {
        // Pot expenses (special case)
        potExpenses += numAmount;
        totalExpenses += numAmount;
      }
    });

    // Calculate pot balance and pending compensation
    const potBalance = totalContributions - totalCompensations - totalExpenses;
    const pendingToCompensate = totalExpenses - totalCompensations;

    // Calculate pending per participant (expenses - compensations)
    const participantPending: Record<string, number> = {};
    Object.keys(participantExpenses).forEach((participantId) => {
      const pending = participantExpenses[participantId] - (participantCompensations[participantId] || 0);
      if (pending > 0) {
        participantPending[participantId] = pending;
      }
    });

    return {
      totalExpenses,
      totalContributions,
      totalCompensations,
      potBalance,
      pendingToCompensate,
      participantBalances,
      participantContributions,
      participantExpenses,
      participantCompensations,
      participantPending,
      potExpenses,
    };
  }, [transactions]);

  return { kpis, isLoading };
}
