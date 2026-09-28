import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Groups of users, managed by the admin (#121, #227), and the initial group that keeps today's behavior.
 *
 * Every user that exists when this runs goes into one initial group, so on deploy day nobody notices a
 * thing. The admin then creates the real groups, moves people into them and deletes the initial group.
 * Soft deleted users are left out: they are gone and cannot come back.
 */
export class CreateGroups1706400000000 implements MigrationInterface {
  name = 'CreateGroups1706400000000';

  private static readonly INITIAL_GROUP_NAME = 'Grupo inicial';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Every constraint and index below is declared a second time on its entity, and the names have to
    // match. The integration and e2e suites build this schema from the entities with TYPEORM_SYNC=true
    // while production builds it from here, and TypeORM matches constraints by name.
    //
    // Names are unique only exactly here; the case-insensitive rule lives in the service (see Group).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_groups_name UNIQUE (name)
      );
    `);

    // The primary key leads with group_id, so it backs the cascade from groups; the index on user_id
    // backs the one from users.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id uuid NOT NULL,
        user_id uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (group_id, user_id),
        CONSTRAINT fk_group_members_group_id
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_members_user_id
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members (user_id);
    `);

    // ON CONFLICT keeps a re-run from failing on the unique name, and the membership insert then goes to
    // whichever group holds the name.
    await queryRunner.query(
      `
      INSERT INTO groups (name) VALUES ($1)
      ON CONFLICT (name) DO NOTHING;
    `,
      [CreateGroups1706400000000.INITIAL_GROUP_NAME],
    );

    await queryRunner.query(
      `
      INSERT INTO group_members (group_id, user_id)
      SELECT g.id, u.id
      FROM groups g
      CROSS JOIN users u
      WHERE g.name = $1 AND u.deleted_at IS NULL
      ON CONFLICT DO NOTHING;
    `,
      [CreateGroups1706400000000.INITIAL_GROUP_NAME],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Child first: the cascades only fire on row deletion, not on DROP TABLE.
    await queryRunner.query(`DROP TABLE IF EXISTS group_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS groups;`);
  }
}
