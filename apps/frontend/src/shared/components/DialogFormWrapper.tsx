import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
  DialogPrimaryButton,
} from '@/shared/components/ui';

interface Action {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

interface DialogFormWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  primaryAction: Action;
  secondaryAction?: Action;
  closeAriaLabel?: string;
  className?: string;
}

export function DialogFormWrapper({
  open,
  onOpenChange,
  title,
  children,
  primaryAction,
  secondaryAction,
  closeAriaLabel,
  className,
}: DialogFormWrapperProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton
            onClick={() => onOpenChange(false)}
            disabled={primaryAction?.disabled}
            aria-label={closeAriaLabel ?? t('close')}
          />
        </DialogHeader>

        <DialogBody className={className}>{children}</DialogBody>

        <DialogFooter className="px-8 pb-8">
          <DialogCloseButton onClick={() => onOpenChange(false)} disabled={secondaryAction?.disabled}>
            {secondaryAction?.label ?? 'Close'}
          </DialogCloseButton>
          <DialogPrimaryButton type="button" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
            {primaryAction.label}
          </DialogPrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogFormWrapper;
