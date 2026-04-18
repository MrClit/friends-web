# Project Improvement Analysis

**Date:** 2026-04-17  
**Scope:** Full monorepo — Frontend (React 19) + Backend (NestJS) + Shared Architecture  
**Total issues found:** 43 (15 High · 17 Medium · 11 Low)

---

## FRONTEND

### HIGH PRIORITY

#### FE-H1 — Token exposure in auth callback URL
**File:** `apps/frontend/src/pages/AuthCallback.tsx`  
JWT access token and user data (email, name, avatar, role) are passed as URL query parameters. Exposed in browser history, server logs, and referrer headers.  
**Fix:** Use hash-based communication or POST-only redirects. Move sensitive data to session storage only after verifying origin.

#### FE-H2 — Token storage without CSRF protection
**Files:** `apps/frontend/src/features/auth/AuthContext.tsx`, `apps/frontend/src/api/client.ts`  
Access tokens in localStorage with no CSRF mechanism. Authorization header injected manually but no state token validation.  
**Fix:** Consider HttpOnly cookies for refresh tokens; add CSRF token on state-changing requests.

#### FE-H3 — Incomplete UI state cleanup on forced logout
**File:** `apps/frontend/src/api/client.ts` (token refresh failure path)  
On 401, a global logout event fires but Zustand modal/form stores are not cleared. Users can see stale UI state.  
**Fix:** Subscribe all UI stores to the logout event and reset their state.

#### FE-H4 — Transaction amount input broken for decimals
**File:** `apps/frontend/src/features/transactions/components/TransactionForm.tsx`  
`step="1"` on the amount input blocks entering cents (e.g. 0.50 €). No min/max validation.  
**Fix:** Set `step="0.01"`, add `min="0.01"`, validate parsed value > 0 before submit.

#### FE-H5 — Missing ARIA labels and semantic HTML in forms
**Files:** Form components across `features/transactions/` and `features/events/`  
Date inputs lack `aria-label`, currency symbols are not associated with their input, modals missing `role="dialog"` and `aria-modal="true"`.  
**Fix:** Audit all forms; add ARIA attributes and proper `<label htmlFor>` associations.

---

### MEDIUM PRIORITY

#### FE-M1 — No React.memo on EventCard (unnecessary re-renders)
**File:** `apps/frontend/src/features/events/components/EventsList.tsx`  
EventCard components re-render on every parent update. No virtualization for long lists.  
**Fix:** Wrap `EventCard` in `React.memo`; add `@tanstack/react-virtual` for lists > 50 items.

#### FE-M2 — Multiple sources of truth for event state
**Files:** `src/hooks/api/useEvents.ts`, `src/shared/store/useEventFormModalStore.ts`, `src/shared/store/useDeletingStore.ts`  
Event data split between TanStack Query cache and Zustand stores. Risk of stale/inconsistent UI.  
**Fix:** TanStack Query is the single source of truth; Zustand stores should only hold UI flags (open/closing), never entity data.

#### FE-M3 — Incomplete i18n coverage
**File:** `apps/frontend/src/i18n/`  
Error messages hardcoded in English; several component labels lack `t()` wrappers. Catalog not exhaustive across `en/`, `ca/`.  
**Fix:** Audit all components with `grep -r '"[A-Z]' src/features`; wrap in `t()`, add missing keys to all locale files.

#### FE-M4 — Critical paths lack test coverage
Missing tests for: token refresh failure, forced logout race condition, EventDetail error states, TransactionForm decimal validation, theme persistence.  
**Fix:** Target 70 %+ coverage for `auth`, `events`, `transactions` hooks and their forms.

#### FE-M5 — Generic API errors shown to users
**File:** `apps/frontend/src/api/client.ts`  
Raw backend error messages surface in the UI. No error code → user-friendly message mapping.  
**Fix:** Add an `errorMessages` i18n map keyed by HTTP status/code; fallback to generic message.

#### FE-M6 — No validation requiring at least one user participant
**File:** `apps/frontend/src/features/events/components/ParticipantsCombobox.tsx`  
All-guest events are allowed by the form. Backend reconciliation will fail silently.  
**Fix:** Add client-side validation: event must have ≥ 1 `UserParticipant`.

#### FE-M7 — Language not ready on direct hash URL access
**File:** `apps/frontend/src/i18n/index.ts`  
Language detector (localStorage + navigator) may resolve after first render on deep links, causing flash of untranslated content.  
**Fix:** Await `i18n.init()` before rendering the router tree (suspense boundary or explicit await in `main.tsx`).

---

### LOW PRIORITY

#### FE-L1 — `unknown` cast masking type errors
**File:** `apps/frontend/src/features/transactions/components/TransactionModal.tsx`  
`(e as unknown as React.FormEvent)` bypasses TypeScript safety.  
**Fix:** Type event handlers correctly at the point of definition.

#### FE-L2 — No TanStack Query devtools in development
**File:** `apps/frontend/src/lib/queryClient.ts`  
`@tanstack/react-query-devtools` not wired up, making cache debugging harder.  
**Fix:** Add `<ReactQueryDevtools />` inside a `if (import.meta.env.DEV)` guard in `App.tsx`.

