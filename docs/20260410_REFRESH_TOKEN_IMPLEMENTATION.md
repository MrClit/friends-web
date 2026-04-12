# Refresh Token System — Implementation Plan

**Date:** 2026-04-10
**Status:** Planning
**Scope:** Backend (NestJS) + Frontend (React)

---

## Table of Contents

1. [Motivation and Objectives](#1-motivation-and-objectives)
2. [System Overview](#2-system-overview)
3. [Solution Design](#3-solution-design)
4. [Step-by-Step Implementation Plan](#4-step-by-step-implementation-plan)
5. [Relevant Files](#5-relevant-files)
6. [Verification and Testing](#6-verification-and-testing)
7. [Deployment Notes and Environment Variables](#7-deployment-notes-and-environment-variables)
8. [Decisions and Scope](#8-decisions-and-scope)

---

## 1. Motivation and Objectives

The current auth system issues a single JWT access token valid for **1 hour**. This has two problems:

- **No revocation**: once issued, a token cannot be invalidated before expiry (e.g., logout, compromised session).
- **UX gap**: users are silently logged out after 1 hour with no recovery path.

**Objectives:**

- Reduce access token lifetime to **15 minutes** (limits damage if a token is stolen).
- Issue a **refresh token** (30-day lifetime) that allows silent renewal of access tokens without re-authentication.
- Store refresh tokens **hashed in the DB** to enable real revocation.
- Transport the refresh token via **HttpOnly cookie** (not accessible to JavaScript → XSS-safe).
- Implement **refresh token rotation** (each use issues a new token, invalidating the previous one).
- Implement **family-based reuse detection**: if a previously-rotated token is used again, the entire login session is revoked (detects token theft).
- Add a **cron job** to clean up expired tokens from the DB.

---

## 2. System Overview

### Current flow

```
OAuth login → backend issues JWT (1h) → redirects to frontend with token in URL
Frontend stores token in localStorage → sends as Bearer on every request
Token expires → user must log in again manually
```

### New flow

```
OAuth login → backend issues:
  - access token (15 min) → in redirect URL param
  - refresh token (30 days) → in HttpOnly cookie (Path=/api/auth)

Frontend:
  - Stores access token in localStorage
  - Cookie is managed automatically by the browser

On 401 from API:
  - client.ts calls POST /api/auth/refresh (cookie sent automatically)
  - Backend rotates refresh token (old → revoked, new → issued)
  - Frontend retries original request with new access token
  - If refresh fails → dispatch 'auth:logout' event → user sees login screen

Logout:
  - Frontend calls POST /api/auth/logout (JWT + cookie)
  - Backend revokes refresh token + clears cookie
```

### Security model

| Threat                           | Mitigation                                                   |
| -------------------------------- | ------------------------------------------------------------ |
| XSS stealing access token        | Short expiry (15 min), limited blast radius                  |
| XSS stealing refresh token       | HttpOnly cookie — not accessible to JS                       |
| CSRF on /auth/refresh            | SameSite=Strict cookie + no state change on GET              |
| Refresh token theft              | Reuse detection: using a rotated token revokes entire family |
| Persistent sessions after logout | DB-backed storage — revocation is real                       |

---

## 3. Solution Design

### 3.1 Data model

New table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash   VARCHAR     NOT NULL,       -- SHA-256 of raw token, never stored raw
  family       UUID        NOT NULL,       -- groups tokens from the same login session
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,
  is_revoked   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON refresh_tokens (token_hash);
CREATE INDEX ON refresh_tokens (user_id);
CREATE INDEX ON refresh_tokens (family);
```

### 3.2 API contract

#### `POST /api/auth/refresh`

- No auth guard required
- Input: `refresh_token` cookie (HttpOnly, sent automatically by browser)
- Success `200`: `{ data: { accessToken: string } }` + new `refresh_token` cookie
- Failure `401`: expired, revoked, or missing token
- Implementation note: load user via a method that exists in `UsersService` (add `findByIdOrThrow` if needed)

#### `POST /api/auth/logout`

- Guard: `AuthGuard('jwt')`
- Input: `refresh_token` cookie (optional — logout proceeds even if missing)
- Success `200`: clears `refresh_token` cookie
- Side effect: marks refresh token as `is_revoked = true` in DB

### 3.3 Refresh token rotation + reuse detection

```
rotateRefreshToken(rawToken):
  hash = sha256(rawToken)
  entity = findByHash(hash)

  if not found:
    throw UnauthorizedException

  if entity.isRevoked OR entity.expiresAt < now():
    if entity.isRevoked:
      // Potential theft — revoke entire family
      revokeFamilyTokens(entity.family)
    throw UnauthorizedException

  // Valid — rotate
  entity.isRevoked = true
  save(entity)
  return issueRefreshToken(entity.userId, entity.family)  // same family
```

### 3.4 Frontend 401 interceptor (thundering herd prevention)

Multiple concurrent requests expiring at the same time must not trigger multiple parallel refresh calls:

```typescript
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise; // reuse in-flight refresh
  refreshPromise = fetch(`${ENV.API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => (r.ok ? r.json().then((b: { data: { accessToken: string } }) => b.data.accessToken) : null))
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
```

On 401 in `apiRequest`:

1. Call `refreshAccessToken()`
2. If returns token → `localStorage.setItem('token', newToken)` + retry request once
3. If returns `null` → `window.dispatchEvent(new Event('auth:logout'))`

---

## 4. Step-by-Step Implementation Plan

### Phase 1 — Backend: Entity + Migration

#### Step 1 — Create `RefreshToken` entity

**File:** `apps/backend/src/modules/auth/entities/refresh-token.entity.ts`

TypeORM entity with the fields described in section 3.1. Use `@Column({ name: 'token_hash' })`, `@Column({ name: 'user_id' })`, etc. to match the snake_case DB column names. Add `@Index()` on `tokenHash` and `@Index()` on `family`.

#### Step 2 — Create TypeORM migration

**File:** `apps/backend/src/migrations/<timestamp>-CreateRefreshTokensTable.ts`

Follow the raw SQL pattern of existing migrations (see `1705300000000-AddSoftDeleteToUsers.ts`). Implement `up` (create table + indexes) and `down` (drop table).

---

### Phase 2 — Backend: RefreshTokenService + Tests

#### Step 3 — Create `RefreshTokenService`

**File:** `apps/backend/src/modules/auth/services/refresh-token.service.ts`

Methods:

- `issueRefreshToken(userId: string, family?: string): Promise<{ rawToken: string; family: string }>` — generates `crypto.randomBytes(64).toString('hex')`, hashes with `crypto.createHash('sha256').update(raw).digest('hex')`, saves entity with `expiresAt = now + REFRESH_TOKEN_EXPIRATION_DAYS`, returns raw token + family UUID (new UUID if not provided)
- `rotateRefreshToken(rawToken: string): Promise<{ rawToken: string; userId: string }>` — see rotation logic in 3.3
- `revokeByRawToken(rawToken: string): Promise<void>` — finds entity by hash, marks `isRevoked = true` (no-op if not found)
- `revokeAllForUser(userId: string): Promise<void>` — marks all user's tokens as revoked
- `revokeFamilyTokens(family: string): Promise<void>` — marks all tokens in family as revoked
- `deleteExpiredTokens(): Promise<void>` — deletes rows where `expiresAt < now()`
- `cleanupExpiredTokens(): Promise<void>` — `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` decorated wrapper calling `deleteExpiredTokens()`

#### Step 4 — Unit tests for `RefreshTokenService`

**File:** `apps/backend/src/modules/auth/services/refresh-token.service.spec.ts`

Test cases (follow `auth.service.spec.ts` pattern — mock `Repository<RefreshToken>`):

- `issueRefreshToken` saves entity and returns raw token
- `rotateRefreshToken` with valid token: marks old as revoked, returns new raw token + userId
- `rotateRefreshToken` with revoked token (reuse): calls `revokeFamilyTokens` + throws `UnauthorizedException`
- `rotateRefreshToken` with expired token: throws `UnauthorizedException`
- `rotateRefreshToken` with unknown hash: throws `UnauthorizedException`
- `revokeByRawToken`: finds by hash and marks `isRevoked = true`
- `revokeFamilyTokens`: calls `update` where `family = X` setting `isRevoked = true`
- `deleteExpiredTokens`: calls `delete` where `expiresAt < now()`

---

### Phase 3 — Backend: Endpoints + Cookie

#### Step 5 — Modify `AuthService`

**File:** `apps/backend/src/modules/auth/auth.service.ts`

- Inject `RefreshTokenService`
- Add `generateAuthTokens(user: User): Promise<{ accessToken: string; refreshToken: string }>` — calls `generateJwt(user)` + `refreshTokenService.issueRefreshToken(user.id)`, returns both
- Keep `generateJwt` unchanged (used by tests and `/me` flow)
- Add `rotateRefreshToken(rawToken: string)` — delegates to `refreshTokenService.rotateRefreshToken`
- Add `revokeRefreshToken(rawToken: string)` — delegates to `refreshTokenService.revokeByRawToken`
- Use `JWT_EXPIRATION` from config for access token expiry (default `15m`) instead of hardcoding in module setup

#### Step 6 — Modify `AuthController`

**File:** `apps/backend/src/modules/auth/auth.controller.ts`

Changes to `redirectToFrontendWithToken`:

- Make async
- Call `authService.generateAuthTokens(user)` instead of `authService.generateJwt(user)`
- Set cookie: `res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/api/auth', maxAge: 30 * 24 * 60 * 60 * 1000 })`
- Rename URL param `token` → `access_token`
- Define cookie options once (helper/private method) and reuse in login + refresh + logout

New endpoint `POST /auth/refresh`:

```typescript
@Post('refresh')
async refresh(@Req() req: Request & { cookies: Record<string, string> }, @Res() res: express.Response) {
  const rawToken = req.cookies['refresh_token'];
  if (!rawToken) throw new UnauthorizedException();
  const { rawToken: newRawToken, userId } = await this.authService.rotateRefreshToken(rawToken);
  const user = await this.usersService.findByIdOrThrow(userId); // add method if needed
  const accessToken = this.authService.generateJwt(user);
  res.cookie('refresh_token', newRawToken, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/api/auth', maxAge: 30 * 24 * 60 * 60 * 1000 });
  return res.json({ data: { accessToken } });
}
```

New endpoint `POST /auth/logout`:

```typescript
@Post('logout')
@UseGuards(AuthGuard('jwt'))
async logout(@Req() req: Request & { cookies: Record<string, string> }, @Res() res: express.Response) {
  const rawToken = req.cookies['refresh_token'];
  if (rawToken) await this.authService.revokeRefreshToken(rawToken);
  res.clearCookie('refresh_token', { path: '/api/auth' });
  return res.json({ data: null });
}
```

#### Step 7 — Reduce access token lifetime

**File:** `apps/backend/src/modules/auth/auth.module.ts`

Read `JWT_EXPIRATION` from `ConfigService` in `JwtModule.registerAsync` and set default to `15m`.

Also update:

- `apps/backend/.env.example`
- `apps/backend/.env.test.example`

#### Step 8 — Enable cookie parsing + CORS credentials

**File:** `apps/backend/src/main.ts`

- Install `cookie-parser`: `pnpm --filter @friends/backend add cookie-parser` + `pnpm --filter @friends/backend add -D @types/cookie-parser`
- Add `app.use(cookieParser())` before `app.listen()`
- Ensure CORS config has `credentials: true` and `origin: process.env.CORS_ORIGIN`
- Keep `secure` cookie flag environment-aware (`NODE_ENV === 'production'`), otherwise local HTTP dev cookies will fail to set

#### Step 9 — Register entity + service in module

**File:** `apps/backend/src/modules/auth/auth.module.ts`

- Import `TypeOrmModule.forFeature([RefreshToken])` (add to `imports` array)
- Add `RefreshTokenService` to `providers`

#### Step 10 — Register ScheduleModule for cron cleanup

**File:** `apps/backend/src/app.module.ts`

- Add `ScheduleModule.forRoot()` to `imports` (package: `@nestjs/schedule` — already a NestJS ecosystem package, install if not present with `pnpm --filter @friends/backend add @nestjs/schedule`)

---

### Phase 4 — Frontend: 401 Interceptor

#### Step 11 — Add refresh + retry logic to `client.ts`

**File:** `apps/frontend/src/api/client.ts`

- Add module-level `refreshPromise` lock (see pattern in section 3.4)
- On 401 response: call `refreshAccessToken()`, on success retry the original request once with the new token, on failure dispatch `window.dispatchEvent(new Event('auth:logout'))`
- Prevent infinite loops: never auto-refresh when the failed request is `/auth/refresh`; mark retried requests to avoid retrying twice

#### Step 12 — Update `AuthContext.tsx`

**File:** `apps/frontend/src/features/auth/AuthContext.tsx`

- Add `useEffect` listening for `'auth:logout'` window event → call `logout()`
- Update `logout()` to call `POST /api/auth/logout` with `credentials: 'include'` (fire-and-forget, do not block the UX clearing)
- Remove the redundant `fetchUser(nextToken)` call inside `setAuth` (user data already arrives from OAuth callback URL params)
- Update auth-related test mocks that implement `AuthContextType` so required methods stay in sync

#### Step 13 — Update `AuthCallback.tsx`

**File:** `apps/frontend/src/pages/AuthCallback.tsx`

- Read `access_token` query param instead of `token`
- No other changes — refresh token is HttpOnly cookie, handled transparently by the browser

---

## 5. Relevant Files

### Backend

| File                                                                   | Change                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/backend/src/modules/auth/entities/refresh-token.entity.ts`       | NEW — TypeORM entity                                                 |
| `apps/backend/src/migrations/<timestamp>-CreateRefreshTokensTable.ts`  | NEW — DB migration                                                   |
| `apps/backend/src/modules/auth/services/refresh-token.service.ts`      | NEW — token lifecycle logic + cron                                   |
| `apps/backend/src/modules/auth/services/refresh-token.service.spec.ts` | NEW — unit tests                                                     |
| `apps/backend/src/modules/auth/auth.module.ts`                         | Add entity, service, TypeOrmModule.forFeature                        |
| `apps/backend/src/modules/auth/auth.service.ts`                        | Add `generateAuthTokens`, `rotateRefreshToken`, `revokeRefreshToken` |
| `apps/backend/src/modules/auth/auth.controller.ts`                     | Modify redirect; add `/refresh` + `/logout`                          |
| `apps/backend/src/modules/auth/auth.controller.spec.ts`                | Update redirect expectations (`access_token`) + cookie assertions    |
| `apps/backend/src/modules/auth/auth.service.spec.ts`                   | Update/add tests for token pair generation and refresh delegation    |
| `apps/backend/src/main.ts`                                             | Add `cookie-parser` middleware                                       |
| `apps/backend/src/app.module.ts`                                       | Register `ScheduleModule.forRoot()`                                  |
| `apps/backend/.env.example`                                            | Add `REFRESH_TOKEN_EXPIRATION_DAYS`                                  |
| `apps/backend/.env.test.example`                                       | Add `REFRESH_TOKEN_EXPIRATION_DAYS`; set `JWT_EXPIRATION=15m`        |

### Frontend

| File                                              | Change                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/frontend/src/api/client.ts`                 | Add refresh lock + 401 interceptor                                    |
| `apps/frontend/src/features/auth/AuthContext.tsx` | `auth:logout` listener, logout API call, remove redundant `fetchUser` |
| `apps/frontend/src/pages/AuthCallback.tsx`        | Read `access_token` param instead of `token`                          |
| `apps/frontend/src/features/auth/**/*.test.tsx`   | Keep `AuthContextType` mocks aligned with context contract            |

---

## 6. Verification and Testing

1. Run migration: `pnpm --filter @friends/backend migration:run`
2. **Login flow**: complete OAuth login → verify in browser DevTools that `refresh_token` cookie is set as HttpOnly with `Path=/api/auth` → decode access token from localStorage and confirm `exp` is ~15 min from now
3. **Silent refresh**: wait for access token expiry (or manually set a short expiry in dev) → make any API call → verify no login redirect, 401 is intercepted, new access token in localStorage, request retried transparently
4. **Reuse detection**: capture a refresh token before rotation; use it after it has been rotated → expect `401` response + verify all tokens from that family have `is_revoked = true` in DB
5. **Logout**: click logout → verify `refresh_token` cookie is cleared → verify token row has `is_revoked = true` in DB → verify subsequent API calls return 401
6. **Cron job**: check application logs at midnight or trigger manually in dev → verify rows with `expires_at < now()` are deleted from `refresh_tokens`
7. **Unit tests**: `pnpm --filter @friends/backend test` — all existing tests pass + new `refresh-token.service.spec.ts` tests pass

---

## 7. Deployment Notes and Environment Variables

### New env vars

| Variable                        | Example | Description                      |
| ------------------------------- | ------- | -------------------------------- |
| `REFRESH_TOKEN_EXPIRATION_DAYS` | `30`    | Refresh token validity in days   |
| `JWT_EXPIRATION`                | `15m`   | Access token lifetime (was `1h`) |

### Cookie runtime behavior

- `httpOnly: true` always
- `secure: NODE_ENV === 'production'`
- `sameSite: 'strict'`
- `path: '/api/auth'`

> Update `.env.example`, `.env.test.example`, and all deployment environment configs (Render, Neon, etc.).

### Cookie requirements in production

- The backend must be served over **HTTPS** for the `Secure` cookie attribute to work.
- If the frontend and backend are on different subdomains, the cookie `Domain` attribute may need to be set explicitly.
- `SameSite=Strict` means the refresh cookie will not be sent on cross-site navigations — appropriate since `/api/auth/refresh` is always called programmatically, never via direct navigation.

### Migration

Run `pnpm --filter @friends/backend migration:run` as part of the deployment pipeline before starting the new backend version.

---

## 8. Decisions and Scope

| Decision               | Choice                             | Rationale                                                               |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Refresh token storage  | DB-backed (hashed)                 | Enables real revocation; stateless JWT refresh tokens cannot be revoked |
| Transport              | HttpOnly cookie (`Path=/api/auth`) | Not accessible to JS → XSS-safe; scoped path limits exposure            |
| Rotation strategy      | Per-use                            | Every refresh issues a new token; previous is immediately invalidated   |
| Reuse detection        | Family-based                       | Any reuse of a rotated token revokes the entire login session           |
| Access token lifetime  | 15 minutes                         | Industry standard for apps with refresh tokens                          |
| Refresh token lifetime | 30 days                            | Balances UX (long sessions) and security (bounded exposure)             |
| Frontend token storage | localStorage (access token only)   | Acceptable given short expiry; refresh token in HttpOnly cookie         |

### Out of scope

- "Remember me" toggle (different expiry per device)
- Multi-device session management UI
- Refresh token expiry extension on activity
- WebSocket authentication
- `revokeAllForUser` endpoint (admin or "logout all devices" UI)
