# Phase 0 — Baseline Audit

**Date:** 2026-07-28
**Status:** Done
**Scope:** Full monorepo — dependencies, build/lint health, test coverage, prior-analysis triage
**Issue:** [#79](https://github.com/MrClit/friends-web/issues/79)
**Related:** [`20260417_PROJECT_IMPROVEMENT_ANALYSIS.md`](./20260417_PROJECT_IMPROVEMENT_ANALYSIS.md)

---

## Summary

The repo is healthy on the things that are easy to measure and weak on the things that are easy to
skip. `pnpm lint` and `pnpm -r build` both pass clean with zero warnings. The problems are
concentrated in three places:

1. **One production dependency is genuinely behind on security patches** (`react-router`, pinned to
   an exact version). The raw advisory count (44) badly overstates the real exposure — most of it is
   dev tooling, and most of the `react-router` advisories target server-side rendering modes this
   app does not use.
2. **The reported frontend coverage number is not trustworthy.** 82.68 % is computed over 51 of 164
   source files. The entire API and TanStack Query layers are instrumented by no test at all.
3. **The backend is validated by nothing automatic.** CI runs frontend lint and tests only. The
   seven integration/e2e suites run on no machine except a developer's, on purpose or by accident.

None of this is an emergency. But items 2 and 3 mean the safety net assumed by phases 1–6 is thinner
than the numbers suggest, which changes how those phases should be scoped.

---

## 1. Build and lint health

| Check | Result |
|---|---|
| `pnpm lint` (all workspaces) | **Pass** — exit 0, no warnings emitted |
| `pnpm -r build` (all workspaces) | **Pass** — exit 0 |

No suppressed or ignored warnings were found in either output. This is a genuinely clean baseline —
there is no accumulated lint debt being silenced.

**Note on the frontend bundle:** the build emits three separate `errorBoundary-*.js` chunks
(0.24 kB, 0.26 kB, 0.27 kB). Harmless in isolation, but it suggests the error-boundary module is
being pulled into three different lazy chunks rather than shared. Worth a look in **Phase 5**, not
here.

---

## 2. Dependency risk

`pnpm audit` reports **44 advisories across 1198 dependencies**: 1 critical, 26 high, 19 moderate,
3 low.

That headline number is misleading. Triaged by whether the code actually reaches production:

### 2.1 Reaches production — act on these

| Package | Installed | Patched | Where | Assessment |
|---|---|---|---|---|
| `react-router` | **7.12.0** (pinned exact) | ≥ 7.18.0 (one advisory wants ≥ 8.3.0) | frontend runtime | **The one that matters.** See caveat below. |
| `typeorm` | 0.3.28 | ≥ 0.3.31 | backend runtime | Two moderate advisories. Routine upgrade. |
| `multer` | 2.1.1 (via override) | ≥ 2.2.0 | backend runtime | DoS via deeply nested field names. **Reachable** — used by `FileInterceptor('avatar')` in `users.controller.ts:68`. |
| `joi` | 18.1.2 | ≥ 18.2.1 | backend runtime | Moderate. Used for env validation at startup. |
| `body-parser` | via `express` | ≥ 2.3.0 | backend runtime | Low. |

**The `react-router` caveat.** Six of its advisories are rated high, which looks alarming, but this
app is a SPA using `HashRouter` (`App.tsx:26`) with all 16 import sites going through
`react-router-dom`. There is no SSR, no RSC, no framework mode, no single-fetch, and no
`__manifest` endpoint. The advisories describing *"unstable RSC redirect handling"*, *"DoS via
unbounded path expansion in `__manifest`"*, *"DoS via reflected user input in single-fetch"*, and
the *turbo-stream deserialization RCE* all target server-side code paths this app never executes.

The upgrade is still worth doing — being six minor versions behind on the router is its own risk,
and the exact pin (`"react-router": "7.12.0"`, no caret) is why it drifted. But it should be
scheduled as maintenance, not triaged as an active vulnerability.

### 2.2 Dev and build tooling only — no production exposure

`vitest` (the sole **critical** — arbitrary file read via the UI server, which is a local dev
server), `vite`, `postcss`, `happy-dom` → `ws`, `@nestjs/cli` → `fast-uri`, `eslint` →
`brace-expansion`, `jest` → `js-yaml` / `@babel/core`, `supertest` → `qs`, `@types/supertest` →
`form-data`.

Worth patching on the normal upgrade cycle. None of it justifies an out-of-band release.

### 2.3 Root cause: the override block has drifted

The root `package.json` carries a hand-maintained `pnpm.overrides` block with ~25 entries pinning
security patches. It has gone stale — `"multer": ">=2.1.1"` no longer satisfies the advisory that
requires ≥ 2.2.0, and the installed tree confirms 2.1.1.

This is the actual finding: **there is no automated dependency updating.** No `.github/dependabot.yml`,
no Renovate config. Every patch in that override block was added by hand after someone noticed, which
means the mechanism only works as well as the last person to run `pnpm audit`. This is `ARCH-L2` from
the April analysis, still open, and it is the upstream cause of everything in §2.1.

---

## 3. Coverage map

### 3.1 The two numbers are not comparable

| Suite | Tests | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|---|
| Frontend (Vitest) | 224 in 32 files | 82.68 % | 74.30 % | 71.23 % | 85.58 % |
| Backend unit (Jest) | 143 in 21 suites | 61.74 % | 56.60 % | 61.29 % | 61.68 % |

Read at face value, the frontend looks 20 points healthier than the backend. That is an artifact of
configuration, not of testing.

**The frontend number covers 51 of 164 source files.** `vite.config.ts` sets `coverage.exclude` but
never sets `coverage.include` or `all: true`, so only files transitively imported by a test are
instrumented. Everything no test touches is absent from the denominator rather than counted as zero.

Files that are entirely absent from the frontend report:

- **The whole API layer** — `events.api.ts`, `transactions.api.ts`, `users.api.ts`,
  `admin-users.api.ts`. Only `client.ts` has a test.
- **The whole server-state layer** — every hook in `src/hooks/api/` (`useEvents`, `useTransactions`,
  `useAdminUsers`, `useEventKPIs`, `useUsers`) plus `keys.ts`.
- Most Zustand stores (`useToastStore`, `useEventFormModalStore`, …) — only `useThemeStore` is tested.
- Most pages — only `EventDetail`, `Home`, `Profile` and `AdminUsers` appear.

Scaling the reported figure by the share of files instrumented (82.68 % × 51/164) puts true frontend
statement coverage in the neighbourhood of **26 %**. That is a file-weighted estimate, not a
measurement — the uninstrumented files are not necessarily average-sized — but the order of magnitude
is the point: it is not 82 %. The backend figure, by contrast, instruments the entire `src` tree
(including migrations, `main.ts` and module files that will never be unit-tested), so 61.74 % is a
*pessimistic* but honest number.

A second, smaller distortion: the 16 `i18n/locales/en/*.json` files are counted as source files at
0 %, dragging the frontend number down while the missing 113 files drag it up.

**Fixing the Vitest config to set `coverage.all: true` with an explicit `include` is a prerequisite
for Phase 4** — otherwise the coverage target it sets will be measured against a moving denominator.

### 3.2 Backend zero-coverage hotspots

Ranked by how much they matter to phases 1 and 2:

| File | Lines | Why it matters |
|---|---|---|
| `auth/strategies/jwt/jwt.strategy.ts` | **0 %** | Every authenticated request passes through it. See §4.2. |
| `events/events.controller.ts` | **0 %** | All event routing, guards and validation decorators. |
| `transactions/transactions.controller.ts` | **0 %** | Same, for the money-carrying endpoints. |
| `events/services/event-query.service.ts` | 17.85 % | Query construction — the likely home of authorization filters. |
| `events/services/event-participants.service.ts` | 24.77 % | Participant enrichment; also the `BE-H4` N+1 site. |
| `auth/services/avatar.service.ts` | 59.42 % | The upload path that reaches `multer` (§2.1). |
| All `dto/` directories | 0 % | Validation rules are entirely unverified by unit tests. |
| `common/middleware/correlation.middleware.ts` | 0 % | — |
| `common/health.controller.ts` | 0 % | — |

The controllers and DTOs at 0 % are *partly* explained by the e2e suites covering them — but see §3.3.

Well-covered by contrast: `transactions/services/` (100 %), `users.service.ts` (97.4 %),
`event-kpis.service.ts` (97.5 %), `roles.guard.ts` (100 %), `refresh-token.service.ts` (94.3 %).

### 3.3 The integration and e2e suites run nowhere automatic

There are seven suites beyond the unit tests:

```
auth-access-control.int-spec.ts      admin-users.e2e-spec.ts
auth-refresh-token.int-spec.ts       auth.e2e-spec.ts
events-last-modified.int-spec.ts     events.e2e-spec.ts
transactions-pagination.int-spec.ts  transactions.e2e-spec.ts
users-search.int-spec.ts
```

They need PostgreSQL (`docker-compose up -d`). **`.github/workflows/deploy.yml` runs neither** — it
runs `pnpm --filter @friends/frontend lint` and `test:run`, then builds, then deploys. The backend is
not linted, unit-tested, integration-tested or e2e-tested by CI at any point, on any branch.

So the backend's real automated coverage in CI is **zero**, and the 61.74 % above only exists on a
machine where someone ran it by hand. This is `ARCH-M1` from April, still open, and it is the single
highest-leverage fix surfaced by this phase.

*Not executed in this audit:* Docker was unavailable on the audit machine and nothing was listening
on `:5432`, so the integration and e2e suites were not run. Their pass/fail state is currently
unknown — which is itself the point.

---

## 4. Triage of the April 2026 analysis

[`20260417_PROJECT_IMPROVEMENT_ANALYSIS.md`](./20260417_PROJECT_IMPROVEMENT_ANALYSIS.md) catalogues
43 findings and overlaps heavily with the scope of issues #80–#85. Phases 1–6 should treat it as
prior art rather than rediscovering it. Spot-checks below; **this is not a complete re-triage of all
43** — each phase should verify its own section.

### 4.1 Verified as fixed

| ID | Evidence |
|---|---|
| `BE-H3` — transaction soft delete | `1705500000000-AddSoftDeleteToTransactions.ts` |
| `BE-H6` — `any[]` participants DTO | `create-event.dto.ts:63` now types `EventParticipantDto[]` |
| `BE-M5` — no rate limiting | `ThrottlerGuard` registered as `APP_GUARD`, `app.module.ts:70` (60 s / 100 req) |
| `BE-M6` — unbounded token rotation | `1705600000000-AddRotationCountToRefreshTokens.ts` |
| `BE-M1` — config not schema-validated | `joi` dependency + `src/config/env.validation.ts` |
| `FE-H4` — amount input blocks cents | `TransactionForm.tsx:72` `step="0.01"`, with a regression test |
| `FE-L5` — no bundle analysis | `rollup-plugin-visualizer` behind `ANALYZE` env flag |
| `ARCH-H3` — no deployment docs | `DEPLOYMENT.md` |
| `ARCH-M2` — no pre-commit hooks | `.husky/` present |

### 4.2 Verified as still open, or only partly done

**`BE-H1` — soft-deleted users can authenticate — *not a live vulnerability, but unguarded.***
The April doc says `jwt.strategy.ts` fails to exclude soft-deleted users. In practice it is safe:
`validate()` calls `usersService.findByEmail()`, which uses `userRepository.findOne()`, and TypeORM
automatically appends `deleted_at IS NULL` for entities carrying `@DeleteDateColumn` — which `User`
does. So the behaviour is correct **by framework default, not by intent**. There is no explicit
filter, no comment recording the dependency, and `jwt.strategy.ts` sits at 0 % coverage. Adding
`withDeleted: true` to that lookup for an unrelated reason would silently reopen the hole.
**Phase 1 should pin this down with a test rather than a code change.**

*(Separately worth Phase 1's attention: the strategy looks the user up by `payload.email` rather than
`payload.sub`, even though `sub` is present. Identity keyed on a mutable field.)*

**`BE-H5` — floating-point precision — partly done.** `decimal.js` is imported in exactly one file,
`event-kpis.service.ts`, where the arithmetic is correctly done in `Decimal` and converted with
`.toNumber()` only at the response boundary. But `transaction-pagination.service.ts:154` still does
`transaction.amount = parseFloat(row.amount)`. **Phase 2 should map every path from `decimal(10,2)`
to a JS number, not assume the KPI fix generalised.**

**`BE-M3` — missing indexes — partly done.** Present: `idx_transactions_event_id`,
`idx_transactions_event_date_created`, `idx_transactions_deleted_at`, `idx_users_deleted_at`, plus
three on refresh tokens. **Still missing: `events(status, created_at)` and the GIN index on
`events.participants`** — both requested in April. Hand to **Phase 5**.

**`ARCH-M1` — backend tests absent from CI.** Still open. See §3.3.

**`ARCH-L2` — no automated dependency updates.** Still open. See §2.3.

---

## 5. What this changes for phases 1–6

| Phase | Adjustment |
|---|---|
| **#80 — Security** | Start from §4 rather than a blank sheet. Confirm `BE-H1` with a test on `jwt.strategy.ts` (0 % covered today) and look at the email-vs-`sub` lookup. The `multer` upload path in `avatar.service.ts` is both under-covered and on an unpatched version. |
| **#81 — Domain correctness** | The `decimal.js` migration is incomplete, not done — `transaction-pagination.service.ts:154` is a confirmed starting point. |
| **#82 — Architecture** | Unchanged. Note `shared-types` is still only 38 lines across 3 files, consistent with April's `ARCH-H2`. |
| **#83 — Testing** | Two blockers surface ahead of it, and both arguably belong to it: the Vitest denominator (§3.1) and backend-in-CI (§3.3). Fixing the coverage config is a prerequisite for setting any meaningful target. |
| **#84 — Performance** | Inherits two concrete leads: the missing `events` indexes (§4.2) and the triplicated `errorBoundary` chunk (§1). |
| **#85 — A11y / i18n** | Unchanged. April's `FE-M3` (incomplete i18n coverage) is unverified and in scope. |

**Recommended order change.** `ARCH-M1` (backend tests in CI) is worth pulling forward ahead of the
remaining phases. Every phase after this one will propose backend changes, and right now nothing
automatic would catch a regression in any of them. It is a small, self-contained workflow change with
disproportionate leverage.

---

## Appendix — reproducing this audit

```bash
pnpm audit                                        # 44 advisories / 1198 deps
pnpm lint && pnpm -r build                        # both exit 0
pnpm --filter @friends/frontend test:coverage     # 224 tests, 51/164 files instrumented
pnpm --filter @friends/backend  test:coverage     # 143 tests, unit only

# Not run in this pass — require PostgreSQL:
cd apps/backend && docker-compose up -d
pnpm --filter @friends/backend test:int
pnpm --filter @friends/backend test:e2e
```

Advisory counts drift as new CVEs are published; the triage in §2, not the totals, is the durable
part of this document.
