import { type TFunction } from 'i18next';
import { MdAccountBalanceWallet, MdVolunteerActivism, MdShoppingBag, MdCreditCard } from 'react-icons/md';
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
      colorClass: 'bg-white text-green-800 dark:bg-emerald-950 dark:text-green-200',
      borderColorClass: 'border-emerald-200 dark:border-emerald-700/50',
      descriptionKey: 'kpiDetail.description.balance',
      IconComponent: MdAccountBalanceWallet,
      kpiKey: 'participantBalances' as const,
      includePot: false, // Pot doesn't have a balance
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-white text-blue-800 dark:bg-emerald-950 dark:text-blue-200',
      borderColorClass: 'border-blue-200 dark:border-blue-700/50',
      descriptionKey: 'kpiDetail.description.contributions',
      IconComponent: MdVolunteerActivism,
      kpiKey: 'participantContributions' as const,
      includePot: false, // Pot doesn't receive contributions
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-white text-red-800 dark:bg-emerald-950 dark:text-red-200',
      borderColorClass: 'border-red-200 dark:border-red-700/50',
      descriptionKey: 'kpiDetail.description.expenses',
      IconComponent: MdShoppingBag,
      kpiKey: 'participantExpenses' as const,
      includePot: true, // ⭐ POT CAN HAVE EXPENSES
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-white text-yellow-800 dark:bg-emerald-950 dark:text-yellow-200',
      borderColorClass: 'border-yellow-200 dark:border-yellow-700/50',
      descriptionKey: 'kpiDetail.description.pending',
      IconComponent: MdCreditCard,
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
