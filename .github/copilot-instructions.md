# Friends - AI Coding Agent Instructions

> Expense sharing platform • React 19 + NestJS + PostgreSQL • pnpm monorepo

---

## Monorepo Structure

- `@friends/frontend` → `apps/frontend/` — React 19 + TanStack Query + Zustand
- `@friends/backend` → `apps/backend/` — NestJS + TypeORM + PostgreSQL
- `@friends/shared-types` → `packages/shared-types/` — Shared TypeScript types

**Package Manager:** pnpm (workspaces in `apps/*` and `packages/*`)

```bash
pnpm install                              # Install all
pnpm dev:frontend                         # Frontend (localhost:5173)
pnpm dev:backend                          # Backend (localhost:3000)
pnpm --filter @friends/frontend test      # Frontend tests (Vitest)
pnpm --filter @friends/backend test       # Backend tests (Jest)
pnpm -r build                             # Build all
```

---

## Frontend (`apps/frontend/`)

**Stack:** React 19 • TypeScript • Vite • TanStack Query • Zustand • TailwindCSS v4 (`@tailwindcss/vite`) • React Router 7 (HashRouter) • i18next • react-hot-toast

### Architecture

**Feature-based structure:**

```
src/features/{feature}/  → components/, types.ts, constants.ts, index.ts
src/api/                 → client.ts, events.api.ts, transactions.api.ts, users.api.ts, admin-users.api.ts
src/hooks/api/           → useEvents.ts, useTransactions.ts, useUsers.ts, useAdminUsers.ts, useEventKPIs.ts, keys.ts
src/shared/store/        → useThemeStore, useEventFormModalStore, useTransactionModalStore, useToastStore, useDeletingStore
src/pages/               → Home, EventDetail, KPIDetail, LoginPage, AuthCallback, AdminUsersPage, NotFound
src/i18n/locales/        → es/ (default), en/, ca/
src/config/env.ts        → Validated env vars (VITE_API_URL, VITE_ENABLE_DEVTOOLS, etc.)
```

**Features:** `events`, `transactions`, `kpi`, `auth`, `admin-users`

### Key Conventions

- **Named exports only** — never use `export default`. Barrel files: `export { X } from './X'`
- `React.memo` → `export const Foo = memo(function Foo() { ... })`
- `React.lazy` → `lazy(() => import('./Foo').then(m => ({ default: m.Foo })))`
- **Server state:** TanStack Query hooks in `src/hooks/api/` with centralized query keys (`keys.ts`)
- **UI state:** Zustand stores for modals, theme, toast, delete loading state
- **API client:** `src/api/client.ts` — unwraps `{ data: T }` responses automatically
- **Styling:** `cn()` helper from `@/lib/utils`, dark mode via `useThemeStore`, teal primary
- **Semantic colors:** blue=contributions, red/rose=expenses, green/emerald=compensations, amber/orange=pot

### Routes

- `/login`, `/auth/callback` — Auth flow (Google OAuth)
- `/` — Home (protected)
- `/event/:id` — Event detail (protected)
- `/event/:id/kpi/:kpi` — KPI drill-down (protected)
- `/admin/users` — Admin user management (protected, ADMIN role)

### i18n

- Languages: `es` (default), `en`, `ca`
- Key pattern: `feature.context.key` (e.g., `events.form.title`)
- Formatting: `formatAmount(amount, 'EUR')`, `formatDateLong(date)`

### Testing

- **Vitest + Testing Library** — co-located tests (`*.test.ts` next to source)
- Setup: `src/test/setup.ts`
- Run: `pnpm test` (watch), `pnpm test:run` (CI), `pnpm test:coverage`

---

## Backend (`apps/backend/`)

**Stack:** NestJS • TypeORM • PostgreSQL • Swagger • JWT + Google OAuth

### Architecture

```
src/modules/{module}/  → controller, service, module, entities/, dto/
src/common/            → filters (HttpExceptionFilter), interceptors (TransformInterceptor), decorators (@ApiStandardResponse, @CurrentUser)
src/config/            → database.config.ts, app.config.ts
```

**Modules:** `auth`, `events`, `transactions`, `users`, `admin`

### Global Behavior

- **API prefix:** `/api` — Swagger at `/api/docs`
- **Response format:** All responses wrapped as `{ data: T }` via `TransformInterceptor`
- **Validation:** Global `ValidationPipe` (`whitelist: true`, `transform: true`)
- **Auth:** Google OAuth → JWT. Guards: `JwtStrategy`, `GoogleStrategy`, `RolesGuard` + `@Roles()` decorator
- **User decorator:** `@CurrentUser()` extracts authenticated user from request

### Key Patterns

- Controllers: HTTP layer only (routing, validation, Swagger decorators)
- Services: Business logic, use NestJS exceptions (`NotFoundException`, `BadRequestException`)
- DTOs: `class-validator` decorators (`@IsString`, `@ValidateNested`, etc.)
- Swagger: `@ApiOperation`, `@ApiStandardResponse(status, description, type, isArray?)`
- User entity supports **soft deletes** (`@DeleteDateColumn`)

### Database

- **Config:** `src/config/database.config.ts` (env-based via `ConfigService`)
- **Migrations:** `migration:generate`, `migration:run`, `migration:revert`, `migration:run:prod`
- **Docker:** `docker-compose up -d` from `apps/backend/`

### Testing

- **Jest** with three configs: `test/jest.unit.json`, `test/jest.integration.json`, `test/jest.e2e.json`

---

## Domain Model

**Participant types** (union, JSONB in Event entity):

- `UserParticipant`: `{ type: 'user', id: UUID, name?, email?, avatar? }`
- `GuestParticipant`: `{ type: 'guest', id: string, name: string }`
- `PotParticipant`: `{ type: 'pot', id: '0' }` — shared expenses (orange/amber UI)

**Event:** `id`, `title`, `description?`, `icon?`, `status` (active | archived), `participants` (JSONB), `createdAt`, `updatedAt`

**Transaction:** `id`, `title`, `paymentType` (contribution | expense | compensation), `amount` (decimal 10,2), `participantId`, `date`, `eventId` (FK), `createdAt`, `updatedAt`

**Transaction type colors:** contribution=blue, expense=rose, compensation=emerald, pot=amber

---

## Conventions

**Git commits:** `type(scope): description` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` — scopes: `frontend`, `backend`, `shared-types`, `ci`

**Code language:** All comments, docs, JSDoc, and type descriptions in **English**. Exception: i18n translation files stay in their respective languages.

**Adding a feature:**

1. Create `src/features/{feature}/` with components, types, constants, `index.ts`
2. Add API methods in `src/api/`, hooks in `src/hooks/api/`, query keys in `keys.ts`
3. Add translations to `src/i18n/locales/{en,es,ca}/translation.json`

### Implementation Plans (`/docs`)

When generating an implementation plan for multi-file features/refactors, the doc must include:

1. Table of Contents
2. Motivation and Objectives
3. System Overview and Requirements
4. Solution Design (flow, structure, data models, API contracts, security, error handling)
5. External Configuration and Prerequisites
6. Step-by-Step Implementation Plan (ordered, atomic tasks)
7. Detailed Checklist
8. Testing and Validation (test cases, mocks, acceptance criteria)
9. Deployment Notes and Environment Variables
10. References and Resources
11. Improvements and Lessons Learned

The plan must be self-contained with enough detail for any developer or LLM to implement without ambiguity.

---

**Last Updated:** March 10, 2026
**Status:** Frontend ✅ Active • Backend ✅ Active
