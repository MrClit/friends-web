import i18n from 'i18next';

import type { I18nNamespace } from './namespaces';

// Collected by Vite at build time; each entry is a lazy import factory.
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>('./locales/**/*.json');

async function loadNamespace(lng: string, ns: I18nNamespace): Promise<void> {
  if (i18n.hasResourceBundle(lng, ns)) return;

  const key = `./locales/${lng}/${ns}.json`;
  const loader = localeModules[key];

  if (!loader) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Namespace file not found: ${key}`);
    }
    return;
  }

  const module = await loader();
  i18n.addResourceBundle(lng, ns, module.default, true, false);
}

function normalizeFallbackList(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((candidate): candidate is string => typeof candidate === 'string');
  }

  return [];
}

function resolveFallbackLanguages(lng: string): string[] {
  const fallback = i18n.options.fallbackLng;

  if (!fallback) {
    return [];
  }

  if (typeof fallback === 'string') {
    return fallback === lng ? [] : [fallback];
  }

  if (Array.isArray(fallback)) {
    return fallback.filter((candidate) => candidate !== lng);
  }

  if (typeof fallback === 'function') {
    const resolved = fallback(lng);
    return normalizeFallbackList(resolved).filter((candidate) => candidate !== lng);
  }

  if (typeof fallback === 'object') {
    const map = fallback as Record<string, unknown>;
    const fromLanguage = normalizeFallbackList(map[lng]);
    const fromDefault = normalizeFallbackList(map.default);

    return [...fromLanguage, ...fromDefault].filter((candidate) => candidate !== lng);
  }

  return [];
}

/**
 * Ensures the given namespaces are loaded for the specified language and its
 * i18next fallback chain. Idempotent: already-loaded bundles are skipped.
 */
export async function ensureNamespacesLoaded(lng: string, namespaces: readonly I18nNamespace[]): Promise<void> {
  const targets = [lng, ...resolveFallbackLanguages(lng)];

  try {
    await Promise.all(
      targets.flatMap((language) =>
        namespaces.filter((ns) => !i18n.hasResourceBundle(language, ns)).map((ns) => loadNamespace(language, ns)),
      ),
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[i18n] Failed loading namespaces', { lng, namespaces, error });
    }
  }
}
