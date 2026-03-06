import type { UserRole } from '../../modules/users/user-role.constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