#### FE-L3 — Env validation skipped outside DEV mode
**File:** `apps/frontend/src/config/env.ts`  
Required `VITE_*` vars only validated in development; silent failures possible in CI previews.  
**Fix:** Run full validation regardless of `NODE_ENV`.

#### FE-L4 — Avatar URLs not domain-whitelisted
**File:** `apps/frontend/src/shared/components/Avatar.tsx`  
Avatar `src` URLs from OAuth providers used directly with no origin check.  
**Fix:** Validate URLs match an allowlist (e.g. `*.googleusercontent.com`, `*.githubusercontent.com`).

#### FE-L5 — Missing React Query devtools + bundle analysis
No bundle size monitoring. No `vite-bundle-visualizer` or similar configured.  
**Fix:** Add `rollup-plugin-visualizer` to Vite config for periodic audits.

---

## BACKEND

### HIGH PRIORITY

#### BE-H1 — Soft-deleted users can still authenticate
**File:** `apps/backend/src/modules/auth/strategies/jwt/jwt.strategy.ts`  
JWT strategy validates the token signature but does not check `deletedAt IS NULL`. Soft-deleted users retain access indefinitely.  
**Fix:** Add `WHERE deletedAt IS NULL` (or TypeORM `withDeleted: false`) in the user lookup inside the strategy.

#### BE-H2 — Transaction type not validated against participant role
**File:** `apps/backend/src/modules/transactions/services/participant-validation.service.ts`  
Participant existence is checked, but not whether the participant type (guest / pot) is compatible with the payment type (compensation, contribution, etc.).  
**Fix:** Add a matrix validation: e.g. `GuestParticipant` cannot be payer of a `compensation`.

#### BE-H3 — Transactions deleted permanently (no audit trail)
**File:** `apps/backend/src/modules/transactions/entities/transaction.entity.ts`  
Events use soft delete (`@DeleteDateColumn`) but transactions are hard-deleted. No recovery path.  
**Fix:** Add `@DeleteDateColumn() deletedAt` to `Transaction` entity; update service to use `softDelete`.

#### BE-H4 — N+1 query in event listing
**File:** `apps/backend/src/modules/events/services/event-participants.service.ts`  
`enrichParticipantsWithUserData` is called once per event in `findAll`. For 100 events each with unique users, this produces N separate user queries.  
**Fix:** Collect all referenced user IDs across all events, fetch them in one `WHERE id IN (...)` query, then map back.

#### BE-H5 — Floating-point precision in KPI calculations
**File:** `apps/backend/src/modules/events/services/event-kpis.service.ts`  
`decimal(10,2)` values are cast to JavaScript `number` before arithmetic. Rounding errors accumulate in reconciliation.  
**Fix:** Use `Decimal.js` (or store amounts as integer cents) for all financial arithmetic.

#### BE-H6 — Loose `any[]` participant validation in DTO
**File:** `apps/backend/src/modules/events/dto/create-event.dto.ts`  
`participants: any[]` defers all shape validation to the service layer. Invalid payloads reach business logic.  
**Fix:** Create `EventParticipantDto` union with `@IsIn(['user','guest','pot'])` discriminator and strict field validation.

#### BE-H7 — Information leak via inconsistent 404 messages
**File:** `apps/backend/src/modules/transactions/transactions.service.ts`  
When authorization fails on a transaction, a generic 404 is returned instead of a consistent 403, allowing callers to probe which event IDs exist.  
**Fix:** Return `403 Forbidden` for known-but-unauthorized resources; reserve `404` for truly non-existent ones.

---

### MEDIUM PRIORITY

#### BE-M1 — Config values not schema-validated
**File:** `apps/backend/src/config/app.config.ts`  
`configService.get<number>()` calls have no Joi/Zod schema. `JWT_SECRET` absence causes a runtime crash rather than a startup error with a clear message.  
**Fix:** Add a `Joi.object({...}).unknown(false)` validation schema to `ConfigModule`.

#### BE-M2 — Insufficient error context in logs
**File:** `apps/backend/src/modules/transactions/transactions.service.ts`  
Error logs capture message + stack but not the request context (event ID, user ID, input payload).  
**Fix:** Add a request-scoped logger that injects correlation IDs and relevant entity IDs.

#### BE-M3 — Missing database indexes
No migrations add indexes on hot query paths:
- `transactions(event_id, date)` — for paginated transaction lists
- `events(status, created_at)` — for filtered event listing
- `users(deleted_at)` — for soft-delete queries
- `events.participants` (GIN) — for JSONB participant lookups

**Fix:** Add a migration with these indexes.

#### BE-M4 — Swagger docs incomplete
**File:** `apps/backend/src/main.ts`  
Many endpoints lack `@ApiResponse` decorators for error codes. Request/response examples absent.  
**Fix:** Add `@ApiResponse({ status: 400, ... })` and `@ApiResponse({ status: 403, ... })` for all CRUD endpoints.

