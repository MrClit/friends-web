# Hooks Organization

Centralized location for all React hooks in the Friends application.

## Structure

```
src/hooks/
├── api/          # Server state (React Query hooks)
├── common/       # Generic reusable hooks (UI state, utilities)
└── domain/       # Business logic hooks (page/feature-specific)
```

## Decision Tree

**Where should my hook go?**

```
Does it fetch/mutate server data?
├─ Yes → hooks/api/
│
Is it reusable across multiple features?
├─ Yes (generic) → hooks/common/
├─ No (specific) → hooks/domain/
```

## Guidelines

### `hooks/api/` - Server State

**Purpose:** React Query hooks for fetching and mutating server data

**Examples:**

- `useEvents()` - Fetch events list
- `useCreateEvent()` - Create event mutation
- `useTransactionsPaginated()` - Paginated transactions

**Characteristics:**

- ✅ Uses React Query (`useQuery`, `useMutation`)
- ✅ Shared across features
- ✅ Handles caching, invalidation
- ✅ No UI state

**Naming:** `use{Entity}`, `use{Entity}Paginated`, `useCreate{Entity}`, `useUpdate{Entity}`, `useDelete{Entity}`

---

### `hooks/common/` - Generic Reusable

**Purpose:** Generic hooks that can be reused anywhere (UI state, utilities)

**Examples:**

- `useModalState()` - Modal open/close state
- `useConfirmDialog()` - Confirmation dialogs
- `useInfiniteScroll()` - Scroll observer

**Characteristics:**

- ✅ No business logic
- ✅ No server data
- ✅ Pure utilities or UI patterns
- ✅ Fully reusable

**Naming:** `use{Pattern}` (descriptive of what it does, not where it's used)

---

### `hooks/domain/` - Business Logic

**Purpose:** Business logic specific to pages or complex features

**Examples:**

- `useEventDetail()` - EventDetail page business logic

**Characteristics:**

- ✅ Combines multiple API calls
- ✅ Business rules and transformations
- ✅ Page/feature-specific
- ❌ No UI state management

**Naming:** `use{Page/Feature}{Purpose}` (e.g., `useEventDetail`, `useTransactionFilters`)

---

## Import Patterns

```typescript
// ✅ Correct - use path alias
import { useEvents } from '@/hooks/api/useEvents';
import { useModalState } from '@/hooks/common';
import { useEventDetail } from '@/hooks/domain/useEventDetail';

// ✅ Also correct - barrel import
import { useModalState, useConfirmDialog } from '@/hooks/common';

// ❌ Avoid - relative imports
import { useModalState } from '../../../hooks/common/useModalState';
```

## Best Practices

1. **Single Responsibility:** One hook, one clear purpose
2. **Memoization:** Use `useCallback`, `useMemo` appropriately
3. **TypeScript:** Always export return types
4. **Testing:** Test complex hooks in isolation
5. **Documentation:** Add JSDoc comments for public API
6. **Barrel Exports:** Update `index.ts` when adding new hooks

## Migration from Previous Structure

**Old structure:**

```
src/hooks/useEventDetail.ts          ❌
src/shared/hooks/useModalState.ts    ❌
```

**New structure:**

```
src/hooks/domain/useEventDetail.ts   ✅
src/hooks/common/useModalState.ts    ✅
```

**Benefits:**

- ✅ Clearer organization (3 categories)
- ✅ Easy to find where to put new hooks
- ✅ Scales better as app grows
- ✅ Self-documenting architecture

## References

- [Common Hooks README](./common/README.md)
- [Domain Hooks README](./domain/README.md)
- [UI State Management Strategy](../../docs/UI_STATE_MANAGEMENT_STRATEGY.md)
- [Frontend API Integration](../../docs/FRONTEND_API_INTEGRATION.md)
