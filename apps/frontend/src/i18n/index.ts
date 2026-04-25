import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { ensureNamespacesLoaded } from './locale-loaders';
import type { I18nNamespace } from './namespaces';
import { NAMESPACES } from './namespaces';

const I18N_DEFAULT_NAMESPACE: I18nNamespace = 'common';

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ns: NAMESPACES,
    defaultNS: I18N_DEFAULT_NAMESPACE,
    fallbackNS: [I18N_DEFAULT_NAMESPACE],
    partialBundledLanguages: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'es', 'ca'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  })
  .then(() => ensureNamespacesLoaded(i18n.resolvedLanguage ?? i18n.language ?? 'en', ['common']));

// Set initial HTML lang attribute based on detected language
document.documentElement.lang = i18n.language;

// Sync HTML lang attribute with i18n language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  // Warm all configured namespaces for the new language so translated UI does
  // not get stuck with keys/defaults after a runtime language switch.
  void ensureNamespacesLoaded(lng, NAMESPACES);
});

export async function preloadI18nNamespaces(namespaces: readonly I18nNamespace[]): Promise<void> {
  await ensureNamespacesLoaded(i18n.resolvedLanguage ?? i18n.language ?? 'en', namespaces);
}

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

export { i18n };
