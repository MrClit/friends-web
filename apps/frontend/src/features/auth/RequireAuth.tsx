import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">{t('auth.loading')}</div>;
  }

  if (!user) {
    // Redirige a la página de login profesional
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario, permite acceso (ambos roles)
  return children;
}
