import { matchPath, useLocation } from 'react-router-dom';
import { EVENT_SECTIONS, type EventSectionConfig } from '../sections';

/**
 * Tells a section route of the event hub apart from a detail route nested under
 * it (the KPI drill-down). Derived from the section registry, so a new section
 * gets the hub chrome for free and a new detail route stays out of it.
 */
export function useIsEventSectionRoute(sections: readonly EventSectionConfig[] = EVENT_SECTIONS): boolean {
  const { pathname } = useLocation();

  return sections.some((section) =>
    Boolean(matchPath({ path: ['/event/:id', section.path].filter(Boolean).join('/'), end: true }, pathname)),
  );
}
