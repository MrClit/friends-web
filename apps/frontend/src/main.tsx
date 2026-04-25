import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { I18nextProvider } from 'react-i18next';
import { i18n, i18nReady } from './i18n';
import { ThemeInitializer } from './shared/components/ThemeInitializer';
import { AuthProvider } from './features/auth/AuthContext';

async function bootstrap() {
  await i18nReady;

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <ThemeInitializer />
          <App />
        </AuthProvider>
      </I18nextProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
