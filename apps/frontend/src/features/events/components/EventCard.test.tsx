import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EventCard } from './EventCard';

vi.mock('@/shared/utils/format', () => ({
  formatDateShort: (date: string) => (date === 'invalid-date' ? '' : 'Jan 20, 2026'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options.title === 'string') return `${key}:${options.title}`;
      return key;
    },
    i18n: { language: 'es' },
  }),
}));

describe('EventCard', () => {
  it('renders defaults for description and active status', () => {
    render(
      <EventCard
        event={{
          id: 'event-1',
          title: 'Trip to Madrid',
        }}
      />,
    );

    expect(screen.getByText('Trip to Madrid')).toBeInTheDocument();
    expect(screen.getByText('eventCard.noDescription')).toBeInTheDocument();
    expect(screen.getByText('status.active')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked or activated with keyboard', () => {
    const onClick = vi.fn();

    render(
      <EventCard
        event={{
          id: 'event-2',
          title: 'Weekend Plan',
        }}
        onClick={onClick}
      />,
    );

    const card = screen.getByRole('button', { name: /eventCard.openAriaLabel:Weekend Plan/i });

    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onClick).toHaveBeenCalledTimes(3);
    expect(onClick).toHaveBeenNthCalledWith(1, 'event-2');
    expect(onClick).toHaveBeenNthCalledWith(2, 'event-2');
    expect(onClick).toHaveBeenNthCalledWith(3, 'event-2');
  });

  it('renders archived labels when status is archived', () => {
    render(
      <EventCard
        event={{
          id: 'event-3',
          title: 'Old Event',
          status: 'archived',
        }}
      />,
    );

    expect(screen.getByText('status.archived')).toBeInTheDocument();
    expect(screen.getByText('eventCard.archivedLabel')).toBeInTheDocument();
  });

  it('shows only first three avatars and overflow count', () => {
    render(
      <EventCard
        event={{
          id: 'event-4',
          title: 'Party',
          participants: [
            { name: 'Ana', avatarUrl: 'https://example.com/ana.png' },
            { name: 'Luis', avatarUrl: 'https://example.com/luis.png' },
            { name: 'Marta', avatarUrl: 'https://example.com/marta.png' },
            { name: 'Pablo', avatarUrl: 'https://example.com/pablo.png' },
            { name: 'Nora', avatarUrl: 'https://example.com/nora.png' },
          ],
        }}
      />,
    );

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders last modified date only when formatter returns a non-empty value', () => {
    const { rerender } = render(
      <EventCard
        event={{
          id: 'event-5',
          title: 'Current Event',
          lastModified: '2026-01-20T10:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Jan 20, 2026')).toBeInTheDocument();

    rerender(
      <EventCard
        event={{
          id: 'event-6',
          title: 'Broken Event',
          lastModified: 'invalid-date',
        }}
      />,
    );

    expect(screen.queryByText('Jan 20, 2026')).not.toBeInTheDocument();
  });
});
