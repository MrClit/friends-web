# Friends - Expense Sharing Platform

> Monorepo for managing shared expenses at events • React 19 + NestJS

A modern web application to help groups track expenses, contributions, and compensations at shared events. Built with TypeScript and organized as a pnpm monorepo with separate frontend and backend workspaces.

## Table of Contents

- [Live Demo](#-live-demo)
- [Workspaces](#️-workspaces)
- [Quick Start](#-quick-start)
- [Monorepo Management](#️-monorepo-management)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [License](#license)

---

## ✨ Live Demo

You can try the app live here: **[https://mrclit.github.io/friends-web/](https://mrclit.github.io/friends-web/)**

The demo includes sample data to explore all features:

- Event management and participant tracking
- Transaction types (contributions, expenses, compensations)
- Pot expenses (shared costs)
- KPI dashboard with drill-down details
- Multi-language support (Spanish, English, Catalan)
- Dark mode

All data is stored locally in your browser (no backend required for demo).

---

## 🏗️ Workspaces

This is a **pnpm monorepo** containing:

| Workspace                                           | Description                        | Status         |
| --------------------------------------------------- | ---------------------------------- | -------------- |
| **[@friends/frontend](apps/frontend/)**             | React 19 + TanStack Query frontend | ✅ Operational |
| **[@friends/backend](apps/backend/)**               | NestJS + PostgreSQL API backend    | ✅ Operational |
| **[@friends/shared-types](packages/shared-types/)** | Shared TypeScript types            | 🚧 Planned     |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/MrClit/friends-web.git
cd friends-web

# Install dependencies (uses pnpm workspaces)
pnpm install

# Start frontend development server
pnpm dev

# Run all tests
pnpm test

# Build for production
pnpm build
```

---

## �️ Monorepo Management

### Package Manager

- **pnpm v10.27.0** with workspaces
- Configured in `pnpm-workspace.yaml`
- Lock file: `pnpm-lock.yaml`

### Working with Workspaces

```bash
# Install dependencies for all workspaces
pnpm install

# Run commands in specific workspace
pnpm --filter @friends/frontend dev
pnpm --filter @friends/frontend test

# Run commands in all workspaces
pnpm -r build
pnpm -r test

# Add dependency to specific workspace
pnpm --filter @friends/frontend add lodash
pnpm --filter @friends/backend add @nestjs/core

# Add dev dependency to root
pnpm add -D -w husky
```

### Available Scripts

```bash
# Development
pnpm dev          # Start frontend dev server
pnpm dev:backend  # Start backend dev server

# Build
pnpm build        # Build frontend for production
pnpm build:backend # Build backend for production

# Testing
pnpm test         # Run frontend tests
pnpm test:run     # Run frontend tests (CI mode)
pnpm -r test:run  # Run tests in all workspaces

# Code Quality
pnpm lint         # Lint frontend code
```

---

## 📂 Project Structure

```
friends-web/
├── apps/
│   ├── frontend/           # React frontend application
│   │   ├── src/
│   │   ├── package.json    # @friends/frontend
│   │   └── README.md
│   └── backend/            # NestJS backend (planned)
│       ├── src/
│       ├── package.json    # @friends/backend
│       └── README.md
├── packages/
│   ├── shared-types/       # Shared TypeScript types (planned)
│   └── shared-utils/       # Shared utilities (planned)
├── docs/
│   └── MONOREPO_MIGRATION.md
├── .github/
│   ├── workflows/
│   │   └── deploy.yml      # GitHub Actions CI/CD
│   └── copilot-instructions.md
├── package.json            # Root package (friends-monorepo)
├── pnpm-workspace.yaml     # pnpm workspaces config
└── pnpm-lock.yaml          # Lockfile
```

---

## 📚 Documentation

For detailed information about each workspace, see their respective documentation:

### Workspace Documentation

- **[Frontend README](apps/frontend/README.md)** - React 19 + TanStack Query application
  - Tech stack and features
  - Architecture patterns and state management
  - Configuration and environment variables
  - Testing strategy
- **[Backend README](apps/backend/README.md)** - NestJS + PostgreSQL API
  - Tech stack and API endpoints
  - Database schema and migrations
  - Environment configuration
  - Development tools and testing

### Additional Documentation

- **[Monorepo Migration Guide](docs/MONOREPO_MIGRATION.md)** - How we migrated to pnpm monorepo
- **[Frontend API Integration](docs/FRONTEND_API_INTEGRATION.md)** - TanStack Query integration
- **[Copilot Instructions](.github/copilot-instructions.md)** - AI coding agent guidelines

---

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

---

> Project created with ❤️ using React, TypeScript, Zustand, TailwindCSS, and Vite.
