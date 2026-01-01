# Friends Monorepo - AI Coding Agent Instructions

## 🏗️ Monorepo Overview

Friends is a **pnpm monorepo** for managing shared expenses at events. The project is organized into workspaces for scalability and code sharing.

### Project Structure
```
friends-web/
├── apps/
│   ├── frontend/          # @friends/frontend - React 19 app
│   └── backend/           # @friends/backend - NestJS API (planned)
├── packages/
│   ├── shared-types/      # @friends/shared-types - Shared TypeScript types (planned)
│   └── shared-utils/      # @friends/shared-utils - Shared utilities (planned)
├── docs/                  # Documentation
├── .github/
│   └── workflows/         # CI/CD pipelines
├── package.json           # Root package (friends-monorepo)
└── pnpm-workspace.yaml    # Workspace configuration
```

### Package Manager (pnpm)
- **Version**: v10.27.0
- **Configuration**: `"packageManager": "pnpm@10.27.0"` in root package.json
- **Lock file**: `pnpm-lock.yaml` (committed to repository)
- **Workspace config**: `pnpm-workspace.yaml` defines workspaces in `apps/*` and `packages/*`

### Working with Workspaces

**Install dependencies:**
```bash
pnpm install              # Install all workspaces
```

**Run commands in specific workspace:**
```bash
pnpm --filter @friends/frontend dev
pnpm --filter @friends/frontend test
pnpm --filter @friends/backend start:dev
```

**Run commands in all workspaces:**
```bash
pnpm -r build            # Build all workspaces
pnpm -r test             # Test all workspaces
pnpm -r --parallel dev   # Run dev servers in parallel
```

**Add dependencies:**
```bash
# To specific workspace
pnpm --filter @friends/frontend add react-query
pnpm --filter @friends/backend add @nestjs/typeorm

# To root (dev dependencies shared across all workspaces)
pnpm add -D -w husky

# Workspace dependencies (internal)
pnpm --filter @friends/frontend add @friends/shared-types@workspace:*
```

### Monorepo Conventions

**Naming:**
- Workspaces use scoped names: `@friends/{workspace}`
- Frontend: `@friends/frontend`
- Backend: `@friends/backend`
- Shared packages: `@friends/shared-*`

**Imports between workspaces:**
```typescript
// Import from shared-types in frontend or backend
import { Event, Transaction } from '@friends/shared-types';

// Import from shared-utils
import { formatCurrency } from '@friends/shared-utils';
```

**Path references:**
- Use relative paths within a workspace: `import { cn } from '@/lib/utils'`
- Use package names for cross-workspace: `import { Event } from '@friends/shared-types'`

---

## 📱 Frontend (@friends/frontend)

Located in `apps/frontend/`. React 19 + TypeScript application for the UI.

### Tech Stack
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **State Management**: Zustand (with LocalStorage persistence)
- **Styling**: TailwindCSS v4 + @tailwindcss/vite
- **UI Components**: Radix UI primitives
- **Icons**: react-icons
- **Routing**: React Router DOM 7 (HashRouter)
- **i18n**: i18next + react-i18next (es, en, ca)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint 9 (flat config)

### Frontend Development Workflow

**From monorepo root:**
```bash
pnpm dev                 # Start frontend dev server
pnpm build              # Build frontend
pnpm test               # Run frontend tests
pnpm lint               # Lint frontend
```

**From `apps/frontend/`:**
```bash
pnpm dev                # Dev server at localhost:5173/friends-web/
pnpm build             # TypeScript check + Vite build
pnpm preview           # Preview production build
pnpm test              # Vitest watch mode
pnpm test:run          # Vitest single run
pnpm test:ui           # Vitest UI
pnpm test:coverage     # Coverage report
pnpm lint              # ESLint check
```

### Frontend Architecture

**Feature-Based Organization:**
```
apps/frontend/src/features/{feature}/
  ├─ components/       # Feature UI components
  ├─ store/           # Feature Zustand store
  ├─ types.ts         # Feature TypeScript types
  ├─ constants.ts     # Feature constants (optional)
  └─ index.ts         # Public API exports
```

- **Features**: `events`, `transactions`, `kpi`
- **Barrel exports**: `import { EventsList } from '@/features/events'`
- **Never import directly from store files** - use store hooks

