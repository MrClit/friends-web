import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/shared/utils';

// ============================================================================
// PRIMITIVE COMPONENTS - Direct re-exports from Radix Dialog
// ============================================================================

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ============================================================================
// COMPLEX COMPONENTS - Overlay and Content
// ============================================================================

/**
 * DialogOverlay: Semi-transparent background layer behind the dialog.
 * Features:
 * - Dark background with blur effect
 * - Centers content (flex)
 * - High z-index to stay on top of everything
 */
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Layout
      'fixed inset-0 z-50 flex items-center justify-center p-4',
      // Visuals
      'bg-[rgba(2,44,34,0.4)] backdrop-blur-sm',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent: Main container for the modal dialog.
 * Features:
 * - Positioned in the center of the screen
 * - Maximum 90vh height
 * - Rounded corners and shadow
 * - Dark theme support
 */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay>
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Layout & positioning
          // Use overlay's flexbox centering and padding so the overlay's `p-4`
          // creates the lateral margin. Avoid `position: fixed` here because
          // fixed elements compute `w-full` relative to the viewport and
          // ignore the overlay padding.
          'relative z-50 mx-auto',
          // Size & constraints
          'w-full max-w-xl',
          'flex flex-col max-h-[90vh] overflow-hidden',
          // Visuals
          'bg-white dark:bg-emerald-950 rounded-4xl shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogOverlay>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogBottomSheet: Mobile variant of the dialog.
 * Slides up from the bottom of the screen.
 * Features:
 * - Positioned at the bottom
 * - Smooth slide-up animation
 * - Maximum 90vh height
 * - Auto-scroll for long content
 */
const DialogBottomSheet = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300 motion-reduce:animate-none" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md bg-white dark:bg-teal-900 rounded-t-3xl p-6 shadow-lg',
        'min-h-[50vh] max-h-[90vh] overflow-y-auto',
        'animate-[slideUpDialog_0.3s_cubic-bezier(0.4,0,0.2,1)] motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      {children}
      <style>{`
        @keyframes slideUpDialog {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogBottomSheet.displayName = 'DialogBottomSheet';

// ============================================================================
// LAYOUT COMPONENTS - Internal dialog structure
// ============================================================================

/**
 * DialogHeader: Dialog header.
 * Typically contains the title and close button.
 * Features:
 * - Horizontal spacing between elements
 * - Bottom border for visual separation
 */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <header
    className={cn(
      // 'flex flex-col space-y-1.5',
      'px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

/**
 * DialogBody: Main content container of the dialog.
 * Features:
 * - Flexible flex that grows automatically
 * - Custom scroll for long content
 * - Horizontal and vertical padding
 */
const DialogBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 min-h-0 overflow-y-auto px-8 py-4 custom-scrollbar ', className)} {...props}>
    {children}
  </div>
);
DialogBody.displayName = 'DialogBody';

/**
 * DialogFooter: Dialog footer.
 * Typically contains action buttons (Cancel, Save, etc.)
 * Features:
 * - Responsive flex (column on mobile, row on desktop)
 * - Right alignment on desktop
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <footer className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

// ============================================================================
// INTERACTION COMPONENTS - Buttons and interactive elements
// ============================================================================

/**
 * DialogCloseButton: Button to close the dialog.
 * Features:
 * - × icon by default or custom content
 * - Hover effect with background
 * - Dark theme support
 * - Fully accessible
 */
const DialogCloseButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Close asChild>
      <button
        ref={ref}
        type="button"
        className={cn(
          'px-6 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-emerald-800/50 transition-colors cursor-pointer text-xl',
          className,
        )}
        {...props}
      >
        {children ?? <span aria-hidden>×</span>}
      </button>
    </DialogPrimitive.Close>
  ),
);
DialogCloseButton.displayName = 'DialogCloseButton';

/**
 * DialogPrimaryButton: Primary action button for dialogs.
 * Features:
 * - Emerald background with hover and active effects
 * - Disabled state with reduced opacity
 * - Dark theme support
 * - Fully accessible
 */
const DialogPrimaryButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        // Base styles
        'px-10 py-3.5 rounded-2xl font-extrabold text-white transition-all',
        // Enabled state
        'bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/25 active:scale-95 cursor-pointer',
        // Disabled state: reduce opacity and remove interactivity
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-emerald-600',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
DialogPrimaryButton.displayName = 'DialogPrimaryButton';

// ============================================================================
// TEXT COMPONENTS - Titles and descriptions
// ============================================================================

/**
 * DialogTitle: Main title of the dialog.
 * Features:
 * - XL text size and bold weight
 * - Teal color with dark theme support
 * - Automatically linked to dialog by Radix for accessibility
 */
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-bold text-teal-700 dark:text-teal-100', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription: Secondary descriptive text of the dialog.
 * Features:
 * - SM size text in gray color
 * - Dark theme supported
 * - Automatically linked to dialog by Radix for accessibility
 */
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-300', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ============================================================================
// USAGE INSTRUCTIONS AND BEST PRACTICES
// ============================================================================

/*
  USAGE NOTES (Radix best-practices):
  
  1. STRUCTURE:
     - DialogTitle and DialogDescription must be direct children of DialogContent
       so Radix can link them automatically (aria-labelledby, aria-describedby)
  
  2. CLOSING THE DIALOG:
     - Use DialogCloseButton for consistent and accessible close buttons
     - DialogContent and DialogBottomSheet support Radix autofocus props
       (e.g: onOpenAutoFocus, onCloseAutoFocus)
  
  3. ANIMATIONS:
     - All animations respect prefers-reduced-motion
     - Transitions are smooth and fast (300ms)
  
  4. DARK THEME:
     - Use dark: classes for automatic dark theme support
     - Colors adjust automatically
  
  5. RESPONSIVE:
     - DialogContent: centered on all screens
     - DialogBottomSheet: optimized for mobile
     - DialogFooter: automatic layout change at sm breakpoint
*/

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogBottomSheet,
  DialogHeader,
  DialogFooter,
  DialogCloseButton,
  DialogPrimaryButton,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
