export const NAMESPACES = [
  'common',
  'auth',
  'home',
  'events',
  'eventDetail',
  'transactions',
  'shopping',
  'kpiDetail',
  'adminUsers',
  'profile',
  'user',
  'header',
  'language',
  'theme',
  'notFound',
  'errorBoundary',
  'confirmDialog',
] as const;

export type I18nNamespace = (typeof NAMESPACES)[number];
