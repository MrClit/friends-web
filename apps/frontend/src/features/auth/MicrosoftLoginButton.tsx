import { useTranslation } from 'react-i18next';

const MICROSOFT_AUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/microsoft`;

export function MicrosoftLoginButton() {
  const { t } = useTranslation();

  const handleLogin = () => {
    window.location.href = MICROSOFT_AUTH_URL;
  };

  return (
    <button
      type="button"
      className="px-4 py-2 bg-white border border-gray-300 rounded shadow flex items-center gap-2 hover:bg-gray-50"
      onClick={handleLogin}
      aria-label={t('auth.loginWithMicrosoft')}
    >
      <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
        <rect x="0" y="0" width="7" height="7" fill="#f25022" />
        <rect x="9" y="0" width="7" height="7" fill="#7fba00" />
        <rect x="0" y="9" width="7" height="7" fill="#00a4ef" />
        <rect x="9" y="9" width="7" height="7" fill="#ffb900" />
      </svg>
      <span>{t('auth.loginWithMicrosoft')}</span>
    </button>
  );
}
