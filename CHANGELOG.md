# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
