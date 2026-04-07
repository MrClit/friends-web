import { type TFunction } from 'i18next';
import { MdAccountBalanceWallet, MdVolunteerActivism, MdPerson, MdShoppingBag } from 'react-icons/md';
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
      label: t('kpi.balance'),
      colorClass: 'bg-white text-green-800 dark:bg-emerald-950 dark:text-green-200',
      borderColorClass: 'border-emerald-200 dark:border-emerald-700/50',
      descriptionKey: 'description.balance',
      IconComponent: MdAccountBalanceWallet,
      kpiKey: 'participantBalances' as const,
      includePot: false, // Pot doesn't have a balance
      gradients: ['from-emerald-400 to-emerald-500', 'from-teal-400 to-teal-500', 'from-green-400 to-green-500'],
    },
    contributionStatus: {
      label: t('kpi.contributionStatus'),
      colorClass: 'bg-white text-blue-800 dark:bg-emerald-950 dark:text-blue-200',
      borderColorClass: 'border-blue-200 dark:border-blue-700/50',
      descriptionKey: 'description.contributionStatus',
      IconComponent: MdVolunteerActivism,
      kpiKey: 'participantPending' as const,
      includePot: false,
      gradients: ['from-blue-400 to-blue-500', 'from-indigo-400 to-indigo-500', 'from-cyan-400 to-cyan-500'],
      valueFormat: 'percent' as const,
    },
    userStatus: {
      label: t('kpi.userStatus'),
      colorClass: 'bg-white text-amber-800 dark:bg-emerald-950 dark:text-amber-200',
      borderColorClass: 'border-amber-200 dark:border-amber-700/50',
      descriptionKey: 'description.userStatus',
      IconComponent: MdPerson,
      kpiKey: 'participantPending' as const,
      includePot: false,
      gradients: ['from-amber-400 to-amber-500', 'from-orange-400 to-orange-500', 'from-yellow-400 to-yellow-500'],
      valueFormat: 'percent' as const,
    },
    expenses: {
      label: t('kpi.expenses'),
      colorClass: 'bg-white text-red-800 dark:bg-emerald-950 dark:text-red-200',
      borderColorClass: 'border-red-200 dark:border-red-700/50',
      descriptionKey: 'description.expenses',
      IconComponent: MdShoppingBag,
      kpiKey: 'participantExpenses' as const,
      includePot: true, // ⭐ POT CAN HAVE EXPENSES
      gradients: ['from-red-400 to-red-500', 'from-rose-400 to-rose-500', 'from-pink-400 to-pink-500'],
    },
  }) as const;

/**
 * Get the configuration key for a specific KPI type
 */
export const getKPIConfigByType = (kpiType: KPIType, config: ReturnType<typeof getKPIConfig>) => {
  return config[kpiType];
};
