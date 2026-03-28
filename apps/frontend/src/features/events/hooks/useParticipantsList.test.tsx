import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EventParticipant, ParticipantReplacement } from '../types';
import { useParticipantsList } from './useParticipantsList';

describe('useParticipantsList', () => {
  it('preserves contributionTarget when replacing guest with user', () => {
    const initialParticipants: EventParticipant[] = [
      { type: 'user', id: 'u1', name: 'Alice' },
      { type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 25 },
    ];

    const { result } = renderHook(() => {
      const [participants, setParticipants] = useState<EventParticipant[]>(initialParticipants);
      const [participantReplacements, setParticipantReplacements] = useState<ParticipantReplacement[]>([]);

      const hook = useParticipantsList({
        participants,
        setParticipants,
        setParticipantReplacements,
      });

      return {
        participants,
        participantReplacements,
        ...hook,
      };
    });

    act(() => {
      result.current.handleStartReplaceGuest('g1');
    });

    act(() => {
      result.current.handleReplaceGuestWithUser({
        type: 'user',
        id: 'u2',
        name: 'Bob',
        email: 'bob@example.com',
      });
    });

    const replacedParticipant = result.current.participants.find((p) => p.id === 'u2');
    expect(replacedParticipant).toBeDefined();
    expect(replacedParticipant?.type).toBe('user');
    expect(
      replacedParticipant && 'contributionTarget' in replacedParticipant
        ? replacedParticipant.contributionTarget
        : undefined,
    ).toBe(25);

    expect(result.current.participantReplacements).toEqual([{ fromGuestId: 'g1', toUserId: 'u2' }]);
  });

  it('removes target field when set to zero or undefined', () => {
    const initialParticipants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 10 }];

    const { result } = renderHook(() => {
      const [participants, setParticipants] = useState<EventParticipant[]>(initialParticipants);
      const [, setParticipantReplacements] = useState<ParticipantReplacement[]>([]);

      const hook = useParticipantsList({
        participants,
        setParticipants,
        setParticipantReplacements,
      });

      return {
        participants,
        ...hook,
      };
    });

    act(() => {
      result.current.handleUpdateParticipantTarget(0, 0);
    });

    expect('contributionTarget' in result.current.participants[0]).toBe(false);

    act(() => {
      result.current.handleUpdateParticipantTarget(0, 15);
    });

    expect(
      'contributionTarget' in result.current.participants[0]
        ? result.current.participants[0].contributionTarget
        : undefined,
    ).toBe(15);

    act(() => {
      result.current.handleUpdateParticipantTarget(0, undefined);
    });

    expect('contributionTarget' in result.current.participants[0]).toBe(false);
  });
});
