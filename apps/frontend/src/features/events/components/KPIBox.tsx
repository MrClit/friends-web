import { formatAmount } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface KPIBoxProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  borderColorClass: string;
  labelColorClass: string;
  onClick?: () => void;
}

export default function KPIBox({ label, value, icon, borderColorClass, labelColorClass, onClick }: KPIBoxProps) {
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
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{formatAmount(value)}</div>
      </div>
    </div>
  );
}
