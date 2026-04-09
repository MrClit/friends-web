import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton';
import { MicrosoftLoginButton } from '@/features/auth/MicrosoftLoginButton';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { cn } from '@/shared/utils';

const AUTH_NAMESPACES = ['auth'] as const;

export function LoginPage() {
  const { t } = useTranslation(AUTH_NAMESPACES);
  const currentYear = new Date().getFullYear();
  const isI18nReady = useI18nNamespacesReady(AUTH_NAMESPACES);

  if (!isI18nReady) {
    return (
      <div
        className={cn(
          'relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6',
          'bg-linear-to-br from-teal-100 via-cyan-100 to-amber-100',
          'dark:from-teal-950 dark:via-cyan-950 dark:to-zinc-950',
        )}
      >
        <p className="text-sm font-medium tracking-wide text-teal-900/80 dark:text-teal-200">
          {t('loading', { ns: 'auth', defaultValue: 'Loading...' })}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6',
        'bg-linear-to-br from-teal-100 via-cyan-100 to-amber-100',
        'dark:from-teal-950 dark:via-cyan-950 dark:to-zinc-950',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          'bg-[radial-gradient(circle_at_12%_15%,rgba(20,184,166,0.24)_0%,transparent_34%),radial-gradient(circle_at_88%_16%,rgba(245,158,11,0.2)_0%,transparent_30%),radial-gradient(circle_at_50%_90%,rgba(14,116,144,0.14)_0%,transparent_38%)]',
          'dark:bg-[radial-gradient(circle_at_12%_15%,rgba(45,212,191,0.16)_0%,transparent_34%),radial-gradient(circle_at_88%_16%,rgba(251,191,36,0.12)_0%,transparent_30%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.08)_0%,transparent_38%)]',
        )}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-3xl border px-6 py-8 sm:px-10 sm:py-10',
          'border-white/65 bg-white/80 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl',
          'dark:border-teal-900/60 dark:bg-zinc-950/70 dark:shadow-[0_24px_80px_-28px_rgba(0,0,0,0.72)]',
        )}
      >
        <div className="mb-6 flex justify-center">
          <Logo showText size={84} />
        </div>

        <div className="mb-9 text-center sm:mb-10">
          <h1 className="mb-2 font-serif text-3xl font-semibold tracking-tight text-teal-900 dark:text-teal-100 sm:text-4xl">
            {t('loginPage.title')}
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
            {t('loginPage.description')}
          </p>
          <p className="mt-2 text-sm font-medium text-teal-800 dark:text-teal-300">
            {t('loginPage.continueWithProvider')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <GoogleLoginButton fullWidth />
          <MicrosoftLoginButton fullWidth />
        </div>
      </div>

      <footer className="relative z-10 mt-7 text-center text-xs tracking-wide text-slate-500 dark:text-slate-400">
        {t('loginPage.footer', { year: currentYear })}
      </footer>
    </div>
  );
}
