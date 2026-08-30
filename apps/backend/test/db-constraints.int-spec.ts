import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';

interface ConstraintRow {
  name: string;
  definition: string;
}

/**
 * The sibling of db-indexes.int-spec.ts, for foreign keys.
 *
 * Foreign keys are declared twice on purpose: as a relation on the entity (which is what builds the
 * schema here, since the DB-backed suites run with TYPEORM_SYNC=true) and as DDL in the migration
 * (which is what builds production). These tests pin the entity half, so a relation dropped from an
 * entity fails the suite instead of drifting away from the migration.
 *
 * The constraint names are asserted as well, not just the shape: TypeORM matches foreign keys by name,
 * so a relation without an explicit `foreignKeyConstraintName` gets a generated hash and reads as a
 * change against the name production already carries.
 */
describe('Foreign key constraints (integration)', () => {
  let app: INestApplication;
  let repository: Repository<Event>;

  const foreignKeysFor = async (table: string): Promise<ConstraintRow[]> =>
    repository.query<ConstraintRow[]>(
      `SELECT c.conname AS name, pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE c.contype = 'f' AND n.nspname = current_schema() AND t.relname = $1;`,
      [table],
    );

  const on = (rows: ConstraintRow[], column: string): ConstraintRow | undefined =>
    rows.find((row) => row.definition.startsWith(`FOREIGN KEY (${column})`));

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = app.get<Repository<Event>>(getRepositoryToken(Event));
  });

  afterAll(async () => {
    await app.close();
  });

  // Every assertion spells out the ON DELETE clause: Postgres omits ON DELETE NO ACTION from
  // pg_get_constraintdef because it is the default, so losing an `onDelete` shows up as the clause
  // simply not being there.
  it('cascades refresh tokens from their user', async () => {
    const foreignKeys = await foreignKeysFor('refresh_tokens');
    const userFk = on(foreignKeys, 'user_id');

    expect(userFk?.name).toBe('refresh_tokens_user_id_fkey');
    expect(userFk?.definition).toMatch(/REFERENCES "?users"?\("?id"?\) ON DELETE CASCADE/);
    expect(foreignKeys).toHaveLength(1);
  });

  it('cascades exchange codes from their user', async () => {
    const foreignKeys = await foreignKeysFor('auth_exchange_codes');
    const userFk = on(foreignKeys, 'user_id');

    expect(userFk?.name).toBe('auth_exchange_codes_user_id_fkey');
    expect(userFk?.definition).toMatch(/REFERENCES "?users"?\("?id"?\) ON DELETE CASCADE/);
    expect(foreignKeys).toHaveLength(1);
  });

  it('cascades transactions from their event', async () => {
    const foreignKeys = await foreignKeysFor('transactions');
    const eventFk = on(foreignKeys, 'event_id');

    expect(eventFk?.name).toBe('fk_transactions_event_id');
    expect(eventFk?.definition).toMatch(/REFERENCES "?events"?\("?id"?\) ON DELETE CASCADE/);
    expect(foreignKeys).toHaveLength(1);
  });

  it('cascades shopping items from their event and empties their attribution instead', async () => {
    const foreignKeys = await foreignKeysFor('shopping_items');

    const eventFk = on(foreignKeys, 'event_id');
    expect(eventFk?.name).toBe('shopping_items_event_id_fkey');
    expect(eventFk?.definition).toMatch(/REFERENCES "?events"?\("?id"?\) ON DELETE CASCADE/);

    // SET NULL and not CASCADE: losing a user must never take other people's items with it.
    const createdByFk = on(foreignKeys, 'created_by');
    expect(createdByFk?.name).toBe('fk_shopping_items_created_by');
    expect(createdByFk?.definition).toMatch(/REFERENCES "?users"?\("?id"?\) ON DELETE SET NULL/);

    const purchasedByFk = on(foreignKeys, 'purchased_by');
    expect(purchasedByFk?.name).toBe('fk_shopping_items_purchased_by');
    expect(purchasedByFk?.definition).toMatch(/REFERENCES "?users"?\("?id"?\) ON DELETE SET NULL/);

    // The count is what makes dropping a relation fail here rather than pass unnoticed.
    expect(foreignKeys).toHaveLength(3);
  });

  // The calendar is a three-level chain, and every link cascades: deleting an event has to take its
  // days, their sittings and every attendance on them with it. A link that stopped cascading would
  // leave rows nothing can reach and nothing can delete.
  it('cascades the calendar all the way down from the event', async () => {
    const dayForeignKeys = await foreignKeysFor('event_calendar_days');
    const eventFk = on(dayForeignKeys, 'event_id');
    expect(eventFk?.name).toBe('fk_event_calendar_days_event_id');
    expect(eventFk?.definition).toMatch(/REFERENCES "?events"?\("?id"?\) ON DELETE CASCADE/);
    expect(dayForeignKeys).toHaveLength(1);

    const mealForeignKeys = await foreignKeysFor('event_calendar_meals');
    const dayFk = on(mealForeignKeys, 'day_id');
    expect(dayFk?.name).toBe('fk_event_calendar_meals_day_id');
    expect(dayFk?.definition).toMatch(/REFERENCES "?event_calendar_days"?\("?id"?\) ON DELETE CASCADE/);
    expect(mealForeignKeys).toHaveLength(1);

    // participant_id carries no foreign key on purpose: it holds either a user uuid or a guest id, and
    // guest ids live only inside the event's JSONB participants, so there is no table to point at.
    const attendanceForeignKeys = await foreignKeysFor('event_calendar_attendances');
    const mealFk = on(attendanceForeignKeys, 'meal_id');
    expect(mealFk?.name).toBe('fk_event_calendar_attendances_meal_id');
    expect(mealFk?.definition).toMatch(/REFERENCES "?event_calendar_meals"?\("?id"?\) ON DELETE CASCADE/);
    expect(attendanceForeignKeys).toHaveLength(1);
  });
});
