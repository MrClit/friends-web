import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsers1705300000000 implements MigrationInterface {
  name = 'AddSoftDeleteToUsers1705300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at
      ON users (deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_deleted_at;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;`);
  }
}
