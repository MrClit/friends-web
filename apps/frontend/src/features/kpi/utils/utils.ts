import type { TFunction } from 'i18next';
import type { EventKPIBalanceBreakdown, EventKPIs } from '@/api/types';
import type { Event } from '@/features/events/types';
import { formatAmount } from '@/shared/utils/format';
import type {
  KPIBalanceBreakdownViewModel,
  KPIBalanceParticipantAmountItem,
  KPIBalancePotExpenseItem,
  KPISelectableParticipant,
  KPIParticipantItem,
  KPIType,
  KPIUserStatusSummaryData,
} from '@/features/kpi/types';
import { getKPIConfig } from '@/features/kpi/constants';
import { getParticipantName } from '@/features/events/utils/participants';

export function formatPercent(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '--';
  }

  return `${value.toFixed(1)}%`;
}

export function formatSignedAmount(value: number): string {
  if (value === 0) {
    return formatAmount(0);
  }

  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatAmount(Math.abs(value))}`;
}

export function buildUserStatusSelectableParticipants(event: Event, t: TFunction): KPISelectableParticipant[] {
  return event.participants
    .filter((participant) => participant.type === 'user' || participant.type === 'guest')
    .map((participant) => ({
      id: participant.id,
      name: getParticipantName(participant, t),
      avatar: participant.type === 'user' ? (participant.avatar ?? null) : null,
    }));
}

export function resolveUserStatusParticipantId(
  selectableParticipants: KPISelectableParticipant[],
  currentUserId?: string,
  requestedParticipantId?: string,
): string | undefined {
  if (
    requestedParticipantId &&
    selectableParticipants.some((participant) => participant.id === requestedParticipantId)
  ) {
    return requestedParticipantId;
  }

  if (currentUserId && selectableParticipants.some((participant) => participant.id === currentUserId)) {
    return currentUserId;
  }

  return undefined;
}

export function buildUserStatusSummaryData(
  event: Event,
  kpis: EventKPIs,
  participantId: string | undefined,
  currentUserId: string | undefined,
  t: TFunction,
): KPIUserStatusSummaryData | undefined {
  if (!participantId) {
    return undefined;
  }

  const participant = event.participants.find(
    (item): item is Extract<Event['participants'][number], { type: 'user' | 'guest' }> =>
      item.id === participantId && (item.type === 'user' || item.type === 'guest'),
  );

  if (!participant) {
    return undefined;
  }

  const targetTotal = participant.contributionTarget ?? 0;
  const differenceTotal = Number(kpis.participantPending[participantId] ?? 0);
  const netTotal = differenceTotal + targetTotal;
  const compliancePercent = targetTotal > 0 ? (netTotal / targetTotal) * 100 : undefined;

  return {
    participantId,
    participantName: getParticipantName(participant, t),
    compliancePercent,
    netTotal,
    targetTotal,
    differenceTotal,
    adjustmentPending: Math.abs(differenceTotal),
    isCurrentUser: Boolean(currentUserId && participantId === currentUserId),
  };
}

/**
 * Build KPI participant items list including pot if needed
 * @param participantsData - Map of participant ID to KPI value
 * @param event - Event with participants
 * @param kpi - Current KPI type
 * @param kpiConfig - KPI configuration from getKPIConfig
 * @param potExpenses - Total pot expenses
 * @param t - i18next translation function
 * @returns Array of KPI participant items
 */
export function buildKPIItems(
  participantsData: Record<string, number>,
  event: Event,
  kpi: KPIType,
  kpiConfig: ReturnType<typeof getKPIConfig>,
  potExpenses: number,
  t: TFunction,
): KPIParticipantItem[] {
  // Calculate total amount including pot if needed
  const totalAmount =
    Object.values(participantsData).reduce((sum, val) => sum + val, 0) +
    (kpiConfig[kpi].includePot && potExpenses > 0 ? potExpenses : 0);

  const sortableItems: Array<{ id: string; total: number; isPot: boolean }> = Object.entries(participantsData).map(
    ([participantId, total]) => ({
      id: participantId,
      total,
      isPot: false,
    }),
  );

  if (kpiConfig[kpi].includePot && potExpenses > 0) {
    sortableItems.push({
      id: '0',
      total: potExpenses,
      isPot: true,
    });
  }

  // For contribution status KPI with signed deltas, sort by absolute value; otherwise sort descending
  if (kpi === 'contributionStatus') {
    sortableItems.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  } else {
    sortableItems.sort((a, b) => b.total - a.total);
  }

  // Use absolute magnitude for signed contribution status values to avoid negative widths and cancellation to zero.
  const percentageBase =
    kpi === 'contributionStatus'
      ? sortableItems.reduce((sum, item) => sum + Math.abs(item.total), 0)
      : Math.abs(totalAmount);

  return sortableItems.map(({ id, total, isPot }) => {
    if (isPot) {
      return {
        id,
        name: t('transactionsList.potLabel'),
        value: formatAmount(total),
        rawAmount: total,
        isPot: true,
        percentage: percentageBase > 0 ? (Math.abs(total) / percentageBase) * 100 : 0,
      };
    }

    const participant = event.participants.find((p) => p.id === id);
    const avatar = participant && 'avatar' in participant ? participant.avatar : undefined;
    const contributionTarget =
      participant && (participant.type === 'user' || participant.type === 'guest')
        ? (participant.contributionTarget ?? 0)
        : undefined;
    const targetValue =
      kpi === 'contributionStatus' && contributionTarget !== undefined ? formatAmount(contributionTarget) : undefined;

    return {
      id,
      name: participant ? getParticipantName(participant, t) : id,
      avatar,
      value: formatAmount(total),
      rawAmount: total,
      targetValue,
      isPot: false,
      percentage: percentageBase > 0 ? (Math.abs(total) / percentageBase) * 100 : 0,
    };
  });
}

function buildBalanceParticipantItems(
  data: Record<string, number>,
  event: Event,
  t: TFunction,
): KPIBalanceParticipantAmountItem[] {
  return Object.entries(data)
    .map(([participantId, rawAmount]) => ({
      participantId,
      amount: Number(rawAmount),
    }))
    .filter(({ amount }) => Number.isFinite(amount) && amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(({ participantId, amount }) => {
      const participant = event.participants.find((p) => p.id === participantId);
      return {
        id: participantId,
        name: participant ? getParticipantName(participant, t) : participantId,
        amount,
      };
    });
}

function buildBalancePotExpenseItems(
  transactions: EventKPIBalanceBreakdown['outflows']['potExpensesTransactions'],
): KPIBalancePotExpenseItem[] {
  return transactions
    .map((tx) => ({
      id: tx.id,
      title: tx.title,
      amount: Number(tx.amount),
      date: tx.date,
    }))
    .filter(({ amount }) => Number.isFinite(amount) && amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function buildBalanceBreakdownData(
  balanceBreakdown: EventKPIBalanceBreakdown,
  event: Event,
  t: TFunction,
): KPIBalanceBreakdownViewModel {
  return {
    inflowsTotal: Number(balanceBreakdown.inflows.total),
    compensationsTotal: Number(balanceBreakdown.outflows.compensationsTotal),
    potExpensesTotal: Number(balanceBreakdown.outflows.potExpensesTotal),
    outflowsTotal: Number(balanceBreakdown.outflows.total),
    potBalance: Number(balanceBreakdown.reconciliation.potBalance),
    isConsistent: Boolean(balanceBreakdown.reconciliation.isConsistent),
    inflowItems: buildBalanceParticipantItems(balanceBreakdown.inflows.contributionsByParticipant, event, t),
    compensationItems: buildBalanceParticipantItems(balanceBreakdown.outflows.compensationsByParticipant, event, t),
    potExpenseItems: buildBalancePotExpenseItems(balanceBreakdown.outflows.potExpensesTransactions),
  };
}
