import { useState, useCallback } from 'react';

/**
 * Generic hook for managing modal/dialog open/close state
 *
 * @param initialOpen - Initial state of the modal (default: false)
 * @returns Object with isOpen state and control methods
 *
 * @example
 * ```tsx
 * const modal = useModalState();
 *
 * return (
 *   <>
 *     <button onClick={modal.open}>Open Modal</button>
 *     <Modal open={modal.isOpen} onClose={modal.close}>
 *       <button onClick={modal.toggle}>Toggle</button>
 *     </Modal>
 *   </>
 * );
 * ```
 */
export function useModalState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export type UseModalStateReturn = ReturnType<typeof useModalState>;
