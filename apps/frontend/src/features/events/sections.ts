import type { IconType } from 'react-icons';
import { MdAccountBalanceWallet, MdShoppingCart, MdCalendarMonth } from 'react-icons/md';

/**
 * A section of the event hub, rendered as a tab under the event header and as a
 * nested route under `/event/:id`.
 */
export interface EventSectionConfig {
  /** Stable identifier, also used as the React key. */
  key: string;
  /** Route path relative to `/event/:id`; empty string for the index route. */
  path: string;
  /** Whether the NavLink should only match exactly (true for the index route). */
  end: boolean;
  /** Translation key within the `eventDetail` namespace. */
  labelKey: string;
  icon: IconType;
  /** Full Tailwind class literals: Tailwind v4 cannot resolve composed class names. */
  activeClasses: string;
}

export const EVENT_SECTIONS: readonly EventSectionConfig[] = [
  {
    key: 'money',
    path: '',
    end: true,
    labelKey: 'tabs.money',
    icon: MdAccountBalanceWallet,
    activeClasses: 'text-emerald-700 border-emerald-600 dark:text-emerald-300 dark:border-emerald-400',
  },
  {
    key: 'calendar',
    path: 'calendar',
    end: false,
    labelKey: 'tabs.calendar',
    icon: MdCalendarMonth,
    activeClasses: 'text-emerald-700 border-emerald-600 dark:text-emerald-300 dark:border-emerald-400',
  },
  {
    key: 'shopping',
    path: 'shopping',
    end: false,
    labelKey: 'tabs.shopping',
    icon: MdShoppingCart,
    activeClasses: 'text-emerald-700 border-emerald-600 dark:text-emerald-300 dark:border-emerald-400',
  },
];
