import { useAuth } from '@/features/auth/useAuth';
import { MdLogout, MdAccountCircle } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { showLogoutToast } from '@/shared/utils/toastUtils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui';

function stringAvatar(name?: string, email?: string) {
  if (name) return name[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return null;
  if (!user) return null;

  const handleLogout = () => {
    logout();
    showLogoutToast(t);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border-2 border-teal-400 dark:border-teal-700 px-2 py-1 bg-transparent hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label={t('user.menu', 'Opciones de usuario')}
        >
          {user.avatar && user.avatar.trim() !== '' ? (
            <img
              src={user.avatar}
              alt={user.name || user.email || 'User'}
              className="w-8 h-8 rounded-full object-cover border-2 border-teal-400 dark:border-teal-700 shadow"
            />
          ) : (
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-200 dark:bg-teal-700 text-teal-800 dark:text-teal-100 font-bold text-lg border-2 border-teal-400 dark:border-teal-700">
              {stringAvatar(user.name, user.email)}
            </span>
          )}
          <span className="hidden sm:block font-semibold text-teal-900 dark:text-teal-100 text-sm max-w-30 truncate">
            {user.name || user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-900"
      >
        <DropdownMenuItem disabled className="flex items-center gap-2 opacity-80 cursor-default select-text">
          <MdAccountCircle className="text-xl text-teal-500" />
          <span className="truncate">{user.email}</span>
        </DropdownMenuItem>
        {/* Futuro: <DropdownMenuItem>Perfil</DropdownMenuItem> */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold cursor-pointer mt-1"
        >
          <MdLogout className="text-lg" />
          {t('user.logout', 'Cerrar sesión')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
