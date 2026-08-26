/**
 * The single description of where the entities and the migrations live.
 *
 * Both DataSources import these: the one the application boots with (database.config.ts) and the one
 * the migration CLI runs with (data-source.ts). They used to carry their own literals, which drifted:
 * the CLI's pattern demanded every entity sit inside an `entities/` directory, so it never saw
 * `modules/users/user.entity.ts` and the migration commands ran against a five-table schema.
 *
 * The paths resolve from this file's own location, so the same value works under ts-node (src/) and
 * compiled (dist/), with no NODE_ENV branching. That also makes this file's location load-bearing:
 * moving it changes what the patterns match. typeorm-paths.spec.ts pins both properties.
 */
export const ENTITY_GLOB = __dirname + '/../**/*.entity{.ts,.js}';

export const MIGRATION_GLOB = __dirname + '/../migrations/*{.ts,.js}';
