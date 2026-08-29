/**
 * The one description of which indexes this schema is supposed to have.
 *
 * It is asserted against both halves of the split this repo lives with: the schema the entities build
 * (db-indexes.int-spec.ts, since the DB-backed suites run with TYPEORM_SYNC=true) and the schema the
 * migrations build (migrations.int-spec.ts). An index declared on only one of the two sides therefore
 * fails the suite instead of drifting in silence — which is how three indexes ended up existing only
 * in production, and five more under a different name (issue #150).
 *
 * Adding an index means touching three places: the `@Index` on the entity, the DDL in the migration,
 * and this list.
 */
export const EXPECTED_INDEXES: Record<string, string[]> = {
  auth_exchange_codes: ['idx_auth_exchange_codes_code_hash', 'idx_auth_exchange_codes_user_id'],
  events: ['idx_events_status_created_at'],
  refresh_tokens: ['idx_refresh_tokens_family', 'idx_refresh_tokens_token_hash', 'idx_refresh_tokens_user_id'],
  shopping_items: ['idx_shopping_items_event_created_at'],
  transactions: ['idx_transactions_event_date_created_active', 'idx_transactions_event_id'],
  // `users` is absent on purpose: it has no index of its own. The primary key and the unique email are
  // constraints, and the query below leaves those out.
};

interface IndexRow {
  tablename: string;
  indexname: string;
}

/**
 * Indexes that back a constraint are excluded: TypeORM names them `PK_<hash>` / `UQ_<hash>` when it
 * synchronizes, while the migrations left Postgres to name them `users_pkey` / `users_email_key`. Those
 * names differ between the two schemas by design, so comparing them would report noise as drift. An
 * index declared with `@Index(..., { unique: true })` is not a constraint and does stay in.
 *
 * NOT EXISTS rather than a LEFT JOIN on pg_constraint: a primary key index is referenced by every
 * foreign key pointing at it, and the join would return one row per reference.
 */
const INDEX_QUERY = `
  SELECT c.relname AS tablename, i.relname AS indexname
  FROM pg_index ix
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_class c ON c.oid = ix.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = ix.indexrelid)
  ORDER BY c.relname, i.relname;
`;

/**
 * Reads the live index names grouped by table, shaped exactly like EXPECTED_INDEXES so the two can be
 * compared with a single assertion. Takes the query function instead of a connection because the two
 * callers reach Postgres by different routes: a Repository in one, a DataSource in the other.
 */
export async function readIndexNamesByTable(
  query: (sql: string) => Promise<IndexRow[]>,
): Promise<Record<string, string[]>> {
  const rows = await query(INDEX_QUERY);

  return rows.reduce<Record<string, string[]>>((byTable, row) => {
    byTable[row.tablename] = [...(byTable[row.tablename] ?? []), row.indexname];
    return byTable;
  }, {});
}
