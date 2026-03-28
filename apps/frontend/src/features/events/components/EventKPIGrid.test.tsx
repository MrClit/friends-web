import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventKPIGrid } from './EventKPIGrid';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { amount?: string }) => {
        const translations: Record<string, string> = {
          'eventDetail.kpi.pot': 'Pot Balance',
          'eventDetail.kpi.contributionStatus': 'Contribution Status',
          'eventDetail.kpi.contributionStatusHelper': `Pending adjustment: ${options?.amount ?? ''}`,
          'eventDetail.kpi.contributionStatusNoTargetHelper': `No targets defined · Adjustment: ${options?.amount ?? ''}`,
          'eventDetail.kpi.userStatus': 'Your Contribution Status',
          'eventDetail.kpi.userStatusHelper': `Pending adjustment: ${options?.amount ?? ''}`,
          'eventDetail.kpi.userStatusNoTargetHelper': `No target defined · Adjustment: ${options?.amount ?? ''}`,
          'eventDetail.kpi.userStatusNoParticipation': 'No participas',
          'eventDetail.kpi.expenses': 'Total Expenses',
        };

        return translations[key] ?? key;
      },
    }),
  };
});

describe('EventKPIGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows no-participation helper in personal KPI when current user is not part of event', () => {
    render(
      <EventKPIGrid
        eventId="event-1"
        currentUserId="admin-1"
        participants={[
          { type: 'user', id: 'u1', name: 'Alice', contributionTarget: 100 },
          { type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 50 },
          { type: 'pot', id: '0' },
        ]}
        potBalance={120}
        totalContributions={80}
        totalExpenses={45}
        participantPending={{ u1: -20, g1: 10 }}
      />,
    );

    expect(screen.getByText('Your Contribution Status')).toBeInTheDocument();
    expect(screen.getByText('No participas')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('navigates to userStatus KPI detail when personal card is clicked', () => {
    render(
      <EventKPIGrid
        eventId="event-1"
        currentUserId="u1"
        participants={[
          { type: 'user', id: 'u1', name: 'Alice', contributionTarget: 100 },
          { type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 50 },
        ]}
        potBalance={120}
        totalContributions={80}
        totalExpenses={45}
        participantPending={{ u1: -20, g1: 10 }}
      />,
    );

    const personalCard = screen.getByRole('button', { name: /Your Contribution Status/i });
    fireEvent.click(personalCard);

    expect(navigateMock).toHaveBeenCalledWith('/event/event-1/kpi/userStatus');
  });
});
