import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventDetail } from './EventDetail';
import { ApiError } from '@/api/client';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'event-123' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockUseEventDetail = vi.fn();

vi.mock('@/features/events/hooks', () => ({
  useEventDetail: (...args: unknown[]) => mockUseEventDetail(...args),
}));

vi.mock('@/hooks/common', () => ({
  useConfirmDialog: () => ({
    isOpen: false,
    confirm: vi.fn(),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/shared/store/useEventFormModalStore', () => ({
  useEventFormModalStore: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/shared/store/useTransactionModalStore', () => ({
  useTransactionModalStore: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => true,
}));

vi.mock('./MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/events', () => ({
  EventDetailHeader: () => <div data-testid="event-detail-header" />,
  EventKPIGrid: () => <div data-testid="event-kpi-grid" />,
  EventFormModal: () => null,
}));

vi.mock('@/features/events/components/EventDetailSkeleton', () => ({
  EventDetailSkeleton: () => <div data-testid="event-detail-skeleton" />,
}));

vi.mock('../features/transactions/components/TransactionModal', () => ({
  TransactionModal: () => null,
}));

vi.mock('../features/transactions/components/TransactionsList', () => ({
  TransactionsList: () => <div data-testid="transactions-list" />,
}));

vi.mock('@/shared/components/ActionButton', () => ({
  ActionButton: () => <button>add-transaction</button>,
}));

vi.mock('@/shared/components', () => ({
  ConfirmDialog: () => null,
  ErrorState: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-state">
      {onRetry && <button onClick={onRetry}>retry</button>}
    </div>
  ),
}));

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function defaultHookReturn(overrides = {}) {
  return {
    event: undefined,
    kpis: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    handleDelete: vi.fn(),
    handleToggleArchive: vi.fn(),
    handleBack: vi.fn(),
    isMutatingEvent: false,
    ...overrides,
  };
}

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ isLoading: true }));
    render(<EventDetail />);
    expect(screen.getByTestId('event-detail-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('event-detail-header')).not.toBeInTheDocument();
  });

  it('shows ErrorState without retry button for 404 ApiError', () => {
    const error = new ApiError(404, 'Not Found', 'Event not found');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    render(<EventDetail />);
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'retry' })).not.toBeInTheDocument();
  });

  it('shows ErrorState with retry button for non-404 ApiError', () => {
    const error = new ApiError(500, 'Internal Server Error', 'Server error');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    render(<EventDetail />);
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });

  it('shows not-found message when event is null without error', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn());
    render(<EventDetail />);
    expect(screen.getByText('notFound')).toBeInTheDocument();
  });

  it('renders event content when event is loaded', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ event: mockEvent, kpis: null }));
    render(<EventDetail />);
    expect(screen.getByTestId('event-detail-header')).toBeInTheDocument();
    expect(screen.getByTestId('event-kpi-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('event-detail-skeleton')).not.toBeInTheDocument();
  });
});
