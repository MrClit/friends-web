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
    useTranslation: () => ({
      t: (key: string, options?: { amount?: string }) => (options?.amount ? `${key}:${options.amount}` : key),
    }),
  };
});

vi.mock('@/shared/utils/format', () => ({
  formatAmount: (amount: number) => `${amount} €`,
}));

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const participantsWithTargets = [
  { type: 'user' as const, id: 'user-1', name: 'Alice', contributionTarget: 30 },
  { type: 'guest' as const, id: 'guest-1', name: 'Guest', contributionTarget: 20.5 },
  { type: 'pot' as const, id: '0' as const },
];

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

vi.mock('@/features/events/components/ContributionTargetsModal', () => ({
  ContributionTargetsModal: ({
    open,
    eventId,
    participants,
    totalExpenses,
    onClose,
  }: {
    open: boolean;
    eventId: string;
    participants: unknown[];
    totalExpenses: number;
    onClose: () => void;
  }) => (
    <div
      data-testid="contribution-targets-modal"
      data-open={open}
      data-event-id={eventId}
      data-participants={participants.length}
      data-total-expenses={totalExpenses}
    >
      <button onClick={onClose}>close-targets</button>
    </div>
  ),
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

  describe('contribution targets subheader', () => {
    it('says there are no targets when no participant has one', () => {
      render(<EventMoneySection />);

      expect(screen.getByText('targets.summaryNone')).toBeInTheDocument();
    });

    it('shows the total target of the event', () => {
      mockUseEventLayoutContext.mockReturnValue({
        event: { ...mockEvent, participants: participantsWithTargets },
        kpis: { potBalance: 0 },
      });
      render(<EventMoneySection />);

      expect(screen.getByText('targets.summaryTotal:50.5 €')).toBeInTheDocument();
    });

    it('opens the targets modal with the event data and closes it back', () => {
      mockUseEventLayoutContext.mockReturnValue({
        event: { ...mockEvent, participants: participantsWithTargets },
        kpis: { potBalance: 0, totalExpenses: 120 },
      });
      render(<EventMoneySection />);

      const modal = screen.getByTestId('contribution-targets-modal');
      expect(modal).toHaveAttribute('data-open', 'false');
      expect(modal).toHaveAttribute('data-event-id', 'event-123');
      expect(modal).toHaveAttribute('data-participants', '3');
      expect(modal).toHaveAttribute('data-total-expenses', '120');

      fireEvent.click(screen.getByRole('button', { name: 'targets.openAria' }));
      expect(modal).toHaveAttribute('data-open', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'close-targets' }));
      expect(modal).toHaveAttribute('data-open', 'false');
    });

    it('passes zero expenses to the modal while the KPIs have not loaded', () => {
      mockUseEventLayoutContext.mockReturnValue({ event: mockEvent, kpis: undefined });
      render(<EventMoneySection />);

      expect(screen.getByTestId('contribution-targets-modal')).toHaveAttribute('data-total-expenses', '0');
    });
  });
});
