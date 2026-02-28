import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { formatAmount } from '@/shared/utils/format';
import type { KPIType, KPIConfig } from '../types';

interface KPIBoxDetailProps {
  kpi: KPIType;
  kpiValue: number;
  kpiConfig: Record<KPIType, KPIConfig>;
}

/**
 * Dynamic KPI Box Detail component
 * Displays KPI value with colors based on the KPI type
 * Supports responsive layout with dynamic styling
 */
export function KPIBoxDetail({ kpi, kpiValue, kpiConfig }: KPIBoxDetailProps) {
  const { t } = useTranslation();
  const config = kpiConfig[kpi];
  const IconComponent = config.IconComponent;

  // Extract all color classes from colorClass (includes dark mode variants)
  const colorClasses = config.colorClass.split(' ');
  const bgClasses = colorClasses.filter((cls) => cls.startsWith('bg-') || cls.startsWith('dark:bg-')).join(' ');
  const textClasses = colorClasses.filter((cls) => cls.startsWith('text-') || cls.startsWith('dark:text-')).join(' ');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-4 sm:p-6 md:p-8 mb-10',
        'border-2 backdrop-blur-sm shadow-soft',
        config.borderColorClass,
        bgClasses,
      )}
    >
      <div
        className={cn(
          'relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 sm:gap-6 md:gap-8 text-center md:text-left',
        )}
      >
        <div className={cn('flex-1')}>
          <div
            className={cn(
              'flex items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4',
            )}
          >
            <IconComponent className={cn('shrink-0 text-xl sm:text-2xl md:text-3xl', textClasses)} />
            <h2 className={cn('text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase', textClasses)}>
              {config.label}
            </h2>
          </div>
          <p
            className={cn(
              'text-sm sm:text-base md:text-lg mt-3 sm:mt-4 md:mt-5 max-w-md mx-auto md:mx-0',
              'text-slate-600 dark:text-slate-300',
            )}
          >
            {t(config.descriptionKey)}
          </p>
        </div>
        <div className={cn('text-center md:text-right')}>
          <div className={cn('text-2xl sm:text-3xl md:text-4xl font-black', textClasses)}>{formatAmount(kpiValue)}</div>
        </div>
      </div>
    </div>
  );
}
