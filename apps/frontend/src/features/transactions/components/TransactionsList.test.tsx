import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionsList } from './TransactionsList';
import type { Transaction } from '../types';
import type { Event } from '../../events/types';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// The real formatDateLong stays in play: rendering the day header is exactly what
// would expose a timezone drift in the value the API returns.
vi.mock('@/i18n', () => ({
  getCurrentLocale: () => 'es-ES',
}));

const mockUseTransactionsPaginated = vi.fn();

vi.mock('@/hooks/api/useTransactions', () => ({
  useTransactionsPaginated: (...args: unknown[]) => mockUseTransactionsPaginated(...args),
}));

vi.mock('@/hooks/common', () => ({
  useInfiniteScroll: () => ({ observerRef: { current: null } }),
}));

vi.mock('@/shared/store/useTransactionModalStore', () => ({
  useTransactionModalStore: () => ({ openModal: vi.fn() }),
}));

vi.mock('./TransactionModal', () => ({
  TransactionModal: () => null,
}));

vi.mock('./TransactionItem', () => ({
  TransactionItem: ({ transaction }: { transaction: Transaction }) => (
    <li data-testid="transaction-item">{transaction.title}</li>
  ),
}));

const event = {
  id: 'event-1',
  title: 'Trip',
  status: 'active',
  participants: [],
} as unknown as Event;

function makeTransaction(id: string, title: string, date: string): Transaction {
  return {
    id,
    title,
    paymentType: 'expense',
    amount: 10,
    participantId: 'g1',
    date,
    eventId: event.id,
  } as Transaction;
}

function mockTransactions(transactions: Transaction[]) {
  mockUseTransactionsPaginated.mockReturnValue({
    data: { pages: [{ transactions, hasMore: false, totalDates: 1, loadedDates: 1 }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
}

/** Day headers are the only place the API's date format is observable in the UI. */
describe('TransactionsList day grouping', () => {
  beforeEach(() => {
    mockUseTransactionsPaginated.mockReset();
  });

  it('renders one header per calendar day, newest first', () => {
    mockTransactions([makeTransaction('t1', 'Dinner', '2026-02-25'), makeTransaction('t2', 'Taxi', '2026-02-24')]);

    render(<TransactionsList event={event} />);

    const headers = screen.getAllByText(/de febrero de 2026/);
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent('25');
    expect(headers[1]).toHaveTextContent('24');
  });

  it('keeps transactions of the same day under a single header', () => {
    mockTransactions([
      makeTransaction('t1', 'Breakfast', '2026-02-25'),
      makeTransaction('t2', 'Lunch', '2026-02-25'),
      makeTransaction('t3', 'Taxi', '2026-02-24'),
    ]);

    render(<TransactionsList event={event} />);

    expect(screen.getAllByText(/de febrero de 2026/)).toHaveLength(2);
    expect(screen.getAllByTestId('transaction-item')).toHaveLength(3);
  });

  it('renders the same calendar day the API sent, with no timezone drift', () => {
    // A full ISO timestamp here would render as the 24th in any timezone behind the
    // server's, which is what the paginated endpoint used to send.
    mockTransactions([makeTransaction('t1', 'New year', '2026-01-01')]);

    render(<TransactionsList event={event} />);

    expect(screen.getByText(/1 de enero de 2026/)).toBeInTheDocument();
  });

  it('shows the empty state when there are no transactions', () => {
    mockTransactions([]);

    render(<TransactionsList event={event} />);

    expect(screen.getByText('transactionsList.noTransactions')).toBeInTheDocument();
  });
});
