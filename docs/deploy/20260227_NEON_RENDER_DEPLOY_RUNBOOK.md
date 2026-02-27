# Neon + Render Deploy Runbook (Backend)

**Date:** 2026-02-27  
**Scope:** Deploy backend from `main` using TypeORM migrations against Neon PostgreSQL.

---

## 1. Objective

Standardize production deployments so schema changes are applied via versioned TypeORM migrations (`migration:run:prod`) before starting the NestJS app in Render.

---

## 2. Prerequisites

- Migrations are committed under `apps/backend/src/migrations/`.
- Backend build is green locally/CI.
- Render service is already connected to repository and branch.
- Neon production database is reachable from Render.
- `TYPEORM_SYNC=false` in production.

---

## 3. Required Render Configuration

### 3.1 Build & Start Commands

- **Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm --filter @friends/backend build
```

- **Start Command:**

```bash
pnpm --filter @friends/backend start:prod:migrate
```

`start:prod:migrate` executes:

1. `migration:run:prod` (uses `dist/data-source.js`)
2. `node dist/main`

### 3.2 Environment Variables (Render)

Minimum required:

```bash
NODE_ENV=production
PORT=3000

DATABASE_HOST=<neon-host>
DATABASE_PORT=5432
DATABASE_USER=<neon-user>
DATABASE_PASSWORD=<neon-password>
DATABASE_NAME=<neon-db>
DATABASE_SSL=true

TYPEORM_SYNC=false
TYPEORM_LOGGING=false

CORS_ORIGIN=<frontend-origin>
JWT_SECRET=<strong-secret>
JWT_EXPIRATION=1h

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=<backend-url>/api/auth/google/callback
FRONTEND_URL=<frontend-url>
```

---

## 4. Pre-Deploy Checklist

- [ ] `main` includes all migration files needed for this release.
- [ ] New migration compiles with backend build.
- [ ] No migration edits after being applied in any persistent environment.
- [ ] Neon backup generated before deploy:

```bash
pg_dump "$DATABASE_URL" -Fc -f backup_pre_release.dump
```

- [ ] Render env vars reviewed (especially DB + OAuth callback URLs).

---

## 5. Deployment Steps

1. Merge `develop` into `main`.
2. Trigger Render deploy (auto or manual).
3. Confirm in Render logs:
   - TypeORM migration execution starts.
   - Migrations complete successfully.
   - Nest app starts and listens on configured port.
4. Validate smoke endpoints:
   - `GET /api`
   - `GET /api/docs`
5. Validate functional flows:
   - Auth login callback path.
   - Events list/create.
   - Transactions list/create/update/delete.

---

## 6. Post-Deploy Validation

- [ ] Render service status is healthy.
- [ ] No migration errors in logs.
- [ ] No DB permission/SSL errors.
- [ ] Auth flow works in production URLs.
- [ ] Basic CRUD operations work.

---

## 7. Rollback Plan

### 7.1 Application Rollback

- Roll back to previous known-good commit in Render.

### 7.2 Database Rollback

Preferred in production: restore from backup if migration is destructive or inconsistent.

```bash
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backup_pre_release.dump
```

> Avoid relying on `migration:revert` in production unless the migration has a safe and tested `down` path.

---

## 8. Operational Notes

- Local commands:

```bash
pnpm --filter @friends/backend migration:run:local
pnpm --filter @friends/backend migration:revert:local
```

- Production command:

```bash
pnpm --filter @friends/backend migration:run:prod
```

- Compatibility aliases still available in `package.json`:
  - `migration:run` -> `migration:run:local`
  - `migration:revert` -> `migration:revert:local`

---

## 9. Future Improvements

- Add a dedicated staging environment with `migration:run:staging`.
- Add a CI check that runs migrations against ephemeral PostgreSQL before merge.
- Add automated smoke tests after Render deploy.
