import { useTranslation } from 'react-i18next';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

export function GoogleLoginButton() {
  const { t } = useTranslation('auth');

  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <button
      type="button"
      className="px-4 py-2 bg-white border border-gray-300 rounded shadow flex items-center gap-2 hover:bg-gray-50"
      onClick={handleLogin}
      aria-label={t('loginWithGoogle')}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt={t('googleIconAlt')}
        className="w-5 h-5"
      />
      <span>{t('loginWithGoogle')}</span>
    </button>
  );
}
