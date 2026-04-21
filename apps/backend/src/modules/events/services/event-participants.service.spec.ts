import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { Event } from '../entities/event.entity';
import { EventParticipantsService } from './event-participants.service';

const makeUser = (id: string): User =>
  ({ id, name: `User ${id}`, email: `${id}@example.com`, avatar: `https://avatar/${id}` }) as User;

const makeEvent = (participants: Event['participants']): Event =>
  ({ id: 'evt', participants }) as unknown as Event;

describe('EventParticipantsService.enrichParticipants', () => {
  let service: EventParticipantsService;
  let userRepository: { find: jest.Mock };

  beforeEach(async () => {
    userRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventParticipantsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository as unknown as Repository<User>,
        },
      ],
    }).compile();

    service = module.get<EventParticipantsService>(EventParticipantsService);
  });

  it('makes a single batch query for multiple events', async () => {
    const u1 = makeUser('u1');
    const u2 = makeUser('u2');
    userRepository.find.mockResolvedValue([u1, u2]);

    const events = [
      makeEvent([{ type: 'user', id: 'u1' }]),
      makeEvent([{ type: 'user', id: 'u2' }]),
    ];

    await service.enrichParticipants(events);

    expect(userRepository.find).toHaveBeenCalledTimes(1);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: { id: In(['u1', 'u2']) },
    });
  });

  it('deduplicates user IDs across events', async () => {
    userRepository.find.mockResolvedValue([makeUser('u1')]);

    const events = [
      makeEvent([{ type: 'user', id: 'u1' }]),
      makeEvent([{ type: 'user', id: 'u1' }]),
    ];

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
