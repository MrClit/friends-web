# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-07-31

Security hardening of the authentication flow. Includes a database migration; no changes to
OAuth console configuration or Render environment variables are required.

### Added

- One-time exchange codes for the OAuth callback (`auth_exchange_codes` table, migration
  `1705700000000-CreateAuthExchangeCodesTable`). `AuthExchangeCodeService` issues opaque codes
  stored as SHA-256 hashes with a configurable TTL (`AUTH_EXCHANGE_CODE_TTL_SECONDS`, default 60
  seconds) and redeems them through a conditional `UPDATE … RETURNING`, so concurrent redemptions
  can never both succeed. Expired rows are swept hourly by a cron job.
- `POST /auth/exchange`, which trades a valid code for the access/refresh token pair.

### Changed

- The OAuth callback now redirects with `?code=…` instead of `?refreshToken=…`. A refresh token
  that used to sit in browser history for 30 days is replaced by a single-use code valid for 60
  seconds. The refresh token is no longer minted at redirect time but when the code is redeemed,
  so an abandoned login leaves no long-lived token behind.
- The access token lives only in memory on the frontend. `AuthContext` bootstraps the session from
  the stored refresh token on page load, and the retry-after-401 path no longer writes it to
  storage.
- Per-endpoint rate limits on the auth controller: `POST /auth/exchange` at 5/min and
  `POST /auth/refresh` at 30/min, replacing the single 10/min class-level limit. Page loads now
  trigger a refresh, so the previous shared budget was too tight for several devices behind one
  NAT.

### Security

- No token of any kind appears in a URL. Closes [#92]. The remaining acceptance criterion of that
  issue — the refresh token being unreadable from JavaScript via an `httpOnly` cookie — is out of
  scope: the frontend (GitHub Pages) and the backend (Render) are cross-site, both `github.io` and
  `onrender.com` being on the Public Suffix List, so a `SameSite=None` cookie would be blocked by
  Safari's ITP and partitioned by Firefox. Tracked in [#111]; the tab-rotation race it interacts
  with is tracked in [#112].

## [0.1.2] - 2026-07-30

Tooling, CI and dependency maintenance. No product features and no database migrations.

### Added

- Continuous integration on pull requests (`.github/workflows/ci.yml`): a `quality` job running
  lint, the monorepo build and the frontend tests, and a `backend` job running the three backend
  suites against a `postgres:17-alpine` service container. Until now the only workflow triggered
  on push to `main`, so the first signal of a broken build was a red production deploy.
- `scripts/check-skills-symlinks.mjs`, wired into `pnpm lint` via `pnpm check:skills`. Vendored
  skills only load through their symlinks in `.claude/skills/`, and that wiring broke silently.

### Changed

- Production dependencies refreshed to resolve reported vulnerabilities: `react-router` unpinned,
  lockfile updated within semver ranges, `js-yaml` override added. Code adapted to the stricter
  typings from the `typescript-eslint` and `i18next` bumps.
- Agent tooling migrated from GitHub Copilot to Claude Code: the Copilot configuration layer is
  gone, the Tailwind `className` rules now live in the `tailwind-inline-cn` skill, and the
  vendored skills are exposed through symlinks (`skills-lock.json` resynced, 13 → 8 entries).
- Issue and PR content is written in Spanish; commits and code stay in English.
- `eslint.config.js` grants Node globals to `scripts/**/*.mjs`, replacing the per-file
  `eslint-disable` workaround.

### Fixed

- `apps/backend/.env.test.example`: `JWT_SECRET` was 15 characters where the Joi validation schema
  requires 32, so copying the example made the integration and e2e suites fail at startup.

### Removed

- 39 stale documents from `/docs` — implementation plans for shipped work and architecture
  documents frozen since January 2026 — plus the resulting dangling links in `README`,
  `DEPLOYMENT.md` and the frontend READMEs.

## [0.1.1] - 2026-07-27

Documentation only. Resolves contradictions between the deployment guide and the release
workflow that would have desynced published tags from what is actually deployed.

### Changed

- `DEPLOYMENT.md` §3: the canonical release flow is now the documented choreography — version
  bump, `CHANGELOG.md` entry, PR into `develop`, PR to `main` with a merge commit, annotated tag
  and GitHub Release. `pnpm release:prod` is demoted to an emergency shortcut, with an explicit
  warning that it skips versioning entirely and writes straight to `main` with no PR.
- `DEPLOYMENT.md` §12: documentation policy now splits jurisdiction. Previously both this guide
  and `.claude/gh-project.md` claimed precedence on conflict, leaving no tie-break.
- `DEPLOYMENT.md` §8: notes that migrations run on backend startup (`start:prod:migrate`), after
  the push to `main` triggers the Render redeploy — so they are verified before merging, not
  applied earlier.
- `.claude/gh-project.md`: references the pre-deploy checklist instead of duplicating it, and
  records the migration-timing exception to the generic release rule.

### Removed

- `DEPLOYMENT.md` §3: the "Release to Production" GitHub Actions option. That workflow was
  deleted in d912419 and shipped in 0.1.0, so the instruction pointed at nothing.

## [0.1.0] - 2026-07-27

First tagged release. Consolidates deployment and operations documentation and hardens
JWT secret validation. No product features and no database migrations.

### Added

- Canonical deployment guide (`DEPLOYMENT.md`): production topology, required backend
  environment variables, secret injection ownership, pre-deploy and post-deploy checklists,
  rollback procedure and troubleshooting.
- Security policy (`.github/SECURITY.md`) documenting the secret lifecycle.
- GitHub workflow coordinates (`.claude/gh-project.md`): project board ids, branch model,
  labels, pre-PR validation command and release pre-flight.
- Draft migration plan for consolidating on Vercel and Supabase
  (`docs/20260713_VERCEL_SUPABASE_MIGRATION_PLAN.md`).

### Changed

- **`JWT_SECRET` now requires a minimum length of 32 characters.** The backend fails to start
  if the configured secret is shorter — verify the production value before deploying.
- `CLAUDE.md`: corrected feature list, routes and API modules; removed a duplicate heading;
  the GitHub section now points to the workflow skill instead of restating it.
- Backend and frontend READMEs refreshed and aligned with the deployment guide.
- `docs/PRODUCTION_RELEASE_AUTOMATION.md` and the Neon/Render runbook reduced to pointers to
  the canonical deployment guide.

### Removed

- Outdated GitHub Actions workflows: `backend-tests.yml` and `release-to-prod.yml`.

[#92]: https://github.com/MrClit/friends-web/issues/92
[#111]: https://github.com/MrClit/friends-web/issues/111
[#112]: https://github.com/MrClit/friends-web/issues/112

[0.1.3]: https://github.com/MrClit/friends-web/releases/tag/v0.1.3
[0.1.2]: https://github.com/MrClit/friends-web/releases/tag/v0.1.2
[0.1.1]: https://github.com/MrClit/friends-web/releases/tag/v0.1.1
[0.1.0]: https://github.com/MrClit/friends-web/releases/tag/v0.1.0
