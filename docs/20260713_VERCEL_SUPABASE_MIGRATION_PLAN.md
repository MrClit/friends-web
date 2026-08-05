# Migration Plan — Vercel (Frontend + Backend) & Supabase (Database)

**Date:** 2026-07-13
**Status:** Draft
**Scope:** Infrastructure / Deployment (no product features)
**Author:** Víctor Sales (with Claude Code)

> Note: this is an infrastructure migration, so it is structured as motivation, current-state analysis, target design, ordered tasks, validation, env vars, and rollback. It lives in `/docs` because it is a design still pending execution; delete it once the migration ships.

---

## 1. Motivation

Current topology is spread across three providers (GitHub Pages, Render, Neon). The goal is to consolidate on **Vercel** (frontend + backend) and **Supabase** (PostgreSQL), reducing the number of dashboards/secrets stores and gaining preview deployments per PR.

---

## 2. Current State (verified in repo)

| Piece | Today | Key coupling points |
|---|---|---|
| Frontend | GitHub Pages via `.github/workflows/deploy.yml` | `base: '/friends-web/'` in `vite.config.ts`; `HashRouter`; `apps/frontend/.env.production` hardcodes Render URL |
| Backend | Render web service (long-running Node) | Start command `start:prod:migrate` runs TypeORM migrations then `node dist/main`; `@Cron(EVERY_DAY_AT_MIDNIGHT)` in `refresh-token.service.ts:112`; in-memory `ThrottlerModule` |
| Database | Neon PostgreSQL | Discrete env vars (`DATABASE_HOST/PORT/USER/PASSWORD/NAME/SSL`) validated in `env.validation.ts`; `pgcrypto` extension; 6 migrations in `src/migrations/` |
| Auth | Google/Microsoft OAuth + JWT + rotating refresh tokens | Refresh token travels in **body/localStorage** (not cookies) → no cross-site cookie constraints. OAuth callback URLs registered in provider consoles point to Render |
| Avatars | Cloudinary | Unchanged by this migration |

---

## 3. Key Architectural Decision — Backend Runtime

NestJS is built as a long-running server; Vercel runs serverless functions. Two options:

### Option A (recommended): NestJS as a Vercel serverless function

Wrap the Nest app in a single serverless handler (Express adapter, app instance cached across warm invocations). Viable because the API is short-lived CRUD (no WebSockets, no streaming, no long jobs).

Consequences that **must** be addressed:

1. **`@Cron` will not fire** in serverless. The daily refresh-token cleanup must move to **Vercel Cron** (calls a guarded maintenance endpoint) or **Supabase `pg_cron`** (plain SQL delete). Recommended: Vercel Cron + secret-protected endpoint, keeping logic in app code. Hobby plan allows daily crons — enough here.
2. **Migrations can no longer run at process start** (`start:prod:migrate` has no equivalent). Move them to a GitHub Actions job on push to `main` (see §6).
3. **Connection pooling:** each warm function holds its own pool. Use Supabase **Supavisor transaction-mode pooler (port 6543)** and cap TypeORM pool (`extra: { max: 1–2 }`) to avoid exhausting Postgres connections.
4. **Cold starts:** Nest bootstrap ≈ 1–3 s on a cold function. Render free tier already spins down (~50 s cold start), so this is likely an improvement; on paid Render it is a regression to accept.
5. **Throttler** becomes per-instance (approximate limits). Acceptable for this app.
6. **Request body limit 4.5 MB** on Vercel functions — relevant if avatar uploads pass through the API. Verify current avatar payload sizes; Cloudinary direct-upload is the escape hatch if needed.

### Option B: Only frontend → Vercel, DB → Supabase; backend stays on a long-running host

Zero backend code changes (only env values). Choose this if serverless constraints above are unacceptable. The rest of this plan still applies except §6.

The remainder of the plan assumes **Option A**.

---

## 4. Target Topology

- **Vercel project 1 — frontend:** Root Directory `apps/frontend`, framework Vite, static output. Production = `main`, previews on PRs.
- **Vercel project 2 — backend:** Root Directory `apps/backend`, one serverless function serving all `/api/*` routes, Vercel Cron for token cleanup.
- **Supabase:** plain PostgreSQL in `public` schema (no Supabase Auth/RLS/Storage — app keeps its own JWT auth and Cloudinary). Region matching the Vercel function region.

---

## 5. Frontend Tasks

