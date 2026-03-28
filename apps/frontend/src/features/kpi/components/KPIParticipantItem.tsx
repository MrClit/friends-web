import { memo } from 'react';
import * as Progress from '@radix-ui/react-progress';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type { KPIParticipantItem as KPIParticipantItemData } from '../types';

interface KPIParticipantItemProps {
  item: KPIParticipantItemData;
  gradientClass: string;
}

export const KPIParticipantItem = memo(function KPIParticipantItem({ item, gradientClass }: KPIParticipantItemProps) {
  const { t } = useTranslation();
  const percentage = item.percentage ?? 0;
  const avatarSrc = item.avatar?.startsWith('http') ? item.avatar : undefined;
  const isNegative = (item.rawAmount ?? 0) < 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-slate-100 dark:border-slate-700 p-4 sm:p-6 hover:border-primary/30">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
        <div className="flex items-center gap-3 w-full sm:w-1/4 sm:min-w-45">
          <Avatar
            avatar={avatarSrc}
            name={item.name}
            alt={item.name}
            isPot={item.isPot}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
            imageClassName="object-cover"
            fallbackClassName={cn(
              'flex items-center justify-center font-bold text-sm',
              item.bgColor || 'bg-indigo-100 dark:bg-indigo-900/30',
              item.textColor || 'text-indigo-600 dark:text-indigo-300',
            )}
          />
          <div className="flex flex-col">
            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{item.name}</h4>
            {item.targetValue && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('kpiDetail.targetLabel')}: {item.targetValue}
              </p>
            )}
          </div>
          <div className="sm:hidden ml-auto">
            <div
              className={cn(
                'text-lg font-bold',
                isNegative ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white',
              )}
            >
              {item.value}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full sm:px-4">
          <Progress.Root
            value={Math.min(percentage, 100)}
            className="relative w-full h-3 sm:h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden"
          >
            <Progress.Indicator
              className={cn('h-full bg-linear-to-r rounded-full transition-[width]', gradientClass)}
              style={{ width: `${percentage}%` }}
            />
          </Progress.Root>
        </div>

        <div className="hidden sm:block text-right w-24 shrink-0">
          <div
            className={cn(
              'text-xl font-bold',
              isNegative ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white',
            )}
          >
            {item.value}
          </div>
        </div>
      </div>
    </div>
  );
});
