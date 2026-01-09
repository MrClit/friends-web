import type { TFunction } from 'i18next';
import type { Event } from '@/api/types';
import { formatAmount } from '@/shared/utils/formatAmount';
import type { KPIParticipantItem, KPIType } from './types';
import { getKPIConfig } from './constants';

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
  // Build participant items
  const items: KPIParticipantItem[] = Object.entries(participantsData).map(([participantId, total]) => {
    const participant = event.participants.find((p) => p.id === participantId);
    return {
      id: participantId,
      name: participant?.name || participantId,
      value: formatAmount(total as number),
      isPot: false,
    };
  });

  // Add Pot item if needed (only for expenses KPI)
  if (kpiConfig[kpi].includePot && potExpenses > 0) {
    items.push({
      id: '0',
      name: t('transactionsList.potLabel'),
      value: formatAmount(potExpenses),
      isPot: true,
    });
  }

  return items;
}
