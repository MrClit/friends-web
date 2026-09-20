import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRotatedAtToRefreshTokens1706300000000 implements MigrationInterface {
  name = 'AddRotatedAtToRefreshTokens1706300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nullable on purpose: rows rotated before this deploy keep NULL, so they get no grace window.
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD COLUMN IF NOT EXISTS rotated_at timestamptz NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      DROP COLUMN IF EXISTS rotated_at;
    `);
  }
}
