# Deployment Guide

Canonical deployment runbook for the Friends monorepo.

This document is the single source of truth for **infrastructure and production operations**. The
release *sequence* is not owned here — see §3.

## 1. Production Topology

- Frontend: GitHub Pages (build and publish on push to `main`)
- Backend API: Render Web Service
- Database: Neon PostgreSQL
- Release promotion: `develop` -> `main`

## 2. Canonical Sources in This Repository

- Release coordinates (branches, board, pre-flight): `.claude/gh-project.md`
- Frontend deployment workflow: `.github/workflows/deploy.yml`
- Backend production start and migrations: `apps/backend/package.json`
- Backend env validation schema: `apps/backend/src/config/env.validation.ts`
- Security policy and secret lifecycle: `.github/SECURITY.md`
- Backend health endpoints: `apps/backend/src/common/health.controller.ts`

## 3. Release Flow (Develop -> Main)

The canonical procedure lives in the `release` skill, which reads this repo's coordinates from
[`.claude/gh-project.md`](.claude/gh-project.md). Follow that flow, not an ad-hoc merge.

In summary:

1. Bump the root `package.json` and add the `CHANGELOG.md` entry on a `release/vX.Y.Z` branch
2. Run the project validations, then open a PR into `develop` and **squash** merge it
3. Open a PR `develop` -> `main` and merge it with a **merge commit** (preserves history)
4. Annotated tag `vX.Y.Z` on `main`, plus a GitHub Release

Versioning is SemVer over the root `package.json`; the packages under `apps/` and `packages/` stay
at `0.0.0`.

There is no shortcut around this: `main` is protected and requires a pull request with green checks,
so a local merge pushed straight to the production branch is rejected. Bypassing the flow would also
leave the tags silently out of sync with what is deployed.

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
JWT_SECRET=<strong-secret>          # minimum 32 characters, or the backend refuses to boot
JWT_EXPIRATION=15m
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

Follow `.github/SECURITY.md` as the canonical policy for generation, rotation cadence, and incident response.

- Render environment panel:
  - Backend runtime secrets (database credentials, JWT, OAuth secrets, Cloudinary)
- OAuth provider consoles (Google/Microsoft):
  - Authorized callback URLs must match backend public URL
- Neon:
  - Database credentials and connection values used by Render
- GitHub Actions:
  - Frontend Pages deploy flow as configured in workflow permissions

## 8. Pre-Deploy Checklist

Infrastructure checks. The release flow reads its pre-flight from
[`.claude/gh-project.md`](.claude/gh-project.md), which points here — keep the list in one place.

- `main` contains required migration files
- Backend build is green
- New migrations compile, are reversible, and are not edited after being applied in persistent environments
- Render env vars reviewed (DB, OAuth callback URLs, CORS, frontend redirect URL)
- Database backup generated before risky releases

> Migrations run **on backend startup** (`start:prod:migrate`), which happens after `main` is pushed
> and Render redeploys — there is no pre-merge migration step. A migration that fails takes the API
> down with it, so it has to be verified *before* merging, not applied earlier.

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

- This file is canonical for **infrastructure and production operations**: topology, environment
  variables, Render and Pages configuration, rollback and smoke checks. If those instructions
  conflict with any other document, this file takes precedence.
- The **release sequence** is not owned here. It belongs to the `release` skill, with this repo's
  coordinates in `.claude/gh-project.md`. If the two disagree about *how a release is cut*, the
  skill wins; if they disagree about *how production is configured*, this file wins.
- Files under `docs/` are limited to designs pending execution and runbooks still valid. They never
  override this file on infrastructure matters.
