import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventMoneySection } from './EventMoneySection';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUseEventLayoutContext = vi.fn();
const openModalMock = vi.fn();
const isI18nReady = vi.fn(() => true);

vi.mock('@/features/events/hooks', () => ({
  useEventLayoutContext: () => mockUseEventLayoutContext(),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => isI18nReady(),
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/shared/store/useTransactionModalStore', () => ({
  useTransactionModalStore: () => ({ openModal: openModalMock }),
}));

vi.mock('@/features/events', () => ({
  EventKPIGrid: ({ eventId, potBalance }: { eventId: string; potBalance: number }) => (
    <div data-testid="event-kpi-grid" data-event-id={eventId} data-pot-balance={potBalance} />
  ),
}));

vi.mock('@/features/events/components/EventSectionSkeleton', () => ({
  EventSectionSkeleton: () => <div data-testid="event-section-skeleton" />,
}));

vi.mock('@/features/transactions/components/TransactionsList', () => ({
  TransactionsList: ({ event }: { event: { id: string } }) => (
    <div data-testid="transactions-list" data-event-id={event.id} />
  ),
}));

vi.mock('@/features/transactions/components/TransactionModal', () => ({
  TransactionModal: () => null,
}));

vi.mock('@/shared/components/ActionButton', () => ({
  FAB_POSITION_CLASSES: 'fixed',
  ActionButton: ({ onClick, actionLabel }: { onClick: () => void; actionLabel: string }) => (
    <button onClick={onClick}>{actionLabel}</button>
  ),
}));

describe('EventMoneySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isI18nReady.mockReturnValue(true);
    mockUseEventLayoutContext.mockReturnValue({ event: mockEvent, kpis: { potBalance: 42 } });
  });

  it('shows the section skeleton until its namespaces are loaded', () => {
    isI18nReady.mockReturnValue(false);
    render(<EventMoneySection />);

    expect(screen.getByTestId('event-section-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('transactions-list')).not.toBeInTheDocument();
  });

  it('renders the KPI grid and the transactions list for the event in context', () => {
    render(<EventMoneySection />);

    expect(screen.getByTestId('event-kpi-grid')).toHaveAttribute('data-event-id', 'event-123');
    expect(screen.getByTestId('event-kpi-grid')).toHaveAttribute('data-pot-balance', '42');
    expect(screen.getByTestId('transactions-list')).toHaveAttribute('data-event-id', 'event-123');
  });

  it('falls back to zeroed KPIs when they have not loaded yet', () => {
    mockUseEventLayoutContext.mockReturnValue({ event: mockEvent, kpis: undefined });
    render(<EventMoneySection />);

    expect(screen.getByTestId('event-kpi-grid')).toHaveAttribute('data-pot-balance', '0');
  });

  it('opens the transaction modal with the event from the contextual action button', () => {
    render(<EventMoneySection />);
    fireEvent.click(screen.getByRole('button', { name: 'addTransaction' }));

    expect(openModalMock).toHaveBeenCalledWith(mockEvent);
  });
});
