import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';

const MICROSOFT_AUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/microsoft`;

type MicrosoftLoginButtonProps = {
  fullWidth?: boolean;
};

export function MicrosoftLoginButton({ fullWidth = false }: MicrosoftLoginButtonProps) {
  const { t } = useTranslation('auth');

  const handleLogin = () => {
    window.location.href = MICROSOFT_AUTH_URL;
  };

  return (
    <button
      type="button"
      className={cn(
        'group inline-flex items-center justify-center rounded-xl border px-4 py-3',
        'text-sm font-medium text-slate-700',
        'border-slate-200/85 bg-white shadow-sm',
        'transition-colors duration-200 hover:bg-slate-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/55 focus-visible:ring-offset-2',
        'dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:hover:bg-zinc-800',
        fullWidth && 'w-full',
      )}
      onClick={handleLogin}
      aria-label={t('loginWithMicrosoft')}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <rect x="0" y="0" width="7" height="7" fill="#f25022" />
        <rect x="9" y="0" width="7" height="7" fill="#7fba00" />
        <rect x="0" y="9" width="7" height="7" fill="#00a4ef" />
        <rect x="9" y="9" width="7" height="7" fill="#ffb900" />
      </svg>
      <span className="ml-2">{t('loginWithMicrosoft')}</span>
    </button>
  );
}
