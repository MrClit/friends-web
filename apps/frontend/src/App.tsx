import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import { QueryProvider } from './providers/QueryProvider';
import { RequireAuth } from './features/auth/RequireAuth';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded components for code-splitting
const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const KPIDetail = lazy(() => import('./pages/KPIDetail'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

export default function App() {
  return (
    <QueryProvider>
      <HashRouter>
        <Suspense fallback={<div>Loading...</div>}>
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
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              className:
                'bg-white dark:bg-teal-900 text-teal-900 dark:text-teal-100 rounded-lg shadow-lg font-semibold',
              duration: 2500,
            }}
          />
        </Suspense>
      </HashRouter>
    </QueryProvider>
  );
}
