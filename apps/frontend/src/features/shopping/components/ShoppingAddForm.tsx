import { useRef } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';
import { SHOPPING_ITEM_MAX_LENGTH } from '../constants';

interface ShoppingAddFormProps {
  onAdd: (name: string) => void;
}

/**
 * Capture row pinned above the list: type, press Enter, keep typing. The field is never disabled while
 * the request is in flight — disabling an input on iOS dismisses the keyboard, which would break
 * chaining several items in a row, and re-typing an item that failed is cheaper than that.
 */
export function ShoppingAddForm({ onAdd }: ShoppingAddFormProps) {
  const { t } = useTranslation('shopping');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = inputRef.current;
    if (!input) return;

    const name = input.value.trim();
    if (!name) return;

    onAdd(name);
    input.value = '';
    input.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
      <input
        ref={inputRef}
        type="text"
        name="name"
        maxLength={SHOPPING_ITEM_MAX_LENGTH}
        placeholder={t('addForm.placeholder')}
        aria-label={t('addForm.label')}
        className={cn(
          'flex-1 min-w-0',
          'px-3 py-2 text-sm',
          'bg-white dark:bg-emerald-950 text-slate-900 dark:text-white placeholder:text-slate-400',
          'border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500',
        )}
      />
      <button
        type="submit"
        aria-label={t('addForm.submit')}
        className={cn(
          'shrink-0 flex items-center justify-center',
          'w-10 h-10',
          'bg-emerald-600 text-white rounded-xl shadow-sm cursor-pointer',
          'hover:bg-emerald-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500',
        )}
      >
        <MdAdd size={22} />
      </button>
    </form>
  );
}
