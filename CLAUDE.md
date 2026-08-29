# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Friends is an expense-sharing platform for group events. pnpm monorepo with:
- `@friends/frontend` → `apps/frontend/` — React 19 + TanStack Query + Zustand
- `@friends/backend` → `apps/backend/` — NestJS + TypeORM + PostgreSQL
- `@friends/shared-types` → `packages/shared-types/` — Shared TypeScript types

Versioning is SemVer on the **root `package.json` only**; every workspace manifest is private and stays at
`0.0.0`. Infrastructure and production operations are documented in [DEPLOYMENT.md](DEPLOYMENT.md) — it is
canonical, do not restate it here.

## Commands

```bash
# Install
pnpm install

# Dev servers
pnpm dev:frontend        # localhost:5173
pnpm dev:backend         # localhost:3000

# Build
pnpm -r build

# Lint & format
pnpm lint
pnpm lint:fix
pnpm format

# Frontend tests (Vitest)
pnpm --filter @friends/frontend test        # watch
pnpm --filter @friends/frontend test:run    # CI
pnpm --filter @friends/frontend test:coverage
pnpm --filter @friends/frontend test:run -- src/api/client.test.ts   # single file
pnpm --filter @friends/frontend test:run -- -t "refreshes the token"  # single test

# Backend tests (Jest) — three separate suites, three configs
pnpm --filter @friends/backend test         # unit, watch
pnpm --filter @friends/backend test:run     # unit + coverage (this is what root `pnpm test` runs)
pnpm --filter @friends/backend test:int     # integration — needs Postgres + .env.test
pnpm --filter @friends/backend test:e2e     # e2e — needs Postgres + .env.test
pnpm --filter @friends/backend test:all     # the three of them
pnpm --filter @friends/backend check:backend  # lint + test:all
pnpm --filter @friends/backend test:e2e -- test/events.e2e-spec.ts   # single file

# Backend DB
cd apps/backend && docker-compose up -d     # start PostgreSQL
pnpm --filter @friends/backend migration:run
```

**Type-checking only happens in `build`.** `check:backend` runs lint + tests, neither of which type-checks;
`pnpm build` is the only thing that does (frontend `tsc -b`, backend `nest build`). A change can be green on
`check:backend` and still fail to compile.

**`@friends/shared-types` is consumed from `dist/`.** Both apps import the built output, so a change there
needs `pnpm --filter @friends/shared-types build` before the consumers see it (the backend `prebuild` does
this; a watching dev server does not).

### Environment

Backend loads `.env.${NODE_ENV}` (`.env.development`, `.env.test`, `.env.production`) and validates it with
the Joi schema in `src/config/env.validation.ts` — that schema, not the `.env.example` files, is the source
of truth for which vars exist, which are required and what the defaults are. Boot fails loudly on a bad env.

The backend integration and e2e suites need a running Postgres *and* an `apps/backend/.env.test` copied from
`.env.test.example` (gitignored). That file sets `TYPEORM_SYNC=true`, so those suites build the schema
themselves and do not run migrations — the one exception is `test/migrations.int-spec.ts`, which builds
its own throwaway database from `src/migrations/`.

Frontend env vars are `VITE_`-prefixed and validated at module load in `src/config/env.ts`
(`VITE_API_URL` and `VITE_APP_NAME` are required; a missing or malformed one throws at startup).

## Frontend Architecture

**Stack:** React 19 · TypeScript · Vite · TanStack Query · Zustand · TailwindCSS v4 · React Router 7 (HashRouter) · i18next

### Feature structure

```
src/features/{feature}/   components/, types.ts, constants.ts, index.ts (hooks/ optional)
src/api/                  client.ts, types.ts + per-entity modules (events.api.ts, transactions.api.ts, users.api.ts, admin-users.api.ts)
src/hooks/api/            TanStack Query hooks + centralized keys.ts
src/shared/store/         Zustand stores (theme, modals, toast, delete state)
src/pages/                Route-level components
src/providers/            QueryProvider (wraps the app in App.tsx)
src/lib/queryClient.ts    The single QueryClient instance and its defaults
src/shared/components/ui/ Radix primitives wrapped for this design system (dialog, dropdown-menu)
src/i18n/locales/         es/ (default), en/, ca/
src/config/env.ts         Validated env vars via VITE_ prefix
```

