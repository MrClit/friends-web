import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { MdAccountBalanceWallet, MdCalendarMonth } from 'react-icons/md';
import { EventSectionTabs } from './EventSectionTabs';
import type { EventSectionConfig } from '../sections';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const twoSections: EventSectionConfig[] = [
  {
    key: 'money',
    path: '',
    end: true,
    labelKey: 'tabs.money',
    icon: MdAccountBalanceWallet,
    activeClasses: 'text-emerald-700',
  },
  {
    key: 'calendar',
    path: 'calendar',
    end: false,
    labelKey: 'tabs.calendar',
    icon: MdCalendarMonth,
    activeClasses: 'text-violet-700',
  },
];

function renderTabs(sections: EventSectionConfig[], initialEntry = '/event/event-123') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/event/:id"
          element={
            <>
              <EventSectionTabs sections={sections} />
              <Outlet />
            </>
          }
        >
          <Route index element={<div>money-section</div>} />
          <Route path="calendar" element={<div>calendar-section</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventSectionTabs', () => {
  it('renders nothing while a single section exists', () => {
    // Uses the real EVENT_SECTIONS registry, which only holds the money section.
    render(
      <MemoryRouter initialEntries={['/event/event-123']}>
        <Routes>
          <Route path="/event/:id" element={<EventSectionTabs />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders one link per section inside a labelled nav', () => {
    renderTabs(twoSections);

    const nav = screen.getByRole('navigation', { name: 'tabs.ariaLabel' });
    const links = screen.getAllByRole('link');

    expect(nav).toBeInTheDocument();
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/event/event-123');
    expect(links[1]).toHaveAttribute('href', '/event/event-123/calendar');
  });

  it('marks the section matching the current route with aria-current', () => {
    renderTabs(twoSections);

    expect(screen.getByRole('link', { name: 'tabs.money' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'tabs.calendar' })).not.toHaveAttribute('aria-current');
  });

  it('moves aria-current when another section is active', () => {
    renderTabs(twoSections, '/event/event-123/calendar');

    expect(screen.getByRole('link', { name: 'tabs.calendar' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'tabs.money' })).not.toHaveAttribute('aria-current');
  });
});
