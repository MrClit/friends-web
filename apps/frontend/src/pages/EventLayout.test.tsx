import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router';
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

type StubAction = { label: string; to: string } | { label: string; onClick: () => void };

function StubActionControl({ action, testId }: { action: StubAction; testId: string }) {
  return 'to' in action ? (
    <a data-testid={testId} href={action.to}>
      {action.label}
    </a>
  ) : (
    <button data-testid={testId} onClick={action.onClick}>
      {action.label}
    </button>
  );
}

vi.mock('@/shared/components', () => ({
  ConfirmDialog: () => null,
  FullPageMessage: ({
    title,
    message,
    primaryAction,
    secondaryAction,
  }: {
    title: string;
    message: string;
    primaryAction: StubAction;
    secondaryAction?: StubAction;
  }) => (
    <div data-testid="full-page-message">
      <h1>{title}</h1>
      <p data-testid="full-page-message-text">{message}</p>
      <StubActionControl action={primaryAction} testId="primary-action" />
      {secondaryAction && <StubActionControl action={secondaryAction} testId="secondary-action" />}
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

  /** A dead end: the unavailable page, whose only action leads home. */
  function expectUnavailablePage(message: string) {
    expect(screen.getByRole('heading', { name: 'unavailableTitle' })).toBeInTheDocument();
    expect(screen.getByTestId('full-page-message-text')).toHaveTextContent(message);
    expect(screen.getByTestId('primary-action')).toHaveTextContent('goHome');
    expect(screen.getByTestId('primary-action')).toHaveAttribute('href', '/');
    expect(screen.queryByTestId('secondary-action')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'retry' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('event-detail-header')).not.toBeInTheDocument();
  }

  it('shows the unavailable page with the invalid link message when the route carries no event id', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn());
    renderLayout('/event');
    expectUnavailablePage('invalidLink');
  });

  it.each([403, 404])('shows the unavailable page with the not-found-or-no-access message for a %i', (status) => {
    const error = new ApiError(status, 'Error', 'Error');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    renderLayout();
    expectUnavailablePage('notFoundOrNoAccess');
  });

  it('shows the unavailable page with the invalid link message for a 400 (malformed id in the URL)', () => {
    const error = new ApiError(400, 'Bad Request', 'Validation failed (uuid is expected)');
    mockUseEventDetail.mockReturnValue(defaultHookReturn({ error }));
    renderLayout('/event/not-a-uuid');
    expectUnavailablePage('invalidLink');
  });

  it.each([
    ['a server error', new ApiError(500, 'Internal Server Error', 'Server error')],
    ['a network failure', new ApiError(0, 'Network Error', 'Failed to fetch')],
    ['an unknown error', new Error('boom')],
  ])('shows the load-failed page with retry first and home second for %s', (_, error) => {
    const hookReturn = defaultHookReturn({ error });
    mockUseEventDetail.mockReturnValue(hookReturn);
    renderLayout();

    expect(screen.getByRole('heading', { name: 'loadFailedTitle' })).toBeInTheDocument();
    expect(screen.getByTestId('full-page-message-text')).toHaveTextContent('errorLoading');
    expect(screen.getByTestId('primary-action')).toHaveTextContent('retry');
    expect(screen.getByTestId('secondary-action')).toHaveTextContent('goHome');
    expect(screen.getByTestId('secondary-action')).toHaveAttribute('href', '/');

    fireEvent.click(screen.getByTestId('primary-action'));
    expect(hookReturn.refetch).toHaveBeenCalledOnce();
  });

  it('shows the unavailable page when the event is missing without an error', () => {
    mockUseEventDetail.mockReturnValue(defaultHookReturn());
    renderLayout();
    expectUnavailablePage('notFoundOrNoAccess');
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
