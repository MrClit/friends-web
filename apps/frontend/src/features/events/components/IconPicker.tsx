import {
  MdFlight,
  MdRestaurant,
  MdLocalBar,
  MdCelebration,
  MdHome,
  MdShoppingCart,
  MdDirectionsCar,
  MdMovie,
  MdFitnessCenter,
} from 'react-icons/md';
// Minimal utilities; avoid adding new dependencies like `classnames`
import { useTranslation } from 'react-i18next';
import { humanize } from '@/shared/utils';

const ICONS: { key: string; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'flight', label: 'flight', Icon: MdFlight },
  { key: 'restaurant', label: 'restaurant', Icon: MdRestaurant },
  { key: 'local_bar', label: 'local_bar', Icon: MdLocalBar },
  { key: 'celebration', label: 'celebration', Icon: MdCelebration },
  { key: 'house', label: 'house', Icon: MdHome },
  { key: 'shopping_cart', label: 'shopping_cart', Icon: MdShoppingCart },
  { key: 'directions_car', label: 'directions_car', Icon: MdDirectionsCar },
  { key: 'movie', label: 'movie', Icon: MdMovie },
  { key: 'fitness_center', label: 'fitness_center', Icon: MdFitnessCenter },
];

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
        {ICONS.map(({ key, Icon }) => (
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
