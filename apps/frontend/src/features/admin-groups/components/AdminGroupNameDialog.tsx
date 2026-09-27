import { useTranslation } from 'react-i18next';

import { DialogFormWrapper } from '@/shared/components/DialogFormWrapper';
import { FormErrorAlert } from '@/shared/components/FormErrorAlert';

/** Mirrors GROUP_NAME_MAX_LENGTH on the backend. */
const GROUP_NAME_MAX_LENGTH = 100;

interface AdminGroupNameDialogProps {
  mode: 'closed' | 'create' | 'rename';
  name: string;
  error: string | null;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export function AdminGroupNameDialog({
  mode,
  name,
  error,
  isSaving,
  onNameChange,
  onClose,
  onSubmit,
}: AdminGroupNameDialogProps) {
  const { t } = useTranslation(['adminGroups', 'common']);
  const isCreate = mode === 'create';

  const actionLabel = isCreate
    ? t(isSaving ? 'creating' : 'createAction', { ns: 'adminGroups' })
    : t(isSaving ? 'renaming' : 'renameAction', { ns: 'adminGroups' });

  return (
    <DialogFormWrapper
      open={mode !== 'closed'}
      onOpenChange={(open) => !open && onClose()}
      title={t(isCreate ? 'createTitle' : 'renameTitle', { ns: 'adminGroups' })}
      closeAriaLabel={t('close', { ns: 'common' })}
      primaryAction={{ label: actionLabel, onClick: onSubmit, disabled: isSaving }}
      secondaryAction={{ label: t('close', { ns: 'common' }), onClick: onClose, disabled: isSaving }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <FormErrorAlert message={error} />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('fields.name', { ns: 'adminGroups' })}
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={GROUP_NAME_MAX_LENGTH}
            disabled={isSaving}
            required
            aria-invalid={error ? true : undefined}
          />
        </label>
      </form>
    </DialogFormWrapper>
  );
}
