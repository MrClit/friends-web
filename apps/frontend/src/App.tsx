import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import { QueryProvider } from './providers/QueryProvider';
import { RequireAuth } from './features/auth/RequireAuth';
import { RequireRole } from './features/auth/RequireRole';
import { ADMIN_ROLE } from './features/auth/types';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { AppLoadingFallback } from './shared/components/AppLoadingFallback';
import { Toast } from './shared/components/Toast';

// Lazy-loaded components for code-splitting
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })));
const KPIDetail = lazy(() => import('./pages/KPIDetail').then((m) => ({ default: m.KPIDetail })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then((m) => ({ default: m.AuthCallback })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const UserSettings = lazy(() => import('./pages/UserSettings').then((m) => ({ default: m.UserSettings })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

export function App() {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <HashRouter>
          <Suspense fallback={<AppLoadingFallback />}>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Home />
                  </RequireAuth>
                }
              />
              <Route
                path="/event/:id"
                element={
                  <RequireAuth>
                    <EventDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/event/:id/kpi/:kpi"
                element={
                  <RequireAuth>
                    <KPIDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <UserSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RequireAuth>
                    <RequireRole allowedRoles={[ADMIN_ROLE]}>
                      <AdminUsersPage />
                    </RequireRole>
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toast />
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    </QueryProvider>
  );
}
