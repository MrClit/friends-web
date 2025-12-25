# Friends Web - AI Coding Agent Instructions

## Project Overview
Friends Web is a React 19 + TypeScript app for managing shared expenses at events. Built with Vite, Zustand, TailwindCSS v4, and i18next. Uses HashRouter for GitHub Pages deployment.

## Architecture Patterns

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
