import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

interface ComboboxNewGuestItemProps {
  name: string;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export default function ComboboxNewGuestItem({ name, isHighlighted, onSelect, onHover }: ComboboxNewGuestItemProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-t border-slate-200 dark:border-emerald-800',
        isHighlighted ? 'bg-slate-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30',
      )}
    >
      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
        +
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900 dark:text-white">{t('participantsInput.createNew')}</p>
        <p className="text-xs text-slate-500 dark:text-emerald-400">{name}</p>
      </div>
    </button>
  );
}
