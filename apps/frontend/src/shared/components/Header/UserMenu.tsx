import { useAuth } from '@/features/auth/useAuth';
import { MdLogout, MdAccountCircle } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/hooks/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui';
import { MdExpandMore } from 'react-icons/md';
import Avatar from '@/shared/components/Avatar';

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { success } = useToast();

  if (loading) return null;
  if (!user) return null;

  const handleLogout = () => {
    success('user.logout_success');

    setTimeout(() => {
      logout();
    }, 500);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white dark:hover:bg-emerald-900/50 transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800 cursor-pointer"
          aria-label={t('user.menu', 'Opciones de usuario')}
        >
          <Avatar
            avatar={user.avatar}
            name={user.name}
            email={user.email}
            alt={user.name || user.email || 'User'}
            imageClassName="w-8 h-8 rounded-full object-cover border-2 border-teal-400 dark:border-teal-700 shadow"
            fallbackClassName="hidden sm:block font-semibold text-teal-900 dark:text-teal-100 text-sm max-w-30 truncate"
          />
          <span className="hidden sm:block font-semibold text-teal-900 dark:text-teal-100 text-sm max-w-30 truncate">
            {user.name || user.email}
          </span>

          <MdExpandMore className="text-slate-400 hidden md:inline text-[20px]" />
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
