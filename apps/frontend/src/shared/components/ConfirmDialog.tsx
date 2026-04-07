import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
  DialogPrimaryButton,
} from '@/shared/components/ui';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('confirmDialog');

  const resolvedTitle = title ?? t('title');
  const resolvedConfirm = confirmText ?? t('confirm');
  const resolvedCancel = cancelText ?? t('cancel');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="z-60 p-5">
        <DialogTitle>{resolvedTitle}</DialogTitle>
        <DialogDescription className="text-teal-800 dark:text-teal-100 mb-6">{message}</DialogDescription>
        <div className="flex justify-end gap-3">
          <DialogCloseButton onClick={onCancel}>{resolvedCancel}</DialogCloseButton>
          <DialogPrimaryButton onClick={onConfirm}>{resolvedConfirm}</DialogPrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
