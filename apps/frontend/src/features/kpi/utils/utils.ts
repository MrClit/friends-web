import type { TFunction } from 'i18next';
import type { Event } from '@/features/events/types';
import { formatAmount } from '@/shared/utils/format';
import type { KPIParticipantItem, KPIType } from '@/features/kpi/types';
import { getKPIConfig } from '@/features/kpi/constants';
import { getParticipantName } from '@/features/events/utils/participants';

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

  sortableItems.sort((a, b) => b.total - a.total);

  return sortableItems.map(({ id, total, isPot }) => {
    if (isPot) {
      return {
        id,
        name: t('transactionsList.potLabel'),
        value: formatAmount(total),
        isPot: true,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
      };
    }

    const participant = event.participants.find((p) => p.id === id);
    const avatar = participant && 'avatar' in participant ? participant.avatar : undefined;

    return {
      id,
      name: participant ? getParticipantName(participant, t) : id,
      avatar,
      value: formatAmount(total),
      isPot: false,
      percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
    };
  });
}
