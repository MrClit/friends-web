# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-09-26

A single full-page error screen for routes that do not exist and events that cannot be loaded, the move to
react-router v8, and tooling housekeeping (ESLint 10, one version of ESLint and TypeScript across the
monorepo). **No database migrations and no new environment variables**: nothing has to change in the Render
dashboard before deploying.

### Added

- Unknown routes and events that cannot be loaded share one full-page error screen instead of a dead-end
  red box: a malformed, missing or inaccessible event offers *Go home*, and a server or network failure
  offers *Retry* first. Errors inside an already loaded event are unchanged. Closes [#197].

### Changed

- The frontend runs on react-router v8; `react-router-dom`, removed in v8, is gone. Closes [#105].
- Whether a participant belongs to an event is decided in one place for transactions and the calendar.
  Error messages and status codes are unchanged. Closes [#187].
- Tooling: ESLint 10 across the monorepo with the React Compiler lint rules, and ESLint and TypeScript
  declared once in a pnpm catalog that every workspace uses (`pnpm check:catalog`, part of `pnpm lint`,
  enforces it) so an incremental `pnpm add` no longer breaks linting. Closes [#211], [#224].

## [0.7.0] - 2026-09-24

Contribution targets move to where the money is, a fix for a save that failed when a guest was swapped for
a user, and a refresh-token grace window so several open tabs stop logging each other out. **One database
migration** (a nullable `rotated_at` column on `refresh_tokens`, applied on boot) and **one new optional
environment variable** with a safe default: nothing has to change in the Render dashboard before deploying.

### Added

- A refresh token rotated less than `REFRESH_TOKEN_ROTATION_GRACE_SECONDS` ago (default `10`, `0` disables)
  can be presented once more by a concurrent tab instead of being treated as reuse and revoking the whole
  session. Tokens rotated before this deploy keep a `NULL` `rotated_at` and get no grace window. Closes
  [#112].

### Changed

- Contribution targets are edited from the event's Money section instead of the event modal. Closes
  [#192].
- Participant utils and types moved from `features/events` to `shared`. Closes [#188].
- Migrations are excluded from the backend's unit coverage, which no longer drags the total down. Closes
  [#168].
- Tooling: a husky `pre-push` hook runs lint, tests and build (skipped on Render and CI), `shared-types`
  is built before the root lint and test, and side-specific `CLAUDE.md` sections moved to path-scoped
  rules. Closes [#59], [#146], [#205].

### Fixed

- Replacing a guest that was just added (and not yet saved) with a user no longer makes saving the event
  fail with a `400`. Closes [#204].

### Security

- The backend refuses to start or migrate under `NODE_ENV=production` while an `apps/backend/.env.production`
  exists on disk — on a laptop that file can only be a copy of the live credentials. Render ships no such
  file and is unaffected. A new `check:env` step in `pnpm lint` fails if any backend `.env*` other than the
  examples is tracked or stops being ignored. Closes [#179].

## [0.6.0] - 2026-09-13

Polish on the calendar shipped in 0.5.0 — the mobile view starts collapsed and the day cards now say what
is being eaten — plus a batch of fixes for things that were visibly wrong on phones (iOS zooming in on every
field, toasts breaking outside a secure context) and a backend fix to how a JWT is resolved to its user.
**No database migration and no new environment variables**: nothing to change in the Render dashboard
before deploying.

### Added

- On mobile, the calendar's day cards start collapsed and each collapsed header summarises the plan for
  every sitting (name, description and the adults/children headcount), so the screen answers "what are we
  eating" without opening a day. Closes [#183].

### Changed

- The event hub sections are ordered money, calendar, shopping — the order participants actually read
  them in. URLs, icons and labels are unchanged. Closes [#185].
- The "Configure days" modal leads with the list of existing days and folds the "Add days" form away, and
  it no longer autofocuses the first date input — which popped the native date picker open on every
  visit, even for someone who only came to edit a description. Focus stays inside the dialog. Closes
  [#184].

### Fixed

- The JWT strategy resolves the user by the stable `sub` claim instead of the mutable email claim. A
  missing or soft-deleted user still yields a 401, and the lookup stays per-request so a deleted user's
  tokens die immediately. Closes [#186].
- Form fields render at 16px on touch devices, gated on `(hover: none) and (pointer: coarse)` rather than
  on a breakpoint, so iOS Safari stops zooming the page in when a field is focused. The viewport meta is
  untouched: pinch-zoom keeps working (WCAG 2.2 SC 1.4.4). Closes [#182].
- Toast ids are unique — two toasts fired in the same millisecond used to share a `Date.now()` id, which
  duplicated React keys and made dismissing one dismiss both. Every random id now goes through a shared
  `randomUUID()` helper with a `crypto.getRandomValues()` fallback, so opening the app over plain HTTP on
  a LAN (where `crypto.randomUUID` does not exist) no longer throws on every toast, on adding a guest or
  on mounting the participants combobox. Closes [#158].
- TanStack Query no longer retries a `400`, `401`, `403` or `404` automatically: those cannot succeed on a
  second attempt, and the client has already refreshed and replayed a `401` before the query ever sees
  it. `5xx`, `429` and network errors keep the three retries. `shouldRetryQuery` in `shared/utils/apiError.ts`
  is the single owner of the rule. Closes [#195].
- Loading an event with a malformed id (`400`) or without access (`403`) no longer shows a Retry button
  that could never work; `describeLoadError` is the single owner of the message-and-retryable rule, used
  by the event layout, KPI detail, shopping list, transactions list and calendar views. Closes [#166].

## [0.5.0] - 2026-09-01

The meal calendar lands: every event gets days, sittings and per-participant attendance counts, planned
from a new Calendar section of the event hub. Includes a database migration,
`1706200000000-CreateEventCalendarTables`, that creates three tables (`event_calendar_days`,
`event_calendar_meals`, `event_calendar_attendances`); it is purely additive — it touches no existing
table, column or row, and its `down()` drops the three again — and applies automatically on the
backend's boot once this release deploys. **No new environment variables**, so there is nothing to
change in the Render dashboard before deploying.

### Added

- Meal calendar API: days, meals and attendances, with the endpoints to configure an event's calendar
  and to record per-participant attendance counts. Closes [#172].
- Calendar section at `/event/:id/calendar` — attendance planning grid on desktop, collapsible day
  cards on mobile, optimistic per-cell saves and the day-range/single-day setup modal. Closes [#173],
  and with it the meal calendar feature as a whole. Closes [#136].

### Fixed

- `PUT` added to the CORS allowed methods. Without it the attendance endpoint's preflight failed, and a
  failed preflight reaches the browser as a bare network error rather than an HTTP status, so it looked
  like the server was down instead of misconfigured.
- The migration DataSource loads `.env.${NODE_ENV}` the way the app does, so `pnpm migration:run` works
  on a developer machine instead of dying with pg's SASL error. Closes [#149].
- The TypeScript migration CLI refuses to run under `NODE_ENV=production`: a stray exported variable
  can no longer point a laptop's `pnpm migration:run` at the production database. Closes [#177].

## [0.4.0] - 2026-08-29

Default-behavior tweak for new transactions plus consolidation work: the KPI drill-down unified under
one layout, and the drift between migration and entity index definitions closed. Includes a database
migration, `1706100000000-DropUnusedSoftDeleteIndexes`, that drops two unused indexes
(`idx_users_deleted_at`, `idx_transactions_deleted_at`); it touches no data or columns, its `down()`
recreates them, and it applies automatically on the backend's boot once this release deploys.

### Changed

- New transactions default to the expense type. Closes [#144].
- The KPI drill-down is unified under `EventLayout`, replacing the parallel route/rendering path it
  had before. Closes [#154].

### Fixed

- Migration and entity index definitions realigned: `idx_transactions_event_id` is now also declared
  on `Transaction`, and the unused `idx_users_deleted_at` / `idx_transactions_deleted_at` are dropped
  by the migration above. A shared expected-indexes list is asserted against both the entity-built and
  the migration-built schema, so the two can no longer drift apart in silence. Closes [#150].

### Tests

- Migrations are applied and reverted against an empty database on every PR, so a broken migration is
  caught before merge instead of at production boot. Closes [#151].

## [0.3.0] - 2026-08-28

Event hub expansion with a shared shopping list, plus data-integrity fixes that align the entity
schema with the migrations already applied in production.

### Added

- Shared shopping list per event, added as a new section of the event hub. Closes [#143].
- Event detail restructured as a sectioned hub with tabs and nested routes. Closes [#152].
- Indexes on the hot query paths for events and transactions. Closes [#28].

### Fixed

- Entity schema aligned with existing migrations: timestamp column types and foreign keys toward
  users. Closes [#157], [#160].
- A single entity path definition shared by both DataSources, instead of two independent copies
  that could drift. Closes [#156].
- Decimal separator alignment in the amount input placeholder and edit preload. Closes [#141].

### Changed

- `.gitattributes` added to normalize line endings to LF. Closes [#145].

## [0.2.0] - 2026-08-05

API contract corrections and backend hardening. **No database migration and no new environment
variables**; nothing to change in the Render dashboard or the OAuth consoles before deploying.

### Added

- `helmet()` security headers on the backend, applied first in `configureApp()` so they cover
  every downstream response, including errors and Swagger. Closes [#118].
- `EventAccessService` (`modules/event-access/`) as the single owner of the event access rule:
  an actor may access an event if it is an admin or a participant of `type: 'user'`. Imported by
  `EventsModule` and `TransactionsModule`, which also deduplicates the four copies of
  `findEventOrThrow`. Closes [#124].
- `auth.api.ts` on the frontend (`exchangeCode`, `getCurrentUser`, `logout`, `oauthLoginUrl`), so
  the four remaining raw `fetch` calls in the auth flow go through `apiRequest` like every other
  module. `apiRequest` gains a `skipAuthRefresh` option for the endpoints that are part of the
  refresh cycle itself. An ESLint `no-restricted-globals` rule on `fetch` keeps it that way.
- Prettier is now enforced: `pnpm lint` runs `format:check`, and `lint:fix` ends with `pnpm format`
  so it has the last word over ESLint's autofixes. Closes [#104].

### Changed

- **`Transaction.amount` is a real `number` on every read path.** The column was declared `number`
  but Postgres returns decimals as strings, so the API served three different runtime types
  depending on the route. A `ColumnNumericTransformer` on the column makes all of them agree.
  Application-layer only, no migration. Closes [#100].
- **`Transaction.date` is a plain `'YYYY-MM-DD'` string on every read path.** It was typed `Date`
  while TypeORM hydrates a Postgres `date` as a string, and the raw-SQL paginated route built a
  `Date` at the server's local midnight — which east of UTC serialized to the _previous_ day. The
  paginated query now formats with `TO_CHAR(rt.date, 'YYYY-MM-DD')`. On the input side,
  `CreateTransactionDto.date` moves from `@IsDateString()` to a strict `YYYY-MM-DD` match, the only
  input contract change; the frontend already sent that format. Closes [#129].
- **`JWT_EXPIRATION` now defaults to `15m` instead of `1d`**, centralized in `auth.constants.ts`.
  Deployments that set the variable explicitly are unaffected; those relying on the default get
  shorter-lived access tokens, transparently renewed by the refresh flow. Closes [#115].
- `GET /users/search` validates its query through a DTO, and the user directory exposure is
  documented. Closes [#119].
- `RequestContextService` is registered once in a global module instead of per-module, which was
  producing a fresh instance per consumer and losing the correlation id. Closes [#97].
- `.env.example`'s `JWT_SECRET` placeholder raised to the schema's 32-character minimum, so
  `cp .env.example .env.development` no longer aborts on boot. A regression test now validates both
  example files against the schema. Closes [#103].
- Monorepo reformatted with Prettier: 44 files that had drifted from the root `.prettierrc`.
  Formatting only, no behavioral change.
- `CLAUDE.md` revised against the actual code: the three backend test suites and their configs,
  the environment/Joi model, the frontend token model, `configureApp()`, the exchange-code auth
  flow, and the nested-vs-flat transactions API surface.

### Removed

- The `cookie-parser` middleware, which had no consumers: no endpoint reads cookies and the
  frontend never sends them. Closes [#125].
- `packages/shared-types/dist/` and `tsconfig.tsbuildinfo` are no longer tracked. With the
  tsbuildinfo committed, `tsc -b` believed the package was already built and silently produced
  nothing when `dist/` was missing.
- The `release:prod` script, unusable now that `main` is protected and requires a PR. Closes [#107].

### Tests

- `event-participants.service.ts` coverage raised from 26% to 99% statements (~55 unit tests plus
  e2e coverage of the guest→user replacement flow, including rollback on a DB failure), with a
  per-file threshold in `jest.unit.json` and `--coverage` wired into `test:run` so it is enforced
  rather than decorative. Closes [#98].
- New frontend `TransactionsList.test.tsx` covering day grouping and the round-trip identity that
  the unified date format makes possible.

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

[#59]: https://github.com/MrClit/friends-web/issues/59
[#112]: https://github.com/MrClit/friends-web/issues/112
[#146]: https://github.com/MrClit/friends-web/issues/146
[#168]: https://github.com/MrClit/friends-web/issues/168
[#179]: https://github.com/MrClit/friends-web/issues/179
[#188]: https://github.com/MrClit/friends-web/issues/188
[#192]: https://github.com/MrClit/friends-web/issues/192
[#204]: https://github.com/MrClit/friends-web/issues/204
[#205]: https://github.com/MrClit/friends-web/issues/205
[#158]: https://github.com/MrClit/friends-web/issues/158
[#166]: https://github.com/MrClit/friends-web/issues/166
[#182]: https://github.com/MrClit/friends-web/issues/182
[#183]: https://github.com/MrClit/friends-web/issues/183
[#184]: https://github.com/MrClit/friends-web/issues/184
[#185]: https://github.com/MrClit/friends-web/issues/185
[#186]: https://github.com/MrClit/friends-web/issues/186
[#195]: https://github.com/MrClit/friends-web/issues/195
[#136]: https://github.com/MrClit/friends-web/issues/136
[#149]: https://github.com/MrClit/friends-web/issues/149
[#172]: https://github.com/MrClit/friends-web/issues/172
[#173]: https://github.com/MrClit/friends-web/issues/173
[#177]: https://github.com/MrClit/friends-web/issues/177
[#144]: https://github.com/MrClit/friends-web/issues/144
[#154]: https://github.com/MrClit/friends-web/issues/154
[#150]: https://github.com/MrClit/friends-web/issues/150
[#151]: https://github.com/MrClit/friends-web/issues/151
[#97]: https://github.com/MrClit/friends-web/issues/97
[#98]: https://github.com/MrClit/friends-web/issues/98
[#28]: https://github.com/MrClit/friends-web/issues/28
[#141]: https://github.com/MrClit/friends-web/issues/141
[#143]: https://github.com/MrClit/friends-web/issues/143
[#145]: https://github.com/MrClit/friends-web/issues/145
[#152]: https://github.com/MrClit/friends-web/issues/152
[#156]: https://github.com/MrClit/friends-web/issues/156
[#157]: https://github.com/MrClit/friends-web/issues/157
[#160]: https://github.com/MrClit/friends-web/issues/160
[#100]: https://github.com/MrClit/friends-web/issues/100
[#103]: https://github.com/MrClit/friends-web/issues/103
[#104]: https://github.com/MrClit/friends-web/issues/104
[#107]: https://github.com/MrClit/friends-web/issues/107
[#115]: https://github.com/MrClit/friends-web/issues/115
[#118]: https://github.com/MrClit/friends-web/issues/118
[#119]: https://github.com/MrClit/friends-web/issues/119
[#124]: https://github.com/MrClit/friends-web/issues/124
[#125]: https://github.com/MrClit/friends-web/issues/125
[#129]: https://github.com/MrClit/friends-web/issues/129
[#92]: https://github.com/MrClit/friends-web/issues/92
[#111]: https://github.com/MrClit/friends-web/issues/111
[#112]: https://github.com/MrClit/friends-web/issues/112
[#197]: https://github.com/MrClit/friends-web/issues/197
[#105]: https://github.com/MrClit/friends-web/issues/105
[#187]: https://github.com/MrClit/friends-web/issues/187
[#211]: https://github.com/MrClit/friends-web/issues/211
[#224]: https://github.com/MrClit/friends-web/issues/224
[0.8.0]: https://github.com/MrClit/friends-web/releases/tag/v0.8.0
[0.7.0]: https://github.com/MrClit/friends-web/releases/tag/v0.7.0
[0.6.0]: https://github.com/MrClit/friends-web/releases/tag/v0.6.0
[0.5.0]: https://github.com/MrClit/friends-web/releases/tag/v0.5.0
[0.4.0]: https://github.com/MrClit/friends-web/releases/tag/v0.4.0
[0.3.0]: https://github.com/MrClit/friends-web/releases/tag/v0.3.0
[0.2.0]: https://github.com/MrClit/friends-web/releases/tag/v0.2.0
[0.1.3]: https://github.com/MrClit/friends-web/releases/tag/v0.1.3
[0.1.2]: https://github.com/MrClit/friends-web/releases/tag/v0.1.2
[0.1.1]: https://github.com/MrClit/friends-web/releases/tag/v0.1.1
[0.1.0]: https://github.com/MrClit/friends-web/releases/tag/v0.1.0
