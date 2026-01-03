import { useTranslation } from 'react-i18next';
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
    <div className="mt-6 text-xs text-teal-700 dark:text-teal-200 opacity-80">
      <strong>{t('kpiDetail.noteTitle')}</strong> <br />
      <span className="block mt-1">
        <span className="font-semibold">{t(`kpiDetail.kpi.${kpiType}`)}</span>: {explanations[kpiType]}
      </span>
    </div>
  );
}
