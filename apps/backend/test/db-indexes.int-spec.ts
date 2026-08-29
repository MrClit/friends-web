import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { EXPECTED_INDEXES, readIndexNamesByTable } from './utils/expected-indexes';

interface IndexRow {
  indexname: string;
  indexdef: string;
}

/**
 * The indexes backing the hot query paths are declared twice on purpose: as @Index metadata on
 * the entities (which is what builds the schema here, since the DB-backed suites run with
 * TYPEORM_SYNC=true) and as raw DDL in the migration (which is what builds production). These
 * tests pin the entity half against the shared list in test/utils/expected-indexes.ts;
 * migrations.int-spec.ts pins the migration half against that same list.
 */
describe('Performance indexes (integration)', () => {
  let app: INestApplication;
  let repository: Repository<Event>;

  const indexesFor = async (table: string): Promise<IndexRow[]> =>
    repository.query<IndexRow[]>(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = $1;`, [table]);

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

  // Asserted as one whole map rather than table by table, so it also catches what a per-table lookup
  // would miss: an index nobody expected, an `IDX_<hash>` left by an @Index declared without a name,
  // and an index on a table that was never added to the list.
  it('builds exactly the expected indexes from the entity metadata', async () => {
    const actual = await readIndexNamesByTable((sql) => repository.query(sql));

    expect(actual).toEqual(EXPECTED_INDEXES);
  });

  // The assertions below say what a name cannot: which columns the index covers, and — for the
  // transactions one — that it is partial. Those are the properties the query plans depend on.

  it('indexes events by status and creation date', async () => {
    const index = (await indexesFor('events')).find((row) => row.indexname === 'idx_events_status_created_at');

    expect(index?.indexdef).toContain('status');
    expect(index?.indexdef).toContain('created_at');
  });

  it('indexes non-deleted transactions by event, date and creation date', async () => {
    const index = (await indexesFor('transactions')).find(
      (row) => row.indexname === 'idx_transactions_event_date_created_active',
    );

    expect(index?.indexdef).toContain('event_id');
    expect(index?.indexdef).toContain('date');
    expect(index?.indexdef).toContain('created_at');
    // The partial predicate is the point of this index: without it the soft-delete filter that
    // every reader of this path carries would not be covered.
    expect(index?.indexdef).toMatch(/WHERE \(?deleted_at IS NULL\)?/);
  });

  it('indexes every transaction by event, soft-deleted ones included', async () => {
    const index = (await indexesFor('transactions')).find((row) => row.indexname === 'idx_transactions_event_id');

    expect(index?.indexdef).toContain('event_id');
    // Deliberately not partial, which is what separates it from the index above: the ON DELETE CASCADE
    // from events deletes soft-deleted rows too, and carries no predicate a partial index could match.
    expect(index?.indexdef).not.toContain('WHERE');
  });

  it('indexes shopping items by event and creation date', async () => {
    const index = (await indexesFor('shopping_items')).find(
      (row) => row.indexname === 'idx_shopping_items_event_created_at',
    );

    expect(index?.indexdef).toContain('event_id');
    expect(index?.indexdef).toContain('created_at');
  });
});