**State Management (Zustand + LocalStorage):**
- All stores use Zustand with `persist` middleware for automatic localStorage sync
- Store pattern: `apps/frontend/src/features/*/store/use*Store.ts`
- Key stores: `useEventsStore`, `useTransactionsStore`, `useThemeStore`
- **Critical**: When deleting an event, cascade delete transactions via `useTransactionsStore.getState().deleteTransactionsByEvent()`
- **Participant removal**: Clear removed participants from transactions via `clearParticipantFromEventTransactions()`

**Transaction System:**
Three payment types:
- `contribution`: Money added to event pot
- `expense`: Money spent from pot by participant
- `compensation`: Reimbursements to balance accounts

Constants:
- `PAYMENT_TYPES`: Array of all payment types
- `PAYMENT_TYPE_CONFIG`: Centralized config with icons and color variants
- `POT_CONFIG`: Special config for pot expenses (piggy bank icon, orange colors)

**Pot System:**
- `POT_PARTICIPANT_ID = '0'`: Special ID representing common pot
- Pot can only make expenses (not contributions or compensations)
- Pot expenses shown in KPI details with orange styling

**KPI System:**
- `KPIType`: `'balance' | 'contributions' | 'expenses' | 'pending'`
- All KPIs computed per-event AND per-participant
- Helper: `isPotExpense(transaction)` to check pot expenses

**Internationalization (i18next):**
- Languages: `en`, `es` (default), `ca`
- Files: `apps/frontend/src/i18n/locales/{lang}/translation.json`
- Key naming: `<feature>.<context>.<key>` (e.g., `events.form.title`)
- Locale mapping: `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`
- In components: `const { t } = useTranslation()` then `t('key.path')`
- **Amount formatting**: Use `formatAmount(amount, currency = 'EUR', useGrouping = true)`
- **Date formatting**: Use `formatDateLong(dateStr)` for locale-aware dates

**Styling (TailwindCSS v4):**
- Uses `@tailwindcss/vite` plugin (not PostCSS)
- Utility helper: `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Theme: Teal primary, dark mode support
- Color conventions:
  - Teal: Primary UI
  - Blue: Contributions
  - Red: Expenses
  - Green: Balance/compensation
  - Yellow: Pending amounts
  - Orange: Pot expenses

**Path Aliases:**
```typescript
"@": "apps/frontend/src"  // Configured in vite.config.ts
```
Use `@/` for internal imports: `import { cn } from '@/lib/utils'`

**Routing (React Router DOM 7):**
- Uses `HashRouter` (GitHub Pages compatibility)
- Routes:
  - `/` - Home (events list)
  - `/event/:id` - Event detail
  - `/event/:id/kpi/:kpi` - KPI drill-down
- Navigation: `useNavigate()` hook
- Route params: `useParams<{ id: string }>()`

**Testing (Vitest + Testing Library):**
- Setup: `apps/frontend/src/test/setup.ts` (mocks localStorage, jest-dom matchers)
- Pattern: Co-locate tests (`*.test.ts` next to source)
- Examples: `useEventsStore.test.ts`, `TransactionItem.test.tsx`
- Current: 58 tests passing

### Frontend Code Conventions

**Naming:**
- camelCase: variables, functions
- PascalCase: components
- useCamelCase: hooks

**Components:**
- Functional components with hooks only (no classes)
- Default exports (not named exports)
- UI Primitives: Radix UI in `apps/frontend/src/components/ui/`
- Icons: react-icons (`FaHandHoldingUsd`, `FaWallet`, `FaHandshake`, `FaPiggyBank`, `MdArrowBack`)

**Forms:**
- Controlled components with validation
- Use `required` attribute
- Disable submit when invalid
- Show loading/disabled states
- Implement dirty state tracking for unsaved changes

**Type Safety:**
- No `any` types - use proper TypeScript
- Types defined in feature `types.ts`
- Export through feature `index.ts`
- Share types across features when needed

**Common Frontend Tasks:**

1. **Add new feature:**
   - Create `apps/frontend/src/features/{feature}/`
   - Add `types.ts`, `store/use{Feature}Store.ts`, `components/`
   - Create `constants.ts` if needed
   - Export via `index.ts`
   - Add translations for es, en, ca

2. **Add translations:**
   - Update all three locale files
   - Use nesting: `feature.component.key`
   - Support pluralization (`_one`, `_other`)

3. **Create KPIs:**
   - Add calculation to `useTransactionsStore`
   - Update `KPIType` union
   - Add KPI configuration
   - Create UI component
   - Add translations

---

## 🔧 Backend (@friends/backend) - Planned

Located in `apps/backend/`. NestJS + TypeScript API.

### Planned Tech Stack
- **Framework**: NestJS 10+
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Validation**: class-validator + class-transformer
- **Auth**: Passport.js + JWT
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Configuration**: @nestjs/config

### Backend Development Workflow (When Ready)

**From monorepo root:**
```bash
pnpm dev:backend        # Start backend dev server
pnpm build:backend      # Build backend
```

**From `apps/backend/`:**
```bash
pnpm start:dev          # Start in watch mode
pnpm build             # Build for production
pnpm start:prod        # Start production server
pnpm test              # Run unit tests
pnpm test:e2e          # Run E2E tests
pnpm test:cov          # Generate coverage
```

### Planned Backend Architecture

**Module Structure:**
```
apps/backend/src/modules/{module}/
  ├─ {module}.controller.ts    # HTTP endpoints
  ├─ {module}.service.ts       # Business logic
  ├─ {module}.module.ts        # Module definition
  ├─ entities/                 # TypeORM entities
  │  └─ {module}.entity.ts
  └─ dto/                      # Data Transfer Objects
     ├─ create-{module}.dto.ts
     └─ update-{module}.dto.ts
