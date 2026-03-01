import { useTranslation } from 'react-i18next';

import { USER_ROLES, type UserRole } from '@/features/auth/types';

import type { CreateAdminUserFormData, EditAdminUserFormData } from '../types';

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
  const { t } = useTranslation();

  if (mode === 'create') {
    const onRoleChange = (role: string) => {
      onChange({ ...form, role: role as UserRole });
    };

    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('adminUsers.fields.email', 'Email')}
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            disabled={disabled}
            required
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('adminUsers.fields.role', 'Role')}
          <select
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            value={form.role}
            onChange={(event) => onRoleChange(event.target.value)}
            disabled={disabled}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  const onRoleChange = (role: string) => {
    onChange({ ...form, role: role as UserRole });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('adminUsers.fields.email', 'Email')}
        <input
          type="email"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          value={form.email}
          onChange={(event) => onChange({ ...form, email: event.target.value })}
          disabled={disabled}
          required
        />
      </label>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('adminUsers.fields.name', 'Name')}
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          disabled={disabled}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('adminUsers.fields.avatar', 'Avatar URL')}
        <input
          type="url"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          value={form.avatar}
          onChange={(event) => onChange({ ...form, avatar: event.target.value })}
          disabled={disabled}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('adminUsers.fields.role', 'Role')}
        <select
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          value={form.role}
          onChange={(event) => onRoleChange(event.target.value)}
          disabled={disabled}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