1. **Vite base path:** change `base: '/friends-web/'` → `'/'` in `apps/frontend/vite.config.ts` (Vercel serves at domain root).
2. **Router:** keep `HashRouter` for the migration (works anywhere, zero risk). Optional follow-up spec: switch to `BrowserRouter` + `vercel.json` rewrite `{"source": "/(.*)", "destination": "/index.html"}` — touches `FRONTEND_URL` (drops the `/#`), OAuth callback page, and 404 handling; do it as a separate change.
3. **Env:** update `apps/frontend/.env.production` → `VITE_API_URL=https://<backend-domain>/api` (or delete the committed file and define vars in the Vercel dashboard; OS env beats `.env.production` in Vite, but leaving a stale Render URL committed is a foot-gun).
4. **Vercel project config:**
   - Root Directory: `apps/frontend` (Vercel auto-detects the pnpm workspace and installs from repo root).
   - Build command: `pnpm --filter @friends/shared-types build && pnpm --filter @friends/frontend build` (frontend has no `prebuild` for shared-types, unlike backend).
   - Output: `dist`.
5. **CI:** replace `.github/workflows/deploy.yml` with a plain CI workflow (lint + `test:run` on PRs/pushes) — Vercel Git integration handles build+deploy and does not run tests.

---

## 6. Backend Tasks (Option A)

1. **Serverless entry:** add `apps/backend/api/index.ts` that bootstraps the Nest app onto an Express instance once (cached promise), applying everything currently in `main.ts` (CORS, global prefix, pipes, filter, interceptor, Swagger), and exports the Express handler. Keep `main.ts` for local dev.
2. **`apps/backend/vercel.json`:** route all paths to the function; set `maxDuration` (e.g. 30 s covers OAuth round-trips); define the cron entry.
3. **Cleanup endpoint for cron:** new guarded endpoint (e.g. `POST /api/auth/maintenance/cleanup-refresh-tokens`, checked against a `CRON_SECRET` header) that calls the existing cleanup logic; register in `vercel.json` `crons` (daily). Remove/keep `@Cron` decorator harmlessly (it simply never fires on Vercel; it still works in local dev).
4. **Migrations in CI:** GitHub Actions workflow on push to `main`: `pnpm install && pnpm --filter @friends/backend build && pnpm --filter @friends/backend migration:run:prod`, using **session-mode** connection secrets (port 5432). Run before/independent of the Vercel deploy; migrations must remain backward-compatible for the seconds of skew.
5. **Pool sizing:** extend `database.config.ts` (and `data-source.ts` if needed) with `extra: { max: Number(process.env.DATABASE_POOL_MAX ?? 10) }`; set `DATABASE_POOL_MAX=1` on Vercel.
6. **Env validation:** add `CRON_SECRET` (and `DATABASE_POOL_MAX`) to `env.validation.ts`.

No changes needed for: response wrapping, JWT/refresh flow (body-based), Cloudinary, pino logging (goes to Vercel logs), `enableShutdownHooks` (no-op).

---

## 7. Database Tasks (Neon → Supabase)

1. **Create Supabase project** (region = Vercel function region; note: free-tier projects pause after ~1 week of inactivity — same class of limitation as Render free spin-down; Pro removes it).
2. **Connections:**
   - Runtime (serverless): pooler host `aws-0-<region>.pooler.supabase.com`, port `6543` (transaction mode), user `postgres.<project-ref>`. Maps 1:1 onto existing `DATABASE_*` vars; `DATABASE_SSL=true`. TypeORM/pg works in transaction mode (no named prepared statements by default).
   - Migrations/CI and `pg_restore`: same pooler host on port `5432` (session mode) or direct connection.
