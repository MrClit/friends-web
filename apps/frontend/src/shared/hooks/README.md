# Shared Hooks

Collection of reusable React hooks for the Friends application.

## Modal State Management

### `useModalState`

Generic hook for managing modal/dialog open/close state.

**Usage:**

```tsx
import { useModalState } from '@/shared/hooks';

function MyComponent() {
  const modal = useModalState();

  return (
    <>
      <button onClick={modal.open}>Open Modal</button>
      <Modal open={modal.isOpen} onClose={modal.close}>
        <p>Modal content</p>
        <button onClick={modal.toggle}>Toggle</button>
      </Modal>
    </>
  );
}
```

**API:**

- `isOpen: boolean` - Current open state
- `open: () => void` - Opens the modal
- `close: () => void` - Closes the modal
- `toggle: () => void` - Toggles the modal state

**When to use:**

- Simple modals that need open/close state
- Dropdowns, dialogs, sidebars
- Any UI element with show/hide behavior

---

### `useConfirmDialog`

Specialized hook for managing confirmation dialogs with pending actions.

**Usage:**

```tsx
import { useConfirmDialog } from '@/shared/hooks';

function MyComponent() {
  const deleteDialog = useConfirmDialog();

  const handleDelete = () => {
    // Actual delete logic
    deleteItem(itemId);
  };

  return (
    <>
      <button onClick={() => deleteDialog.confirm(handleDelete)}>Delete Item</button>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onConfirm={deleteDialog.handleConfirm}
        onCancel={deleteDialog.handleCancel}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
      />
    </>
  );
}
```

**API:**

- `isOpen: boolean` - Current dialog state
- `confirm: (action: () => void) => void` - Shows dialog with pending action
- `handleConfirm: () => void` - Executes action and closes dialog
- `handleCancel: () => void` - Cancels action and closes dialog

**When to use:**

- Delete confirmations
- Destructive actions that need user confirmation
- Discard changes warnings
- Any action requiring explicit user consent

**Handling actions with parameters:**

Use closures to pass parameters to the action:

```tsx
const deleteDialog = useConfirmDialog();
const itemId = '123';

<button onClick={() => deleteDialog.confirm(() => deleteItem(itemId))}>Delete</button>;
```

---

## Testing

Both hooks have comprehensive test coverage:

```bash
# Run tests
pnpm test useModalState useConfirmDialog

# Run with coverage
pnpm test:coverage useModalState useConfirmDialog
```

---

## Architecture

These hooks follow the UI State Management Strategy documented in `/docs/UI_STATE_MANAGEMENT_STRATEGY.md`:

- ✅ **Modal state**: Always use `useModalState` or `useConfirmDialog`
- ✅ **Business logic**: Separate in custom hooks (e.g., `useEventDetail`)
- ✅ **No Zustand**: Only if state is truly shared between pages

---

## See Also

- [UI State Management Strategy](/docs/UI_STATE_MANAGEMENT_STRATEGY.md)
- [useInfiniteScroll](./useInfiniteScroll.ts)
