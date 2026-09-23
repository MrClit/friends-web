# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Friends is an expense-sharing platform for group events. pnpm monorepo with:
- `@friends/frontend` → `apps/frontend/` — React 19 + TanStack Query + Zustand
- `@friends/backend` → `apps/backend/` — NestJS + TypeORM + PostgreSQL
- `@friends/shared-types` → `packages/shared-types/` — Shared TypeScript types

Versioning is SemVer on the **root `package.json` only**; every workspace manifest is private and stays at
`0.0.0`. Infrastructure and production operations are documented in [DEPLOYMENT.md](DEPLOYMENT.md) — it is
canonical, do not restate it here.

Frontend, backend and skill-wiring specifics live in `.claude/rules/` (`frontend.md`, `backend.md`,
`skills-wiring.md`) and load only when a file matching their `paths:` is read.

## Commands

```bash
# Install
pnpm install

# Dev servers
pnpm dev:frontend        # localhost:5173
pnpm dev:backend         # localhost:3000

# Build
pnpm -r build

# Lint & format
pnpm lint
pnpm lint:fix
pnpm format

# Frontend tests (Vitest)
pnpm --filter @friends/frontend test        # watch
pnpm --filter @friends/frontend test:run    # CI
pnpm --filter @friends/frontend test:coverage
pnpm --filter @friends/frontend test:run -- src/api/client.test.ts   # single file
pnpm --filter @friends/frontend test:run -- -t "refreshes the token"  # single test

# Backend tests (Jest) — three separate suites, three configs
pnpm --filter @friends/backend test         # unit, watch
pnpm --filter @friends/backend test:run     # unit + coverage (this is what root `pnpm test` runs)
pnpm --filter @friends/backend test:int     # integration — needs Postgres + .env.test
pnpm --filter @friends/backend test:e2e     # e2e — needs Postgres + .env.test
pnpm --filter @friends/backend test:all     # the three of them
pnpm --filter @friends/backend check:backend  # lint + test:all
pnpm --filter @friends/backend test:e2e -- test/events.e2e-spec.ts   # single file

# Backend DB
cd apps/backend && docker-compose up -d     # start PostgreSQL
pnpm --filter @friends/backend migration:run
```

**Type-checking only happens in `build`.** `check:backend` runs lint + tests, neither of which type-checks;
`pnpm build` is the only thing that does (frontend `tsc -b`, backend `nest build`). A change can be green on
`check:backend` and still fail to compile.

**`@friends/shared-types` is consumed from `dist/`.** Both apps import the built output, so a change there
needs `pnpm --filter @friends/shared-types build` before the consumers see it (root `pnpm lint`, `pnpm test`
and `pnpm build` do this themselves; a watching dev server does not).

## Domain Model

**Participant** (JSONB union in Event):
- `UserParticipant`: `{ type: 'user', id: UUID, name?, email?, avatar?, contributionTarget? }`
- `GuestParticipant`: `{ type: 'guest', id: string, name: string, contributionTarget? }`
- `PotParticipant`: `{ type: 'pot', id: '0' }` — shared expenses (amber UI), no target

`contributionTarget` is what each participant is expected to put in; the *pending* KPI is
`netContribution - contributionTarget` per participant. Dropping it when building a participant silently
zeroes that KPI.

**Event:** id, title, description?, icon?, status (`active` | `archived`), participants (JSONB), timestamps

**Transaction:** id, title, paymentType (`contribution` | `expense` | `compensation`), amount (decimal 10,2), participantId, date, eventId (FK), timestamps

## GitHub Workflow

Repository: `MrClit/friends-web`

Any GitHub operation — issues, project board, branches, commits, PRs, merges, releases — goes
through the `gh-workflow` skill (and the `release` skill for production releases). Delegate the
execution to the `gh-ops` agent.

This repo's coordinates — board ids, branch model, labels, validation command, release pre-flight —
live in [`.claude/gh-project.md`](.claude/gh-project.md). It is the single source of truth; do not
duplicate any of it here.

Those two skills and the agent are **user-level configuration, deliberately not vendored into this
repo** — they are generic and shared across several projects, while `gh-project.md` holds everything
specific to this one. If they are not available in the current environment, say so and stop: do not
improvise a GitHub flow, and do not commit, push, open or merge anything without them.

## Conventions

**Git commits:** `type(scope): description` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` — scopes: `frontend`, `backend`, `shared-types`, `ci`, `docs`, `a11y`

**Code language:** All comments, JSDoc, and type descriptions in English. i18n translation files stay in their own languages.

**Planning a feature.** Two separate artifacts, do not merge them:

- **The what and the why → the GitHub issue.** Motivation, behavior contract (happy path + edge cases),
  what is explicitly out of scope, open questions. This is human input; it cannot be derived from the code.
  Write it before planning — otherwise the plan is built on guesses.
- **The how → plan mode / the `Plan` agent, in session.** Task order, files to touch, test cases. Ephemeral
  and regenerated from the current code, so it never goes stale. Do not write it to a file.

`/docs` is **not** the folder for implementation plans. It holds only living reference documents — a design
that is still pending execution, or a runbook that is still valid. A doc that describes work already shipped
must be deleted, not archived: the code is the truth, and the issue plus its PR are the record. An agent
cannot tell a stale doc from a current one, so a wrong doc costs more than a missing one.

## Skills

Best-practice guides load **automatically** by description — there is no need to link or read them by
path from here: `nestjs-best-practices`, `vercel-react-best-practices`, `vercel-composition-patterns`,
`tailwind-css-patterns`, `tailwind-inline-cn`, `accessibility`, `typescript-advanced-types`, `vite`,
`vitest`.

The frontend-specific caveats for these skills live in `.claude/rules/frontend.md`.
