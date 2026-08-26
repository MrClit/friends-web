import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShoppingItemsTable1705900000000 implements MigrationInterface {
  name = 'CreateShoppingItemsTable1705900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name varchar(120) NOT NULL,
        created_by uuid,
        purchased_by uuid,
        purchased_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Mirrors the @Index on the ShoppingItem entity; both declarations are required, see the comment there.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shopping_items_event_created_at
      ON shopping_items (event_id, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS shopping_items;`);
  }
}
