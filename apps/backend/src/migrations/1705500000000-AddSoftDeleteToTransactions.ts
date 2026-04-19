import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToTransactions1705500000000 implements MigrationInterface {
  name = 'AddSoftDeleteToTransactions1705500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at
      ON transactions (deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_deleted_at;`);
    await queryRunner.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS deleted_at;`);
  }
}
