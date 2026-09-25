import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { cn } from '@/shared/utils';

/** An action is either a link to another route or a button with a handler. */
export type FullPageAction = { label: string; to: string } | { label: string; onClick: () => void };

interface FullPageMessageProps {
  icon: IconType;
  title: string;
  message: string;
  primaryAction: FullPageAction;
  secondaryAction?: FullPageAction;
}

const ACTION_BASE =
  'px-6 py-2.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const ACTION_VARIANT = {
  primary: 'text-white bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500',
  secondary:
    'text-slate-700 border border-slate-300 hover:bg-slate-100 focus-visible:ring-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
} as const;

function ActionControl({ action, variant }: { action: FullPageAction; variant: keyof typeof ACTION_VARIANT }) {
  const className = cn(ACTION_BASE, ACTION_VARIANT[variant]);

  if ('to' in action) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/**
 * Full-page dead end or failed page load: the page itself could not be shown, so it offers a way
 * out instead of a partial error box. Partial failures inside a loaded page use `ErrorState`.
 * It does not include the app layout; the page rendering it wraps it.
 */
export function FullPageMessage({ icon: Icon, title, message, primaryAction, secondaryAction }: FullPageMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Icon aria-hidden="true" className="text-7xl text-emerald-600 dark:text-emerald-400" />
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <ActionControl action={primaryAction} variant="primary" />
        {secondaryAction ? <ActionControl action={secondaryAction} variant="secondary" /> : null}
      </div>
    </div>
  );
}
