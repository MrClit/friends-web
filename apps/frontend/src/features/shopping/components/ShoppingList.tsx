import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdShare } from 'react-icons/md';
import type { ShoppingItem } from '@/api/types';
import type { Event } from '@/features/events/types';
import { ApiError } from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import {
  useShoppingItems,
  useCreateShoppingItem,
  useRenameShoppingItem,
  useToggleShoppingItemPurchased,
  useDeleteShoppingItem,
} from '@/hooks/api/useShoppingItems';
import { ConfirmDialog, ErrorState, IconButton } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import { ShoppingAddForm } from './ShoppingAddForm';
import { ShoppingItemRow } from './ShoppingItemRow';
import { ShoppingPurchasedGroup } from './ShoppingPurchasedGroup';
import { useShareShoppingList } from '../hooks/useShareShoppingList';
import { buildShoppingListText } from '../utils/buildShoppingListText';

interface ShoppingListProps {
  event: Event;
}

export function ShoppingList({ event }: ShoppingListProps) {
  const { t } = useTranslation(['shopping', 'common']);
  const { user } = useAuth();
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  const { data, isLoading, error, refetch } = useShoppingItems(event.id);
  const createItem = useCreateShoppingItem(event.id);
  const renameItem = useRenameShoppingItem(event.id);
  const toggleItem = useToggleShoppingItemPurchased(event.id, user?.id);
  const deleteItem = useDeleteShoppingItem(event.id);
  const { shareText } = useShareShoppingList();

  const items = useMemo(() => data ?? [], [data]);
  const { pending, purchased } = useMemo(
    () => ({
      pending: items.filter((item) => item.purchasedAt === null),
      purchased: items.filter((item) => item.purchasedAt !== null),
    }),
    [items],
  );

  const handleAdd = useCallback((name: string) => createItem.mutate({ name }), [createItem]);

  const handleToggle = useCallback(
    (item: ShoppingItem, isPurchased: boolean) => toggleItem.mutate({ id: item.id, purchased: isPurchased }),
    [toggleItem],
  );

  const handleRename = useCallback(
    (item: ShoppingItem, name: string) => renameItem.mutate({ id: item.id, name }),
    [renameItem],
  );

  const handleConfirmDelete = useCallback(() => {
    if (itemToDelete) deleteItem.mutate(itemToDelete.id);
    setItemToDelete(null);
  }, [itemToDelete, deleteItem]);

  /**
   * Built here, synchronously, from the items already rendered. iOS Safari only allows share() and
   * clipboard writes inside the gesture that triggered them, so nothing may be awaited on the way.
   */
  const handleShare = useCallback(() => {
    shareText(
      buildShoppingListText({
        items,
        eventTitle: event.title,
        headerLabel: t('share.header'),
        countLabel: t('share.count', { count: pending.length }),
      }),
    );
  }, [shareText, items, event.title, t, pending.length]);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mb-8 text-center text-emerald-400 py-8">{t('loading', { ns: 'common' })}</div>
    );
  }

  if (error) {
    const isNotFoundOrNoAccess = error instanceof ApiError && error.status === 404;

    return (
      <ErrorState
        message={isNotFoundOrNoAccess ? t('notFoundOrNoAccess', { ns: 'common' }) : undefined}
        onRetry={isNotFoundOrNoAccess ? undefined : () => void refetch()}
      />
    );
  }

  return (
    <section className="pb-24">
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        {/* Polite live region: a tick made by somebody else arrives through polling, with no
            interaction of ours to announce it. */}
        <p
          aria-live="polite"
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          {t('pendingCount', { count: pending.length })}
        </p>

        <IconButton
          ariaLabel={t('share.button')}
          onClick={handleShare}
          disabled={pending.length === 0}
          className={cn('shrink-0', 'disabled:opacity-40 disabled:cursor-not-allowed')}
        >
          <MdShare className="text-lg text-emerald-700 dark:text-emerald-300" />
        </IconButton>
      </div>

      <ShoppingAddForm onAdd={handleAdd} />

      {items.length === 0 ? (
        <div className="text-center text-emerald-400 py-8">{t('empty')}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onRename={handleRename}
              onRequestDelete={setItemToDelete}
            />
          ))}
        </ul>
      )}

      {purchased.length > 0 && (
        <ShoppingPurchasedGroup count={purchased.length}>
          {purchased.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onRename={handleRename}
              onRequestDelete={setItemToDelete}
            />
          ))}
        </ShoppingPurchasedGroup>
      )}

      <ConfirmDialog
        open={itemToDelete !== null}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: itemToDelete?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('deleteDialog.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </section>
  );
}