```

**Planned Modules:**
- `events`: Event CRUD operations
- `transactions`: Transaction management
- `participants`: Participant management
- `auth`: Authentication (JWT)

**API Endpoints (Planned):**
```
# Events
GET    /api/events
POST   /api/events
GET    /api/events/:id
PATCH  /api/events/:id
DELETE /api/events/:id

# Transactions
GET    /api/events/:eventId/transactions
POST   /api/events/:eventId/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

# Participants
GET    /api/events/:eventId/participants
POST   /api/events/:eventId/participants
DELETE /api/participants/:id

# Auth (optional)
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/profile
```

**Database Schema (Planned):**
```sql
-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  participants TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  participant_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'contribution' | 'expense' | 'compensation'
  amount DECIMAL(10, 2) NOT NULL,
  concept VARCHAR(255),
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Environment Variables (Planned):**
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=friends_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Backend Code Conventions (Planned)

**Naming:**
- camelCase: variables, functions, services
- PascalCase: classes, DTOs, entities
- kebab-case: file names (`events.controller.ts`)

**DTOs:**
- Use class-validator decorators
- Create separate DTOs for create/update operations
- Use `@ApiProperty()` for Swagger documentation

**Services:**
- Business logic only (no HTTP concerns)
- Injectable with `@Injectable()`
- Use dependency injection

**Controllers:**
- HTTP layer only (routing, request/response)
- Use decorators: `@Get()`, `@Post()`, `@Patch()`, `@Delete()`
- Use `@Body()`, `@Param()`, `@Query()` for inputs
- Return DTOs or entities

**Type Safety:**
- Use TypeScript strict mode
- Import types from `@friends/shared-types` when available
- Define entities with TypeORM decorators

---

## 📦 Shared Packages

### @friends/shared-types (Planned)

Located in `packages/shared-types/`. Shared TypeScript types between frontend and backend.

**Purpose:**
- Single source of truth for data structures
- Type safety across workspaces
- Refactoring safety

**Structure:**
```
packages/shared-types/src/
├── event.types.ts          # Event, EventParticipant, CreateEventDto, UpdateEventDto
├── transaction.types.ts    # Transaction, PaymentType, CreateTransactionDto
├── kpi.types.ts           # KPIType, KPIConfig, EventKPIs
├── common.types.ts        # ApiResponse, PaginatedResponse, ErrorResponse
└── index.ts               # Barrel export
```

**Usage:**
```typescript
// In frontend or backend
import { Event, Transaction, PaymentType } from '@friends/shared-types';

const event: Event = {
  id: '1',
  name: 'Dinner',
  date: '2026-01-01',
  participants: [],
};
```

