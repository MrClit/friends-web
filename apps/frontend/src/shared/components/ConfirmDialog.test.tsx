import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const dialogMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'confirmDialog.title': 'Confirm action',
        'confirmDialog.confirm': 'Confirm',
        'confirmDialog.cancel': 'Cancel',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/shared/components/ui', () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => {
    dialogMock({ open, onOpenChange });
    return (
      <div data-testid="dialog-root">
        <button type="button" onClick={() => onOpenChange(false)}>
          trigger-close
        </button>
        {children}
      </div>
    );
  },
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogCloseButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DialogPrimaryButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('ConfirmDialog', () => {
  it('renders translated fallback title and button labels when optional props are omitted', () => {
    render(<ConfirmDialog open message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders custom title and labels when provided', () => {
    render(
      <ConfirmDialog
        open
        title="Delete event"
        message="This cannot be undone"
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Delete event')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm and onCancel handlers from action buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ConfirmDialog open message="Proceed?" onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Confirm'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when dialog requests close via onOpenChange(false)', () => {
    const onCancel = vi.fn();

    render(<ConfirmDialog open message="Proceed?" onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('trigger-close'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
