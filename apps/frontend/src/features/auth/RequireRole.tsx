import { useEffect, useRef, type JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { UserRole } from './types';
import { useToastStore } from '@/shared/store/useToastStore';
import { AppLoadingFallback } from '@/shared/components/AppLoadingFallback';
import { useAccessGuard } from './useAccessGuard';

interface RequireRoleProps {
  children: JSX.Element;
  allowedRoles: UserRole[];
}

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { location, status } = useAccessGuard({ allowedRoles });
  const { t } = useTranslation('adminUsers');
  const { addToast } = useToastStore();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (status === 'unauthorized' && !hasNotifiedRef.current) {
      addToast({
        type: 'error',
        message: t('accessDenied', 'Access denied'),
        duration: 5000,
      });
      hasNotifiedRef.current = true;
    }
  }, [addToast, status, t]);

  if (status === 'loading') {
    return <AppLoadingFallback />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace />;
  }

  return children;
}
