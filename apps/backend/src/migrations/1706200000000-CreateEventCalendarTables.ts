import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventCalendarTables1706200000000 implements MigrationInterface {
  name = 'CreateEventCalendarTables1706200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The meal calendar of an event: days, the sittings of each day, and how many people each
    // participant brings to each sitting.
    //
    // No index is created beyond the three unique constraints. Each of them leads with the column its
    // foreign key points through, so it already backs the ON DELETE CASCADE, and there is no read path
    // that filters by anything else: the whole calendar of one event is fetched at once.
    //
    // Every constraint below is declared a second time on its entity, and the names have to match. The
    // integration and e2e suites build this schema from the entities with TYPEORM_SYNC=true while
    // production builds it from here, and TypeORM matches constraints by name.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_calendar_days (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL,
        date date NOT NULL,
        description varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_event_calendar_days_event_id
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        CONSTRAINT uq_event_calendar_days_event_date UNIQUE (event_id, date)
      );
    `);

    // slot is text and not an enum type: adding a sitting (breakfast) must not need a migration.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_calendar_meals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        day_id uuid NOT NULL,
        slot varchar(20) NOT NULL,
        description varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_event_calendar_meals_day_id
          FOREIGN KEY (day_id) REFERENCES event_calendar_days(id) ON DELETE CASCADE,
        CONSTRAINT uq_event_calendar_meals_day_slot UNIQUE (day_id, slot)
      );
    `);

    // participant_id is varchar(50) and carries no foreign key, exactly like the one on transactions: it
    // holds a user uuid or a guest id, and guest ids live only inside the event's JSONB participants.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_calendar_attendances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        meal_id uuid NOT NULL,
        participant_id varchar(50) NOT NULL,
        adults integer NOT NULL DEFAULT 0,
        children integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_event_calendar_attendances_meal_id
          FOREIGN KEY (meal_id) REFERENCES event_calendar_meals(id) ON DELETE CASCADE,
        CONSTRAINT uq_event_calendar_attendances_meal_participant UNIQUE (meal_id, participant_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Child first: the cascades only fire on row deletion, not on DROP TABLE.
    await queryRunner.query(`DROP TABLE IF EXISTS event_calendar_attendances;`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_calendar_meals;`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_calendar_days;`);
  }
}
