import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KPIDetailView } from './KPIDetailView';
import type { EventKPIs } from '@/api/types';
import type { Event } from '@/features/events/types';

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

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: undefined }),
}));

vi.mock('./KPIDetailContent.tsx', () => ({
  KPIDetailContent: ({ kpi }: { kpi: string }) => <div data-testid="kpi-detail-content">{kpi}</div>,
}));

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  status: 'active',
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Event;

const mockKPIs = {
  totalExpenses: 0,
  totalContributions: 0,
  totalCompensations: 0,
  potBalance: 0,
  pendingToCompensate: 0,
  participantBalances: {},
  participantContributions: {},
  participantExpenses: {},
  participantCompensations: {},
  participantPending: {},
  potExpenses: 0,
} as unknown as EventKPIs;

function renderView(kpi: string) {
  return render(
    <MemoryRouter initialEntries={[`/event/event-123/kpi/${kpi}`]}>
      <Routes>
        <Route path="/event/:id/kpi/:kpi" element={<KPIDetailView event={mockEvent} kpis={mockKPIs} kpi={kpi} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('KPIDetailView', () => {
  it('renders a valid KPI as itself', () => {
    renderView('balance');
    expect(screen.getByTestId('kpi-detail-content')).toHaveTextContent('balance');
  });

  it.each(['contributions', 'pending'])('keeps the legacy %s link alive as contributionStatus', (legacyKpi) => {
    renderView(legacyKpi);
    expect(screen.getByTestId('kpi-detail-content')).toHaveTextContent('contributionStatus');
  });

  it('shows its own not-found message for an unknown KPI', () => {
    renderView('nope');
    expect(screen.getByText('notFound')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-detail-content')).not.toBeInTheDocument();
  });
});