Features: `events`, `transactions`, `kpi`, `auth`, `admin-users`, `profile`

### State management layers

1. **Server state:** TanStack Query hooks in `src/hooks/api/` with keys from `keys.ts`
2. **UI/modal state:** Zustand stores (`useEventFormModalStore`, `useTransactionModalStore`, etc.)
3. **Global state:** `useThemeStore` (dark mode only)

### API client and the token model

`src/api/client.ts` — custom fetch wrapper that auto-unwraps `{ data: T }` responses, handles JWT refresh, and throws `ApiError` with status info.

The token split is deliberate and easy to break:

- **Access token lives in a module-level variable, never in storage** — a persistent XSS cannot read it. It is
  lost on reload and re-obtained from the refresh token. Do not "fix" this by persisting it.
- **Refresh token lives in `localStorage`** under `REFRESH_TOKEN_KEY`, and is rotated on every refresh.
- On a `401` the client refreshes once and replays the request (`_retried` guard); a failed refresh dispatches
  a global `auth:logout` event, which `AuthContext` listens for. Concurrent 401s share one `refreshPromise`.

### Key conventions

- **Named exports only** — never `export default`. Barrel files use `export { X } from './X'`
- `React.memo` → `export const Foo = memo(function Foo() { ... })`
- `React.lazy` → `lazy(() => import('./Foo').then(m => ({ default: m.Foo })))`
- `cn()` helper from `@/shared/utils` for conditional Tailwind classes (clsx + tailwind-merge); use when a `className` has 8+ utilities or mixes state/theme/responsive variants
- Tailwind class order: layout → spacing → typography → visual → interaction → state/theme → responsive
- Full className rules and the refactor procedure live in the `tailwind-inline-cn` skill
- Semantic colors: blue=contributions, rose=expenses, emerald=compensations, amber=pot

### Routes

Vite `base` is `/friends-web/` (GitHub Pages subpath) and routing is a `HashRouter`, so production URLs look
like `/friends-web/#/event/:id`. That is why `FRONTEND_URL` on the backend carries a trailing `#` — the OAuth
redirect has to land inside the hash router. Every route below is lazy-loaded in [App.tsx](apps/frontend/src/App.tsx).

- `/login`, `/auth/callback` — OAuth flow
- `/` — Home (event list, protected)
- `/event/:id` — Event detail (protected)
- `/event/:id/kpi/:kpi` — KPI drill-down (protected)
- `/profile` — User profile (protected)
- `/settings` → redirects to `/profile` (protected alias)
- `/admin/users` — Admin user management (protected, ADMIN role)
- `*` — 404 Not Found

### Testing

Vitest + Testing Library. Tests are **co-located** with the source (`Foo.test.ts` next to `Foo.ts`), not in a
separate tree. Global setup: `src/test/setup.ts`.

### i18n

- Languages: `es` (default), `en`, `ca`
- Key pattern: `feature.context.key` (e.g., `events.form.title`)
- Helpers: `formatAmount(amount, 'EUR')`, `formatDateLong(date)`

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

Modules: `auth`, `events`, `transactions`, `users`, `admin`, `event-access`

A module that grows past one service splits into `{module}/services/` (see `events/services/`,
`transactions/services/`) rather than fattening the root service.

### Global behavior

Everything shared between production and tests is applied by `configureApp()` in
[configure-app.ts](apps/backend/src/common/bootstrap/configure-app.ts) — **e2e tests build their app through
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

### API surface

Transactions are exposed twice, and the split matters when adding endpoints: collection operations are nested
under the event (`/api/events/:eventId/transactions`, plus `.../paginated`) while operations on a single
transaction are flat (`/api/transactions/:id`). Admin user management is `/api/admin/users` behind
`@Roles('admin')`.

### Auth flow

OAuth callback → the backend mints a **one-time exchange code** (`AuthExchangeCode` entity, TTL from
`AUTH_EXCHANGE_CODE_TTL_SECONDS`) and redirects to `FRONTEND_URL` with it → the frontend `POST /api/auth/exchange`
trades it for an access token + refresh token. Tokens never travel in the redirect URL. Refresh tokens are
persisted (`RefreshToken` entity), rotated on use and capped by `REFRESH_TOKEN_MAX_ROTATIONS`.
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

## Domain Model

