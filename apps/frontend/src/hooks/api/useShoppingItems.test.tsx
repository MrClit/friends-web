import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShoppingItem } from '@/api/types';
import { queryKeys } from './keys';
import { useToggleShoppingItemPurchased } from './useShoppingItems';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

const updateMock = vi.fn();
vi.mock('@/api/shopping.api', () => ({
  shoppingApi: {
    getByEvent: vi.fn(),
    create: vi.fn(),
    update: (id: string, dto: unknown) => updateMock(id, dto) as Promise<ShoppingItem>,
    delete: vi.fn(),
  },
}));

vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const EVENT_ID = 'event-1';
const queryKey = queryKeys.shoppingItems.byEvent(EVENT_ID);

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'item-1',
  eventId: EVENT_ID,
  name: 'Pan',
  createdBy: 'user-1',
  purchasedBy: null,
  purchasedAt: null,
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
  ...overrides,
});

const renderToggle = (initialItems: ShoppingItem[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKey, initialItems);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useToggleShoppingItemPurchased(EVENT_ID, 'user-9'), { wrapper });
  return { queryClient, result };
};

const readCache = (queryClient: QueryClient) => queryClient.getQueryData<ShoppingItem[]>(queryKey);

describe('useToggleShoppingItemPurchased', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the item as purchased in the cache before the request resolves', async () => {
    let resolveUpdate: (value: ShoppingItem) => void = () => {};
    updateMock.mockReturnValue(
      new Promise<ShoppingItem>((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const { queryClient, result } = renderToggle([makeItem()]);

    result.current.mutate({ id: 'item-1', purchased: true });

    await waitFor(() => {
      expect(readCache(queryClient)?.[0].purchasedAt).not.toBeNull();
    });
    expect(readCache(queryClient)?.[0].purchasedBy).toBe('user-9');

    resolveUpdate(makeItem({ purchasedAt: '2026-08-26T12:00:00.000Z', purchasedBy: 'user-9' }));
  });

  it('clears the attribution optimistically when unmarking', async () => {
    updateMock.mockResolvedValue(makeItem());
    const { queryClient, result } = renderToggle([
      makeItem({ purchasedAt: '2026-08-26T11:00:00.000Z', purchasedBy: 'user-2' }),
    ]);

    result.current.mutate({ id: 'item-1', purchased: false });

    await waitFor(() => {
      expect(readCache(queryClient)?.[0].purchasedAt).toBeNull();
    });
    expect(readCache(queryClient)?.[0].purchasedBy).toBeNull();
  });

  it('restores the previous list when the request fails', async () => {
    updateMock.mockRejectedValue(new Error('network down'));
    const initialItems = [makeItem(), makeItem({ id: 'item-2', name: 'Hielo' })];
    const { queryClient, result } = renderToggle(initialItems);

    result.current.mutate({ id: 'item-1', purchased: true });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(readCache(queryClient)).toEqual(initialItems);
  });

  it('leaves the other items untouched', async () => {
    updateMock.mockResolvedValue(makeItem());
    const { queryClient, result } = renderToggle([makeItem(), makeItem({ id: 'item-2', name: 'Hielo' })]);

    result.current.mutate({ id: 'item-1', purchased: true });

    await waitFor(() => {
      expect(readCache(queryClient)?.[0].purchasedAt).not.toBeNull();
    });
    expect(readCache(queryClient)?.[1].purchasedAt).toBeNull();
  });
});
