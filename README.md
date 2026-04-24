# Friends - Expense Sharing Platform

> Monorepo for managing shared expenses at events • React 19 + NestJS

A modern web application to help groups track expenses, contributions, and compensations at shared events. Built with TypeScript and organized as a pnpm monorepo with separate frontend, backend, and shared-types workspaces.

## Table of Contents

- [Live Demo](#-live-demo)
- [Workspaces](#️-workspaces)
- [Quick Start](#-quick-start)
- [Monorepo Management](#️-monorepo-management)
- [Project Structure](#-project-structure)
- [CI/CD](#-cicd)
- [Documentation](#-documentation)
- [License](#license)

---

## ✨ Live Demo

You can try the app live here: **[https://mrclit.github.io/friends-web/](https://mrclit.github.io/friends-web/)**

Features available in the demo:

- Event management and participant tracking
- Transaction types (contributions, expenses, compensations)
- Pot expenses (shared costs)
- KPI dashboard with drill-down details
- Multi-language support (Spanish, English, Catalan)
- Dark mode

---

## 🏗️ Workspaces

This is a **pnpm monorepo** containing:

| Workspace                                           | Description                        | Status         |
| --------------------------------------------------- | ---------------------------------- | -------------- |
| **[@friends/frontend](apps/frontend/)**             | React 19 + TanStack Query frontend | ✅ Operational |
| **[@friends/backend](apps/backend/)**               | NestJS + PostgreSQL API backend    | ✅ Operational |
| **[@friends/shared-types](packages/shared-types/)** | Shared TypeScript types            | ✅ Operational |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/MrClit/friends-web.git
cd friends-web

# Install dependencies (uses pnpm workspaces)
pnpm install

# Start dev servers
pnpm dev:frontend   # http://localhost:5173
pnpm dev:backend    # http://localhost:3000

# Start PostgreSQL (backend requires Docker)
cd apps/backend && docker-compose up -d

# Build all workspaces
pnpm build
```

---

## 🗂️ Monorepo Management

### Package Manager

- **pnpm v10.30.1** with workspaces
- Configured in `pnpm-workspace.yaml`
- Lock file: `pnpm-lock.yaml`

### Working with Workspaces

```bash
# Install dependencies for all workspaces
pnpm install

# Run commands in a specific workspace
pnpm --filter @friends/frontend dev
pnpm --filter @friends/backend dev

# Run commands in all workspaces
pnpm -r build
pnpm -r test:run

# Add dependency to a specific workspace
pnpm --filter @friends/frontend add lodash
pnpm --filter @friends/backend add @nestjs/core

# Add dev dependency to root
pnpm add -D -w husky
```

### Available Scripts

```bash
# Development
pnpm dev:frontend     # Start frontend dev server (localhost:5173)
pnpm dev:backend      # Start backend dev server (localhost:3000)

# Build
pnpm build            # Build all workspaces
pnpm build:frontend   # Build frontend only
pnpm build:backend    # Build backend only

# Testing
pnpm test             # Run all workspace tests (CI mode)
pnpm test:watch       # Run all workspace tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Lint all workspaces
pnpm lint:fix         # Lint and auto-fix all workspaces
pnpm format           # Format with Prettier
pnpm format:check     # Check Prettier formatting

# Other
pnpm clean            # Remove all node_modules and build artifacts
pnpm release:prod     # Merge develop → main and trigger production deploy
```

---

## 📂 Project Structure

```
friends-web/
├── apps/
│   ├── frontend/           # @friends/frontend — React 19 application
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── backend/            # @friends/backend — NestJS API
│       ├── src/
│       ├── docker-compose.yml
│       ├── package.json
│       └── README.md
├── packages/
│   └── shared-types/       # @friends/shared-types — shared TS types
│       ├── src/
│       └── package.json
├── docs/                   # Implementation specs and architecture docs
├── scripts/
│   └── release-to-prod.mjs # Production release script
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Auto-deploy frontend on push to main
│       ├── release-to-prod.yml # Manual production release
│       └── backend-tests.yml   # Manual backend test run
├── package.json            # Root package (friends-monorepo)
├── pnpm-workspace.yaml     # pnpm workspaces config
└── pnpm-lock.yaml          # Lockfile
```

---

## 🔄 CI/CD

| Workflow              | Trigger              | Description                                              |
| --------------------- | -------------------- | -------------------------------------------------------- |
| **deploy.yml**        | Push to `main`       | Lints, tests, builds frontend, deploys to GitHub Pages   |
| **release-to-prod.yml** | Manual (`workflow_dispatch`) | Merges `develop` → `main` to trigger a production release |
| **backend-tests.yml** | Manual (`workflow_dispatch`) | Runs backend test suite against a PostgreSQL service container |

---

## 📚 Documentation

Workspace-level READMEs:

- **[Frontend README](apps/frontend/README.md)** — React 19 + TanStack Query, architecture, state management, env vars, testing
- **[Backend README](apps/backend/README.md)** — NestJS + PostgreSQL, API endpoints, migrations, env vars, testing
- **[Shared Types README](packages/shared-types/README.md)** — shared TS types used across workspaces

Implementation plans and architecture docs live in **[docs/](docs/)**.

---

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
