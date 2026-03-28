import { formatAmount } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface KPIBoxProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  borderColorClass: string;
  labelColorClass: string;
  valueFormat?: 'amount' | 'percent';
  helperText?: string;
  onClick?: () => void;
}

function formatKPIValue(value: number, valueFormat: 'amount' | 'percent') {
  if (valueFormat === 'percent') {
    return Number.isFinite(value) ? `${value.toFixed(1)}%` : '--';
  }

  return formatAmount(value);
}

export function KPIBox({
  label,
  value,
  icon,
  borderColorClass,
  labelColorClass,
  valueFormat = 'amount',
  helperText,
  onClick,
}: KPIBoxProps) {
  const formattedValue = formatKPIValue(value, valueFormat);

  return (
    <div
      className={cn(
        'bg-white dark:bg-emerald-950',
        'p-3 sm:p-4',
        'rounded-xl shadow-sm',
        'border-l-4',
        borderColorClass,
        'relative overflow-hidden',
        'group hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div className="relative z-10">
        <div
          className={cn(
            'flex items-center gap-1.5',
            'font-semibold text-[11px] uppercase tracking-wider mb-1',
            labelColorClass,
          )}
        >
          {icon}
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{formattedValue}</div>
        {helperText ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p> : null}
      </div>
    </div>
  );
}