**Migration Plan:**
1. Create `packages/shared-types/` workspace
2. Move types from `apps/frontend/src/features/*/types.ts`
3. Add as dependency: `@friends/shared-types: "workspace:*"`
4. Update imports in frontend
5. Use same types in backend

### @friends/shared-utils (Planned)

Located in `packages/shared-utils/`. Shared utility functions.

**Potential utilities:**
- Currency formatting (if backend needs it)
- Date utilities
- Business logic validations
- Shared constants

---

## 🔀 Cross-Cutting Concerns

### TypeScript Configuration

**Root `tsconfig.json`:**
- Base configuration for all workspaces
- Extends in workspace-specific tsconfig files

**Workspace tsconfig:**
- Frontend: `apps/frontend/tsconfig.json` (React-specific)
- Backend: `apps/backend/tsconfig.json` (Node-specific)
- Shared: `packages/*/tsconfig.json` (Library-specific)

### Testing Strategy

**Unit Tests:**
- Frontend: Vitest + Testing Library
- Backend: Jest + Supertest
- Shared: Jest (when applicable)

**E2E Tests (Planned):**
- Integration tests between frontend and backend
- Playwright or Cypress for full user flows

**Test Commands:**
```bash
pnpm -r test:run        # Run all tests
pnpm test               # Run frontend tests (from root)
pnpm test:backend       # Run backend tests (when ready)
```

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Convention:**
- Use conventional commits
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `frontend`, `backend`, `shared-types`, `monorepo`, `ci`

Examples:
```bash
feat(frontend): add transaction filtering
fix(backend): resolve database connection timeout
docs(monorepo): update README with workspace structure
chore(ci): update deployment workflow for monorepo
```

### CI/CD Pipelines

**GitHub Actions Workflows:**

**`.github/workflows/deploy.yml`** (Frontend deployment):
- Trigger: Push to `main`
- Jobs: build, deploy to GitHub Pages
- Uses pnpm with workspace filtering

**`.github/workflows/test.yml`** (Planned):
- Trigger: Pull requests, push to `develop`
- Jobs:
  - Lint all workspaces
  - Test frontend
  - Test backend
  - Type check shared-types

**Deployment:**
- Frontend: GitHub Pages (currently)
- Backend: Railway, Render, or Vercel (planned)
- Database: Managed PostgreSQL (planned)

### Documentation

**Structure:**
- Root `README.md`: Monorepo overview
- `apps/frontend/README.md`: Frontend-specific docs
- `apps/backend/README.md`: Backend-specific docs
- `packages/*/README.md`: Package API documentation
- `docs/`: Extended documentation
  - `MONOREPO_MIGRATION.md`: Migration guide
  - `DEVELOPMENT.md`: Development setup
  - `ARCHITECTURE.md`: Architecture decisions

### Code Quality

**Linting:**
- Frontend: ESLint 9 (flat config)
- Backend: ESLint with NestJS plugin (planned)
- Shared: ESLint base config

**Formatting:**
- Prettier (optional, can be added to root)
- Consistent across all workspaces

**Type Checking:**
```bash
pnpm -r type-check      # Check all workspaces
```

### Environment Variables

**Frontend (`apps/frontend/.env`):**
```bash
VITE_API_URL=http://localhost:3000
```

**Backend (`apps/backend/.env`):**
```bash
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/friends_db
JWT_SECRET=secret
CORS_ORIGIN=http://localhost:5173
```

---

## 📝 Common Monorepo Tasks

### Adding a New Workspace

1. **Create directory:**
   ```bash
   mkdir -p apps/new-app
   # or
   mkdir -p packages/new-package
   ```

2. **Create `package.json`:**
   ```json
   {
     "name": "@friends/new-app",
     "version": "0.0.0",
     "private": true
   }
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Add to documentation:**
   - Update root README
   - Create workspace README

### Working Across Workspaces

**Import shared types:**
```typescript
// Add dependency in workspace package.json
{
  "dependencies": {
    "@friends/shared-types": "workspace:*"
  }
}

// Import in code
import { Event } from '@friends/shared-types';
```

**Develop with hot reload:**
```bash
# Terminal 1: Frontend dev server
pnpm dev

