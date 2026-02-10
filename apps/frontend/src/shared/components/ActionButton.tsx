import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface ActionButtonProps {
  onClick: () => void;
  actionLabel: string;
  actionIcon?: ReactNode;
  className?: string;
}

export default function ActionButton({ onClick, actionLabel, actionIcon, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        // Position & layout
        // 'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2',
        // Flex & alignment
        'flex items-center justify-center gap-2',
        // Spacing
        'px-8 py-4',
        // Shape
        'rounded-2xl',
        // Colors
        'bg-teal-600 hover:bg-emerald-700 text-white',
        // Typography
        'font-bold',
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
      {actionLabel}
    </button>
  );
}
