import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';

// Lazy-loaded components for code-splitting
const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const KPIDetail = lazy(() => import('./pages/KPIDetail'));

export default function App() {
  return (
    <QueryProvider>
      <HashRouter>
        <Suspense fallback={<div>Loading...</div>}> {/* TODO: Improve with a spinner or loading component */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/event/:id/kpi/:kpi" element={<KPIDetail />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </QueryProvider>
  );
}
