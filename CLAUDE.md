# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Friends is an expense-sharing platform for group events. pnpm monorepo with:
- `@friends/frontend` → `apps/frontend/` — React 19 + TanStack Query + Zustand
- `@friends/backend` → `apps/backend/` — NestJS + TypeORM + PostgreSQL
- `@friends/shared-types` → `packages/shared-types/` — Shared TypeScript types

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

# Backend tests (Jest)
pnpm --filter @friends/backend test         # watch
pnpm --filter @friends/backend test:run     # CI
pnpm --filter @friends/backend check:backend  # lint + all tests

# Backend DB
cd apps/backend && docker-compose up -d     # start PostgreSQL
pnpm --filter @friends/backend migration:run
```

Backend has three Jest configs: `test/jest.unit.json`, `test/jest.integration.json`, `test/jest.e2e.json`.

## Frontend Architecture

**Stack:** React 19 · TypeScript · Vite · TanStack Query · Zustand · TailwindCSS v4 · React Router 7 (HashRouter) · i18next

### Feature structure

```
src/features/{feature}/   components/, types.ts, constants.ts, index.ts (hooks/ optional)
src/api/                  client.ts, types.ts + per-entity modules (events.api.ts, transactions.api.ts, users.api.ts, admin-users.api.ts)
src/hooks/api/            TanStack Query hooks + centralized keys.ts
src/shared/store/         Zustand stores (theme, modals, toast, delete state)
src/pages/                Route-level components
src/i18n/locales/         es/ (default), en/, ca/
src/config/env.ts         Validated env vars via VITE_ prefix
```

Features: `events`, `transactions`, `kpi`, `auth`, `admin-users`, `profile`

### State management layers

1. **Server state:** TanStack Query hooks in `src/hooks/api/` with keys from `keys.ts`
2. **UI/modal state:** Zustand stores (`useEventFormModalStore`, `useTransactionModalStore`, etc.)
3. **Global state:** `useThemeStore` (dark mode only)

### API client

`src/api/client.ts` — custom fetch wrapper that auto-unwraps `{ data: T }` responses, handles JWT refresh, and throws `ApiError` with status info.

### Key conventions

- **Named exports only** — never `export default`. Barrel files use `export { X } from './X'`
- `React.memo` → `export const Foo = memo(function Foo() { ... })`
- `React.lazy` → `lazy(() => import('./Foo').then(m => ({ default: m.Foo })))`
- `cn()` helper from `@/shared/utils` for conditional Tailwind classes (clsx + tailwind-merge); use when a `className` has 8+ utilities or mixes state/theme/responsive variants
- Tailwind class order: layout → spacing → typography → visual → interaction → state/theme → responsive
- Full className rules and the refactor procedure live in the `tailwind-inline-cn` skill
- Semantic colors: blue=contributions, rose=expenses, emerald=compensations, amber=pot

### Routes

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
src/modules/{module}/   controller.ts, service.ts, module.ts, entities/, dto/
src/common/             HttpExceptionFilter, TransformInterceptor, @CurrentUser(), @ApiStandardResponse()
src/config/             database.config.ts, app.config.ts
src/migrations/         TypeORM migration files
```

Modules: `auth`, `events`, `transactions`, `users`, `admin`

### Global behavior

- API prefix: `/api` — Swagger at `/api/docs`
- All responses wrapped as `{ data: T }` via `TransformInterceptor`
- Global `ValidationPipe` with `whitelist: true`, `transform: true`
- `@CurrentUser()` decorator extracts authenticated user from JWT
- `RolesGuard` + `@Roles()` for role-based access

### Patterns

- Controllers handle HTTP only (routing, validation, Swagger decorators)
- Services own business logic; throw NestJS exceptions (`NotFoundException`, etc.)
- DTOs use `class-validator` decorators
- Swagger: `@ApiOperation` + `@ApiStandardResponse(status, description, type, isArray?)`
- User entity uses soft deletes (`@DeleteDateColumn`)
- Cascade delete: transactions deleted when parent event is deleted

### Database

Config in `src/config/database.config.ts` (env-based via `ConfigService`). Migration scripts:
`migration:generate`, `migration:run` (local), `migration:run:prod` (runs against `dist/`, executed on
production boot), `migration:revert`.

## Domain Model

**Participant** (JSONB union in Event):
- `UserParticipant`: `{ type: 'user', id: UUID, name?, email?, avatar? }`
- `GuestParticipant`: `{ type: 'guest', id: string, name: string }`
- `PotParticipant`: `{ type: 'pot', id: '0' }` — shared expenses (amber UI)

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

**Git commits:** `type(scope): description` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` — scopes: `frontend`, `backend`, `shared-types`, `ci`

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
the symlink too, or it will not load. Skills written for this repo live directly in `.claude/skills/`.
