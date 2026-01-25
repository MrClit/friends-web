import { MdAddCircle } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface CreateEventCardProps {
  onClick?: () => void;
  className?: string;
}

export const CreateEventCard: FC<CreateEventCardProps> = ({ onClick, className }) => {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Crear nuevo evento"
      className={cn(
        'group border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 p-8 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-primary/50 hover:bg-white/50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer min-h-75',
        className,
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <div
        className={cn(
          'w-16 h-16 flex items-center justify-center rounded-full',
          'transition-all group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white',
        )}
      >
        <MdAddCircle className="text-4xl text-emerald-50 bg-emerald-600 rounded-full transition-all group-hover:text-emerald-600 group-hover:bg-white" />
      </div>
      <p className="font-bold text-lg text-emerald-800 dark:text-emerald-100 group-hover:text-emerald-600 transition-colors">
        {t('events.createEventCard.title')}
      </p>
      <p className="text-sm mt-2 text-center text-emerald-600/60 dark:text-emerald-400/60 px-6">
        {t('events.createEventCard.subtitle')}
      </p>
    </div>
  );
};
