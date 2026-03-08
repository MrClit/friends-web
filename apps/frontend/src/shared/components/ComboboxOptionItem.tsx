import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@/shared/utils/cn';

interface ComboboxOptionItemProps {
  label: string;
  description?: string;
  avatar?: string | null;
  isPot?: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export function ComboboxOptionItem({
  label,
  description,
  avatar,
  isPot,
  isHighlighted,
  onSelect,
  onHover,
}: ComboboxOptionItemProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        isHighlighted ? 'bg-slate-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30',
      )}
    >
      <Avatar
        avatar={avatar}
        name={label}
        isPot={isPot}
        className="w-8 h-8 rounded-full text-xs shrink-0"
        fallbackClassName={cn(
          'flex items-center justify-center font-bold',
          !isPot && 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white truncate">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-emerald-400 truncate">{description}</p>}
      </div>
    </button>
  );
}
