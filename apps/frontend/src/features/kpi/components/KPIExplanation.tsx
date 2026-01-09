import { useTranslation } from 'react-i18next';
import { FaQuestionCircle } from 'react-icons/fa';
import type { KPIType } from '../types';

interface KPIExplanationProps {
  kpiType: KPIType;
}

/**
 * Explanation component for KPI detail pages
 * Shows translated notes explaining what each KPI means
 */
export default function KPIExplanation({ kpiType }: KPIExplanationProps) {
  const { t } = useTranslation();

  const explanations: Record<KPIType, string> = {
    balance: t('kpiDetail.noteBalance'),
    contributions: t('kpiDetail.noteContributions'),
    expenses: t('kpiDetail.noteExpenses'),
    pending: t('kpiDetail.notePending'),
  };

  return (
    <div className="w-full max-w-2xl mb-8 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2 text-sm">
        <FaQuestionCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">{t(`kpiDetail.kpi.${kpiType}`)}</span>
          {' — '}
          {explanations[kpiType]}
        </p>
      </div>
    </div>
  );
}
