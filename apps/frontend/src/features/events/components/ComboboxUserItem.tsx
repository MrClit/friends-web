import { cn } from '@/shared/utils/cn';
import Avatar from '@/shared/components/Avatar';
import type { User } from '@/features/auth/types';

interface ComboboxUserItemProps {
  user: User;
  isHighlighted: boolean;
  onSelect: (user: User) => void;
  onHover: () => void;
}

export default function ComboboxUserItem({ user, isHighlighted, onSelect, onHover }: ComboboxUserItemProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(user)}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        isHighlighted ? 'bg-slate-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30',
      )}
    >
      <Avatar
        avatar={user.avatar}
        name={user.name || user.email}
        className="w-8 h-8 rounded-full text-xs shrink-0"
        fallbackClassName="flex items-center justify-center bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 font-bold"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white truncate">{user.name || user.email}</p>
        {user.name && <p className="text-xs text-slate-500 dark:text-emerald-400 truncate">{user.email}</p>}
      </div>
    </button>
  );
}
