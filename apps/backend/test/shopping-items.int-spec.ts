import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { ShoppingItem } from '../src/modules/shopping-list/entities/shopping-item.entity';
import { User } from '../src/modules/users/user.entity';
import { createEvent, createShoppingItem, createUser } from './utils/test-factories';

/**
 * Pins the parts of the shopping list contract that live in the database rather than in the service:
 * the cascade from events, the SET NULL from users and the column shapes.
 */
describe('ShoppingItem persistence (integration)', () => {
  let app: INestApplication;
  let eventRepository: Repository<Event>;
  let shoppingItemRepository: Repository<ShoppingItem>;
  let userRepository: Repository<User>;
  let event: Event;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
    shoppingItemRepository = app.get<Repository<ShoppingItem>>(getRepositoryToken(ShoppingItem));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await shoppingItemRepository.createQueryBuilder().delete().from(ShoppingItem).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();

    event = await createEvent(eventRepository, {
      title: 'Shopping Event',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('deletes the items of an event when the event is deleted', async () => {
    await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });
    await createShoppingItem(shoppingItemRepository, { name: 'Hielo', eventId: event.id });

    await eventRepository.delete(event.id);

    await expect(shoppingItemRepository.count()).resolves.toBe(0);
  });

  it('round-trips a name of the maximum length untouched', async () => {
    const name = 'a'.repeat(120);

    const saved = await createShoppingItem(shoppingItemRepository, { name, eventId: event.id });
    const found = await shoppingItemRepository.findOneOrFail({ where: { id: saved.id } });

    expect(found.name).toBe(name);
    expect(found.name).toHaveLength(120);
  });

  it('stores a pending item with no purchase attribution', async () => {
    const saved = await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });

    const found = await shoppingItemRepository.findOneOrFail({ where: { id: saved.id } });

    expect(found.purchasedAt).toBeNull();
    expect(found.purchasedBy).toBeNull();
    expect(found.createdAt).toBeInstanceOf(Date);
  });

  it('round-trips the purchase timestamp as a Date', async () => {
    const purchasedAt = new Date('2026-08-26T09:30:00.000Z');
    const saved = await createShoppingItem(shoppingItemRepository, {
      name: 'Hielo',
      eventId: event.id,
      purchasedAt,
    });

    const found = await shoppingItemRepository.findOneOrFail({ where: { id: saved.id } });

    expect(found.purchasedAt).toBeInstanceOf(Date);
    expect(found.purchasedAt?.toISOString()).toBe(purchasedAt.toISOString());
  });

  // The attribution columns carry a foreign key with ON DELETE SET NULL. This pins that decision: a
  // user disappearing empties the attribution but never takes the item — which belongs to the event,
  // not to the person who typed it — with it.
  it('clears the attribution when the referenced user is hard deleted, keeping the item', async () => {
    const user = await createUser(userRepository, { email: 'creator@example.com', name: 'Creator' });
    const saved = await createShoppingItem(shoppingItemRepository, {
      name: 'Cerveza',
      eventId: event.id,
      createdBy: user.id,
      purchasedBy: user.id,
      purchasedAt: new Date(),
    });

    // Hard delete, not the soft delete the users module uses.
    await userRepository.createQueryBuilder().delete().from(User).where('id = :id', { id: user.id }).execute();

    const found = await shoppingItemRepository.findOneOrFail({ where: { id: saved.id } });
    expect(found.name).toBe('Cerveza');
    expect(found.createdBy).toBeNull();
    expect(found.purchasedBy).toBeNull();
  });

  it('keeps the lists of two events apart', async () => {
    const otherEvent = await createEvent(eventRepository, { title: 'Other Event' });
    await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });
    await createShoppingItem(shoppingItemRepository, { name: 'Vino', eventId: otherEvent.id });

    const items = await shoppingItemRepository.find({ where: { eventId: event.id } });

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Pan');
  });
});
