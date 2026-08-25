import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/utils';
import { EVENT_SECTIONS, type EventSectionConfig } from '../sections';

interface EventSectionTabsProps {
  sections?: readonly EventSectionConfig[];
}

/**
 * Section navigation for the event hub. These are routes, not ARIA tabs, so the
 * markup is a plain nav of links and NavLink supplies `aria-current="page"`.
 *
 * Sticky offset matches the global header height (40px logo + py-4 + 1px border).
 */
export function EventSectionTabs({ sections = EVENT_SECTIONS }: EventSectionTabsProps) {
  const { t } = useTranslation('eventDetail');

  // A single section needs no navigation; the bar appears once a second one ships.
  if (sections.length < 2) {
    return null;
  }

  return (
    <nav
      aria-label={t('tabs.ariaLabel')}
      className="sticky top-[73px] z-40 mb-6 border-b border-emerald-100 bg-[rgba(255,255,255,0.85)] backdrop-blur-md dark:border-emerald-800/50 dark:bg-[rgba(2,44,34,0.85)]"
    >
      <ul className="flex items-stretch gap-1 sm:gap-2">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <li key={section.key} className="flex-1 sm:flex-none">
              <NavLink
                to={section.path === '' ? '.' : section.path}
                end={section.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs font-medium',
                    'rounded-t-lg border-b-2 border-transparent text-slate-600 transition-colors',
                    'hover:bg-emerald-50/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    'dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-white',
                    'sm:flex-row sm:gap-2 sm:px-4 sm:text-sm',
                    isActive && section.activeClasses,
                  )
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span>{t(section.labelKey)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
