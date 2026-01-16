import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1705100000000 implements MigrationInterface {
  name = 'CreateUsersTable1705100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('admin', 'user');
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "name" varchar,
        "avatar" varchar,
        "role" "user_role_enum" NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    // Example: Pre-populate with an admin user (replace with real email)
    await queryRunner.query(`
      INSERT INTO "users" (email, name, avatar, role)
      VALUES ('victor.sales83@gmail.com', 'Admin User', NULL, 'admin');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users";');
    await queryRunner.query('DROP TYPE "user_role_enum";');
  }
}
