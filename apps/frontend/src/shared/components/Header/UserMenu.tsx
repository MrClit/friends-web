import { useAuth } from '@/features/auth/useAuth';
import { MdLogout, MdAccountCircle } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/hooks/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui';
import { MdExpandMore } from 'react-icons/md';
import { Avatar } from '@/shared/components/Avatar';
import { ADMIN_ROLE } from '@/features/auth/types';
import { useNavigate } from 'react-router-dom';
import { MdAdminPanelSettings } from 'react-icons/md';

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { success } = useToast();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return null;

  const handleLogout = () => {
    success('user.logout_success');

    setTimeout(() => {
      logout();
    }, 500);
  };

  const displayName = user.name || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-emerald-800/70 bg-white/80 dark:bg-emerald-950/40 p-1 pr-2.5 shadow-sm hover:bg-white dark:hover:bg-emerald-900/50 hover:border-teal-200 dark:hover:border-emerald-700/80 data-[state=open]:bg-white dark:data-[state=open]:bg-emerald-900/50 data-[state=open]:border-teal-200 dark:data-[state=open]:border-emerald-700/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-emerald-950 cursor-pointer"
          aria-label={t('user.menu', 'Opciones de usuario')}
        >
          <Avatar
            avatar={user.avatar}
            name={user.name}
            email={user.email}
            alt={user.name || user.email || 'User'}
            className="h-9 w-9 shrink-0 rounded-full"
            imageClassName="h-9 w-9 object-cover ring-1 ring-teal-300/80 dark:ring-teal-700/80 shadow-sm"
            fallbackClassName="h-9 w-9 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-bold ring-1 ring-teal-300/80 dark:ring-teal-700/80 shadow-sm"
          />
          <span className="hidden sm:block font-semibold text-slate-700 dark:text-teal-100 text-sm max-w-32 truncate">
            {displayName}
          </span>

          <MdExpandMore className="text-slate-400 group-hover:text-slate-500 dark:text-emerald-300/70 dark:group-hover:text-emerald-300 hidden md:inline text-[20px] transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-52 rounded-xl border border-slate-200 dark:border-emerald-800 bg-white/95 dark:bg-emerald-950/95 backdrop-blur"
      >
        <DropdownMenuItem disabled className="flex items-center gap-2 opacity-80 cursor-default select-text">
          <MdAccountCircle className="text-xl text-teal-500" />
          <span className="truncate">{user.email}</span>
        </DropdownMenuItem>

        {user.role === ADMIN_ROLE && (
          <DropdownMenuItem
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-teal-800 dark:text-teal-200 font-semibold cursor-pointer"
          >
            <MdAdminPanelSettings className="text-lg" />
            {t('adminUsers.menuEntry', 'User Management')}
          </DropdownMenuItem>
        )}

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
