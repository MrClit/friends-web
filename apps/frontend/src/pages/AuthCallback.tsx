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
    const refreshToken = params.get('refreshToken');
    if (!params.get('success') || !refreshToken) {
      navigate('/', { replace: true });
      return;
    }

    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    async function bootstrap() {
      try {
        const refreshRes = await fetch(`${ENV.API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!refreshRes.ok) throw new Error('refresh failed');
        const refreshBody = (await refreshRes.json()) as { data?: { accessToken?: string; refreshToken?: string } };
        const accessToken = refreshBody.data?.accessToken;
        const newRefreshToken = refreshBody.data?.refreshToken;
        if (!accessToken) throw new Error('no access token');
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

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
