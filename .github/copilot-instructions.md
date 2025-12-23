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

### Feature-Based Organization
```
src/features/{feature}/
  ├─ components/       # Feature UI components
  ├─ store/           # Feature Zustand store
  ├─ types.ts         # Feature TypeScript types
  └─ index.ts         # Public API exports
```
- Features: `events`, `transactions`
- Import from feature barrel exports: `import { EventsList } from '@/features/events'`
- **Never import directly from store files in components** - use store hooks

### Transaction System
Three payment types ([types.ts](../src/features/transactions/types.ts)):
- `contribution`: Money added to event pot
- `expense`: Money spent from pot by participant
- `compensation`: Reimbursements to balance accounts

**KPI calculations** in `useTransactionsStore`:
- `getPotBalanceByEvent`: contributions - compensations
- `getPendingToCompensateByEvent`: expenses - compensations
- **All KPIs computed per-event AND per-participant** (see store methods)

### Internationalization (i18next)
- Three languages: `en`, `es` (default), `ca`
- Translation files: `src/i18n/locales/{lang}/translation.json`
- **Key naming**: Use pattern `<feature>.<context>.<key>` (e.g., `events.form.title`)
- **Locale mapping**: `getCurrentLocale()` from `src/i18n/index.ts` maps language codes to locale codes:
  - `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`
- **Amount formatting**: Always use `formatAmount()` from `src/shared/utils/formatAmount.ts` (uses `getCurrentLocale()`, default currency EUR)
- **Date formatting**: Use `formatDateLong()` from `src/shared/utils/formatDateLong.ts` (uses `getCurrentLocale()`)
- Both formatters automatically adapt to user's selected language
- In components: `const { t } = useTranslation()` then `t('key.path')`

### Styling (TailwindCSS v4)
- **Use `@tailwindcss/vite` plugin** (not PostCSS) - see [vite.config.ts](../vite.config.ts#L7)
- Utility helper: `cn()` from `@/lib/utils` for conditional classes (uses `clsx` + `tailwind-merge`)
- Theme: Teal color scheme with dark mode support via `useThemeStore`
- Dark mode classes: Use `dark:` prefix (e.g., `dark:bg-teal-800`)

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
- **Forms**: Controlled components with validation, error handling, loading states
- **Modals**: State lifting pattern with submit/cancel actions (see [EventFormModal.tsx](../src/features/events/components/EventFormModal.tsx))

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

## Common Tasks

### Adding a New Feature
1. Create `src/features/{feature}/` directory
2. Add `types.ts`, `store/use{Feature}Store.ts`, `components/`
3. Export public API via `index.ts`
4. Update imports in pages

### Adding Translations
1. Add keys to all three locale files: `src/i18n/locales/{en,es,ca}/translation.json`
2. Use consistent nesting: `feature.component.key`

### Creating New KPIs
1. Add calculation method to `useTransactionsStore`
2. Create UI component in `features/events/components/`
3. Display in `EventDetail` page
