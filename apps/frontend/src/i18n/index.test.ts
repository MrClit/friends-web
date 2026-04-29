import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { i18n } from './index';

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
