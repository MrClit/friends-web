# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.1]: https://github.com/MrClit/friends-web/releases/tag/v0.1.1
[0.1.0]: https://github.com/MrClit/friends-web/releases/tag/v0.1.0
