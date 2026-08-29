import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useIsEventSectionRoute } from './useIsEventSectionRoute';
import type { EventSectionConfig } from '../sections';

const sections = [
  { key: 'money', path: '', end: true, labelKey: 'tabs.money', icon: () => null, activeClasses: '' },
  { key: 'shopping', path: 'shopping', end: false, labelKey: 'tabs.shopping', icon: () => null, activeClasses: '' },
] as unknown as readonly EventSectionConfig[];

function renderAt(pathname: string) {
  return renderHook(() => useIsEventSectionRoute(sections), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>,
  }).result.current;
}

describe('useIsEventSectionRoute', () => {
  it('matches the index section', () => {
    expect(renderAt('/event/event-1')).toBe(true);
  });

  it('matches a named section', () => {
    expect(renderAt('/event/event-1/shopping')).toBe(true);
  });

  it('does not match a detail route nested under the event', () => {
    expect(renderAt('/event/event-1/kpi/balance')).toBe(false);
  });

  it('does not match a route outside the event hub', () => {
    expect(renderAt('/profile')).toBe(false);
  });
});
