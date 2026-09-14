import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomUUID } from './randomUUID';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Stands in for `crypto.getRandomValues` in a context that lacks `crypto.randomUUID` */
function fillRandomBytes(array: Uint8Array): Uint8Array {
  for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  return array;
}

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the native crypto.randomUUID when the context exposes it', () => {
    // The global test setup mocks crypto.randomUUID to return test-uuid-N
    expect(randomUUID()).toBe('test-uuid-1');
    expect(randomUUID()).toBe('test-uuid-2');
  });

  describe('without crypto.randomUUID (non-secure context)', () => {
    it('builds a v4 UUID from crypto.getRandomValues', () => {
      vi.stubGlobal('crypto', { getRandomValues: fillRandomBytes });

      expect(randomUUID()).toMatch(UUID_V4);
    });

    it('returns a different id on every call', () => {
      vi.stubGlobal('crypto', { getRandomValues: fillRandomBytes });

      const ids = new Set(Array.from({ length: 50 }, () => randomUUID()));
      expect(ids.size).toBe(50);
    });

    it('sets the version and variant bits regardless of the random bytes', () => {
      vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(0xff) });

      expect(randomUUID()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    });
  });
});
