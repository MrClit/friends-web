# @friends/frontend

> React 19 + TypeScript frontend application for managing shared expenses at events

This is the frontend workspace of the Friends monorepo. Built with Vite, Zustand, TailwindCSS v4, and i18next for multi-language support.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Demo](#demo)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [Contributing](#contributing)

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 7
- **State Management:** Zustand (with LocalStorage persistence)
- **Styling:** TailwindCSS v4 + @tailwindcss/vite
- **UI Components:** Radix UI primitives
- **Icons:** react-icons
- **Routing:** React Router DOM 7 (HashRouter for GitHub Pages)
- **i18n:** i18next + react-i18next
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint 9 (flat config)

## Features

- ⚡️ Fast development with Vite and React Fast Refresh
- ⚛️ React 19 with hooks and functional components
- 🎨 TailwindCSS v4 with dark mode support
- 🌐 Multi-language support (Spanish, English, Catalan)
- 🧩 Feature-based modular architecture
- 📦 Scalable and maintainable codebase
- 👫 Event management: create, edit, delete
- 👥 Participant management per event
- 💸 Transaction management: contributions, expenses, and compensations
- 🏦 Pot expenses support (shared expenses from common pot)
- 📊 Event detail page with KPIs and drill-down
- ⏬ **Infinite scroll** for transaction lists (date-based pagination)
- ➕ Reusable and accessible forms and modals
- 🗃️ Persistent state with Zustand + LocalStorage
- 🌙 Dark mode support and theme selector
- 🔄 Navigation with React Router DOM 7
- ✅ Comprehensive test coverage (58 tests)

## Demo

You can try the app live here:
[https://mrclit.github.io/friends-web/](https://mrclit.github.io/friends-web/)

## Getting Started

From the **monorepo root**:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Or specifically target frontend
pnpm --filter @friends/frontend dev
```

From **this directory** (`apps/frontend/`):

```bash
# Install dependencies (if not already installed)
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173/friends-web/`

## Available Scripts

```bash
pnpm dev        # Start the development server (Vite)
pnpm build      # TypeScript check + production build
pnpm preview    # Preview the production build
pnpm lint       # Run ESLint
pnpm test       # Run tests in watch mode
pnpm test:run   # Run tests once
pnpm test:ui    # Open Vitest UI
pnpm test:coverage # Generate coverage report
```

## Project Structure

```
src/
├─ assets/           # Images and resources
├─ components/
│  └─ ui/            # Radix UI primitives (dropdown-menu, etc.)
├─ features/         # Domain modules (feature-based organization)
│  ├─ events/
│  │  ├─ components/   # Event UI components
│  │  ├─ store/        # Event state (Zustand + tests)
│  │  ├─ types.ts      # Event TypeScript types
│  │  └─ index.ts      # Public API exports
│  ├─ kpi/
│  │  ├─ components/   # KPI detail components
│  │  ├─ types.ts      # KPI types
│  │  └─ index.ts
│  └─ transactions/
│     ├─ components/   # Transaction UI components (with tests)
│     ├─ store/        # Transaction state (Zustand + tests)
│     ├─ constants.ts  # Payment type configuration
│     ├─ types.ts      # Transaction types
│     └─ index.ts
├─ i18n/             # Internationalization
│  ├─ index.ts       # i18next setup and locale mapping
│  └─ locales/       # Translation files
│     ├─ ca/         # Catalan
│     ├─ en/         # English
│     └─ es/         # Spanish (default)
├─ lib/
│  └─ utils.ts       # Utility functions (cn for classnames)
├─ pages/            # Page components
│  ├─ Home.tsx       # Events list
│  ├─ EventDetail.tsx  # Event detail with KPIs
│  └─ KPIDetail.tsx    # KPI drill-down
├─ shared/           # Shared/reusable code
│  ├─ components/    # Reusable UI (ConfirmDialog, DarkModeToggle, etc.)
│  ├─ constants/     # Shared constants (POT_PARTICIPANT_ID)
│  ├─ hooks/         # Custom hooks (useInfiniteScroll)
│  ├─ store/         # Global state (theme)
│  ├─ utils/         # Utilities (formatAmount, formatDateLong)
│  └─ demo/          # Demo data generator
├─ test/
│  └─ setup.ts       # Vitest setup (localStorage mock, jest-dom)
├─ App.tsx           # Main app component with router
├─ main.tsx          # Entry point
├─ index.css         # Global styles (Tailwind imports)
└─ vite-env.d.ts     # Vite TypeScript declarations
```

### Architecture Patterns

**Feature-Based Organization:**

```
features/{feature}/
├─ components/     # Feature UI components
├─ store/          # Feature state (Zustand)
├─ types.ts        # Feature TypeScript types
├─ constants.ts    # Feature constants (optional)
└─ index.ts        # Public API (barrel exports)
```

**State Management:**

- All stores use Zustand with `persist` middleware for LocalStorage sync
- Pattern: `src/features/*/store/use*Store.ts`
- Key stores: `useEventsStore`, `useTransactionsStore`, `useThemeStore`

**Path Aliases:**

- `@/*` → `src/*` (configured in `vite.config.ts`)
- Example: `import { cn } from '@/lib/utils'`

## Configuration

### Environment Variables

Create a `.env` file if you need custom variables:

```bash
VITE_API_URL=http://localhost:3000
```

### TailwindCSS

Configuration in `tailwind.config.js`. Uses TailwindCSS v4 with `@tailwindcss/vite` plugin.

### ESLint

Rules in `eslint.config.js` (flat config format). Plugins:

- `@typescript-eslint`
- `react-hooks`
- `react-refresh`

### Translations

Add languages in `src/i18n/locales/{lang}/translation.json`. Currently supports:

- `es` (Spanish - default)
- `en` (English)
- `ca` (Catalan)

Key naming pattern: `<feature>.<context>.<key>`

## Testing

Uses [Vitest](https://vitest.dev/) with [@testing-library/react](https://testing-library.com/react).

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
pnpm test:ui       # Vitest UI
pnpm test:coverage # Coverage report
```

**Test Pattern:**

- Co-locate tests with code (`*.test.ts` next to source)
- Store tests: `useEventsStore.test.ts`, `useTransactionsStore.pagination.test.ts`
- Component tests: `TransactionItem.test.tsx`
- Utility tests: `formatAmount.test.ts`, `formatDateLong.test.ts`

**Current Coverage:**

- ✅ 58 tests passing
- Store tests (events, transactions)
- Component tests (UI interactions)
- Utility tests (formatters, helpers)

## Contributing

This frontend is part of the Friends monorepo. For general contribution guidelines, see the [root README](../../README.md).

### Frontend-Specific Guidelines

1. **Components:** Use functional components with hooks only
2. **Naming:** camelCase for variables/functions, PascalCase for components
3. **Imports:** Use path aliases (`@/`) and feature barrel exports
4. **Styling:** Use Tailwind utility classes with `cn()` helper
5. **Types:** Define in feature `types.ts`, avoid `any`
6. **State:** Use Zustand stores, avoid prop drilling
7. **Testing:** Write tests for stores, components, and utilities
8. **i18n:** Add translations for all three languages

---

> Part of the Friends monorepo • [Back to root](../../)