3. **Extensions:** migration `1705200…` runs `CREATE EXTENSION IF NOT EXISTS pgcrypto` — available on Supabase; `gen_random_uuid()` is core since PG13. No changes.
4. **Schema:** created by running the 6 existing migrations against Supabase (not by dump), so the `migrations` history table stays consistent. App only uses `public`; Supabase reserved schemas (`auth`, `storage`, …) don't conflict. Leave RLS disabled (API connects as the privileged user; access control lives in the app).
5. **Data copy (cutover):**
   ```bash
   pg_dump "$NEON_URL" --data-only --schema=public --exclude-table=migrations -Fc -f friends_data.dump
   pg_restore --no-owner --no-privileges --disable-triggers -d "$SUPABASE_SESSION_URL" friends_data.dump
   ```
   (`--exclude-table=migrations` because Supabase's history was already written by step 4; `--disable-triggers` to avoid FK ordering issues.)

---

## 8. Ordered Cutover Sequence

1. Supabase project up → run migrations from local (`migration:run` pointing at Supabase session port) → smoke test backend locally against Supabase.
2. Create Vercel **backend** project with full env set (§9), `CORS_ORIGIN` temporarily set to the current GitHub Pages origin **and** the new frontend domain is not possible (single-origin string) — test with the new frontend preview instead.
3. Create Vercel **frontend** project; preview deployment pointing `VITE_API_URL` at the new backend; validate login + CRUD end-to-end on previews (add preview OAuth callback URLs in Google/Microsoft consoles alongside the existing ones).
4. Land the code changes (§5–6) on `develop`, then promote them to `main` with a `develop` → `main` pull request merged with a merge commit (see `DEPLOYMENT.md` §3).
5. **Cutover window:** announce/accept brief write freeze → data dump/restore (§7.5) → flip `VITE_API_URL`/`CORS_ORIGIN`/`FRONTEND_URL` to final domains → promote Vercel production deployments.
6. Update OAuth consoles: production callback URLs → `https://<backend-domain>/api/auth/google/callback` and `/api/auth/microsoft/callback` (add first, remove Render ones after validation).
7. Validate (§10). Then decommission: disable GH Pages, suspend (don't delete) the Render service and keep a final Neon snapshot for ~2 weeks as rollback.
8. Rewrite `DEPLOYMENT.md` (it is canonical) and touch `.github/SECURITY.md` secret-location references (Render/Neon → Vercel/Supabase).

---

## 9. Environment Variable Mapping

### Backend (Vercel project 2)

| Variable | Value change |
|---|---|
| `DATABASE_HOST` | Neon host → `aws-0-<region>.pooler.supabase.com` |
| `DATABASE_PORT` | `5432` → `6543` (runtime); CI migrations use `5432` |
| `DATABASE_USER` | Neon user → `postgres.<project-ref>` |
| `DATABASE_PASSWORD` / `DATABASE_NAME` | from Supabase (`postgres`) |
| `DATABASE_SSL` | `true` (unchanged) |
| `DATABASE_POOL_MAX` | **new** — `1` on Vercel |
| `CRON_SECRET` | **new** — guards maintenance endpoint |
| `CORS_ORIGIN` | GH Pages origin → `https://<frontend-domain>` |
| `FRONTEND_URL` | → `https://<frontend-domain>/#` (keep `/#` while HashRouter stays) |
| `GOOGLE_CALLBACK_URL` / `MICROSOFT_CALLBACK_URL` | → `https://<backend-domain>/api/auth/...` |
| `NODE_ENV`, `LOG_LEVEL`, `TYPEORM_*`, `JWT_*`, `REFRESH_TOKEN_*`, OAuth client ids/secrets, `CLOUDINARY_*` | unchanged values, re-entered in Vercel |

`PORT` becomes irrelevant on Vercel (validation default keeps it harmless).

### Frontend (Vercel project 1)

`VITE_API_URL=https://<backend-domain>/api`; rest identical to `.env.production`.

### GitHub Actions (new secrets)

Session-mode `DATABASE_*` set for the migrations job.

---

## 10. Post-Cutover Validation Checklist

- `GET /api`, `/api/docs`, `/api/health/live`, `/api/health/ready` on the new backend domain
- Google **and** Microsoft OAuth end-to-end (callback → `/auth/callback` → session established)
- Refresh-token rotation (leave a session idle past JWT expiry, confirm silent refresh)
- Events + transactions list/create; KPI drill-down; avatar upload (validates Cloudinary + body-size limit)
- Vercel Cron: trigger the maintenance endpoint manually with `CRON_SECRET`, check expired tokens are deleted; confirm the cron shows as registered in Vercel
- Row counts Neon vs Supabase for `users`, `events`, `transactions`, `refresh_tokens`

## 11. Rollback

- **Before decommission:** revert `VITE_API_URL` (frontend redeploy), re-enable GH Pages workflow, resume Render service — Neon was never touched destructively.
- **After data divergence on Supabase:** restore the pre-cutover Neon snapshot only if abandoning the migration; otherwise fix forward (Supabase daily backups on Pro, manual `pg_dump` on free).

## 12. Risks & Gotchas Summary

| Risk | Mitigation |
|---|---|
| `@Cron` silently dead on serverless | §6.3 — Vercel Cron + guarded endpoint; verify in §10 |
| Postgres connection exhaustion | Transaction-mode pooler + `DATABASE_POOL_MAX=1` |
| Cold-start latency | Accept (better than Render free); Fluid/paid options later |
| Stale `base`/API URL committed | §5.1, §5.3 — part of the code change, reviewed in PR |
| Preview deployments blocked by single-origin CORS | Known limitation; previews test UI only, or temporarily point `CORS_ORIGIN` at a preview. Optional follow-up: support comma-separated `CORS_ORIGIN` list |
| Avatar payload > 4.5 MB | Verify current limits; move to Cloudinary direct upload if hit |
| Supabase free-tier pausing after inactivity | Accept on free, or Pro; health-check pinger as stopgap |
| Migration/deploy skew (CI migrates before function redeploys) | Keep migrations backward-compatible (already project policy) |

## 13. Estimated Effort

| Phase | Effort |
|---|---|
| Backend serverless entry + vercel.json + cron endpoint | 0.5–1 day |
| CI workflows (tests + migrations job) | 0.5 day |
| Frontend config changes | < 0.5 day |
| Supabase setup + rehearsal of dump/restore | 0.5 day |
| Cutover + validation | 0.5 day |
| Docs (`DEPLOYMENT.md`, `SECURITY.md`) | 0.5 day |
