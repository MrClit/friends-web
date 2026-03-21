import { useAuth } from '@/features/auth/useAuth';
import { MdLogout, MdAccountCircle, MdPerson } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/hooks/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui';
import { MdExpandMore } from 'react-icons/md';
import { Avatar } from '@/shared/components/Avatar';
import { ADMIN_ROLE } from '@/features/auth/types';
import { useNavigate } from 'react-router-dom';
import { MdAdminPanelSettings } from 'react-icons/md';
import { cn } from '@/shared/utils';

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
          className={cn(
            'group flex items-center rounded-full border cursor-pointer',
            'gap-2.5 p-1',
            'border-slate-200/80 bg-white/80 shadow-sm',
            'transition-colors hover:border-teal-200 hover:bg-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            'data-[state=open]:border-teal-200 data-[state=open]:bg-white',
            'dark:border-emerald-800/70 dark:bg-emerald-950/40',
            'dark:hover:border-emerald-700/80 dark:hover:bg-emerald-900/50',
            'dark:data-[state=open]:border-emerald-700/80 dark:data-[state=open]:bg-emerald-900/50',
            'dark:focus-visible:ring-offset-emerald-950',
            'sm:pr-2.5',
          )}
          aria-label={t('user.menu', 'Opciones de usuario')}
        >
          <Avatar
            avatar={user.avatar}
            name={user.name}
            email={user.email}
            alt={user.name || user.email || 'User'}
            className="h-9 w-9 shrink-0 rounded-full"
            imageClassName={cn('h-9 w-9 object-cover', 'ring-1 ring-teal-300/80 shadow-sm', 'dark:ring-teal-700/80')}
            fallbackClassName={cn(
              'flex h-9 w-9 items-center justify-center',
              'text-xs font-bold text-white',
              'bg-gradient-to-br from-teal-500 to-emerald-600',
              'ring-1 ring-teal-300/80 shadow-sm',
              'dark:ring-teal-700/80',
            )}
          />
          <span
            className={cn(
              'hidden max-w-32 truncate',
              'text-sm font-semibold text-slate-700',
              'dark:text-teal-100',
              'sm:block',
            )}
          >
            {displayName}
          </span>

          <MdExpandMore
            className={cn(
              'hidden text-[20px] text-slate-400 transition-colors',
              'group-hover:text-slate-500',
              'dark:text-emerald-300/70 dark:group-hover:text-emerald-300',
              'md:inline',
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'min-w-52 rounded-xl border backdrop-blur',
          'border-slate-200 bg-white/95',
          'dark:border-emerald-800 dark:bg-emerald-950/95',
        )}
      >
        <DropdownMenuItem disabled className="flex items-center gap-2 opacity-80 cursor-default select-text">
          <MdAccountCircle className="text-xl text-teal-500" />
          <span className="truncate">{user.email}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className={cn('flex items-center gap-2 cursor-pointer', 'font-semibold text-teal-800', 'dark:text-teal-200')}
        >
          <MdPerson className="text-lg" />
          {t('user.profile', 'Profile')}
        </DropdownMenuItem>

        {user.role === ADMIN_ROLE && (
          <DropdownMenuItem
            onClick={() => navigate('/admin/users')}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              'font-semibold text-teal-800',
              'dark:text-teal-200',
            )}
          >
            <MdAdminPanelSettings className="text-lg" />
            {t('adminUsers.menuEntry', 'User Management')}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={handleLogout}
          className={cn(
            'mt-1 flex items-center gap-2 cursor-pointer',
            'font-semibold text-red-700',
            'dark:text-red-300',
          )}
        >
          <MdLogout className="text-lg" />
          {t('user.logout', 'Cerrar sesión')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
