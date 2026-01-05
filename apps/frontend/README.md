# @friends/frontend

> React 19 + TypeScript frontend application for managing shared expenses at events

This is the frontend workspace of the Friends monorepo. A modern web application for tracking contributions, expenses, and compensations at group events, with support for multiple languages and persistent local storage.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [TailwindCSS](#tailwindcss)
  - [ESLint](#eslint)
  - [Translations](#translations)
- [Testing](#testing)

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 7
- **State Management:**
  - TanStack Query v5 (server state, caching)
  - Zustand (UI state)
- **Backend Integration:** REST API + PostgreSQL
- **Styling:** TailwindCSS v4 + @tailwindcss/vite
- **UI Components:** Radix UI primitives
- **Icons:** react-icons (Font Awesome, Material Design)
- **Routing:** React Router DOM 7 (HashRouter for GitHub Pages)
- **i18n:** i18next + react-i18next (Spanish, English, Catalan)
- **HTTP Client:** Fetch API with custom wrapper
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint 9 (flat config)

## Features

### Event Management

- ✅ Create, edit, and delete events
- 📅 Store event name, date, and location
- 👥 Manage participants per event
- 💾 **Data persistence:** Events stored in PostgreSQL backend via REST API
- 🔄 **Real-time sync:** Automatic cache invalidation and background refetch

### Transaction Management

- 💰 Three transaction types:
  - **Contributions:** Money added to the event pot
  - **Expenses:** Money spent by participants
  - **Compensations:** Reimbursements between participants
- 🏦 **Pot expenses:** Special expenses made from the common pot (shared costs)
- ⏬ **Infinite scroll:** Date-based pagination for large transaction lists
- 🔍 Display transactions with date, participant, amount, and concept
- 📊 Visual indicators with icons and colors per transaction type

### KPI Dashboard

- 📈 Event summary with key performance indicators:
  - **Balance:** Current balance per participant
  - **Contributions:** Total contributed by each participant
  - **Expenses:** Total spent by each participant
  - **Pending:** Amounts pending compensation
- 🔄 Drill-down navigation to detailed KPI views
- 🏦 Separate display for pot expenses with distinctive styling

### User Experience

- 🌐 **Multi-language support:** Spanish (default), English, and Catalan
- 🌙 **Dark mode:** Toggle between light and dark themes
- 📱 **Responsive design:** Optimized for mobile and desktop
- ♿ **Accessibility:** ARIA labels and keyboard navigation
- 💾 **Data persistence:** All data stored in PostgreSQL backend
- 🔄 **Smart caching:** TanStack Query with automatic revalidation
- 🎨 **Visual feedback:** Loading states, error handling, and success messages
- ⚠️ **Unsaved changes protection:** Confirmation dialogs when closing forms with modifications
- 🚀 **Optimistic updates:** Instant UI feedback with automatic rollback on errors

### Developer Experience

- ⚡️ Fast development with Vite and React Fast Refresh
- 🧩 Feature-based modular architecture
- 🎯 Type-safe with TypeScript strict mode
- 📡 **Backend integration:** REST API with TanStack Query (React Query)
- 📦 Component library with Radix UI primitives
- 🔧 Centralized configuration with environment variables
- 🐛 React Query DevTools for cache inspection
- ✅ Comprehensive test suite (58 tests passing)

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
pnpm dev           # Start the development server (Vite)
pnpm build         # TypeScript check + production build
pnpm preview       # Preview the production build
pnpm lint          # Run ESLint
pnpm lint:fix      # Run ESLint and auto-fix issues
pnpm test          # Run tests in watch mode
pnpm test:watch    # Run tests in watch mode (alias)
pnpm test:run      # Run tests once (CI mode)
pnpm test:ui       # Open Vitest UI
pnpm test:coverage # Generate coverage report
pnpm clean         # Clean build artifacts and cache
```

## Project Structure

```
src/
├─ api/              # Backend API communication layer
│  ├─ client.ts      # Base fetch wrapper with error handling
│  ├─ events.api.ts  # Events endpoints (CRUD operations)
│  ├─ transactions.api.ts # Transactions endpoints (CRUD + pagination)
│  └─ types.ts       # API DTOs (request/response types)
├─ assets/           # Images and resources
├─ components/
│  └─ ui/            # Radix UI primitives (dropdown-menu, dialog, etc.)
├─ config/
│  └─ env.ts         # Environment configuration helper
├─ features/         # Domain modules (feature-based organization)
│  ├─ events/
│  │  ├─ components/   # Event UI components
│  │  ├─ store/        # UI state only (useEventsUIStore)
│  │  ├─ types.ts      # Event TypeScript types
│  │  └─ index.ts      # Public API exports
│  ├─ kpi/
│  │  ├─ components/   # KPI detail components
│  │  ├─ types.ts      # KPI types
│  │  └─ index.ts
│  └─ transactions/
│     ├─ components/   # Transaction UI components
│     ├─ store/        # UI state only (useTransactionsUIStore)
│     ├─ constants.ts  # Payment type configuration
│     ├─ types.ts      # Transaction types
│     └─ index.ts
├─ hooks/
│  └─ api/           # React Query hooks (server state)
│     ├─ keys.ts      # Centralized query keys
│     ├─ useEvents.ts # Events queries and mutations
│     ├─ useTransactions.ts # Transactions queries and mutations
│     └─ useEventKPIs.ts # Computed KPIs from queries
├─ i18n/             # Internationalization
│  ├─ index.ts       # i18next setup and locale mapping
│  └─ locales/       # Translation files
│     ├─ ca/         # Catalan
│     ├─ en/         # English
│     └─ es/         # Spanish (default)
├─ lib/
│  ├─ queryClient.ts # TanStack Query client configuration
│  └─ utils.ts       # Utility functions (cn for classnames)
├─ pages/            # Page components
│  ├─ Home.tsx       # Events list
│  ├─ EventDetail.tsx  # Event detail with KPIs
│  └─ KPIDetail.tsx    # KPI drill-down
├─ providers/
│  └─ QueryProvider.tsx # TanStack Query provider setup
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

Each feature is self-contained with its own components, state, types, and constants:

```
features/{feature}/
├─ components/     # Feature UI components
├─ store/          # Feature state (Zustand with persist)
├─ types.ts        # Feature TypeScript types
├─ constants.ts    # Feature constants (optional)
└─ index.ts        # Public API (barrel exports)
```

**State Management Architecture:**

The application uses a hybrid state management approach with clear separation of responsibilities:

**React Query (TanStack Query) - Server State:**

- Manages all data from the backend REST API
- Located in `src/hooks/api/`
- Key hooks:
  - `useEvents()` - Fetch events list
  - `useEvent(id)` - Fetch single event
  - `useCreateEvent()`, `useUpdateEvent()`, `useDeleteEvent()` - Event mutations
  - `useTransactionsByEvent(eventId)` - Fetch transactions
  - `useTransactionsPaginated(eventId)` - Infinite scroll pagination
  - `useCreateTransaction()`, `useUpdateTransaction()`, `useDeleteTransaction()` - Transaction mutations
  - `useEventKPIs(eventId)` - Computed KPIs from transaction data
- **Features:**
  - Automatic caching and invalidation
  - Optimistic updates for better UX
  - Background refetch on window focus
  - Query deduplication
  - DevTools integration

**Zustand - UI State (Local Only):**

- Manages ephemeral UI state (modals, filters, selections)
- Store files: `src/features/*/store/use*UIStore.ts`
- Key stores:
  - `useEventsUIStore` - Modal state, event selection, filter text
  - `useTransactionsUIStore` - Modal state, filter type, transaction selection
  - `useThemeStore` - Theme preferences (light/dark mode) with localStorage
- **No `persist` middleware** (except theme store)
- No CRUD operations (handled by React Query)

**Data Integrity:**

- **Cascade deletes:** Backend handles with TypeORM `onDelete: 'CASCADE'`
- **Cache invalidation:** React Query invalidates related queries after mutations
- **Participant cleanup:** Handled in backend before updating events

**Transaction System:**

Three payment types:

- **Contribution:** Money added to event pot
- **Expense:** Money spent from pot by participant
- **Compensation:** Reimbursements to balance accounts

Special features:

- **Pot expenses:** Special participant ID (`'0'`) for common pot expenses
- **Payment type config:** Centralized configuration with icons and colors in `constants.ts`
- **Infinite scroll:** Date-based pagination for large transaction lists

**KPI Calculations:**

All KPIs computed per-event AND per-participant:

- **Balance:** Total contributions - expenses - compensations
- **Contributions:** Sum of all money added to pot
- **Expenses:** Sum of all spending (including pot expenses)
- **Pending:** Expenses not yet compensated

**Path Aliases:**

- `@/*` → `src/*` (configured in `vite.config.ts`)
- Example: `import { cn } from '@/lib/utils'`
- Use barrel exports: `import { EventsList } from '@/features/events'`

## Configuration

### Environment Variables

This project uses **Vite** for environment variable management. All variables are embedded in the code during build time and must be prefixed with `VITE_` to be exposed.

#### Available Environment Files

**Committed to repository:**

- `.env` - Default base values
- `.env.development` - Local development configuration
- `.env.production` - Production build (GitHub Pages)
- `.env.test` - Test environment (Vitest)
- `.env.local.example` - Example template

**Not committed (in .gitignore):**

- `.env.local` - Personal local overrides
- `.env.*.local` - Environment-specific local overrides

#### Available Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Feature Flags
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=false

# App Metadata
VITE_APP_NAME=Friends
VITE_APP_VERSION=0.1.0
```

#### Loading Precedence

Vite loads environment files in this order (highest to lowest priority):

1. `.env.[mode].local` (e.g., `.env.production.local`)
2. `.env.local`
3. `.env.[mode]` (e.g., `.env.production`)
4. `.env`

#### Usage in Code

**✅ Recommended** - Use the `ENV` helper:

```typescript
import { ENV } from '@/config/env';

const apiUrl = ENV.API_URL;
const isDevMode = ENV.IS_DEV;
```

**❌ Avoid** - Direct access:

```typescript
// Don't do this
const apiUrl = import.meta.env.VITE_API_URL;
```

#### Environment-Specific Scripts

```bash
# Development (uses .env.development)
pnpm dev

# Production build (uses .env.production)
pnpm build

# Test (uses .env.test)
pnpm test

# Preview production build
pnpm preview
```

#### Creating Local Overrides

To test against a different backend locally:

```bash
# Copy the example
cp .env.local.example .env.local

# Edit .env.local with your values (this file is NOT committed)
```

#### Important Security Notes

- **NEVER** put secrets in environment variables (API keys, passwords)
- All variables are **visible in browser code**
- Only variables with `VITE_` prefix are exposed
- Variables are embedded at **build time**, not runtime

#### Debugging

In development mode, `src/config/env.ts` logs the configuration to console:

```
🔧 Environment Configuration: {
  mode: 'development',
  apiUrl: 'http://localhost:3000/api',
  devtools: true,
  debug: true
}
```

#### Adding New Variables

1. Add the variable to all `.env*` files:

   ```bash
   VITE_NEW_VARIABLE=value
   ```

2. Update TypeScript types in `src/vite-env.d.ts`:

   ```typescript
   interface ImportMetaEnv {
     readonly VITE_NEW_VARIABLE: string;
   }
   ```

3. Add to the helper in `src/config/env.ts`:

   ```typescript
   export const ENV = {
     NEW_VARIABLE: import.meta.env.VITE_NEW_VARIABLE,
     // ...
   };
   ```

4. Use in your code:
   ```typescript
   import { ENV } from '@/config/env';
   console.log(ENV.NEW_VARIABLE);
   ```

### TailwindCSS

Configuration in `tailwind.config.js`. Uses TailwindCSS v4 with `@tailwindcss/vite` plugin (not PostCSS).

**Color System:**

- **Teal:** Primary UI elements (buttons, headers)
- **Blue:** Contributions
- **Red:** Expenses
- **Green:** Balance/compensation
- **Yellow:** Pending amounts
- **Orange:** Pot expenses

**Utility Helper:**

```typescript
import { cn } from '@/lib/utils';

// Combines clsx and tailwind-merge for conditional classes
className={cn('base-class', { 'conditional-class': condition })}
```

### ESLint

Rules in `eslint.config.js` (flat config format). Plugins:

- `@typescript-eslint` - TypeScript linting
- `react-hooks` - React Hooks rules
- `react-refresh` - Fast Refresh compatibility

### Translations

Translation files located in `src/i18n/locales/{lang}/translation.json`.

**Supported Languages:**

- `es` (Spanish - default)
- `en` (English)
- `ca` (Catalan)

**Key Naming Pattern:**

```
<feature>.<context>.<key>
```

**Examples:**

```json
{
  "events": {
    "form": {
      "title": "Event Title"
    }
  }
}
```

**Usage:**

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const title = t('events.form.title');
```

**Locale Mapping:**

- `'es'` → `'es-ES'` (España)
- `'en'` → `'en-US'` (United States)
- `'ca'` → `'ca-ES'` (Catalunya)

**Formatting Utilities:**

```typescript
// Amount formatting (locale-aware)
import { formatAmount } from '@/shared/utils/formatAmount';
formatAmount(1234.56); // "1.234,56 €" (in Spanish)

// Date formatting (locale-aware)
import { formatDateLong } from '@/shared/utils/formatDateLong';
formatDateLong('2026-01-05'); // "domingo, 5 de enero de 2026" (in Spanish)
```

## Testing

Uses [Vitest](https://vitest.dev/) with [@testing-library/react](https://testing-library.com/react) for component testing.

### Running Tests

```bash
pnpm test          # Watch mode (interactive)
pnpm test:run      # Single run (CI)
pnpm test:ui       # Vitest UI interface
pnpm test:coverage # Generate coverage report
```

### Test Organization

Tests are co-located with source code (`*.test.ts` or `*.test.tsx` next to the file being tested):

- **Store tests:** `useEventsStore.test.ts`, `useTransactionsStore.test.ts`, `useTransactionsStore.pagination.test.ts`
- **Component tests:** `TransactionItem.test.tsx`
- **Utility tests:** `formatAmount.test.ts`, `formatDateLong.test.ts`
- **Hook tests:** `useInfiniteScroll.test.ts`

### Test Setup

Configuration in `src/test/setup.ts`:

- Mocks `localStorage` for Zustand persistence
- Extends Jest DOM matchers for better assertions
- Configures React Testing Library

### Coverage

✅ **58 tests passing** covering:

- State management (events, transactions)
- UI components and interactions
- Utility functions and formatters
- Custom React hooks
- Transaction pagination logic

---

**Part of the Friends monorepo**  
[← Back to monorepo root](../../README.md) | [View Backend API →](../backend/README.md)

### Related Documentation

- [Backend API Documentation](../backend/README.md) - REST API endpoints and database schema
- [API Integration Guide](../../docs/FRONTEND_API_INTEGRATION.md) - How this frontend integrates with the backend
