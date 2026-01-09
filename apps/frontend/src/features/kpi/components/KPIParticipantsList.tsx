import { FaPiggyBank } from 'react-icons/fa';
import type { KPIParticipantItem } from '../types';

interface KPIParticipantsListProps {
  items: KPIParticipantItem[];
  title: string; // Translated title (e.g., "Participants")
}

/**
 * List component for displaying participants and optionally the Pot
 * Shows participant names with their KPI values
 * Pot items are visually differentiated with orange border and piggy bank icon
 */
export default function KPIParticipantsList({ items, title }: KPIParticipantsListProps) {
  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-lg font-semibold mb-4 text-teal-700 dark:text-teal-100">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 shadow-sm 
              ${
                item.isPot
                  ? 'border-2 border-orange-300 dark:border-orange-700'
                  : 'hover:bg-teal-50 dark:hover:bg-teal-900'
              } transition-colors`}
          >
            {item.isPot && <FaPiggyBank className="text-orange-600 dark:text-orange-400 text-xl flex-shrink-0" />}
            <div className="flex-1">
              <div
                className={`font-semibold text-base ${
                  item.isPot ? 'text-orange-800 dark:text-orange-200' : 'text-teal-900 dark:text-teal-100'
                }`}
              >
                {item.name}
              </div>
            </div>
            <div
              className={`font-bold text-lg tabular-nums ${
                item.isPot ? 'text-orange-800 dark:text-orange-200' : 'text-teal-700 dark:text-teal-200'
              }`}
            >
              {item.value}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
