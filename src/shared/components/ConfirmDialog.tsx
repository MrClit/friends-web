import { useTranslation } from 'react-i18next';

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
  if (!open) return null;

  const resolvedTitle = title ?? t('confirmDialog.title');
  const resolvedConfirm = confirmText ?? t('confirmDialog.confirm');
  const resolvedCancel = cancelText ?? t('confirmDialog.cancel');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-white dark:bg-teal-900 rounded-2xl p-6 shadow-lg animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {resolvedTitle && <h3 className="text-lg font-bold text-teal-700 dark:text-teal-100 mb-2">{resolvedTitle}</h3>}
        <p className="text-teal-800 dark:text-teal-100 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-teal-700 text-teal-800 dark:text-teal-100 hover:bg-gray-300 dark:hover:bg-teal-800"
            onClick={onCancel}
          >
            {resolvedCancel}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold"
            onClick={onConfirm}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
      <style>{`
        .animate-slideUp {
          animation: slideUp .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
