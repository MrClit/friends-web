import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUnusedSoftDeleteIndexes1706100000000 implements MigrationInterface {
  name = 'DropUnusedSoftDeleteIndexes1706100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Plain btrees over columns that are NULL in nearly every row. No reader of either table filters
    // on `deleted_at IS NOT NULL` — the only predicate in the codebase is `IS NULL`, explicit in
    // UsersService.search and TransactionPaginationService or injected by TypeORM's soft delete — and
    // a condition matching almost the whole table is served by a sequential scan, never by an index.
    // Dropped rather than declared on the entities so that dev, the test suites and production end up
    // with the same set of indexes. If a "deleted rows" screen ever appears, the index to add back is
    // a partial one (WHERE deleted_at IS NOT NULL), which is tiny and would actually be used.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_deleted_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_deleted_at;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at
      ON users (deleted_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at
      ON transactions (deleted_at);
    `);
  }
}
