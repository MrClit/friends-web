import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthExchangeCodesTable1705700000000 implements MigrationInterface {
  name = 'CreateAuthExchangeCodesTable1705700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_exchange_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code_hash varchar NOT NULL,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_exchange_codes_code_hash
      ON auth_exchange_codes (code_hash);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_exchange_codes_user_id
      ON auth_exchange_codes (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_exchange_codes;`);
  }
}
