import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KPIDetail } from './KPIDetail';
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

const mockUseEventLayoutContext = vi.fn();

vi.mock('@/features/events/hooks', () => ({
  useEventLayoutContext: () => mockUseEventLayoutContext(),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => true,
}));

vi.mock('@/features/events/components/EventSectionSkeleton', () => ({
  EventSectionSkeleton: () => <div data-testid="event-section-skeleton" />,
}));

vi.mock('@/shared/components', () => ({
  ErrorState: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-state">{onRetry && <button onClick={onRetry}>retry</button>}</div>
  ),
}));

vi.mock('@/features/kpi', () => ({
  KPIDetailView: ({ kpi }: { kpi: string }) => <div data-testid="kpi-detail-view">{kpi}</div>,
}));

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function defaultContext(overrides = {}) {
  return {
    event: mockEvent,
    kpis: { potBalance: 42 },
    isLoadingKpis: false,
    kpisError: null,
    refetchKpis: vi.fn(),
    ...overrides,
  };
}

function renderPage(initialEntry = '/event/event-123/kpi/balance') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/event/:id/kpi/:kpi" element={<KPIDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('KPIDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the section skeleton while the KPIs load', () => {
    mockUseEventLayoutContext.mockReturnValue(defaultContext({ kpis: undefined, isLoadingKpis: true }));
    renderPage();

    expect(screen.getByTestId('event-section-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-detail-view')).not.toBeInTheDocument();
  });

  it('shows ErrorState without retry button for a 404 on the KPIs', () => {
    const kpisError = new ApiError(404, 'Not Found', 'Event not found');
    mockUseEventLayoutContext.mockReturnValue(defaultContext({ kpis: undefined, kpisError }));
    renderPage();

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'retry' })).not.toBeInTheDocument();
  });

  it('retries the KPIs from ErrorState on a non-404 error', () => {
    const context = defaultContext({
      kpis: undefined,
      kpisError: new ApiError(500, 'Internal Server Error', 'Server error'),
    });
    mockUseEventLayoutContext.mockReturnValue(context);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(context.refetchKpis).toHaveBeenCalled();
  });

  it('shows the KPI not-found message when the KPIs are missing without error', () => {
    mockUseEventLayoutContext.mockReturnValue(defaultContext({ kpis: undefined }));
    renderPage();

    expect(screen.getByText('notFound')).toBeInTheDocument();
  });

  it('renders the KPI view with the KPI from the URL once everything is loaded', () => {
    mockUseEventLayoutContext.mockReturnValue(defaultContext());
    renderPage();

    expect(screen.getByTestId('kpi-detail-view')).toHaveTextContent('balance');
  });
});
