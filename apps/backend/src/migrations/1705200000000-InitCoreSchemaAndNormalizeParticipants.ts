import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCoreSchemaAndNormalizeParticipants1705200000000 implements MigrationInterface {
  name = 'InitCoreSchemaAndNormalizeParticipants1705200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE user_role_enum AS ENUM ('admin', 'user');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'events_status_enum') THEN
          CREATE TYPE events_status_enum AS ENUM ('active', 'archived');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type_enum') THEN
          CREATE TYPE payment_type_enum AS ENUM ('contribution', 'expense', 'compensation');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar NOT NULL UNIQUE,
        name varchar,
        avatar varchar,
        role user_role_enum NOT NULL DEFAULT 'user',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(255) NOT NULL,
        description varchar(255),
        icon varchar(50),
        status events_status_enum NOT NULL DEFAULT 'active',
        participants jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(255) NOT NULL,
        payment_type payment_type_enum NOT NULL,
        amount numeric(10,2) NOT NULL,
        participant_id varchar(50) NOT NULL,
        date date NOT NULL,
        event_id uuid NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);

    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar;`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar varchar;`);
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role_enum;`);
    await queryRunner.query(`UPDATE users SET role = 'user' WHERE role IS NULL;`);
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN role SET NOT NULL;`);

    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS description varchar(255);`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS icon varchar(50);`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS status events_status_enum;`);
    await queryRunner.query(`UPDATE events SET status = 'active' WHERE status IS NULL;`);
    await queryRunner.query(`ALTER TABLE events ALTER COLUMN status SET DEFAULT 'active';`);
    await queryRunner.query(`ALTER TABLE events ALTER COLUMN status SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS participants jsonb;`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);

    await queryRunner.query(`
      UPDATE events e
      SET participants = normalized.normalized_participants
      FROM (
        SELECT
          ev.id,
          COALESCE(
            jsonb_agg(
              CASE
                WHEN jsonb_typeof(p.elem) = 'object' THEN
                  CASE
                    WHEN (p.elem ? 'type') THEN
                      CASE
                        WHEN p.elem->>'type' = 'user' THEN
                          jsonb_build_object(
                            'type', 'user',
                            'id', COALESCE(NULLIF(p.elem->>'id', ''), 'unknown-user')
                          )
                        WHEN p.elem->>'type' = 'pot' THEN
                          jsonb_build_object('type', 'pot', 'id', '0')
                        ELSE
                          jsonb_build_object(
                            'type', 'guest',
                            'id', COALESCE(
                              NULLIF(p.elem->>'id', ''),
                              'guest-' || substr(md5(p.elem::text || p.ord::text), 1, 8)
                            ),
                            'name', COALESCE(NULLIF(p.elem->>'name', ''), 'Guest')
                          )
                      END
                    ELSE
                      jsonb_build_object(
                        'type', 'guest',
                        'id', COALESCE(
                          NULLIF(p.elem->>'id', ''),
                          'guest-' || substr(md5(p.elem::text || p.ord::text), 1, 8)
                        ),
                        'name', COALESCE(NULLIF(p.elem->>'name', ''), 'Guest')
                      )
                  END
                WHEN jsonb_typeof(p.elem) = 'string' THEN
                  jsonb_build_object(
                    'type', 'guest',
                    'id', 'guest-' || substr(md5((p.elem #>> '{}') || p.ord::text), 1, 8),
                    'name', p.elem #>> '{}'
                  )
                ELSE
                  jsonb_build_object(
                    'type', 'guest',
                    'id', 'guest-' || substr(md5(p.elem::text || p.ord::text), 1, 8),
                    'name', 'Guest'
                  )
              END
              ORDER BY p.ord
            ),
            '[]'::jsonb
          ) AS normalized_participants
        FROM events ev
        LEFT JOIN LATERAL jsonb_array_elements(COALESCE(ev.participants, '[]'::jsonb))
          WITH ORDINALITY AS p(elem, ord) ON TRUE
        GROUP BY ev.id
      ) normalized
      WHERE e.id = normalized.id;
    `);

    await queryRunner.query(`UPDATE events SET participants = '[]'::jsonb WHERE participants IS NULL;`);
    await queryRunner.query(`ALTER TABLE events ALTER COLUMN participants SET NOT NULL;`);

    await queryRunner.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'transactions'
            AND column_name = 'payment_type'
            AND udt_name <> 'payment_type_enum'
        ) THEN
          ALTER TABLE transactions
            ALTER COLUMN payment_type
            TYPE payment_type_enum
            USING payment_type::text::payment_type_enum;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE c.contype = 'f'
            AND n.nspname = 'public'
            AND t.relname = 'transactions'
            AND pg_get_constraintdef(c.oid) ILIKE '%(event_id)%REFERENCES events(id)%'
        ) THEN
          ALTER TABLE transactions
            ADD CONSTRAINT fk_transactions_event_id
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON transactions(event_id);`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_event_date_created
      ON transactions(event_id, date DESC, created_at DESC);
    `);
  }

  public async down(): Promise<void> {
    // Intentionally no-op to avoid destructive rollbacks in production.
  }
}
