import { FaPiggyBank } from 'react-icons/fa';
import * as Progress from '@radix-ui/react-progress';
import { cn } from '@/shared/utils/cn';
import type { KPIParticipantItem } from '../types';

interface KPIParticipantsListProps {
  items: KPIParticipantItem[];
  title: string; // Translated title (e.g., "Participants")
}

/**
 * List component for displaying participants and optionally the Pot
 * Shows participant names, avatars, progress bars, and their KPI values
 * Pot items are visually differentiated with orange styling
 */
export default function KPIParticipantsList({ items, title }: KPIParticipantsListProps) {
  const participantCount = items.length;

  const getGradientClass = (index: number) => {
    const gradients = ['from-emerald-400 to-emerald-500', 'from-indigo-400 to-indigo-500', 'from-pink-400 to-pink-500'];
    return gradients[index % gradients.length];
  };

  const renderAvatar = (item: KPIParticipantItem) => {
    if (item.isPot) {
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm ring-2 ring-slate-100 dark:ring-slate-700 shrink-0">
          <FaPiggyBank className="text-lg" />
        </div>
      );
    }

    if (item.avatar?.startsWith('http')) {
      return (
        <img
          alt={item.name}
          src={item.avatar}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
        />
      );
    }

    return (
      <div
        className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-slate-100 dark:ring-slate-700 shrink-0',
          item.bgColor || 'bg-indigo-100 dark:bg-indigo-900/30',
          item.textColor || 'text-indigo-600 dark:text-indigo-300',
        )}
      >
        {item.avatar || item.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        {participantCount && (
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {participantCount} Participantes
          </span>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const gradientClass = getGradientClass(index);
          const percentage = item.percentage ?? 0;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-slate-100 dark:border-slate-700 p-4 sm:p-6 hover:border-primary/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                {/* Name and Avatar Section */}
                <div className="flex items-center gap-3 w-full sm:w-1/4 sm:min-w-45">
                  {renderAvatar(item)}
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{item.name}</h4>
                  </div>
                  {/* Mobile Amount */}
                  <div className="sm:hidden ml-auto">
                    <div className="text-lg font-bold text-slate-800 dark:text-white">{item.value}</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="flex-1 w-full sm:px-4">
                  <Progress.Root
                    value={Math.min(percentage, 100)}
                    className="relative w-full h-3 sm:h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden"
                  >
                    <Progress.Indicator
                      className={cn('h-full bg-linear-to-r rounded-full transition-all', gradientClass)}
                      style={{ width: `${percentage}%` }}
                    />
                  </Progress.Root>
                </div>

                {/* Desktop Amount */}
                <div className="hidden sm:block text-right w-24 shrink-0">
                  <div className="text-xl font-bold text-slate-800 dark:text-white">{item.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
