import { toast } from 'react-hot-toast';

export function showLogoutToast(t: (key: string, defaultValue: string) => string) {
  toast.success(t('user.logout_success', 'Sesión cerrada correctamente'));
}
