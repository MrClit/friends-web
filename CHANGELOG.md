# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/MrClit/friends-web/releases/tag/v0.1.0
