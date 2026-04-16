import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface ActionButtonProps {
  onClick: () => void;
  actionLabel: string;
  actionIcon?: ReactNode;
  className?: string;
}

export function ActionButton({ onClick, actionLabel, actionIcon, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        // Position & layout
        // 'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2',
        // Flex & alignment
        'flex items-center justify-center gap-1.5 sm:gap-2',
        // Spacing (responsive: smaller padding on mobile)
        'px-4 py-3 sm:px-8 sm:py-4',
        // Shape
        'rounded-2xl',
        // Colors
        'bg-emerald-600 hover:bg-emerald-700 text-white',
        // Typography (responsive: smaller text on mobile)
        'text-sm sm:text-base font-bold',
        // Elevation & effects
        'shadow-xl shadow-emerald-600/25 transition-all active:scale-95 hover:-translate-y-1',
        // Interaction
        'group hover:cursor-pointer',
        // external overrides
        className,
      )}
      onClick={onClick}
      aria-label={actionLabel}
      role="button"
    >
      {actionIcon && <span className="font-bold group-hover:rotate-90 transition-transform">{actionIcon}</span>}
      <span className="whitespace-nowrap">{actionLabel}</span>
    </button>
  );
}
