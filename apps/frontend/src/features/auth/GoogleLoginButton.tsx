import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

type GoogleLoginButtonProps = {
  fullWidth?: boolean;
};

export function GoogleLoginButton({ fullWidth = false }: GoogleLoginButtonProps) {
  const { t } = useTranslation('auth');

  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
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
      aria-label={t('loginWithGoogle')}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt={t('googleIconAlt')}
        className="h-5 w-5"
      />
      <span className="ml-2">{t('loginWithGoogle')}</span>
    </button>
  );
}
