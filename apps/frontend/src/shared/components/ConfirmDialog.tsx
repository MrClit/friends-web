import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const resolvedTitle = title ?? t('confirmDialog.title');
  const resolvedConfirm = confirmText ?? t('confirmDialog.confirm');
  const resolvedCancel = cancelText ?? t('confirmDialog.cancel');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="z-60">
        <DialogTitle>{resolvedTitle}</DialogTitle>
        <DialogDescription className="text-teal-800 dark:text-teal-100 mb-6">{message}</DialogDescription>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-teal-700 text-teal-800 dark:text-teal-100 hover:bg-gray-300 dark:hover:bg-teal-800 cursor-pointer"
            onClick={onCancel}
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold cursor-pointer"
            onClick={onConfirm}
          >
            {resolvedConfirm}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
