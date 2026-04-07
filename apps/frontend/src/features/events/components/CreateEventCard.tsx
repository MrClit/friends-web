import { MdAddCircle } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';
import { memo, type FC, type ButtonHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export interface CreateEventCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const CreateEventCardInner: FC<CreateEventCardProps> = ({ onClick, className, disabled, ...rest }) => {
  const { t } = useTranslation('events');

  return (
    <button
      type="button"
      aria-label={t('createEventCard.ariaLabel')}
      className={cn(
        'group border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 p-8 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-primary/50 hover:bg-white/50 dark:hover:bg-emerald-900/20 transition-all min-h-75',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <div
        className={cn(
          'w-16 h-16 flex items-center justify-center rounded-full',
          'transition-all group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white',
        )}
      >
        <MdAddCircle
          aria-hidden="true"
          className="text-4xl text-emerald-50 bg-emerald-600 rounded-full transition-all group-hover:text-emerald-600 group-hover:bg-white"
        />
      </div>
      <p className="font-bold text-lg text-emerald-800 dark:text-emerald-100 group-hover:text-emerald-600 transition-colors">
        {t('createEventCard.title')}
      </p>
      <p className="text-sm mt-2 text-center text-emerald-600/60 dark:text-emerald-400/60 px-6">
        {t('createEventCard.subtitle')}
      </p>
    </button>
  );
};

export const CreateEventCard = memo(CreateEventCardInner);
