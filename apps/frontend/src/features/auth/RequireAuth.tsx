import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { JSX } from 'react';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando autenticación...</div>;
  }

  if (!user) {
    // Redirige a la página de login profesional
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario, permite acceso (ambos roles)
  return children;
}
