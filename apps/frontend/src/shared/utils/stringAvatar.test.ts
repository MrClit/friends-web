import { describe, expect, it } from 'vitest';
import { stringAvatar } from './stringAvatar';

describe('stringAvatar', () => {
  it('returns initials from first and last name when there are at least two parts', () => {
    expect(stringAvatar('John Doe')).toBe('JD');
    expect(stringAvatar('  maria   del   mar  ')).toBe('MM');
  });

  it('returns first letter for single-word names', () => {
    expect(stringAvatar('alice')).toBe('A');
  });

  it('returns question mark for empty or whitespace-only names', () => {
    expect(stringAvatar('')).toBe('?');
    expect(stringAvatar('   ')).toBe('?');
  });

  it('falls back to email initial when name is missing', () => {
    expect(stringAvatar(undefined, 'test@example.com')).toBe('T');
  });

  it('returns question mark when both name and email are missing', () => {
    expect(stringAvatar()).toBe('?');
  });
});
