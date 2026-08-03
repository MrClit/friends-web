import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { User } from '../../users/user.entity';
import { Event, EventParticipant } from '../entities/event.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ParticipantReplacementDto } from '../dto/participant-replacement.dto';
import { EventParticipantsService } from './event-participants.service';

const makeUser = (id: string): User =>
  ({ id, name: `User ${id}`, email: `${id}@example.com`, avatar: `https://avatar/${id}` }) as User;

const makeEvent = (participants: Event['participants']): Event =>
  ({ id: 'evt', participants }) as unknown as Event;

interface QueryBuilderDouble {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
}

/** Chainable query builder double: every step returns itself except execute(). */
const makeQueryBuilder = (affected: number | undefined = 1): QueryBuilderDouble => {
  const builder: QueryBuilderDouble = {
    update: jest.fn(() => builder),
    set: jest.fn(() => builder),
    where: jest.fn(() => builder),
    andWhere: jest.fn(() => builder),
    execute: jest.fn().mockResolvedValue({ affected }),
  };

  return builder;
};

const makeManager = (builder: QueryBuilderDouble) => {
  const getRepository = jest.fn(() => ({ createQueryBuilder: () => builder }));

  return { manager: { getRepository } as unknown as EntityManager, getRepository };
};

describe('EventParticipantsService', () => {
  let service: EventParticipantsService;
  let userRepository: { find: jest.Mock };

  beforeEach(async () => {
    userRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventParticipantsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<EventParticipantsService>(EventParticipantsService);
  });

  describe('enrichParticipants', () => {
    it('makes a single batch query for multiple events', async () => {
      const u1 = makeUser('u1');
      const u2 = makeUser('u2');
      userRepository.find.mockResolvedValue([u1, u2]);

      const events = [makeEvent([{ type: 'user', id: 'u1' }]), makeEvent([{ type: 'user', id: 'u2' }])];

      await service.enrichParticipants(events);

      expect(userRepository.find).toHaveBeenCalledTimes(1);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { id: In(['u1', 'u2']) },
      });
    });

    it('deduplicates user IDs across events', async () => {
      userRepository.find.mockResolvedValue([makeUser('u1')]);

      const events = [makeEvent([{ type: 'user', id: 'u1' }]), makeEvent([{ type: 'user', id: 'u1' }])];

      await service.enrichParticipants(events);

      const calledWith = (userRepository.find.mock.calls[0] as unknown[])[0] as { where: { id: ReturnType<typeof In> } };
      const ids = (calledWith.where.id as unknown as { _value: string[] })._value;
      expect(ids).toHaveLength(1);
      expect(ids).toContain('u1');
    });

    it('maps name, email and avatar onto matching participants', async () => {
      const u1 = makeUser('u1');
      userRepository.find.mockResolvedValue([u1]);

      const event = makeEvent([{ type: 'user', id: 'u1' }]);
      await service.enrichParticipants(event);

      expect(event.participants[0]).toMatchObject({
        type: 'user',
        id: 'u1',
        name: u1.name,
        email: u1.email,
        avatar: u1.avatar,
      });
    });

    it('preserves contributionTarget after enrichment', async () => {
      userRepository.find.mockResolvedValue([makeUser('u1')]);

      const event = makeEvent([{ type: 'user', id: 'u1', contributionTarget: 150 }]);
      await service.enrichParticipants(event);

      expect((event.participants[0] as { contributionTarget?: number }).contributionTarget).toBe(150);
    });

    it('leaves guest and pot participants untouched', async () => {
      userRepository.find.mockResolvedValue([makeUser('u1')]);

      const guest = { type: 'guest', id: 'g1', name: 'Guest' } as const;
      const pot = { type: 'pot', id: '0' } as const;
      const event = makeEvent([{ type: 'user', id: 'u1' }, guest, pot]);

      await service.enrichParticipants(event);

      expect(event.participants[1]).toEqual(guest);
      expect(event.participants[2]).toEqual(pot);
    });

    it('skips the DB query when there are no user participants', async () => {
      const event = makeEvent([
        { type: 'guest', id: 'g1', name: 'Guest' },
        { type: 'pot', id: '0' },
      ]);

      await service.enrichParticipants(event);

      expect(userRepository.find).not.toHaveBeenCalled();
    });

    it('does not propagate errors from the repository', async () => {
      userRepository.find.mockRejectedValue(new Error('DB down'));

      const event = makeEvent([{ type: 'user', id: 'u1' }]);

      await expect(service.enrichParticipants(event)).resolves.toBeUndefined();
    });
  });

  describe('normalizeParticipants', () => {
    describe('empty input', () => {
      it('throws when undefined and empty input is not allowed (create)', () => {
        expect(() => service.normalizeParticipants(undefined, false)).toThrow(BadRequestException);
      });

      it('throws when the array is empty and empty input is not allowed (create)', () => {
        expect(() => service.normalizeParticipants([], false)).toThrow('participants must be a non-empty array');
      });

      it('returns undefined when undefined and empty input is allowed (update)', () => {
        expect(service.normalizeParticipants(undefined, true)).toBeUndefined();
      });

      it('returns undefined when the array is empty and empty input is allowed (update)', () => {
        expect(service.normalizeParticipants([], true)).toBeUndefined();
      });

      it('defaults to disallowing empty input', () => {
        expect(() => service.normalizeParticipants(undefined)).toThrow(BadRequestException);
      });
    });

    it('throws when the input is not an array', () => {
      const notAnArray = { type: 'user', id: 'u1' } as unknown as unknown[];

      expect(() => service.normalizeParticipants(notAnArray)).toThrow('participants must be an array');
    });

    describe('user participants', () => {
      it('keeps only type and id, stripping client-supplied name, email and avatar', () => {
        const result = service.normalizeParticipants([
          { type: 'user', id: 'u1', name: 'Spoofed', email: 'spoofed@example.com', avatar: 'https://spoofed' },
        ]);

        expect(result).toEqual([{ type: 'user', id: 'u1' }]);
      });

      it.each([
        ['missing', { type: 'user' }],
        ['not a string', { type: 'user', id: 42 }],
        ['blank', { type: 'user', id: '   ' }],
      ])('throws when the id is %s', (_case, participant) => {
        expect(() => service.normalizeParticipants([participant])).toThrow(
          'participants[0].id is required for user participant',
        );
      });
    });

    describe('guest participants', () => {
      it('keeps type, id and name, stripping extra properties', () => {
        const result = service.normalizeParticipants([
          { type: 'guest', id: 'g1', name: 'Guest One', email: 'guest@example.com' },
        ]);

        expect(result).toEqual([{ type: 'guest', id: 'g1', name: 'Guest One' }]);
      });

      it('throws when the id is blank', () => {
        expect(() => service.normalizeParticipants([{ type: 'guest', id: ' ', name: 'Guest' }])).toThrow(
          'participants[0].id is required for guest participant',
        );
      });

      it.each([
        ['missing', { type: 'guest', id: 'g1' }],
        ['not a string', { type: 'guest', id: 'g1', name: 7 }],
        ['blank', { type: 'guest', id: 'g1', name: '  ' }],
      ])('throws when the name is %s', (_case, participant) => {
        expect(() => service.normalizeParticipants([participant])).toThrow(
          'participants[0].name is required for guest participant',
        );
      });
    });

    describe('pot participants', () => {
      it('always normalizes the pot to the reserved id 0', () => {
        const result = service.normalizeParticipants([{ type: 'pot', id: 'whatever', name: 'Pot' }]);

        expect(result).toEqual([{ type: 'pot', id: '0' }]);
      });
    });

    describe('invalid entries', () => {
      it.each([
        ['an unknown type', { type: 'ghost', id: 'x' }, "participants[0].type must be one of 'user'|'guest'|'pot'"],
        ['a missing type', { id: 'x' }, 'participants[0].type is required'],
        ['a non-object entry', 'not-an-object', 'participants[0].type is required'],
        ['a null entry', null, 'participants[0].type is required'],
      ])('throws for %s', (_case, participant, message) => {
        expect(() => service.normalizeParticipants([participant])).toThrow(message);
      });

      it('reports the index of the offending participant', () => {
        expect(() =>
          service.normalizeParticipants([{ type: 'pot', id: '0' }, { type: 'guest', id: 'g1' }]),
        ).toThrow('participants[1].name is required for guest participant');
      });
    });

    describe.each([
      ['user', (extra: Record<string, unknown>) => ({ type: 'user', id: 'u1', ...extra })],
      ['guest', (extra: Record<string, unknown>) => ({ type: 'guest', id: 'g1', name: 'Guest', ...extra })],
    ])('contributionTarget on %s participants', (_type, build) => {
      it('keeps a positive target', () => {
        const result = service.normalizeParticipants([build({ contributionTarget: 120.5 })]);

        expect(result?.[0]).toMatchObject({ contributionTarget: 120.5 });
      });

      it('keeps a zero target', () => {
        const result = service.normalizeParticipants([build({ contributionTarget: 0 })]);

        expect(result?.[0]).toMatchObject({ contributionTarget: 0 });
      });

      it.each([
        ['undefined', undefined],
        ['null', null],
      ])('omits the key entirely when the target is %s', (_case, target) => {
        const result = service.normalizeParticipants([build({ contributionTarget: target })]);

        expect(result?.[0]).not.toHaveProperty('contributionTarget');
      });

      it.each([
        ['a string', '100', 'must be a number or undefined'],
        ['a boolean', true, 'must be a number or undefined'],
        ['NaN', Number.NaN, 'must be finite'],
        ['Infinity', Number.POSITIVE_INFINITY, 'must be finite'],
        ['negative', -1, 'must be >= 0'],
      ])('throws when the target is %s', (_case, target, message) => {
        expect(() => service.normalizeParticipants([build({ contributionTarget: target })])).toThrow(
          `participants[0].contributionTarget ${message}`,
        );
      });
    });
  });

  describe('validateParticipantReplacements', () => {
    const guest: EventParticipant = { type: 'guest', id: 'g1', name: 'Guest One' };
    const member: EventParticipant = { type: 'user', id: 'u-member' };
    const originalParticipants: EventParticipant[] = [member, guest];
    const nextParticipants: EventParticipant[] = [member, { type: 'user', id: 'u-new' }];

    const validate = (
      replacements: ParticipantReplacementDto[] | undefined,
      next: EventParticipant[] | undefined = nextParticipants,
      original: EventParticipant[] = originalParticipants,
    ) => service.validateParticipantReplacements(original, next, replacements);

    it('returns an empty list when no replacements are provided, without requiring participants', () => {
      expect(service.validateParticipantReplacements(originalParticipants, undefined, undefined)).toEqual([]);
      expect(service.validateParticipantReplacements(originalParticipants, undefined, [])).toEqual([]);
    });

    it('throws when replacements are used without providing participants', () => {
      expect(() =>
        service.validateParticipantReplacements(originalParticipants, undefined, [
          { fromGuestId: 'g1', toUserId: 'u-new' },
        ]),
      ).toThrow('participants must be provided when participantReplacements are used');
    });

    it('returns the trimmed replacement list on a valid replacement', () => {
      expect(validate([{ fromGuestId: '  g1  ', toUserId: ' u-new ' }])).toEqual([
        { fromGuestId: 'g1', toUserId: 'u-new' },
      ]);
    });

    it.each([
      ['fromGuestId', { fromGuestId: '   ', toUserId: 'u-new' }, 'participantReplacements[0].fromGuestId is required'],
      ['toUserId', { fromGuestId: 'g1', toUserId: '   ' }, 'participantReplacements[0].toUserId is required'],
    ])('throws when %s is blank', (_case, replacement, message) => {
      expect(() => validate([replacement])).toThrow(message);
    });

    it('throws when the same guest is replaced twice', () => {
      const original = [...originalParticipants];
      const next: EventParticipant[] = [member, { type: 'user', id: 'u-new' }, { type: 'user', id: 'u-other' }];

      expect(() =>
        validate(
          [
            { fromGuestId: 'g1', toUserId: 'u-new' },
            { fromGuestId: 'g1', toUserId: 'u-other' },
          ],
          next,
          original,
        ),
      ).toThrow('Duplicate replacement source guest id: g1');
    });

    it('throws when the same user is the target of two replacements', () => {
      const original: EventParticipant[] = [member, guest, { type: 'guest', id: 'g2', name: 'Guest Two' }];

      expect(() =>
        validate(
          [
            { fromGuestId: 'g1', toUserId: 'u-new' },
            { fromGuestId: 'g2', toUserId: 'u-new' },
          ],
          nextParticipants,
          original,
        ),
      ).toThrow('Duplicate replacement destination user id: u-new');
    });

    it('throws when the source guest does not exist in the event', () => {
      expect(() => validate([{ fromGuestId: 'g-unknown', toUserId: 'u-new' }])).toThrow(
        'Guest participant g-unknown does not exist in the event',
      );
    });

    it('throws when the destination user already participates in the event', () => {
      expect(() => validate([{ fromGuestId: 'g1', toUserId: member.id }])).toThrow(
        `User ${member.id} already participates in the event and cannot be used as replacement target`,
      );
    });

    it('throws when the destination user is missing from the updated participants', () => {
      expect(() => validate([{ fromGuestId: 'g1', toUserId: 'u-absent' }])).toThrow(
        'Replacement target user u-absent must exist in updated participants',
      );
    });

    it('throws when the source guest is still present in the updated participants', () => {
      const next: EventParticipant[] = [...nextParticipants, guest];

      expect(() => validate([{ fromGuestId: 'g1', toUserId: 'u-new' }], next)).toThrow(
        'Replacement source guest g1 must be removed from updated participants',
      );
    });
  });

  describe('applyParticipantReplacements', () => {
    it('does not touch the database when there are no replacements', async () => {
      const { manager, getRepository } = makeManager(makeQueryBuilder());

      await service.applyParticipantReplacements(manager, 'evt-1', []);

      expect(getRepository).not.toHaveBeenCalled();
    });

    it('issues a scoped update for a single replacement', async () => {
      const builder = makeQueryBuilder(3);
      const { manager, getRepository } = makeManager(builder);

      await service.applyParticipantReplacements(manager, 'evt-1', [{ fromGuestId: 'g1', toUserId: 'u-new' }]);

      expect(getRepository).toHaveBeenCalledWith(Transaction);
      expect(builder.update).toHaveBeenCalledWith(Transaction);
      expect(builder.set).toHaveBeenCalledWith({ participantId: 'u-new' });
      expect(builder.where).toHaveBeenCalledWith('event_id = :eventId', { eventId: 'evt-1' });
      expect(builder.andWhere).toHaveBeenCalledWith('participant_id = :fromGuestId', { fromGuestId: 'g1' });
      expect(builder.execute).toHaveBeenCalledTimes(1);
    });

    it('issues one update per replacement, in order', async () => {
      const builder = makeQueryBuilder(1);
      const { manager } = makeManager(builder);

      await service.applyParticipantReplacements(manager, 'evt-1', [
        { fromGuestId: 'g1', toUserId: 'u-one' },
        { fromGuestId: 'g2', toUserId: 'u-two' },
      ]);

      const setPayloads = (builder.set.mock.calls as Array<[Record<string, unknown>]>).map((call) => call[0]);

      expect(builder.execute).toHaveBeenCalledTimes(2);
      expect(setPayloads).toEqual([{ participantId: 'u-one' }, { participantId: 'u-two' }]);
    });

    it('tolerates a driver that does not report the affected row count', async () => {
      const { manager } = makeManager(makeQueryBuilder(undefined));

      await expect(
        service.applyParticipantReplacements(manager, 'evt-1', [{ fromGuestId: 'g1', toUserId: 'u-new' }]),
      ).resolves.toBeUndefined();
    });
  });
});
