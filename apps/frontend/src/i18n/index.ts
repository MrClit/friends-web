import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import ca from './locales/ca/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ca: { translation: ca },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'es', 'ca'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Set initial HTML lang attribute based on detected language
document.documentElement.lang = i18n.language;

// Sync HTML lang attribute with i18n language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// Map i18n language codes to locale codes for date/number formatting
export const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  ca: 'ca-ES',
};

/**
 * Get the current locale code for formatting dates and numbers
 * @returns The locale code (e.g., 'es-ES', 'en-US', 'ca-ES')
 */
export function getCurrentLocale(): string {
  const language = i18n.language || 'es';
  return LOCALE_MAP[language] || 'es-ES';
}

export default i18n;
