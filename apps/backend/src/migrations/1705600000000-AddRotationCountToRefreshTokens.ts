import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRotationCountToRefreshTokens1705600000000 implements MigrationInterface {
  name = 'AddRotationCountToRefreshTokens1705600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD COLUMN IF NOT EXISTS rotation_count int NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      DROP COLUMN IF EXISTS rotation_count;
    `);
  }
}
