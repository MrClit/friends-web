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
src/features/{feature}/   components/, types.ts, constants.ts, index.ts
src/api/                  client.ts + per-entity modules (events.api.ts, etc.)
src/hooks/api/            TanStack Query hooks + centralized keys.ts
src/shared/store/         Zustand stores (theme, modals, toast, delete state)
src/pages/                Route-level components
src/i18n/locales/         es/ (default), en/, ca/
src/config/env.ts         Validated env vars via VITE_ prefix
```

Features: `events`, `transactions`, `kpi`, `auth`, `admin-users`

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
- Semantic colors: blue=contributions, rose=expenses, emerald=compensations, amber=pot

### Routes

- `/login`, `/auth/callback` — OAuth flow
- `/` — Home (event list, protected)
- `/event/:id` — Event detail (protected)
- `/event/:id/kpi/:kpi` — KPI drill-down (protected)
- `/admin/users` — Admin user management (protected, ADMIN role)

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
- User entity uses soft deletes (`@DeleteDateColumn`)
- Cascade delete: transactions deleted when parent event is deleted

## Domain Model

**Participant** (JSONB union in Event):
- `UserParticipant`: `{ type: 'user', id: UUID, name?, email?, avatar? }`
- `GuestParticipant`: `{ type: 'guest', id: string, name: string }`
- `PotParticipant`: `{ type: 'pot', id: '0' }` — shared expenses (amber UI)

**Event:** id, title, description?, icon?, status (`active` | `archived`), participants (JSONB), timestamps

**Transaction:** id, title, paymentType (`contribution` | `expense` | `compensation`), amount (decimal 10,2), participantId, date, eventId (FK), timestamps

## Conventions

**Git commits:** `type(scope): description` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` — scopes: `frontend`, `backend`, `shared-types`, `ci`

**Code language:** All comments, JSDoc, and type descriptions in English. i18n translation files stay in their own languages.

**Adding a feature:**
1. Create `src/features/{feature}/` with components, types, constants, `index.ts`
2. Add API methods in `src/api/`, hooks in `src/hooks/api/`, query keys in `keys.ts`
3. Add translations to `src/i18n/locales/{en,es,ca}/translation.json`

**Implementation plans** for multi-file features go in `/docs` and must be self-contained (motivation, design, ordered tasks, test cases, env vars).
