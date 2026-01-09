import { type TFunction } from 'i18next';
import type { KPIType } from './types';
import { KPI_SPEC } from './types';

/**
 * Type guard to validate if a value is a valid KPIType
 * @param value - Value to validate
 * @returns True if value is a valid KPIType
 */
export function isValidKPI(value: unknown): value is KPIType {
  return typeof value === 'string' && value in KPI_SPEC;
}

/**
 * Configuration for each KPI type
 * Note: Labels are translated dynamically using useTranslation()
 * This function must be called within a component with i18next context
 */
export const getKPIConfig = (t: TFunction) =>
  ({
    balance: {
      label: t('kpiDetail.kpi.balance'),
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      kpiKey: 'participantBalances' as const,
      includePot: false, // Pot doesn't have a balance
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      kpiKey: 'participantContributions' as const,
      includePot: false, // Pot doesn't receive contributions
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      kpiKey: 'participantExpenses' as const,
      includePot: true, // ⭐ POT CAN HAVE EXPENSES
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      kpiKey: 'participantPending' as const,
      includePot: false, // Pot doesn't have pending amounts
    },
  }) as const;

/**
 * Get the configuration key for a specific KPI type
 */
export const getKPIConfigByType = (kpiType: KPIType, config: ReturnType<typeof getKPIConfig>) => {
  return config[kpiType];
};
