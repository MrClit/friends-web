// Minimal utilities; avoid adding new dependencies like `classnames`
import { useTranslation } from 'react-i18next';
import { humanize } from '@/shared/utils';
import { EVENT_ICON_OPTIONS } from '../constants';

interface IconPickerProps {
  selected?: string;
  onSelect: (key: string) => void;
}

export default function IconPicker({ selected, onSelect }: IconPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4">
        {t('eventForm.iconLabel')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {EVENT_ICON_OPTIONS.map(({ key, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            aria-label={humanize(key)}
            title={humanize(key)}
            onClick={() => onSelect(key)}
            className={`w-12 h-12 min-w-12 rounded-xl flex items-center justify-center cursor-pointer transition-all border-2  hover:bg-emerald-50 dark:hover:bg-emerald-900/40 ${
              selected === key
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 shadow-sm shadow-emerald-600/20'
                : 'border-transparent text-slate-400'
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600`}
          >
            <Icon className="text-2xl" />
          </button>
        ))}
      </div>
    </div>
  );
}
