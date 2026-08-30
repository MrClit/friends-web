import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventCalendarSection } from './EventCalendarSection';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

const mockEvent = {
  id: 'event-123',
  title: 'Fiesta Mayor',
  status: 'active' as const,
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUseEventLayoutContext = vi.fn();
const isI18nReady = vi.fn(() => true);

vi.mock('@/features/events/hooks', () => ({
  useEventLayoutContext: () => mockUseEventLayoutContext(),
}));

vi.mock('@/shared/hooks/useI18nNamespacesReady', () => ({
  useI18nNamespacesReady: () => isI18nReady(),
}));

vi.mock('@/features/events/components/EventSectionSkeleton', () => ({
  EventSectionSkeleton: () => <div data-testid="event-section-skeleton" />,
}));

vi.mock('@/features/calendar', () => ({
  CalendarPlanning: ({ event }: { event: { id: string } }) => (
    <div data-testid="calendar-planning" data-event-id={event.id} />
  ),
}));

describe('EventCalendarSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEventLayoutContext.mockReturnValue({ event: mockEvent });
    isI18nReady.mockReturnValue(true);
  });

  it('renders the planning for the event resolved by the layout', () => {
    render(<EventCalendarSection />);

    expect(screen.getByTestId('calendar-planning')).toHaveAttribute('data-event-id', 'event-123');
  });

  // Without the gate the section would flash raw translation keys before the namespace lands.
  it('shows the skeleton until its translations are loaded', () => {
    isI18nReady.mockReturnValue(false);

    render(<EventCalendarSection />);

    expect(screen.getByTestId('event-section-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-planning')).not.toBeInTheDocument();
  });
});
