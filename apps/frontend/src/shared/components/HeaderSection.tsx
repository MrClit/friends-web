import React from 'react';
import { ActionButton } from './ActionButton';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  onNewEvent?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  eyebrow?: React.ReactNode;
}

export function HeaderSection({ title, subtitle, onNewEvent, actionLabel, actionIcon, eyebrow }: HeaderSectionProps) {
  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
      <div>
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-emerald-50 mb-3 tracking-tight">{title}</h2>
        {subtitle && <p className="text-emerald-800/60 dark:text-emerald-300/60 text-lg">{subtitle}</p>}
      </div>
      {onNewEvent && <ActionButton onClick={onNewEvent} actionLabel={actionLabel || ''} actionIcon={actionIcon} />}
    </section>
  );
}
