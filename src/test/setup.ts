import { expect, afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

/**
 * Extend Vitest's expect with jest-dom matchers
 * This allows us to use assertions like:
 * - expect(element).toBeInTheDocument()
 * - expect(element).toHaveTextContent('text')
 * - expect(element).toBeVisible()
 */
expect.extend(matchers);

/**
 * Cleanup after each test case
 * Removes any rendered components from the DOM
 */
afterEach(() => {
  cleanup();
});

/**
 * Mock localStorage for tests
 * This prevents tests from interfering with browser storage
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as Storage;

/**
 * Mock crypto.randomUUID for deterministic tests
 * Returns predictable UUIDs in test environment
 */
let uuidCounter = 0;

// Use Object.defineProperty to override the read-only crypto property
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      uuidCounter++;
      return `test-uuid-${uuidCounter}`;
    },
  },
  writable: true,
});

/**
 * Reset UUID counter before each test
 */
beforeEach(() => {
  uuidCounter = 0;
  localStorage.clear();
});
