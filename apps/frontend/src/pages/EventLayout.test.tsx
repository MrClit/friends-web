import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { EventLayout } from './EventLayout';
import type { EventLayoutContext } from '@/features/events/hooks';
import { ApiError } from '@/api/client';

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

const mockUseEventDetail = vi.fn();
const mockUseIsEventSectionRoute = vi.fn();

vi.mock('@/features/events/hooks', () => ({
  useEventDetail: (...args: unknown[]) => mockUseEventDetail(...args),
  useIsEventSectionRoute: () => mockUseIsEventSectionRoute(),
}));

vi.mock('@/hooks/common', () => ({
  useConfirmDialog: () => ({
    isOpen: false,
    confirm: vi.fn(),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

vi.mock('@/shared/store/useEventFormModalStore', () => ({
  useEventFormModalStore: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => true,
}));

vi.mock('./MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/events', () => ({
  EventDetailHeader: ({ onBack, onEdit, onDelete, onToggleArchive }: Record<string, (() => void) | undefined>) => (
    <div data-testid="event-detail-header" data-has-actions={String(Boolean(onEdit || onDelete || onToggleArchive))}>
      <button onClick={onBack}>back</button>
    </div>
  ),
  EventFormModal: () => null,
  EventSectionTabs: () => <div data-testid="event-section-tabs" />,
}));

vi.mock('@/features/events/components/EventDetailSkeleton', () => ({
  EventDetailSkeleton: () => <div data-testid="event-detail-skeleton" />,
}));

vi.mock('@/features/events/components/EventSectionSkeleton', () => ({
  EventSectionSkeleton: () => <div data-testid="event-section-skeleton" />,
}));

vi.mock('@/shared/components', () => ({
  ConfirmDialog: () => null,
  ErrorState: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-state">{onRetry && <button onClick={onRetry}>retry</button>}</div>
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
    isLoadingKpis: false,
    kpisError: null,
    refetchKpis: vi.fn(),
    handleDelete: vi.fn(),
    handleToggleArchive: vi.fn(),
    handleBack: vi.fn(),
    handleBackToEvent: vi.fn(),
    isMutatingEvent: false,
    ...overrides,
  };
}

/** Stands in for a real section: proves the loaded event reaches the outlet. */
function SectionProbe() {
  const { event, kpis } = useOutletContext<EventLayoutContext>();

  return (
    <div data-testid="section-probe" data-kpis={String(kpis?.potBalance ?? 'none')}>
      {event.title}
    </div>
  );
}

function renderLayout(initialEntry = '/event/event-123') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/event/:id" element={<EventLayout />}>
          <Route index element={<SectionProbe />} />
          <Route path="kpi/:kpi" element={<div data-testid="kpi-probe" />} />
        </Route>
        <Route path="/event" element={<EventLayout />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsEventSectionRoute.mockReturnValue(true);
  });

  it('shows skeleton while loading', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ isLoading: true }));
    renderLayout();
    expect(screen.getByTestId('event-detail-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('event-detail-header')).not.toBeInTheDocument();
  });

  it('shows the invalid id message when the route carries no event id', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn());
    renderLayout('/event');
    expect(screen.getByText('invalidId')).toBeInTheDocument();
  });

  it('shows ErrorState without retry button for 404 ApiError', () => {
    const error = new ApiError(404, 'Not Found', 'Event not found');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    renderLayout();
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'retry' })).not.toBeInTheDocument();
  });

  it('shows ErrorState with retry button for non-404 ApiError', () => {
    const error = new ApiError(500, 'Internal Server Error', 'Server error');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    renderLayout();
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });

  it('shows not-found message when event is null without error', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn());
    renderLayout();
    expect(screen.getByText('notFound')).toBeInTheDocument();
  });

  it('renders header, tabs and the section with the event in context', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ event: mockEvent, kpis: { potBalance: 42 } }));
    renderLayout();

    expect(screen.getByTestId('event-detail-header')).toBeInTheDocument();
    expect(screen.getByTestId('event-section-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('section-probe')).toHaveTextContent('Test Event');
    expect(screen.getByTestId('section-probe')).toHaveAttribute('data-kpis', '42');
    expect(screen.queryByTestId('event-detail-skeleton')).not.toBeInTheDocument();
  });

  it('gives a section route the tabs, the event actions and a back button to the event list', () => {
    const hookReturn = defaultHookReturn({ event: mockEvent });
    mockUseEventDetail.mockReturnValue(hookReturn);
    renderLayout();

    expect(screen.getByTestId('event-section-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('event-detail-header')).toHaveAttribute('data-has-actions', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(hookReturn.handleBack).toHaveBeenCalled();
    expect(hookReturn.handleBackToEvent).not.toHaveBeenCalled();
  });

  it('keeps tabs and event actions out of a detail route and sends back to the event', () => {
    const hookReturn = defaultHookReturn({ event: mockEvent });
    mockUseEventDetail.mockReturnValue(hookReturn);
    mockUseIsEventSectionRoute.mockReturnValue(false);
    renderLayout('/event/event-123/kpi/balance');

    expect(screen.getByTestId('kpi-probe')).toBeInTheDocument();
    expect(screen.queryByTestId('event-section-tabs')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-detail-header')).toHaveAttribute('data-has-actions', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(hookReturn.handleBackToEvent).toHaveBeenCalled();
    expect(hookReturn.handleBack).not.toHaveBeenCalled();
  });
});
