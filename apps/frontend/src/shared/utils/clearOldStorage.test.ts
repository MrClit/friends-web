import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearOldStorage } from './clearOldStorage';

describe('clearOldStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('removes legacy keys, returns removed keys, and logs cleanup summary', () => {
    localStorage.setItem('events-storage', 'x');
    localStorage.setItem('transactions-storage', 'y');
    localStorage.setItem('demoInitialized', 'true');
    localStorage.setItem('keep-me', 'safe');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const removed = clearOldStorage();

    expect(removed).toEqual(['events-storage', 'transactions-storage', 'demoInitialized']);
    expect(localStorage.getItem('events-storage')).toBeNull();
    expect(localStorage.getItem('transactions-storage')).toBeNull();
    expect(localStorage.getItem('demoInitialized')).toBeNull();
    expect(localStorage.getItem('keep-me')).toBe('safe');

    expect(logSpy).toHaveBeenCalledWith('✓ Removed old localStorage key: events-storage');
    expect(logSpy).toHaveBeenCalledWith('✓ Removed old localStorage key: transactions-storage');
    expect(logSpy).toHaveBeenCalledWith('✓ Removed old localStorage key: demoInitialized');
    expect(logSpy).toHaveBeenCalledWith('🧹 Cleanup complete: 3 old key(s) removed');
  });

  it('returns empty array and logs clean state when no legacy keys exist', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const removed = clearOldStorage();

    expect(removed).toEqual([]);
    expect(logSpy).toHaveBeenCalledWith('✓ No old keys found - localStorage already clean');
  });
});
