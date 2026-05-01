import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1705100000000 implements MigrationInterface {
  name = 'CreateUsersTable1705100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('admin', 'user');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "name" varchar,
        "avatar" varchar,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    // Example: Pre-populate with an admin user (replace with real email)
    await queryRunner.query(`
      INSERT INTO "users" (email, name, avatar, role)
      VALUES ('victor.sales83@gmail.com', 'Admin User', NULL, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users";');
    await queryRunner.query('DROP TYPE "user_role_enum";');
  }
}
