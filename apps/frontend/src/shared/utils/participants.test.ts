import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { getParticipantAvatar, getParticipantName } from './participants';

const t = vi.fn((key: string) => `translated:${key}`) as unknown as TFunction;

describe('getParticipantName', () => {
  it('returns the name of a guest', () => {
    expect(getParticipantName({ type: 'guest', id: 'g1', name: 'Ana' }, t)).toBe('Ana');
  });

  it('returns the name of a user', () => {
    expect(getParticipantName({ type: 'user', id: 'u1', name: 'Luis' }, t)).toBe('Luis');
  });

  it('falls back to "?" for a user without name', () => {
    expect(getParticipantName({ type: 'user', id: 'u1' }, t)).toBe('?');
    expect(getParticipantName({ type: 'user', id: 'u1', name: '' }, t)).toBe('?');
  });

  it('translates the pot name from the common namespace', () => {
    expect(getParticipantName({ type: 'pot', id: '0' }, t)).toBe('translated:potName');
    expect(t).toHaveBeenCalledWith('potName', { ns: 'common' });
  });
});

describe('getParticipantAvatar', () => {
  it('returns the avatar of a user', () => {
    expect(getParticipantAvatar({ type: 'user', id: 'u1', avatar: 'https://example.com/a.png' })).toBe(
      'https://example.com/a.png',
    );
  });

  it('returns null for a user without avatar', () => {
    expect(getParticipantAvatar({ type: 'user', id: 'u1' })).toBeNull();
  });

  it('returns null for guests and the pot', () => {
    expect(getParticipantAvatar({ type: 'guest', id: 'g1', name: 'Ana' })).toBeNull();
    expect(getParticipantAvatar({ type: 'pot', id: '0' })).toBeNull();
  });
});
