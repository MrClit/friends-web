import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { isUserRole } from '@/features/auth/types';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { ENV } from '@/config/env';
import { REFRESH_TOKEN_KEY } from '@/api/client';

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

    async function bootstrap() {
      try {
        // Redeem the one-time exchange code for the token pair; the refresh
        // token itself never travels in the callback URL.
        const exchangeRes = await fetch(`${ENV.API_URL}/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!exchangeRes.ok) throw new Error('exchange failed');
        const exchangeBody = (await exchangeRes.json()) as { data?: { accessToken?: string; refreshToken?: string } };
        const accessToken = exchangeBody.data?.accessToken;
        const refreshToken = exchangeBody.data?.refreshToken;
        if (!accessToken || !refreshToken) throw new Error('no tokens');
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

        const meRes = await fetch(`${ENV.API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!meRes.ok) throw new Error('me failed');
        const meBody = (await meRes.json()) as {
          data?: { id: string; email: string; name?: string; avatar?: string; role: string };
        };
        const user = meBody.data;
        if (user && isUserRole(user.role)) {
          setAuth(
            { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
            accessToken,
          );
        }
      } catch {
        // fall through to navigate home unauthenticated
      }
      navigate('/', { replace: true });
    }

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <span className="text-lg">{isI18nReady ? t('loading') : 'Loading...'}</span>
    </div>
  );
}
