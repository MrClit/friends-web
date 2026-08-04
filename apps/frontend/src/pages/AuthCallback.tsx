import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { isUserRole } from '@/features/auth/types';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { REFRESH_TOKEN_KEY, setAccessToken } from '@/api/client';
import { authApi } from '@/api/auth.api';

const AUTH_NAMESPACES = ['auth'] as const;

export function AuthCallback() {
  const { t } = useTranslation(AUTH_NAMESPACES);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const isI18nReady = useI18nNamespacesReady(AUTH_NAMESPACES);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (!params.get('success') || !code) {
      navigate('/', { replace: true });
      return;
    }

    async function bootstrap(oneTimeCode: string) {
      try {
        // Redeem the one-time exchange code for the token pair; the refresh
        // token itself never travels in the callback URL.
        const { accessToken, refreshToken } = await authApi.exchangeCode(oneTimeCode);
        if (!accessToken || !refreshToken) throw new Error('no tokens');
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

        // Hand the token to the API client before the next call, which reads it
        // from there instead of taking it as an argument.
        setAccessToken(accessToken);

        const user = await authApi.getCurrentUser();
        if (user && isUserRole(user.role)) {
          setAuth(
            { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
            accessToken,
          );
        }
      } catch {
        // Fall through to navigate home unauthenticated, without leaving a
        // half-established session behind in the API client.
        setAccessToken(null);
      }
      navigate('/', { replace: true });
    }

    void bootstrap(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <span className="text-lg">{isI18nReady ? t('loading') : 'Loading...'}</span>
    </div>
  );
}
