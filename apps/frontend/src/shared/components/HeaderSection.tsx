import React from 'react';
import { cn } from '@/shared/utils/cn';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  onNewEvent?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subtitle,
  onNewEvent,
  actionLabel,
  actionIcon,
}) => (
  <section className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
    <div>
      <h2 className="text-4xl font-extrabold text-slate-900 dark:text-emerald-50 mb-3 tracking-tight">{title}</h2>
      {subtitle && <p className="text-emerald-800/60 dark:text-emerald-300/60 text-lg">{subtitle}</p>}
    </div>
    {onNewEvent && (
      <button
        type="button"
        className={cn(
          'bg-teal-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-emerald-600/25 transition-all active:scale-95 group hover:cursor-pointer',
        )}
        onClick={onNewEvent}
        aria-label={actionLabel || title}
        role="button"
      >
        <span className="font-bold group-hover:rotate-90 transition-transform">{actionIcon}</span>
        {actionLabel}
      </button>
    )}
  </section>
);

export default HeaderSection;
