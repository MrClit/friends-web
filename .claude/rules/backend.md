---
paths:
  - "apps/backend/**"
  - "scripts/check-env-files.mjs"
---

## Backend Architecture

**Stack:** NestJS · TypeORM · PostgreSQL 15+ · Swagger/OpenAPI · JWT + Google/Microsoft OAuth2

### Module structure

```
src/modules/{module}/       controller.ts, service.ts, module.ts, entities/, dto/, services/
src/common/bootstrap/       configure-app.ts — shared by main.ts and the test harness
src/common/                 HttpExceptionFilter, TransformInterceptor, @CurrentUser(), @ApiStandardResponse()
src/common/request-context/ RequestContextService (global module, registered once)
src/common/middleware/      CorrelationMiddleware — x-correlation-id, applied to '*'
src/common/health.controller.ts
src/config/                 database.config.ts, app.config.ts, env.validation.ts, auth.constants.ts
src/migrations/             TypeORM migration files
```

Modules: `auth`, `events`, `transactions`, `shopping-list`, `calendar`, `users`, `admin`, `event-access`, `event-participation`

A module that grows past one service splits into `{module}/services/` (see `events/services/`,
`transactions/services/`) rather than fattening the root service.

### Global behavior

Everything shared between production and tests is applied by `configureApp()` in
[configure-app.ts](../../apps/backend/src/common/bootstrap/configure-app.ts) — **e2e tests build their app through
it**, so a global added only in `main.ts` will not be exercised by the suites. `main.ts` keeps only the
environment-dependent wiring (CORS, Swagger, `listen`).

- API prefix: `/api` — Swagger at `/api/docs`
- `helmet()` first, so security headers cover everything downstream
- All responses wrapped as `{ data: T }` via `TransformInterceptor`
- Global `ValidationPipe` with `whitelist`, **`forbidNonWhitelisted`** (an unknown body property is a 400, not
  a silent strip), `transform` and `enableImplicitConversion`
- `HttpExceptionFilter` owns the error contract
- Global `ThrottlerGuard` (100 req/min) via `APP_GUARD`, and `nestjs-pino` for logging — request ids come from
  `x-correlation-id` when present, `/api/health` is excluded from access logs
- `@CurrentUser()` decorator extracts authenticated user from JWT
- `RolesGuard` + `@Roles()` for role-based access

### Authorization

`EventAccessService` (`modules/event-access/`) is the **single owner** of the event access rule: an actor may
access an event if it is an admin, or is listed as a participant of `type: 'user'`. Guest participants that
happen to share an id grant nothing. Any module needing to authorize an event depends on this service —
do not re-derive the rule against your own repository.

`EventParticipationService` (`modules/event-participation/`) is likewise the **single owner** of whether a
`participantId` is valid in an event, in two explicit variants: `assertParticipantOrPot` (transactions — the
pot `'0'` may pay) and `assertPersonParticipant` (calendar — only users and guests). Do not walk
`event.participants` yourself to validate an id.

### API surface

Transactions are exposed twice, and the split matters when adding endpoints: collection operations are nested
under the event (`/api/events/:eventId/transactions`, plus `.../paginated`) while operations on a single
transaction are flat (`/api/transactions/:id`). Admin user management is `/api/admin/users` behind
`@Roles('admin')`.

### Auth flow

OAuth callback → the backend mints a **one-time exchange code** (`AuthExchangeCode` entity, TTL from
`AUTH_EXCHANGE_CODE_TTL_SECONDS`) and redirects to `FRONTEND_URL` with it → the frontend `POST /api/auth/exchange`
trades it for an access token + refresh token. Tokens never travel in the redirect URL. Refresh tokens are
persisted (`RefreshToken` entity), rotated on use and capped by `REFRESH_TOKEN_MAX_ROTATIONS`; a token rotated
within the last `REFRESH_TOKEN_ROTATION_GRACE_SECONDS` may be reused by a concurrent tab without tripping breach detection.
Google and Microsoft strategies share `strategies/base/oauth-validation.base.ts`; avatars go to Cloudinary
via `services/avatar.service.ts`.

### Patterns

- Controllers handle HTTP only (routing, validation, Swagger decorators)
- Services own business logic; throw NestJS exceptions (`NotFoundException`, etc.)
- DTOs use `class-validator` decorators
- Swagger: `@ApiOperation` + `@ApiStandardResponse(status, description, type, isArray?)`
- **Money is `decimal.js`, never native numbers.** Amounts are `decimal(10,2)` and Postgres returns them as
  strings, so aggregate with `new Decimal(String(amount))` (rounding is `ROUND_HALF_EVEN`, set globally) and
  `.toNumber()` only when serializing the response. Summing with `+` reintroduces float drift into balances.
- User entity uses soft deletes (`@DeleteDateColumn`)
- Cascade delete: transactions deleted when parent event is deleted

### Testing

Three suites, three configs, three naming conventions — the config decides what runs, so a misnamed file is
silently never executed:

| Suite | Config | Location and name | Needs Postgres |
|---|---|---|---|
| unit | `test/jest.unit.json` | co-located, `src/**/*.spec.ts` | no |
| integration | `test/jest.integration.json` | `test/**/*.int-spec.ts` | yes |
| e2e | `test/jest.e2e.json` | `test/**/*.e2e-spec.ts` | yes |

Shared helpers for the DB-backed suites live in `test/utils/` (`test-app-config.ts`, `test-factories.ts`,
`test-http-helpers.ts`) — reuse them instead of hand-rolling app bootstrap or fixtures. The unit config
enforces coverage thresholds (global, plus a stricter per-file gate on
`events/services/event-participants.service.ts`), so uncovered new code fails the run.

### Database

Config in `src/config/database.config.ts` (env-based via `ConfigService`). Migration scripts:
`migration:generate`, `migration:run` (local), `migration:run:prod` (runs against `dist/`, executed on
production boot), `migration:revert`.

### Environment

Backend loads `.env.${NODE_ENV}` (`.env.development`, `.env.test`) and validates it with the Joi schema in
`src/config/env.validation.ts` — that schema, not the `.env.example` files, is the source of truth for which
vars exist, which are required and what the defaults are. Boot fails loudly on a bad env. Production reads
no file (Render exports the variables) and **refuses to boot or migrate if an `apps/backend/.env.production`
exists on disk** — see `src/config/env-file.ts`. `pnpm check:env` (run by `pnpm lint`) fails if any backend
`.env*` other than `*.example` is tracked or stops being ignored: the frontend commits its env files, the
backend never does.

The backend integration and e2e suites need a running Postgres *and* an `apps/backend/.env.test` copied from
`.env.test.example` (gitignored). That file sets `TYPEORM_SYNC=true`, so those suites build the schema
themselves and do not run migrations — the one exception is `test/migrations.int-spec.ts`, which builds
its own throwaway database from `src/migrations/`.
