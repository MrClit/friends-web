import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'aria-label'> {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary';
}

/**
 * Reusable icon button component with consistent styling.
 * Used for header controls like dark mode toggle and language selector.
 * Supports all native button props for compatibility with Radix UI asChild pattern.
 */
export function IconButton({ ariaLabel, children, className, variant = 'default', ...props }: IconButtonProps) {
  const baseStyles =
    'cursor-pointer rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 h-10 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors';

  const variantStyles = {
    default: 'bg-white/90 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-800 w-10',
    primary:
      'bg-white/90 dark:bg-emerald-950/90 border-2 border-emerald-500 dark:border-yellow-400 shadow-lg px-2 w-16 backdrop-blur-md',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