# Terminal 2: Backend dev server (when ready)
pnpm dev:backend

# Or run both
pnpm -r --parallel dev
```

### Debugging Tips

**Frontend:**
- Use React DevTools browser extension
- Zustand DevTools (already configured)
- Vite's built-in error overlay

**Backend (Planned):**
- Use NestJS logger
- VS Code debugger with `launch.json`
- Attach to running process

**Monorepo:**
- Check workspace resolution: `pnpm list --depth 0`
- Verify symlinks: `ls -la node_modules/@friends`
- Clear cache: `pnpm store prune`

---

## 🎯 Next Steps for Implementation

1. ✅ Migrate to monorepo structure
2. ✅ Update documentation (READMEs)
3. 🚧 Create `@friends/backend` with NestJS
4. 🚧 Create `@friends/shared-types` package
5. 🚧 Migrate frontend types to shared-types
6. 🚧 Implement first API endpoints
7. 🚧 Connect frontend to backend API
8. 🚧 Add authentication
9. 🚧 Deploy backend
10. 🚧 Add E2E tests

---

**Last Updated:** January 1, 2026  
**Monorepo Status:** Configured, Frontend Active, Backend Planned

### State Management (Zustand + LocalStorage Persistence)
- **All stores use Zustand with `persist` middleware** for automatic localStorage sync
- Store pattern: `src/features/*/store/use*Store.ts`
- Key stores: `useEventsStore` (events), `useTransactionsStore` (transactions), `useThemeStore` (theme)
- **Critical**: When deleting an event, use `useTransactionsStore.getState().deleteTransactionsByEvent()` to cascade delete transactions (see [useEventsStore.ts](../src/features/events/store/useEventsStore.ts#L32-L37))
- **Participant removal**: When updating event participants, removed participants must be cleared from transactions via `clearParticipantFromEventTransactions()` ([useEventsStore.ts](../src/features/events/store/useEventsStore.ts#L45-L52))
- **Theme store**: Uses `useThemeStore` without persist middleware - manually syncs with localStorage and respects system preferences

### Feature-Based Organization
```
src/features/{feature}/
  ├─ components/       # Feature UI components
  ├─ store/           # Feature Zustand store
  ├─ types.ts         # Feature TypeScript types
  ├─ constants.ts     # Feature constants (optional)
  └─ index.ts         # Public API exports
```
- Features: `events`, `transactions`, `kpi`
- Import from feature barrel exports: `import { EventsList } from '@/features/events'`
- **Never import directly from store files in components** - use store hooks
- Constants exported via `constants.ts` (e.g., `PAYMENT_TYPES`, `PAYMENT_TYPE_CONFIG` in transactions)

### Transaction System
Three payment types ([types.ts](../src/features/transactions/types.ts)):
- `contribution`: Money added to event pot
- `expense`: Money spent from pot by participant
- `compensation`: Reimbursements to balance accounts

**Payment Type Constants** ([constants.ts](../src/features/transactions/constants.ts)):
- `PAYMENT_TYPES`: Array of all payment types for iteration
- `PAYMENT_TYPE_CONFIG`: Centralized config with icon components and color variants (light/strong) for each type
- `POT_CONFIG`: Special config for pot expenses (piggy bank icon, orange colors)

**Pot System** ([pot.ts](../src/shared/constants/pot.ts)):
- `POT_PARTICIPANT_ID = '0'`: Special participant ID representing the common pot
- Pot can only make expenses (not contributions or compensations)
- Pot expenses shown in KPI details with special orange styling

**KPI calculations** in `useTransactionsStore`:
- `getPotBalanceByEvent`: contributions - compensations - expenses (includes pot expenses)
- `getPendingToCompensateByEvent`: expenses - compensations
- `getTotalPotExpensesByEvent`: Filter expenses by POT_PARTICIPANT_ID
- `getPotExpensesData`: Returns pot expenses data for KPI display
- **All KPIs computed per-event AND per-participant** (see store methods)
- Helper method `isPotExpense(transaction)`: Check if transaction is a pot expense

### KPI System
New feature structure: `src/features/kpi/`
- **Types** ([types.ts](../src/features/kpi/types.ts)):
  - `KPIType`: Union type for KPI identifiers (`'balance' | 'contributions' | 'expenses' | 'pending'`)
  - `KPIParticipantItem`: Display item with id, name, formatted value, and isPot flag
  - `KPIConfig`: Configuration interface for KPI components
- **Components** ([components/](../src/features/kpi/components/)):
  - `KPIDetailHeader`: Header with back button and title
  - `KPIParticipantsList`: List component that displays participants and pot with special styling
  - `KPIExplanation`: Displays contextual explanation for each KPI
- **Page**: [KPIDetail.tsx](../src/pages/KPIDetail.tsx) uses KPI feature components
- **Pot integration**: `expenses` KPI includes pot expenses when `getPotExpensesData()` returns data

### Internationalization (i18next)
- Three languages: `en`, `es` (default), `ca`
- Translation files: `src/i18n/locales/{lang}/translation.json`
- **Key naming**: Use pattern `<feature>.<context>.<key>` (e.g., `events.form.title`)
- **Locale mapping**: `getCurrentLocale()` from `src/i18n/index.ts` maps language codes to locale codes:
  - `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`
- **Pluralization**: Supports i18next pluralization (e.g., `participants_one`, `participants_other`)
- **Amount formatting**: Always use `formatAmount(amount, currency = 'EUR', useGrouping = true)` from `src/shared/utils/formatAmount.ts`
  - Uses `getCurrentLocale()` for locale-aware formatting
  - Default currency: EUR
  - Returns formatted string with currency symbol
- **Date formatting**: Use `formatDateLong(dateStr)` from `src/shared/utils/formatDateLong.ts`
  - Uses `getCurrentLocale()` for locale-aware formatting
  - Returns full format: weekday, year, month, day
- Both formatters automatically adapt to user's selected language
- In components: `const { t } = useTranslation()` then `t('key.path')`
- **Dynamic labels**: Use dynamic keys for context-sensitive translations (e.g., `t(\`transactionForm.participantLabel.${type}\`)`)

### Styling (TailwindCSS v4)
- **Use `@tailwindcss/vite` plugin** (not PostCSS) - see [vite.config.ts](../vite.config.ts#L7)
- Utility helper: `cn()` from `@/lib/utils` for conditional classes (uses `clsx` + `tailwind-merge`)
- Theme: Teal color scheme with dark mode support via `useThemeStore`
- Dark mode classes: Use `dark:` prefix (e.g., `dark:bg-teal-800`)
- **Color conventions**:
  - Teal: Primary color for UI (buttons, backgrounds, text)
  - Blue: Contributions (light: `bg-blue-100 text-blue-800`, dark: `dark:bg-blue-900 dark:text-blue-200`)
  - Red: Expenses (light: `bg-red-100 text-red-800`, dark: `dark:bg-red-900 dark:text-red-200`)
  - Green: Balance/compensation (light: `bg-green-100 text-green-800`, dark: `dark:bg-green-900 dark:text-green-200`)
  - Yellow: Pending amounts (light: `bg-yellow-100 text-yellow-800`, dark: `dark:bg-yellow-900 dark:text-yellow-200`)
  - Orange: Pot expenses (light/strong: `text-orange-800 dark:text-orange-200`, border: `border-orange-300 dark:border-orange-700`)
- **Responsive design**: Use `sm:`, `md:`, `lg:` prefixes for breakpoints
- **Animations**: Custom animations defined inline (e.g., `slideUp` in EventFormModal)

### Path Aliases
```typescript
"@": "/src"  // Configured in vite.config.ts
```
Always use `@/` imports: `import { cn } from '@/lib/utils'`

## Development Workflow

### Running the App
```bash
pnpm dev          # Dev server at localhost:5173
pnpm build        # TypeScript check + Vite build
pnpm preview      # Preview production build
```

### Testing (Vitest + Testing Library)
```bash
pnpm test         # Watch mode
pnpm test:run     # Single run
pnpm test:ui      # Vitest UI
pnpm test:coverage # Coverage report
```
- **Test setup**: [src/test/setup.ts](../src/test/setup.ts) - mocks localStorage, extends jest-dom matchers
- **Test pattern**: Co-locate tests with code (`*.test.ts` next to `*.ts`)
- Example: [useEventsStore.test.ts](../src/features/events/store/useEventsStore.test.ts)

### Code Quality
```bash
pnpm lint         # ESLint check
```
- Config: `eslint.config.js` (flat config format)
- Uses `@typescript-eslint`, `react-hooks`, `react-refresh` plugins

## Key Conventions

### Code Style
- **Naming**: camelCase for variables/functions, PascalCase for components, useCamelCase for hooks
- **Components**: Functional components with hooks only (no class components)
- **Composition**: Prefer component composition over logic duplication
- **Documentation**: JSDoc comments in English for functions and components
- **ID Generation**: Use `crypto.randomUUID()` for unique IDs

### Component Patterns
- **Default exports** for components (not named exports)
- **UI Primitives**: Radix UI for complex patterns (dropdowns, dialogs) in `src/components/ui/`
- **Icons**: Use react-icons for all icons
  - `FaHandHoldingUsd`: Contributions
  - `FaWallet`: Expenses
  - `FaHandshake`: Compensations
  - `FaPiggyBank`: Pot expenses
  - `MdArrowBack`: Navigation back
- **Forms**: Controlled components with validation, error handling, loading states
  - Use `required` attribute for form validation
  - Disable submit button when form is invalid
  - Show loading/disabled states during async operations
- **Modals**: State lifting pattern with submit/cancel actions (see [EventFormModal.tsx](../src/features/events/components/EventFormModal.tsx))
  - Implement dirty state tracking to prevent accidental data loss
  - Show confirmation dialog when closing with unsaved changes
  - Reset form state on close
- **Lists**: Use `map()` with unique `key` prop (prefer ID over index)
- **Conditional rendering**: Use ternary operator or `&&` for simple conditions
- **Transaction Type Selector**: Segmented control pattern with icons and labels ([TransactionTypeSelector.tsx](../src/features/transactions/components/TransactionTypeSelector.tsx))

### Type Safety
- **No `any` types** - use proper TypeScript types
- Domain types defined in feature `types.ts` files
- Export types through feature `index.ts`
- Share types across features when needed (e.g., `EventParticipant` used by transactions)

### Error Handling & Async
- Use try-catch for error handling
- Handle loading and error states explicitly
- Provide user feedback for async operations

### Demo Data
- Demo initializer: [DemoInitializer.tsx](../src/shared/components/DemoInitializer.tsx) 
- Seed data: [demoData.ts](../src/shared/demo/demoData.ts)
- Checks localStorage before creating demo event

### Routing
- Uses `HashRouter` (for GitHub Pages compatibility)
- Routes in [App.tsx](../src/App.tsx):
  - `/` - Home (events list)
  - `/event/:id` - Event detail
  - `/event/:id/kpi/:kpi` - KPI detail drill-down
- **Navigation**: Use `useNavigate()` hook from react-router-dom
- **Route params**: Use `useParams<{ id: string }>()` for type-safe route parameters
- **KPI navigation**: KPI boxes are clickable and navigate to detail page

## Common Tasks

### Adding a New Feature
1. Create `src/features/{feature}/` directory
2. Add `types.ts`, `store/use{Feature}Store.ts`, `components/`
3. Create `constants.ts` if feature needs centralized configuration
4. Export public API via `index.ts`
5. Update imports in pages
6. Add translations for all three languages

### Adding Translations
1. Add keys to all three locale files: `src/i18n/locales/{en,es,ca}/translation.json`
2. Use consistent nesting: `feature.component.key`
3. Support pluralization when needed (add `_one` and `_other` variants)
4. Use dynamic keys for context-sensitive translations

### Creating New KPIs
1. Add calculation method to `useTransactionsStore`
2. Update `KPIType` union in `src/features/kpi/types.ts`
3. Add KPI configuration in KPIDetail page
4. Create UI component in `features/events/components/` or use existing `KPIBox`
5. Display in `EventDetail` page
6. Add translations for KPI labels

### Working with Transactions
1. Always use `PAYMENT_TYPE_CONFIG` for icons and colors
2. Use `POT_PARTICIPANT_ID` when dealing with pot transactions
3. Include pot option in transaction forms for expenses only
4. Filter transactions by event using `getTransactionsByEvent(eventId)`
5. Use type-safe `PaymentType` union for transaction types