#### BE-M5 — No rate limiting on auth or write endpoints
No `@nestjs/throttler` guard. Auth endpoints are open to credential spraying; transaction creation open to spam.  
**Fix:** Install `@nestjs/throttler`, apply `ThrottlerGuard` globally with stricter limits on `/api/auth/*`.

#### BE-M6 — Refresh token rotation without max-rotation limit
**File:** `apps/backend/src/modules/auth/services/refresh-token.service.ts`  
Tokens can be rotated indefinitely with no upper bound, so a stolen refresh token never expires.  
**Fix:** Track `rotationCount`; reject and revoke once it exceeds a configurable threshold (e.g. 100).

#### BE-M7 — Missing integration tests for auth flows
No test covers: OAuth callback end-to-end, refresh token rotation race condition, soft-delete + JWT access, admin role escalation attempt.  
**Fix:** Add Jest integration tests using `test/jest.integration.json` for these paths.

---

### LOW PRIORITY

#### BE-L1 — Spanish string in English codebase
**File:** `apps/backend/src/modules/auth/services/oauth-provider.service.ts`  
Error message `"No autorizado"` mixed in with English code.  
**Fix:** Replace with `"Unauthorized"`.

#### BE-L2 — Inconsistent `{ data: null }` on 204 responses
**File:** `apps/backend/src/common/interceptors/transform.interceptor.ts`  
204 No Content responses still pass through the `{ data: T }` wrapper, producing `{ data: null }`.  
**Fix:** Return an empty body (no JSON) on 204; document this in the API contract.

#### BE-L3 — No secret management strategy
OAuth client secrets and JWT secrets live only in `.env`. No guidance on rotation or production storage.  
**Fix:** Document use of AWS Secrets Manager / 1Password Secrets Automation for production deployments.

#### BE-L4 — Unused import comments in DTOs
**File:** `apps/backend/src/modules/events/dto/create-event.dto.ts`  
Comments like `// participant DTO types validation deferred` indicate stale code.  
**Fix:** Remove dead comments; leave no TODO without a linked issue.

---

## SHARED / ARCHITECTURE

### HIGH PRIORITY

#### ARCH-H1 — Enum types duplicated between frontend and backend
`PaymentType` and `EventStatus` enums are defined independently in `packages/shared-types/`, backend entities, and frontend constants.  
**Fix:** Establish `packages/shared-types/` as the single source; re-export from there in both apps. Or generate types from the OpenAPI spec.

#### ARCH-H2 — `packages/shared-types/` is minimal / underused
The monorepo has a `shared-types` package but it's not consistently consumed. Frontend API types and backend DTOs drift apart.  
**Fix:** Move all cross-boundary types (participant shapes, payment types, event status, pagination) to `@friends/shared-types` and import from there.

#### ARCH-H3 — No deployment documentation
Docker Compose exists for local DB only. No guide for production: environment setup, migration step, secrets injection.  
**Fix:** Add `docs/DEPLOYMENT.md` covering Docker, env vars, DB migrations, and rollback procedure.

---

### MEDIUM PRIORITY

#### ARCH-M1 — Backend tests not in CI deploy pipeline
**File:** `.github/workflows/deploy.yml`  
Frontend tests run pre-deploy; backend tests only triggered manually.  
**Fix:** Add a backend test job (with `services: postgres`) that must pass before deploy.

#### ARCH-M2 — No pre-commit lint/format hooks
Linting errors only caught in CI, not locally.  
**Fix:** Add `husky` + `lint-staged` running `pnpm lint` and `pnpm format` on staged files.

#### ARCH-M3 — No `.env.local` schema validation
Invalid or missing env vars fail silently until a component first uses them.  
**Fix:** Add a `pnpm check:env` script (Zod/Joi) run in the `prepare` hook.

---

### LOW PRIORITY

#### ARCH-L1 — Root README is sparse
New contributors lack architecture overview, local setup instructions, and ADR links.  
**Fix:** Write a root `README.md` with an architecture diagram, local setup steps, and links to `docs/`.

#### ARCH-L2 — No automated dependency updates
No Dependabot or Renovate configured. Security patches go unnoticed.  
**Fix:** Enable Dependabot for `npm` in `.github/dependabot.yml` with weekly schedule.

---

## Summary

| Area | High | Medium | Low | Total |
|------|------|--------|-----|-------|
| Frontend | 5 | 7 | 5 | 17 |
| Backend | 7 | 7 | 4 | 18 |
| Shared / Arch | 3 | 3 | 2 | 8 |
| **Total** | **15** | **17** | **11** | **43** |

## Recommended action order

1. **Now** — FE-H1 (token in URL) + BE-H1 (soft-deleted users can auth) — both are security issues requiring minimal code change.
2. **This sprint** — BE-H3 (transaction soft delete), BE-H4 (N+1 fix), BE-H5 (decimal precision), FE-H4 (amount input), ARCH-H1 (shared enums).
3. **Next sprint** — Rate limiting (BE-M5), database indexes (BE-M3), i18n audit (FE-M3), state-of-truth consolidation (FE-M2).
4. **Backlog** — CI/CD improvements, Dependabot, README, Swagger completion, devtools.
