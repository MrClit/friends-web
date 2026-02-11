# Refactor TransactionModal with Custom Hook

## Table of Contents

1. [Motivation and Objectives](#motivation-and-objectives)
2. [System Overview and Requirements](#system-overview-and-requirements)
3. [Solution Design](#solution-design)
   - 3.1 [Current vs. Proposed Architecture](#31-current-vs-proposed-architecture)
   - 3.2 [File Structure](#32-file-structure)
   - 3.3 [Hook API Design](#33-hook-api-design)
   - 3.4 [Dirty State Detection](#34-dirty-state-detection)
   - 3.5 [Error Handling](#35-error-handling)
4. [External Configuration and Prerequisites](#external-configuration-and-prerequisites)
5. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
6. [Detailed Checklist](#detailed-checklist)
7. [Testing and Validation](#testing-and-validation)
8. [Deployment Notes](#deployment-notes)
9. [References and Resources](#references-and-resources)
10. [Improvements and Lessons Learned](#improvements-and-lessons-learned)
11. [Why This Structure?](#why-this-structure)

---

## Motivation and Objectives

### Why?

The current `TransactionModal.tsx` component has all its business logic, state management, and UI concerns tightly coupled within a single file (~200 LOC). This makes it:

- **Hard to test**: Business logic is intertwined with React lifecycle and UI.
- **Hard to maintain**: Changes to validation or submission logic require navigating UI code.
- **Inconsistent**: `EventFormModal.tsx` uses a custom hook pattern (`useEventFormModal`), but `TransactionModal` doesn't follow the same architecture.

### Goals

1. **Extract business logic** into a custom hook `useTransactionModal`
2. **Maintain feature parity**: All current functionality (create, update, delete, dirty checking, confirmation dialogs)
3. **Follow EventFormModal pattern**: Same structure, naming conventions, and testing approach
4. **Improve testability**: Isolate business logic for unit testing
5. **Enable future enhancements**: Clearer separation makes it easier to add features like optimistic updates, field-level validation, or undo functionality

### Scope

**In scope:**

- Create `useTransactionModal.ts` hook
- Refactor `TransactionModal.tsx` to use the hook
- Implement dirty state detection (warn on unsaved changes)
- Add unit tests for the hook

**Out of scope:**

- UI redesign (keep current design from `20260210_REFACTOR_TRANSACTION_MODAL_DESIGN.md`)
- Backend API changes
- New features (e.g., bulk operations, recurring transactions)

---

## System Overview and Requirements

### Context

- **Frontend**: React 19 + TypeScript + Zustand (for modal state)
- **State Management**: TanStack Query for server state
- **Modal Store**: `useTransactionModalStore` manages open/close state and current transaction
- **Related Components**:
  - `TransactionForm`: Form fields
  - `TransactionTypeSelector`: Payment type selector
  - `ConfirmDialog`: Delete confirmation

### Dependencies

- `react`: Hooks (useState, useEffect, useMemo, useCallback)
- `react-i18next`: Translations
- `@tanstack/react-query`: useQuery, useMutation
- `useTransactionModalStore`: Global modal state
- API hooks: `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`

### Current Flow

1. User opens modal (create or edit mode)
2. Modal reads `event` and `transaction` from Zustand store
3. User fills form fields (`type`, `title`, `amount`, `date`, `participantId`)
4. On submit: calls create/update mutation → invalidates queries → closes modal
5. On delete: shows confirmation → calls delete mutation → closes modal
6. On close: closes immediately (no dirty check)

### Proposed Flow

1. User opens modal
2. Hook initializes state from `transaction` (edit) or defaults (create)
3. **Dirty detection**: Tracks unsaved changes
4. On close attempt with unsaved changes: shows confirmation dialog
5. On submit/delete: same as current, but through hook handlers
6. On success: resets form and closes modal

---

## Solution Design

### 3.1 Current vs. Proposed Architecture

**Current (TransactionModal.tsx):**

```
┌─────────────────────────────────────────┐
│       TransactionModal.tsx              │
│  ┌───────────────────────────────────┐  │
│  │ - State (type, title, amount...)  │  │
│  │ - useEffect (reset on open)       │  │
│  │ - useEffect (keyboard listener)   │  │
│  │ - Mutations (create/update/delete)│  │
│  │ - Handlers (submit, delete, close)│  │
│  │ - JSX (Dialog, Form, Buttons)     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Proposed:**

```
┌────────────────────────────────────────────────────────┐
│              TransactionModal.tsx                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ - useTransactionModal() hook                     │  │
│  │   (returns all state, handlers, computed values) │  │
│  │ - JSX only (Dialog, Form, Buttons)               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         useTransactionModal.ts (hook)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ - Form state management                          │  │
│  │ - Reset logic                                    │  │
│  │ - Dirty state detection (checkIsDirty helper)   │  │
│  │ - Submit handler (create/update)                 │  │
│  │ - Delete handler (with confirmation)             │  │
│  │ - Close handler (with dirty check)               │  │
│  │ - Validation (canSubmit)                         │  │
│  │ - Error handling                                 │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 3.2 File Structure

```
src/features/transactions/
├─ components/
│  ├─ TransactionModal.tsx          # Refactored (UI only)
│  ├─ TransactionForm.tsx            # Existing (no changes)
│  └─ TransactionTypeSelector.tsx    # Existing (no changes)
├─ hooks/
│  └─ useTransactionModal.ts         # NEW (business logic)
└─ types.ts                          # Existing (PaymentType, Transaction)
```

### 3.3 Hook API Design

**Interface:**

```typescript
interface UseTransactionModalProps {
  open: boolean;
  event: Event | null;
  transaction: Transaction | null;
  onClose: () => void;
}

interface UseTransactionModalReturn {
  // Form state
  type: PaymentType;
  setType: (type: PaymentType) => void;
  title: string;
  setTitle: (title: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  date: string;
  setDate: (date: string) => void;
  participantId: string;
  setParticipantId: (id: string) => void;

  // Confirmation dialogs
  showDeleteConfirm: boolean;
  showDiscardConfirm: boolean;

  // Computed
  isLoading: boolean;
  canSubmit: boolean;
  isDirty: boolean;
  errorMessage: string | null;

  // Handlers
  handleSubmit: (e: React.FormEvent) => void;
  handleDelete: () => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  handleOpenChange: (isOpen: boolean) => void;
  handleConfirmDiscard: () => void;
  handleCancelDiscard: () => void;
}
```

**Usage Example:**

```tsx
export default function TransactionModal() {
  const { open, event, transaction, closeModal } = useTransactionModalStore();

  const {
    type,
    setType,
    title,
    setTitle,
    amount,
    setAmount,
    date,
    setDate,
    participantId,
    setParticipantId,
    showDeleteConfirm,
    showDiscardConfirm,
    isLoading,
    canSubmit,
    handleSubmit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenChange,
    handleConfirmDiscard,
    handleCancelDiscard,
  } = useTransactionModal({
    open,
    event,
    transaction,
    onClose: closeModal,
  });

  if (!open || !event) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/* UI only */}
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        // ...
      />

      {/* Discard changes confirmation (NEW) */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        // ...
      />
    </>
  );
}
```

### 3.4 Dirty State Detection

**Logic:**

A transaction is "dirty" if:

1. **Create mode**: Any field has a non-default value
   - Default: `type='contribution'`, `title=''`, `amount=''`, `participantId=''`, `date=today`
   - Dirty if: title, amount, or participantId are filled, OR type changed, OR date changed from today

2. **Edit mode**: Any field differs from original `transaction` prop
   - Compare: `type`, `title`, `amount`, `participantId`, `date`

**Helper Function:**

```typescript
function checkIsDirty(
  transaction: Transaction | null,
  type: PaymentType,
  title: string,
  amount: string,
  date: string,
  participantId: string,
  open: boolean,
): boolean {
  if (!open) return false;

  const today = new Date().toISOString().slice(0, 10);

  if (!transaction) {
    // Create mode: check if any field is non-default
    return (
      type !== 'contribution' ||
      title.trim() !== '' ||
      amount.trim() !== '' ||
      participantId.trim() !== '' ||
      date !== today
    );
  }

  // Edit mode: check if any field changed
  return (
    type !== transaction.paymentType ||
    title.trim() !== transaction.title.trim() ||
    amount !== transaction.amount.toString() ||
    participantId !== (transaction.participantId || '') ||
    date !== transaction.date.slice(0, 10)
  );
}
```

**Implementation:**

```typescript
const isDirty = useMemo(
  () => checkIsDirty(transaction, type, title, amount, date, participantId, open),
  [transaction, type, title, amount, date, participantId, open],
);
```

### 3.5 Error Handling

**Current State:**

- No error state in TransactionModal
- Mutations can fail silently

**Proposed State:**

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

**On Mutation Error:**

```typescript
onError: (error) => {
  const message = error instanceof Error ? error.message : t('common.errorLoading');
  setErrorMessage(message);
};
```

**Display:**

```tsx
{
  errorMessage && (
    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
      {errorMessage}
    </div>
  );
}
```

---

## External Configuration and Prerequisites

### Environment

No environment variables needed.

### Dependencies

All dependencies are already installed (no new packages).

### Zustand Store

Current store exports:

```typescript
export const useTransactionModalStore = create<TransactionModalState>((set) => ({
  open: false,
  event: null,
  transaction: null,
  showDeleteConfirm: false,
  openModal: (event: Event, transaction?: Transaction) =>
    set({ open: true, event, transaction: transaction || null, showDeleteConfirm: false }),
  closeModal: () => set({ open: false, event: null, transaction: null, showDeleteConfirm: false }),
  setShowDeleteConfirm: (show: boolean) => set({ showDeleteConfirm: show }),
}));
```

**No changes needed** to the store. The `showDeleteConfirm` state can stay in the store OR be moved to the hook (both approaches are valid; we'll keep it in the store for consistency).

### i18n Keys

**New translations needed:**

```json
// en/translation.json
{
  "transactionModal": {
    "discardTitle": "Discard changes?",
    "discardMessage": "You have unsaved changes. Are you sure you want to discard them?",
    "discard": "Discard",
    // existing keys...
  }
}

// es/translation.json
{
  "transactionModal": {
    "discardTitle": "¿Descartar cambios?",
    "discardMessage": "Tienes cambios sin guardar. ¿Estás seguro de que quieres descartarlos?",
    "discard": "Descartar",
    // existing keys...
  }
}

// ca/translation.json
{
  "transactionModal": {
    "discardTitle": "Descartar canvis?",
    "discardMessage": "Tens canvis sense desar. Estàs segur que vols descartar-los?",
    "discard": "Descartar",
    // existing keys...
  }
}
```

---

## Step-by-Step Implementation Plan

### Phase 1: Create Hook Structure (15 min)

1. **Create file**: `src/features/transactions/hooks/useTransactionModal.ts`
2. **Copy EventFormModal pattern**: Use `useEventFormModal.ts` as template
3. **Define interface**: `UseTransactionModalProps` and `UseTransactionModalReturn`
4. **Add imports**: React hooks, i18next, API hooks, types

### Phase 2: Implement Form State Management (20 min)

5. **Add state declarations**:

   ```typescript
   const [type, setType] = useState<PaymentType>('contribution');
   const [title, setTitle] = useState('');
   const [amount, setAmount] = useState('');
   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
   const [participantId, setParticipantId] = useState('');
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   ```

6. **Create `resetForm` function**:

   ```typescript
   const resetForm = useCallback(() => {
     if (transaction) {
       setType(transaction.paymentType);
       setTitle(transaction.title);
       setAmount(transaction.amount.toString());
       setDate(transaction.date.slice(0, 10));
       setParticipantId(transaction.participantId || '');
     } else {
       setType('contribution');
       setTitle('');
       setAmount('');
       setDate(new Date().toISOString().slice(0, 10));
       setParticipantId('');
     }
     setErrorMessage(null);
   }, [transaction]);
   ```

7. **Add reset effect**:
   ```typescript
   useEffect(() => {
     if (open) {
       resetForm();
     }
   }, [open, resetForm]);
   ```

### Phase 3: Implement Dirty State Detection (15 min)

8. **Create `checkIsDirty` helper function** (outside hook, like in EventFormModal)

9. **Add `isDirty` memoized value**:

   ```typescript
   const isDirty = useMemo(
     () => checkIsDirty(transaction, type, title, amount, date, participantId, open),
     [transaction, type, title, amount, date, participantId, open],
   );
   ```

10. **Add `canSubmit` validation**:
    ```typescript
    const canSubmit = useMemo(
      () => !!title.trim() && !!amount.trim() && !!date && !!participantId,
      [title, amount, date, participantId],
    );
    ```

### Phase 4: Implement Mutation Handlers (25 min)

11. **Initialize mutations**:

    ```typescript
    const createTransaction = useCreateTransaction(event?.id ?? '');
    const updateTransaction = useUpdateTransaction();
    const deleteTransaction = useDeleteTransaction();
    ```

12. **Create `handleSubmit`**:

    ```typescript
    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || !event) return;

        setErrorMessage(null);

        if (transaction) {
          // Update
          updateTransaction.mutate(
            {
              id: transaction.id,
              data: {
                title: title.trim(),
                paymentType: type,
                amount: parseFloat(amount),
                participantId,
                date,
              },
            },
            {
              onSuccess: () => {
                setShowDiscardConfirm(false);
                resetForm();
                onClose();
              },
              onError: (error) => {
                const message = error instanceof Error ? error.message : t('common.errorLoading');
                setErrorMessage(message);
              },
            },
          );
        } else {
          // Create
          createTransaction.mutate(
            {
              title: title.trim(),
              paymentType: type,
              amount: parseFloat(amount),
              participantId,
              date,
            },
            {
              onSuccess: () => {
                setShowDiscardConfirm(false);
                resetForm();
                onClose();
              },
              onError: (error) => {
                const message = error instanceof Error ? error.message : t('common.errorLoading');
                setErrorMessage(message);
              },
            },
          );
        }
      },
      [
        canSubmit,
        event,
        transaction,
        title,
        type,
        amount,
        participantId,
        date,
        updateTransaction,
        createTransaction,
        resetForm,
        onClose,
        t,
      ],
    );
    ```

13. **Create delete handlers**:

    ```typescript
    const handleDelete = useCallback(() => {
      setShowDeleteConfirm(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
      if (transaction) {
        deleteTransaction.mutate(transaction.id, {
          onSuccess: () => {
            setShowDeleteConfirm(false);
            setShowDiscardConfirm(false);
            resetForm();
            onClose();
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : t('common.errorLoading');
            setErrorMessage(message);
          },
        });
      }
    }, [transaction, deleteTransaction, resetForm, onClose, t]);

    const handleCancelDelete = useCallback(() => {
      setShowDeleteConfirm(false);
    }, []);
    ```

### Phase 5: Implement Close with Dirty Check (20 min)

14. **Create `handleOpenChange`**:

    ```typescript
    const handleOpenChange = useCallback(
      (isOpen: boolean) => {
        if (!isOpen && !showDiscardConfirm && !showDeleteConfirm) {
          if (isDirty) {
            setShowDiscardConfirm(true);
          } else {
            resetForm();
            onClose();
          }
        }
      },
      [isDirty, showDiscardConfirm, showDeleteConfirm, resetForm, onClose],
    );
    ```

15. **Create discard handlers**:

    ```typescript
    const handleConfirmDiscard = useCallback(() => {
      setShowDiscardConfirm(false);
      resetForm();
      onClose();
    }, [resetForm, onClose]);

    const handleCancelDiscard = useCallback(() => {
      setShowDiscardConfirm(false);
    }, []);
    ```

16. **Add `isLoading` computed value**:

    ```typescript
    const isLoading = createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending;
    ```

17. **Return hook API**:
    ```typescript
    return {
      // State
      type,
      setType,
      title,
      setTitle,
      amount,
      setAmount,
      date,
      setDate,
      participantId,
      setParticipantId,
      showDeleteConfirm,
      showDiscardConfirm,
      errorMessage,
      // Computed
      isLoading,
      canSubmit,
      isDirty,
      // Handlers
      handleSubmit,
      handleDelete,
      handleConfirmDelete,
      handleCancelDelete,
      handleOpenChange,
      handleConfirmDiscard,
      handleCancelDiscard,
    };
    ```

### Phase 6: Refactor TransactionModal Component (25 min)

18. **Remove old state declarations** from TransactionModal.tsx
19. **Remove old useEffect hooks** (keyboard listener, reset logic)
20. **Remove old mutation handlers** (handleSubmit, handleDelete, etc.)
21. **Import and call hook**:

    ```typescript
    const {
      type,
      setType,
      title,
      setTitle,
      amount,
      setAmount,
      date,
      setDate,
      participantId,
      setParticipantId,
      showDeleteConfirm,
      showDiscardConfirm,
      isLoading,
      canSubmit,
      errorMessage,
      handleSubmit,
      handleDelete,
      handleConfirmDelete,
      handleCancelDelete,
      handleOpenChange,
      handleConfirmDiscard,
      handleCancelDiscard,
    } = useTransactionModal({
      open,
      event,
      transaction,
      onClose: closeModal,
    });
    ```

22. **Update Dialog onOpenChange**:

    ```tsx
    <Dialog open={open} onOpenChange={handleOpenChange}>
    ```

23. **Add `onInteractOutside` and `onEscapeKeyDown` handlers** (prevent close when confirm dialogs are open):

    ```tsx
    <DialogContent
      onInteractOutside={(e) => {
        if (showDiscardConfirm || showDeleteConfirm) {
          e.preventDefault();
        }
      }}
      onEscapeKeyDown={(e) => {
        if (showDiscardConfirm || showDeleteConfirm) {
          e.preventDefault();
        }
      }}
    >
    ```

24. **Add error message display** in DialogBody
25. **Update button disabled states** to use `isLoading` from hook
26. **Add new ConfirmDialog for discard confirmation**:
    ```tsx
    <ConfirmDialog
      open={showDiscardConfirm}
      title={t('transactionModal.discardTitle')}
      message={t('transactionModal.discardMessage')}
      confirmText={t('transactionModal.discard')}
      cancelText={t('transactionModal.cancel')}
      onConfirm={handleConfirmDiscard}
      onCancel={handleCancelDiscard}
    />
    ```

### Phase 7: Add Translations (10 min)

27. **Update `src/i18n/locales/en/translation.json`** with new keys
28. **Update `src/i18n/locales/es/translation.json`** with new keys
29. **Update `src/i18n/locales/ca/translation.json`** with new keys

### Phase 8: Testing (30 min)

30. **Create unit tests**: `src/features/transactions/hooks/useTransactionModal.test.ts`
31. **Manual testing**: Create, edit, delete transactions
32. **Test dirty state**: Try closing with unsaved changes
33. **Test error handling**: Simulate API errors

---

## Detailed Checklist

### Implementation

- [ ] Create `src/features/transactions/hooks/useTransactionModal.ts`
- [ ] Implement form state (type, title, amount, date, participantId)
- [ ] Implement confirmation state (showDeleteConfirm, showDiscardConfirm)
- [ ] Implement error state (errorMessage)
- [ ] Create `resetForm` function with useCallback
- [ ] Add reset effect (useEffect on `open` change)
- [ ] Implement `checkIsDirty` helper function
- [ ] Add `isDirty` memoized value
- [ ] Add `canSubmit` validation
- [ ] Initialize mutations (create, update, delete)
- [ ] Implement `handleSubmit` with create/update logic
- [ ] Implement `handleDelete` (show confirmation)
- [ ] Implement `handleConfirmDelete` (execute delete)
- [ ] Implement `handleCancelDelete` (hide confirmation)
- [ ] Implement `handleOpenChange` (with dirty check)
- [ ] Implement `handleConfirmDiscard` (discard changes)
- [ ] Implement `handleCancelDiscard` (cancel discard)
- [ ] Add `isLoading` computed value
- [ ] Return all state, computed values, and handlers

### Refactor TransactionModal.tsx

- [ ] Remove old state declarations
- [ ] Remove old useEffect hooks
- [ ] Remove old mutation initializations
- [ ] Remove old handler functions
- [ ] Import `useTransactionModal` hook
- [ ] Call hook with props
- [ ] Destructure hook return values
- [ ] Update Dialog `onOpenChange` prop
- [ ] Add `onInteractOutside` handler to DialogContent
- [ ] Add `onEscapeKeyDown` handler to DialogContent
- [ ] Add error message display in DialogBody
- [ ] Update button disabled states
- [ ] Add new ConfirmDialog for discard confirmation
- [ ] Verify no TypeScript errors

### i18n

- [ ] Add `discardTitle` key (en, es, ca)
- [ ] Add `discardMessage` key (en, es, ca)
- [ ] Add `discard` key (en, es, ca)

### Testing

- [ ] Create test file: `useTransactionModal.test.ts`
- [ ] Test: Hook initializes with default values (create mode)
- [ ] Test: Hook initializes with transaction values (edit mode)
- [ ] Test: `isDirty` returns false with default values
- [ ] Test: `isDirty` returns true when fields change
- [ ] Test: `canSubmit` validation works correctly
- [ ] Test: `handleSubmit` calls create mutation (create mode)
- [ ] Test: `handleSubmit` calls update mutation (edit mode)
- [ ] Test: `handleDelete` shows confirmation
- [ ] Test: `handleConfirmDelete` calls delete mutation
- [ ] Test: `handleOpenChange` closes immediately when not dirty
- [ ] Test: `handleOpenChange` shows confirmation when dirty
- [ ] Test: Error handling sets errorMessage on mutation failure

### Manual Testing

- [ ] Open modal in create mode → verify default values
- [ ] Fill form → submit → verify transaction created
- [ ] Open modal in edit mode → verify values pre-filled
- [ ] Edit form → submit → verify transaction updated
- [ ] Open modal → fill form → close (X button) → verify discard confirmation
- [ ] Open modal → fill form → close (outside click) → verify discard confirmation
- [ ] Open modal → fill form → close (ESC key) → verify discard confirmation
- [ ] In discard confirmation → click cancel → verify stays open
- [ ] In discard confirmation → click confirm → verify closes
- [ ] Open modal (edit) → click delete → verify delete confirmation
- [ ] In delete confirmation → click cancel → verify stays open
- [ ] In delete confirmation → click confirm → verify transaction deleted
- [ ] Simulate network error → verify error message displays
- [ ] Test in dark mode → verify styles correct

---

## Testing and Validation

### Unit Tests (useTransactionModal.test.ts)

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactionModal } from './useTransactionModal';
import * as useTransactionsModule from '@/hooks/api/useTransactions';

// Mock dependencies
vi.mock('@/hooks/api/useTransactions');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useTransactionModal', () => {
  const mockEvent = {
    id: 'event-1',
    title: 'Trip',
    participants: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ],
  };

  const mockTransaction = {
    id: 'tx-1',
    paymentType: 'expense' as const,
    title: 'Dinner',
    amount: 50,
    date: '2026-02-11',
    participantId: '1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock mutations
    vi.spyOn(useTransactionsModule, 'useCreateTransaction').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(useTransactionsModule, 'useUpdateTransaction').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(useTransactionsModule, 'useDeleteTransaction').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  describe('Initialization', () => {
    it('should initialize with default values in create mode', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      expect(result.current.type).toBe('contribution');
      expect(result.current.title).toBe('');
      expect(result.current.amount).toBe('');
      expect(result.current.participantId).toBe('');
      expect(result.current.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // today
    });

    it('should initialize with transaction values in edit mode', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: mockTransaction,
          onClose: vi.fn(),
        }),
      );

      expect(result.current.type).toBe('expense');
      expect(result.current.title).toBe('Dinner');
      expect(result.current.amount).toBe('50');
      expect(result.current.participantId).toBe('1');
      expect(result.current.date).toBe('2026-02-11');
    });
  });

  describe('Dirty state detection', () => {
    it('should not be dirty with default values', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      expect(result.current.isDirty).toBe(false);
    });

    it('should be dirty when title changes', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.setTitle('Lunch');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should be dirty when amount changes in edit mode', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: mockTransaction,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.setAmount('100');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should not allow submit with empty required fields', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      expect(result.current.canSubmit).toBe(false);
    });

    it('should allow submit when all fields are filled', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.setTitle('Lunch');
        result.current.setAmount('25');
        result.current.setParticipantId('1');
      });

      expect(result.current.canSubmit).toBe(true);
    });
  });

  describe('Submit handler', () => {
    it('should call create mutation in create mode', async () => {
      const mockMutate = vi.fn();
      vi.spyOn(useTransactionsModule, 'useCreateTransaction').mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.setTitle('Lunch');
        result.current.setAmount('25');
        result.current.setParticipantId('1');
      });

      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lunch',
          amount: 25,
          participantId: '1',
        }),
        expect.any(Object),
      );
    });

    it('should call update mutation in edit mode', async () => {
      const mockMutate = vi.fn();
      vi.spyOn(useTransactionsModule, 'useUpdateTransaction').mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: mockTransaction,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.setTitle('Breakfast');
      });

      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-1',
          data: expect.objectContaining({
            title: 'Breakfast',
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('Delete handler', () => {
    it('should show confirmation on delete', () => {
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: mockTransaction,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(result.current.showDeleteConfirm).toBe(true);
    });

    it('should call delete mutation on confirm', () => {
      const mockMutate = vi.fn();
      vi.spyOn(useTransactionsModule, 'useDeleteTransaction').mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: mockTransaction,
          onClose: vi.fn(),
        }),
      );

      act(() => {
        result.current.handleConfirmDelete();
      });

      expect(mockMutate).toHaveBeenCalledWith('tx-1', expect.any(Object));
    });
  });

  describe('Close with dirty check', () => {
    it('should close immediately when not dirty', () => {
      const mockOnClose = vi.fn();
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.handleOpenChange(false);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show confirmation when dirty', () => {
      const mockOnClose = vi.fn();
      const { result } = renderHook(() =>
        useTransactionModal({
          open: true,
          event: mockEvent,
          transaction: null,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.setTitle('Lunch');
      });

      act(() => {
        result.current.handleOpenChange(false);
      });

      expect(result.current.showDiscardConfirm).toBe(true);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Tests (TransactionModal.test.tsx)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionModal from './TransactionModal';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('TransactionModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should show discard confirmation when closing with unsaved changes', async () => {
    const user = userEvent.setup();

    // Mock store with open modal
    useTransactionModalStore.setState({
      open: true,
      event: { id: '1', title: 'Trip', participants: [{ id: '1', name: 'Alice' }] },
      transaction: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionModal />
      </QueryClientProvider>
    );

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Lunch');

    // Try to close
    await user.click(screen.getByLabelText(/close/i));

    // Verify discard confirmation appears
    expect(screen.getByText(/discard changes/i)).toBeInTheDocument();
  });
});
```

---

## Deployment Notes

### No Backend Changes

This is a frontend-only refactor. No API or database changes required.

### Environment Variables

No new environment variables needed.

### Rollout Plan

1. **Development**: Test thoroughly in local environment
2. **Staging**: Deploy to staging, verify all transaction operations
3. **Production**: Standard deployment (no feature flags needed)

### Rollback Plan

If critical bugs are found:

1. Revert commit
2. Redeploy previous version
3. No data loss risk (no schema changes)

---

## References and Resources

### Internal Documentation

- [Frontend Architecture Refactor](./20260117_FRONTEND_ARCHITECTURE_REFACTOR.md)
- [Transaction Modal Design Refactor](./20260210_REFACTOR_TRANSACTION_MODAL_DESIGN.md)
- [UI State Management Strategy](./UI_STATE_MANAGEMENT_STRATEGY.md)

### Code References

- **Template Pattern**: `src/features/events/hooks/useEventFormModal.ts`
- **Modal Store Pattern**: `src/shared/store/useEventFormModalStore.ts`
- **Dialog Component**: `src/shared/components/ui/Dialog.tsx`
- **API Hooks**: `src/hooks/api/useTransactions.ts`

### External Resources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Zustand - State Management](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## Improvements and Lessons Learned

### Improvements Made

1. **Separation of Concerns**: Business logic moved to testable hook
2. **Consistency**: Matches EventFormModal pattern
3. **User Experience**: Added discard confirmation for unsaved changes
4. **Error Handling**: Added error state and display
5. **Type Safety**: Strong TypeScript interfaces for hook API

### Future Enhancements

1. **Optimistic Updates**: Update UI immediately before server confirms
2. **Field-Level Validation**: Real-time validation with error messages per field
3. **Auto-Save Draft**: Save form state to localStorage on change
4. **Undo/Redo**: Stack of changes for undo functionality
5. **Keyboard Shortcuts**: Cmd+S to save, Cmd+Enter to submit
6. **Form Analytics**: Track completion rate, time to submit, error frequency

### Lessons Learned

1. **Hook Composition**: Custom hooks are powerful for encapsulating complex state logic
2. **Dirty State**: Critical for good UX; users appreciate warnings about unsaved changes
3. **Callback Dependencies**: Careful management needed to avoid stale closures
4. **Modal Nesting**: Confirm dialogs inside modals require special handling to prevent unintended closes
5. **Testing Strategy**: Hook testing + integration testing provides good coverage

### Architecture Benefits

- **Testability**: Hook logic can be unit tested in isolation
- **Reusability**: Hook could be adapted for other forms
- **Maintainability**: Changes to business logic don't require touching UI
- **Debugging**: Console.log in hook to inspect state flow
- **Documentation**: Hook interface serves as API documentation

---

## Why This Structure?

This documentation follows the structure defined in `.github/copilot-instructions.md` to ensure:

1. **LLM-Friendly**: Clear sections with semantic headers make it easy for AI agents to parse and understand
2. **Human-Friendly**: Table of contents and anchors enable quick navigation
3. **Complete Context**: All information needed for implementation is in one place
4. **Reproducible**: Any developer (or AI) can follow the plan step-by-step
5. **Searchable**: Structured sections make it easy to find specific information
6. **Versionable**: Git-friendly format tracks changes over time

The level of detail ensures that:

- **No ambiguity**: Every decision is explained
- **No context switching**: No need to search other files for information
- **No guesswork**: Clear acceptance criteria and test cases
- **Future reference**: Serves as documentation for why decisions were made

---

**Status**: ✅ Ready for Implementation  
**Estimated Time**: ~2.5 hours  
**Priority**: Medium  
**Dependencies**: None  
**Author**: GitHub Copilot  
**Last Updated**: February 11, 2026
