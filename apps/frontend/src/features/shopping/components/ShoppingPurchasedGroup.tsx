import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdExpandMore } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';

interface ShoppingPurchasedGroupProps {
  count: number;
  children: ReactNode;
}

/**
 * Collapsible block holding the purchased items, so what is still missing stays at the top and the
 * useful part of the list does not degrade as the shopping gets done.
 */
export function ShoppingPurchasedGroup({ count, children }: ShoppingPurchasedGroupProps) {
  const { t } = useTranslation('shopping');
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          // No horizontal padding: the counter, the capture input, the rows and this toggle all share
          // one left edge.
          'flex items-center gap-1 w-full',
          'py-2',
          'text-xs font-semibold uppercase tracking-wide',
          'text-slate-500 dark:text-slate-400 cursor-pointer',
          'hover:text-slate-700 dark:hover:text-slate-200',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded',
        )}
      >
        <MdExpandMore className={cn('text-lg transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        {t('purchasedGroup', { count })}
      </button>

      {isOpen && (
        <ul id={listId} className="flex flex-col gap-2 mt-2">
          {children}
        </ul>
      )}
    </div>
  );
}
