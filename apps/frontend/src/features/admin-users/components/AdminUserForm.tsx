import { useTranslation } from 'react-i18next';

import { USER_ROLES, type UserRole } from '@/features/auth/types';
import * as Select from '@radix-ui/react-select';

import type { CreateAdminUserFormData, EditAdminUserFormData } from '../types';

interface TextFieldProps {
  label: string;
  type?: string;
  value: string;
  onChangeField: (v: string) => void;
  required?: boolean;
  disabled: boolean;
}

function TextField({ label, type = 'text', value, onChangeField, required = false, disabled }: TextFieldProps) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <input
        type={type}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        value={value}
        onChange={(e) => onChangeField(e.target.value)}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}

interface RoleSelectProps {
  value: string;
  onChangeValue: (v: string) => void;
  disabled: boolean;
}

function RoleSelect({ value, onChangeValue, disabled }: RoleSelectProps) {
  const { t } = useTranslation('adminUsers');
  const roleLabel = value ? t(`roles.${value}.label`, { defaultValue: value.toUpperCase() }) : '';
  const roleDescription = value ? t(`roles.${value}.description`, { defaultValue: '' }) : '';

  return (
    <Select.Root value={value} onValueChange={(v) => onChangeValue(v)} disabled={disabled}>
      <Select.Trigger
        aria-label={t('fields.role', 'Role')}
        className="mt-1 w-full inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      >
        <Select.Value placeholder={t('selectRole', 'Select role')}>
          {roleLabel && (
            <span className="inline-flex items-center gap-2">
              <span>{roleLabel}</span>
              {roleDescription && <span className="text-xs text-gray-500 dark:text-gray-300">{roleDescription}</span>}
            </span>
          )}
        </Select.Value>
        <Select.Icon>
          <svg
            className="h-4 w-4 text-gray-500 dark:text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <Select.Viewport className="p-1">
            {USER_ROLES.map((role) => (
              <Select.Item
                key={role}
                value={role}
                className="relative flex cursor-default select-none items-center rounded-md pl-8 pr-3 py-2 text-sm text-gray-900 hover:bg-gray-100 data-disabled:opacity-50 dark:text-white dark:hover:bg-gray-800"
              >
                <Select.ItemText>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {t(`roles.${role}.label`, { defaultValue: role.toUpperCase() })}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      {t(`roles.${role}.description`, { defaultValue: '' })}
                    </span>
                  </div>
                </Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <svg
                    className="h-4 w-4 text-emerald-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

interface CreateAdminUserFormProps {
  form: CreateAdminUserFormData;
  onChange: (form: CreateAdminUserFormData) => void;
  mode: 'create';
  disabled?: boolean;
}

interface EditAdminUserFormProps {
  form: EditAdminUserFormData;
  onChange: (form: EditAdminUserFormData) => void;
  mode: 'edit';
  disabled?: boolean;
}

type AdminUserFormProps = CreateAdminUserFormProps | EditAdminUserFormProps;

export function AdminUserForm({ form, onChange, mode, disabled = false }: AdminUserFormProps) {
  const { t } = useTranslation('adminUsers');

  const onRoleChange = (role: string) => {
    if (mode === 'create') {
      onChange({ ...(form as CreateAdminUserFormData), role: role as UserRole });
      return;
    }

    // mode === 'edit'
    onChange({ ...(form as EditAdminUserFormData), role: role as UserRole });
  };

  if (mode === 'create') {
    return (
      <div className="space-y-4">
        <TextField
          label={t('fields.email', 'Email')}
          type="email"
          value={form.email}
          onChangeField={(v) => onChange({ ...form, email: v })}
          disabled={disabled}
          required
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('fields.role', 'Role')}
          <RoleSelect value={form.role} onChangeValue={(v) => onRoleChange(v)} disabled={disabled} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TextField
        label={t('fields.email', 'Email')}
        type="email"
        value={form.email}
        onChangeField={(v) => onChange({ ...form, email: v })}
        disabled={disabled}
        required
      />

      <TextField
        label={t('fields.name', 'Name')}
        type="text"
        value={form.name}
        onChangeField={(v) => onChange({ ...form, name: v })}
        disabled={disabled}
      />

      <TextField
        label={t('fields.avatar', 'Avatar URL')}
        type="url"
        value={form.avatar}
        onChangeField={(v) => onChange({ ...form, avatar: v })}
        disabled={disabled}
      />

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.role', 'Role')}
        <RoleSelect value={form.role} onChangeValue={(v) => onRoleChange(v)} disabled={disabled} />
      </label>
    </div>
  );
}

export default AdminUserForm;
