# Friends - Expense Sharing Platform

> Monorepo for managing shared expenses at events • React 19 + NestJS (planned)

A personal project to help groups track expenses, contributions, and compensations at shared events. Built with modern TypeScript stack and organized as a pnpm monorepo.

**✨ Live Demo:** [https://mrclit.github.io/friends-web/](https://mrclit.github.io/friends-web/)

---

## 🏗️ Workspaces

This is a **pnpm monorepo** containing:

| Workspace | Description | Status |
|-----------|-------------|--------|
| **[@friends/frontend](apps/frontend/)** | React 19 + Vite frontend | ✅ Production |
| **[@friends/backend](apps/backend/)** | NestJS API backend | 🚧 Planned |
| **[@friends/shared-types](packages/shared-types/)** | Shared TypeScript types | 🚧 Planned |

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

## 📦 Tech Stack

### Frontend ([@friends/frontend](apps/frontend/))
- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **State:** Zustand (with LocalStorage persistence)
- **Styling:** TailwindCSS v4
- **Routing:** React Router DOM 7
- **i18n:** i18next (Spanish, English, Catalan)
- **Testing:** Vitest + Testing Library

### Backend ([@friends/backend](apps/backend/)) - Planned
- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL + TypeORM
- **API:** RESTful + Swagger/OpenAPI
- **Auth:** JWT (planned)
- **Testing:** Jest + Supertest

### Shared
- **Package Manager:** pnpm v10.27.0 (workspaces)
- **Monorepo:** pnpm workspaces
- **CI/CD:** GitHub Actions
- **Deployment:** GitHub Pages (frontend)

---

## 📚 Documentation

- **[Frontend Documentation](apps/frontend/README.md)** - React app details, features, and architecture
- **[Monorepo Migration Guide](docs/MONOREPO_MIGRATION.md)** - How we migrated to pnpm monorepo
- **[Backend Documentation](apps/backend/README.md)** - Coming soon
- **[Copilot Instructions](.github/copilot-instructions.md)** - AI coding agent guidelines

---

## 🛠️ Development

### Working with the Monorepo

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

### Available Scripts (Root)

```bash
pnpm dev          # Start frontend dev server
pnpm build        # Build frontend for production
pnpm test         # Run frontend tests
pnpm test:run     # Run frontend tests once
pnpm lint         # Lint frontend code
```

---

## 🎯 Features

### Current (Frontend)
- ✅ Event management (create, edit, delete)
- ✅ Participant management per event
- ✅ Transaction tracking (contributions, expenses, compensations)
- ✅ Pot expenses (shared expenses from common pot)
- ✅ KPI dashboard with drill-down details
- ✅ Infinite scroll for transactions
- ✅ Multi-language support (es, en, ca)
- ✅ Dark mode
- ✅ Persistent state (LocalStorage)
- ✅ Responsive design
- ✅ 58 tests passing

### Planned (Backend)
- 🚧 RESTful API with NestJS
- 🚧 PostgreSQL database
- 🚧 User authentication (JWT)
- 🚧 Shared types between frontend/backend
- 🚧 Real-time updates (WebSockets)
- 🚧 API documentation (Swagger)

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

## 🧪 Testing

```bash
# Run tests for all workspaces
pnpm -r test:run

# Run tests for specific workspace
pnpm --filter @friends/frontend test
pnpm --filter @friends/frontend test:coverage

# Open Vitest UI
pnpm --filter @friends/frontend test:ui
```

**Current Coverage:**
- Frontend: 58 tests passing
  - Store tests (Zustand)
  - Component tests (React Testing Library)
  - Utility tests (formatters, helpers)

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test them
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Use conventional commits
- Ensure all tests pass before PR

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

---

> Project created with ❤️ using React, TypeScript, Zustand, TailwindCSS, and Vite.
