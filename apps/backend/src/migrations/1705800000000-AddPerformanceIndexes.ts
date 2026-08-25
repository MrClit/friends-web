import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1705800000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1705800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Event listing filters by status and orders by creation date, and the table had no
    // index at all beyond the primary key.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_status_created_at
      ON events (status, created_at);
    `);

    // Replaces idx_transactions_event_date_created, which predates the soft delete column:
    // every reader of this path now filters on deleted_at IS NULL, so the predicate belongs
    // in the index. No DESC here — both orderings are descending, so Postgres serves
    // `ORDER BY date DESC, created_at DESC` with a backward scan of the ascending index.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_event_date_created_active
      ON transactions (event_id, date, created_at)
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_event_date_created;`);

    // idx_transactions_event_id stays: it is what backs the ON DELETE CASCADE from events,
    // and that delete reaches soft-deleted rows the partial index above does not cover.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_event_date_created
      ON transactions (event_id, date DESC, created_at DESC);
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_event_date_created_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_status_created_at;`);
  }
}
