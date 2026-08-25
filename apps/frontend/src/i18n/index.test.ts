import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentLocale, i18n } from './index';

describe('i18n: HTML lang attribute sync', () => {
  beforeEach(() => {
    document.documentElement.lang = 'es';
  });

  afterEach(() => {
    document.documentElement.lang = 'es';
  });

  it('sets lang attribute on languageChanged', () => {
    i18n.emit('languageChanged', 'en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates lang attribute for every supported language', () => {
    for (const lng of ['en', 'ca', 'es'] as const) {
      i18n.emit('languageChanged', lng);
      expect(document.documentElement.lang).toBe(lng);
    }
  });
});

describe('getCurrentLocale', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['es', 'es-ES'],
    ['en', 'en-US'],
    ['ca', 'ca-ES'],
  ])('maps %s to %s', (language, expected) => {
    vi.spyOn(i18n, 'resolvedLanguage', 'get').mockReturnValue(language);
    expect(getCurrentLocale()).toBe(expected);
  });

  it('strips the region from a regional code instead of falling back', () => {
    // The language detector can leave a browser code such as 'en-GB', which is
    // not a key of LOCALE_MAP. It must resolve through 'en', not the fallback.
    vi.spyOn(i18n, 'resolvedLanguage', 'get').mockReturnValue('en-GB');
    expect(getCurrentLocale()).toBe('en-US');
  });

  it('falls back to the English locale for an unsupported language', () => {
    vi.spyOn(i18n, 'resolvedLanguage', 'get').mockReturnValue('de');
    expect(getCurrentLocale()).toBe('en-US');
  });

  it('uses language when resolvedLanguage is undefined', () => {
    vi.spyOn(i18n, 'resolvedLanguage', 'get').mockReturnValue(undefined);
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('ca');
    expect(getCurrentLocale()).toBe('ca-ES');
  });
});
