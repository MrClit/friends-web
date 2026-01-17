import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import ThemeInitializer from './shared/components/ThemeInitializer';
import DemoInitializer from './shared/components/DemoInitializer';
import { clearOldStorage } from './shared/utils/clearOldStorage';
import { AuthProvider } from './features/auth/AuthContext';

// Clean up old localStorage keys from Zustand stores (one-time migration)
clearOldStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ThemeInitializer />
        <DemoInitializer />
        <App />
      </AuthProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
