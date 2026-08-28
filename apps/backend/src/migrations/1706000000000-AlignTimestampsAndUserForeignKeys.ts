import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Closes the two halves of the schema drift the entities could not close on their own.
 *
 * The timestamp columns are already `timestamptz` here; what production lacks is the NOT NULL that
 * @CreateDateColumn and @UpdateDateColumn always declare. And the shopping list attribution columns
 * never got their foreign keys, because at the time the migration CLI could not resolve a relation to
 * User (see #156).
 */
export class AlignTimestampsAndUserForeignKeys1706000000000 implements MigrationInterface {
  name = 'AlignTimestampsAndUserForeignKeys1706000000000';

  private static readonly TIMESTAMP_TABLES = ['users', 'events', 'transactions'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill before constraining. These columns have defaulted to now() since they were created, so
    // there should be nothing to fix, but a NOT NULL that fails takes the whole deploy down with it.
    for (const table of AlignTimestampsAndUserForeignKeys1706000000000.TIMESTAMP_TABLES) {
      await queryRunner.query(`
        UPDATE ${table} SET created_at = now() WHERE created_at IS NULL;
      `);
      await queryRunner.query(`
        UPDATE ${table} SET updated_at = now() WHERE updated_at IS NULL;
      `);
      // SET NOT NULL is idempotent, so no guard is needed here.
      await queryRunner.query(`
        ALTER TABLE ${table}
          ALTER COLUMN created_at SET NOT NULL,
          ALTER COLUMN updated_at SET NOT NULL;
      `);
    }

    // Null out any attribution pointing at a user that no longer exists, or adding the foreign key
    // would fail. NOT EXISTS rather than NOT IN: a NULL anywhere in a NOT IN subquery silently makes
    // the whole predicate return no rows.
    await queryRunner.query(`
      UPDATE shopping_items s SET created_by = NULL
      WHERE s.created_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.created_by);
    `);
    await queryRunner.query(`
      UPDATE shopping_items s SET purchased_by = NULL
      WHERE s.purchased_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.purchased_by);
    `);

    // ADD CONSTRAINT has no IF NOT EXISTS, hence the guard.
    for (const column of ['created_by', 'purchased_by']) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.contype = 'f'
              AND n.nspname = 'public'
              AND t.relname = 'shopping_items'
              AND c.conname = 'fk_shopping_items_${column}'
          ) THEN
            ALTER TABLE shopping_items
              ADD CONSTRAINT fk_shopping_items_${column}
              FOREIGN KEY (${column}) REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['created_by', 'purchased_by']) {
      await queryRunner.query(`
        ALTER TABLE shopping_items DROP CONSTRAINT IF EXISTS fk_shopping_items_${column};
      `);
    }

    for (const table of AlignTimestampsAndUserForeignKeys1706000000000.TIMESTAMP_TABLES) {
      await queryRunner.query(`
        ALTER TABLE ${table}
          ALTER COLUMN created_at DROP NOT NULL,
          ALTER COLUMN updated_at DROP NOT NULL;
      `);
    }
  }
}
