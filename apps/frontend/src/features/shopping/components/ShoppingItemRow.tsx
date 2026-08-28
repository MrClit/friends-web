import { memo, useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDeleteOutline } from 'react-icons/md';
import type { ShoppingItem } from '@/api/types';
import { IconButton } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import { SHOPPING_ITEM_MAX_LENGTH } from '../constants';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem, purchased: boolean) => void;
  onRename: (item: ShoppingItem, name: string) => void;
  onRequestDelete: (item: ShoppingItem) => void;
}

/**
 * One row of the shopping list: a checkbox, the name (which turns into an input when tapped) and a
 * delete button.
 */
function ShoppingItemRowBase({ item, onToggle, onRename, onRequestDelete }: ShoppingItemRowProps) {
  const { t } = useTranslation('shopping');
  const nameNodeId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const nameButtonRef = useRef<HTMLButtonElement>(null);
  // Escape moves the focus out of the input, which fires blur right after. Without this flag the blur
  // handler would commit the very value Escape was meant to discard.
  const cancelledRef = useRef(false);

  const isPurchased = item.purchasedAt !== null;

  const leaveEditing = useCallback(() => {
    setIsEditing(false);
    // After the row swaps back to its read mode, put the focus where it was.
    requestAnimationFrame(() => nameButtonRef.current?.focus());
  }, []);

  const commit = useCallback(
    (value: string) => {
      const name = value.trim();
      // An emptied field cancels: deleting is the confirmed path, never a side effect of clearing.
      if (name && name !== item.name) {
        onRename(item, name);
      }
      leaveEditing();
    },
    [item, onRename, leaveEditing],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit(event.currentTarget.value);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelledRef.current = true;
        leaveEditing();
      }
    },
    [commit, leaveEditing],
  );

  return (
    <li
      className={cn(
        'flex items-center gap-3',
        'bg-slate-50 dark:bg-emerald-950 p-3 rounded-xl',
        'shadow-sm border border-slate-100 dark:border-slate-700/50',
        'transition-all',
      )}
    >
      <input
        type="checkbox"
        checked={isPurchased}
        onChange={(event) => onToggle(item, event.target.checked)}
        aria-labelledby={nameNodeId}
        className="size-5 shrink-0 cursor-pointer accent-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      />

      {isEditing ? (
        <input
          type="text"
          defaultValue={item.name}
          maxLength={SHOPPING_ITEM_MAX_LENGTH}
          autoFocus
          aria-label={t('item.editName')}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (cancelledRef.current) {
              cancelledRef.current = false;
              return;
            }
            commit(event.target.value);
          }}
          className={cn(
            'flex-1 min-w-0',
            'px-2 py-1 text-sm',
            'bg-white dark:bg-emerald-900 text-slate-900 dark:text-white',
            'border border-emerald-300 dark:border-emerald-700 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500',
          )}
        />
      ) : (
        <button
          type="button"
          id={nameNodeId}
          ref={nameButtonRef}
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex-1 min-w-0',
            'px-2 py-1 text-left text-sm break-words',
            'rounded-lg cursor-pointer',
            'hover:bg-emerald-50 dark:hover:bg-emerald-900',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500',
            isPurchased ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white',
          )}
        >
          {item.name}
        </button>
      )}

      <IconButton
        ariaLabel={t('item.delete', { name: item.name })}
        onClick={() => onRequestDelete(item)}
        className="shrink-0 w-9 h-9 border-none shadow-none bg-transparent dark:bg-transparent text-slate-500 dark:text-slate-400"
      >
        <MdDeleteOutline className="text-xl" />
      </IconButton>
    </li>
  );
}

export const ShoppingItemRow = memo(ShoppingItemRowBase);
