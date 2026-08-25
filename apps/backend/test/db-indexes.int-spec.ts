import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';

interface IndexRow {
  indexname: string;
  indexdef: string;
}

/**
 * The indexes backing the hot query paths are declared twice on purpose: as @Index metadata on
 * the entities (which is what builds the schema here, since the DB-backed suites run with
 * TYPEORM_SYNC=true) and as raw DDL in the migration (which is what builds production). These
 * tests pin the entity half, so an index silently dropped from an entity fails the suite instead
 * of drifting away from the migration.
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

  it('indexes events by status and creation date', async () => {
    const index = (await indexesFor('events')).find((row) => row.indexname === 'idx_events_status_created_at');

    expect(index).toBeDefined();
    expect(index?.indexdef).toContain('status');
    expect(index?.indexdef).toContain('created_at');
  });

  it('indexes non-deleted transactions by event, date and creation date', async () => {
    const index = (await indexesFor('transactions')).find(
      (row) => row.indexname === 'idx_transactions_event_date_created_active',
    );

    expect(index).toBeDefined();
    expect(index?.indexdef).toContain('event_id');
    expect(index?.indexdef).toContain('date');
    expect(index?.indexdef).toContain('created_at');
    // The partial predicate is the point of this index: without it the soft-delete filter that
    // every reader of this path carries would not be covered.
    expect(index?.indexdef).toMatch(/WHERE \(?deleted_at IS NULL\)?/);
  });
});
