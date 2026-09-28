import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Every event belongs to a group (#121, #228). The existing events all go into the initial group, and
 * the admin then moves each one to its real group by hand.
 *
 * The initial group is not taken for granted. CreateGroups1706400000000 creates it, but if that migration
 * ever ships in a release of its own, the admin could have deleted or renamed it before this one runs.
 * In that case it is created again, holding only the users that take part in the events being assigned,
 * never the whole user list: people who were already split into their real groups must not see each
 * other again. On a normal run those users are members already and the insert changes nothing.
 */
export class AddGroupToEvents1706500000000 implements MigrationInterface {
  name = 'AddGroupToEvents1706500000000';

  private static readonly INITIAL_GROUP_NAME = 'Grupo inicial';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS group_id uuid;`);

    const [{ count }] = (await queryRunner.query(
      `SELECT COUNT(*)::int AS count FROM events WHERE group_id IS NULL;`,
    )) as { count: number }[];

    if (count > 0) {
      await this.assignToInitialGroup(queryRunner);
    }

    await queryRunner.query(`ALTER TABLE events ALTER COLUMN group_id SET NOT NULL;`);

    // Declared a second time on the Event entity, under the same names: the DB-backed test suites build
    // the schema from the entities, and TypeORM matches constraints and indexes by name.
    await queryRunner.query(`
      ALTER TABLE events
        ADD CONSTRAINT fk_events_group_id
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_events_group_id ON events (group_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_group_id;`);
    await queryRunner.query(`ALTER TABLE events DROP CONSTRAINT IF EXISTS fk_events_group_id;`);
    await queryRunner.query(`ALTER TABLE events DROP COLUMN IF EXISTS group_id;`);
  }

  private async assignToInitialGroup(queryRunner: QueryRunner): Promise<void> {
    const name = AddGroupToEvents1706500000000.INITIAL_GROUP_NAME;

    await queryRunner.query(`INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;`, [name]);

    // The users that take part in the events still without a group. Soft deleted users are left out, as
    // they were from the initial group itself.
    await queryRunner.query(
      `
      INSERT INTO group_members (group_id, user_id)
      SELECT DISTINCT g.id, u.id
      FROM events e
      CROSS JOIN LATERAL jsonb_array_elements(e.participants) AS p
      JOIN users u ON u.id::text = p->>'id' AND u.deleted_at IS NULL
      JOIN groups g ON g.name = $1
      WHERE e.group_id IS NULL AND p->>'type' = 'user'
      ON CONFLICT DO NOTHING;
    `,
      [name],
    );

    await queryRunner.query(
      `UPDATE events SET group_id = (SELECT id FROM groups WHERE name = $1) WHERE group_id IS NULL;`,
      [name],
    );
  }
}
