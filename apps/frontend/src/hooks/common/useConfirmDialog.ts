import { useState, useCallback } from 'react';

/**
 * Specialized hook for managing confirmation dialogs
 * Handles the pattern of showing a dialog and executing an action on confirmation
 *
 * @returns Object with dialog state and control methods
 *
 * @example
 * ```tsx
 * const deleteDialog = useConfirmDialog();
 *
 * const handleDelete = () => {
 *   // Actual delete logic
 *   console.log('Item deleted');
 * };
 *
 * return (
 *   <>
 *     <button onClick={() => deleteDialog.confirm(handleDelete)}>
 *       Delete Item
 *     </button>
 *
 *     <ConfirmDialog
 *       open={deleteDialog.isOpen}
 *       onConfirm={deleteDialog.handleConfirm}
 *       onCancel={deleteDialog.handleCancel}
 *       title="Delete Item"
 *       message="Are you sure you want to delete this item?"
 *     />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  /**
   * Shows the confirmation dialog with a pending action
   * @param action - Function to execute on confirmation
   */
  const confirm = useCallback((action: () => void) => {
    // Wrap in arrow function to properly store the function reference
    setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  /**
   * Executes the pending action and closes the dialog
   */
  const handleConfirm = useCallback(() => {
    try {
      if (pendingAction) {
        pendingAction();
      }
    } finally {
      // Always clean up, even if the action throws an error
      setIsOpen(false);
      setPendingAction(null);
    }
  }, [pendingAction]);

  /**
   * Cancels the pending action and closes the dialog
   */
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

export type UseConfirmDialogReturn = ReturnType<typeof useConfirmDialog>;
