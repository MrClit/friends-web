# Deployment Guide

Canonical deployment runbook for the Friends monorepo.

This document is the single source of truth for production deployment and operations.

## 1. Production Topology

- Frontend: GitHub Pages (build and publish on push to `main`)
- Backend API: Render Web Service
- Database: Neon PostgreSQL
- Release promotion: `develop` -> `main`

## 2. Canonical Sources in This Repository

- Release command: `pnpm release:prod` in root `package.json`
- Release automation script: `scripts/release-to-prod.mjs`
- Frontend deployment workflow: `.github/workflows/deploy.yml`
- Backend production start and migrations: `apps/backend/package.json`
- Backend env validation schema: `apps/backend/src/config/env.validation.ts`
- Backend health endpoints: `apps/backend/src/common/health.controller.ts`

## 3. Release Flow (Develop -> Main)

### Option A: Local command (recommended)

Run from monorepo root:

```bash
pnpm release:prod
```

What it does:

1. Validates clean git working tree
2. Fetches origin
3. Checks out `main`
4. Pulls latest `main`
5. Merges `develop` into `main`
6. Pushes `main` to origin
7. Returns to the original branch

### Option B: GitHub Actions manual workflow

Run workflow `Release to Production` from GitHub Actions UI.

## 4. Frontend Deployment (GitHub Pages)

Workflow: `.github/workflows/deploy.yml`

Trigger:

- Push to `main`

Pipeline summary:

1. Install dependencies with pnpm
2. Lint frontend
3. Run frontend tests
4. Build monorepo
5. Upload `apps/frontend/dist`
6. Deploy to GitHub Pages

## 5. Backend Deployment (Render)

Render service should track branch `main`.

### Build command

```bash
pnpm install --frozen-lockfile && pnpm --filter @friends/backend build
```

### Start command

```bash
pnpm --filter @friends/backend start:prod:migrate
```

`start:prod:migrate` runs:

1. `migration:run:prod` (TypeORM using `dist/data-source.js`)
2. `node dist/main`

## 6. Required Backend Environment Variables (Production)

These values are validated in `apps/backend/src/config/env.validation.ts`.

### Runtime

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Database

```bash
DATABASE_HOST=<neon-host>
DATABASE_PORT=5432
DATABASE_USER=<neon-user>
DATABASE_PASSWORD=<neon-password>
DATABASE_NAME=<neon-db>
DATABASE_SSL=true
TYPEORM_SYNC=false
TYPEORM_LOGGING=false
```

### CORS and frontend redirect

```bash
CORS_ORIGIN=<frontend-origin>
FRONTEND_URL=<frontend-url-with-hash-base>
```

### JWT and refresh tokens

```bash
JWT_SECRET=<strong-secret>
JWT_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION_DAYS=30
REFRESH_TOKEN_MAX_ROTATIONS=100
```

### OAuth providers

```bash
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=<backend-url>/api/auth/google/callback

MICROSOFT_CLIENT_ID=<microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<microsoft-client-secret>
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=<backend-url>/api/auth/microsoft/callback
```

### Cloudinary

```bash
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_AVATAR_FOLDER=friends/prod/avatars
```

## 7. Secret Injection Ownership

- Render environment panel:
  - Backend runtime secrets (database credentials, JWT, OAuth secrets, Cloudinary)
- OAuth provider consoles (Google/Microsoft):
  - Authorized callback URLs must match backend public URL
- Neon:
  - Database credentials and connection values used by Render
- GitHub Actions:
  - Frontend Pages deploy flow as configured in workflow permissions

## 8. Pre-Deploy Checklist

- `main` contains required migration files
- Backend build is green
- New migrations compile and are not edited after being applied in persistent environments
- Render env vars reviewed (DB, OAuth callback URLs, CORS, frontend redirect URL)
- Database backup generated before risky releases

Recommended backup command:

```bash
pg_dump "$DATABASE_URL" -Fc -f backup_pre_release.dump
```

## 9. Post-Deploy Validation Checklist

### Platform checks

- Frontend deploy job finished successfully in GitHub Actions
- Render service status is healthy
- No migration errors in Render logs
- No DB SSL/permission errors

### Smoke endpoints

- `GET /api`
- `GET /api/docs`
- `GET /api/health/live`
- `GET /api/health/ready`

### Functional smoke tests

- OAuth login callback flow works end-to-end
- Events: list and create
- Transactions: list and create

## 10. Rollback Procedure

### Application rollback

- Roll back Render service to a previous known-good commit/deploy

### Database rollback

Preferred for destructive/inconsistent migrations: restore from backup.

```bash
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backup_pre_release.dump
```

Avoid relying on `migration:revert` in production unless `down` paths were tested specifically for that release.

## 11. Troubleshooting

### Release command fails due to uncommitted changes

- Commit or stash changes, then retry `pnpm release:prod`

### Merge conflicts during release

```bash
git merge --abort
git checkout develop
```

Resolve conflicts in `develop`, then retry release.

### OAuth callback errors in production

- Verify provider console callback URLs exactly match public backend callback endpoints
- Verify `FRONTEND_URL` and backend callback URLs point to the intended environment

### Backend starts but readiness fails

- Validate DB credentials, network reachability, and `DATABASE_SSL`
- Check Render logs for migration/database errors

## 12. Documentation Policy

- This file is canonical for deployment operations.
- Files under `docs/` may contain planning notes or historical snapshots.
- If deployment instructions conflict, this file takes precedence.