**Participant** (JSONB union in Event):
- `UserParticipant`: `{ type: 'user', id: UUID, name?, email?, avatar?, contributionTarget? }`
- `GuestParticipant`: `{ type: 'guest', id: string, name: string, contributionTarget? }`
- `PotParticipant`: `{ type: 'pot', id: '0' }` — shared expenses (amber UI), no target

`contributionTarget` is what each participant is expected to put in; the *pending* KPI is
`netContribution - contributionTarget` per participant. Dropping it when building a participant silently
zeroes that KPI.

**Event:** id, title, description?, icon?, status (`active` | `archived`), participants (JSONB), timestamps

**Transaction:** id, title, paymentType (`contribution` | `expense` | `compensation`), amount (decimal 10,2), participantId, date, eventId (FK), timestamps

## GitHub Workflow

Repository: `MrClit/friends-web`

Any GitHub operation — issues, project board, branches, commits, PRs, merges, releases — goes
through the `gh-workflow` skill (and the `release` skill for production releases). Delegate the
execution to the `gh-ops` agent.

This repo's coordinates — board ids, branch model, labels, validation command, release pre-flight —
live in [`.claude/gh-project.md`](.claude/gh-project.md). It is the single source of truth; do not
duplicate any of it here.

Those two skills and the agent are **user-level configuration, deliberately not vendored into this
repo** — they are generic and shared across several projects, while `gh-project.md` holds everything
specific to this one. If they are not available in the current environment, say so and stop: do not
improvise a GitHub flow, and do not commit, push, open or merge anything without them.

## Conventions

**Git commits:** `type(scope): description` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` — scopes: `frontend`, `backend`, `shared-types`, `ci`, `docs`, `a11y`

**Code language:** All comments, JSDoc, and type descriptions in English. i18n translation files stay in their own languages.

**Adding a feature:**
1. Create `src/features/{feature}/` with components, types, constants, `index.ts`
2. Add API methods in `src/api/`, hooks in `src/hooks/api/`, query keys in `keys.ts`
3. Add translations to `src/i18n/locales/{en,es,ca}/translation.json`

**Planning a feature.** Two separate artifacts, do not merge them:

- **The what and the why → the GitHub issue.** Motivation, behavior contract (happy path + edge cases),
  what is explicitly out of scope, open questions. This is human input; it cannot be derived from the code.
  Write it before planning — otherwise the plan is built on guesses.
- **The how → plan mode / the `Plan` agent, in session.** Task order, files to touch, test cases. Ephemeral
  and regenerated from the current code, so it never goes stale. Do not write it to a file.

`/docs` is **not** the folder for implementation plans. It holds only living reference documents — a design
that is still pending execution, or a runbook that is still valid. A doc that describes work already shipped
must be deleted, not archived: the code is the truth, and the issue plus its PR are the record. An agent
cannot tell a stale doc from a current one, so a wrong doc costs more than a missing one.

## Skills

Best-practice guides load **automatically** by description — there is no need to link or read them by
path from here: `nestjs-best-practices`, `vercel-react-best-practices`, `vercel-composition-patterns`,
`tailwind-css-patterns`, `tailwind-inline-cn`, `accessibility`, `typescript-advanced-types`, `vite`,
`vitest`.

Only the project-specific caveats belong in this file:

- **`vercel-react-best-practices`** — ignore its `server-*` rules (React Server Components, `use server`,
  Next.js data fetching). This frontend is a Vite SPA; those rules do not apply. Everything else
  (waterfalls, memoization, bundle size) does.
- **`tailwind-css-patterns`** is generic. Where it disagrees with **`tailwind-inline-cn`** — this repo's
  own `cn()` and class-ordering rules — `tailwind-inline-cn` wins.

Vendored skills live in `.agents/skills/` (tracked in `skills-lock.json`, updated by the skills CLI) and
are exposed to Claude Code through symlinks in `.claude/skills/`. Adding a vendored skill means adding
the symlink too, or it will not load — silently, with no error. Skills written for this repo live
directly in `.claude/skills/`.

`pnpm check:skills` (also run by `pnpm lint`) enforces that wiring: every vendored skill has a resolving
symlink, none is a real directory or dangling, `skills-lock.json` matches disk, and no two skills declare
the same frontmatter `name`. Re-running the skills CLI can undo it, so let the check tell you.
