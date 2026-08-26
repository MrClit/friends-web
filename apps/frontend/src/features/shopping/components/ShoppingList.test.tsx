import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShoppingItem } from '@/api/types';
import type { Event } from '@/features/events/types';
import { ShoppingList } from './ShoppingList';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { name?: string; count?: number }) =>
        options?.count !== undefined ? `${key}:${options.count}` : options?.name ? `${key}:${options.name}` : key,
    }),
  };
});

const idleMutation = { mutate: vi.fn(), isPending: false };
const useShoppingItemsMock = vi.fn();

vi.mock('@/hooks/api/useShoppingItems', () => ({
  useShoppingItems: (eventId: string) => useShoppingItemsMock(eventId) as unknown,
  useCreateShoppingItem: () => idleMutation,
  useRenameShoppingItem: () => idleMutation,
  useToggleShoppingItemPurchased: () => idleMutation,
  useDeleteShoppingItem: () => idleMutation,
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

const shareTextMock = vi.fn();
vi.mock('../hooks/useShareShoppingList', () => ({
  useShareShoppingList: () => ({ shareText: shareTextMock }),
}));

const mockEvent = {
  id: 'event-1',
  title: 'Cumple de Marta',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Event;

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'item-1',
  eventId: 'event-1',
  name: 'Pan',
  createdBy: 'user-1',
  purchasedBy: null,
  purchasedAt: null,
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
  ...overrides,
});

const givenItems = (items: ShoppingItem[]) => {
  useShoppingItemsMock.mockReturnValue({ data: items, isLoading: false, error: null, refetch: vi.fn() });
};

describe('ShoppingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    givenItems([]);
  });

  it('shows the empty state when there is nothing on the list', () => {
    render(<ShoppingList event={mockEvent} />);

    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('keeps the pending items out of the purchased group', () => {
    givenItems([
      makeItem({ id: '1', name: 'Pan' }),
      makeItem({ id: '2', name: 'Hielo', purchasedAt: '2026-08-26T11:00:00.000Z' }),
    ]);

    render(<ShoppingList event={mockEvent} />);

    expect(screen.getByRole('button', { name: 'Pan' })).toBeInTheDocument();
    // Collapsed by default, so the purchased row is not rendered yet.
    expect(screen.queryByRole('button', { name: 'Hielo' })).not.toBeInTheDocument();
  });

  it('collapses the purchased group by default and expands it on click', () => {
    givenItems([makeItem({ id: '2', name: 'Hielo', purchasedAt: '2026-08-26T11:00:00.000Z' })]);

    render(<ShoppingList event={mockEvent} />);

    const groupToggle = screen.getByRole('button', { name: 'purchasedGroup:1' });
    expect(groupToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(groupToggle);

    expect(groupToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Hielo' })).toBeInTheDocument();
  });

  it('announces the pending count in a live region', () => {
    givenItems([makeItem({ id: '1' }), makeItem({ id: '2', name: 'Hielo' })]);

    render(<ShoppingList event={mockEvent} />);

    const counter = screen.getByText('pendingCount:2');
    expect(counter).toHaveAttribute('aria-live', 'polite');
  });

  it('disables the share button when nothing is pending', () => {
    givenItems([makeItem({ id: '1', purchasedAt: '2026-08-26T11:00:00.000Z' })]);

    render(<ShoppingList event={mockEvent} />);

    expect(screen.getByRole('button', { name: 'share.button' })).toBeDisabled();
  });

  it('shares the built text when there is something pending', () => {
    givenItems([makeItem({ id: '1', name: 'Pan' })]);

    render(<ShoppingList event={mockEvent} />);
    fireEvent.click(screen.getByRole('button', { name: 'share.button' }));

    expect(shareTextMock).toHaveBeenCalledTimes(1);
    const sharedText = shareTextMock.mock.calls[0][0] as string;
    expect(sharedText).toContain('Cumple de Marta');
    expect(sharedText).toContain('• Pan');
  });

  it('asks for confirmation before deleting an item', () => {
    givenItems([makeItem({ id: '1', name: 'Pan' })]);

    render(<ShoppingList event={mockEvent} />);
    fireEvent.click(screen.getByRole('button', { name: 'item.delete:Pan' }));

    expect(screen.getByText('deleteDialog.message:Pan')).toBeInTheDocument();
    expect(idleMutation.mutate).not.toHaveBeenCalled();
  });
});
