# Domain Hooks

Business logic hooks specific to pages or complex features.

**Location:** `src/hooks/domain/`  
**Purpose:** Encapsulate page-specific or feature-specific business logic

## Guidelines

### When to use domain hooks:

- ✅ Page-specific business logic (e.g., `useEventDetail` for EventDetail page)
- ✅ Complex feature orchestration combining multiple API calls
- ✅ Business rules and data transformations
- ✅ Stateful logic that doesn't fit in a component

### What should NOT be here:

- ❌ Generic UI state (use `hooks/common/` instead)
- ❌ Server data fetching (use `hooks/api/` instead)
- ❌ Simple component logic (keep in component)

## Current Hooks

### `useEventDetail`

Business logic for the EventDetail page.

**Location:** `src/hooks/domain/useEventDetail.ts`

**Purpose:**

- Fetches event data and KPIs
- Handles event mutations (update, delete)
- Manages navigation
- **Does NOT** manage UI state (modals, dialogs)

**Usage:**

```typescript
import { useEventDetail } from '@/hooks/domain/useEventDetail';

function EventDetail() {
  const { event, kpis, handleEditSubmit, handleDelete, handleBack } = useEventDetail(id);

  // Component manages its own UI state
  const editModal = useModalState();
  const deleteDialog = useConfirmDialog();

  // ...
}
```

**Key principle:** Domain hooks handle **business logic**, components handle **UI state**.

## Adding New Domain Hooks

When creating a new domain hook:

1. **Naming:** Use `use{Feature}{Purpose}` (e.g., `useEventDetail`, `useTransactionFilters`)
2. **Single Responsibility:** One clear business purpose
3. **Export:** Add to `index.ts` for barrel export
4. **Document:** Update this README with usage example
5. **Test:** Write unit tests if complex logic
6. **Separate concerns:** No UI state management

## Architecture Decision

**Why separate domain hooks from common hooks?**

- **Clarity:** Easy to distinguish reusable vs specific logic
- **Maintainability:** Domain hooks change with features, common hooks are stable
- **Scalability:** As app grows, domain hooks stay organized by purpose
- **Team collaboration:** Clear where to put new business logic

See: [UI State Management Strategy](../../../docs/UI_STATE_MANAGEMENT_STRATEGY.md)
