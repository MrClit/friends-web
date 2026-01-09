/**
 * Available languages configuration for the application.
 */
export const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ca', label: 'CA', name: 'Català' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
