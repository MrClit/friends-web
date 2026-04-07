import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { isUserRole } from '@/features/auth/types';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

const AUTH_NAMESPACES = ['auth'] as const;

function parseQuery(search: string) {
  const params = new URLSearchParams(search);
  return {
    token: params.get('token'),
    id: params.get('id'),
    email: params.get('email'),
    name: params.get('name'),
    avatar: params.get('avatar'),
    role: params.get('role'),
  };
}

export function AuthCallback() {
  const { t } = useTranslation(AUTH_NAMESPACES);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const isI18nReady = useI18nNamespacesReady(AUTH_NAMESPACES);

  useEffect(() => {
    const { token, id, email, name, avatar, role } = parseQuery(location.search);

    if (token && id && email && role && isUserRole(role)) {
      setAuth(
        {
          id: id ?? '',
          email: email ?? '',
          name: name ?? undefined,
          avatar: avatar ?? undefined,
          role,
        },
        token,
      );
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <span className="text-lg">{isI18nReady ? t('loading') : 'Loading...'}</span>
    </div>
  );
}
