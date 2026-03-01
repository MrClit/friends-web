export const USER_ROLES = ['admin', 'user'] as const;

export const ADMIN_ROLE = USER_ROLES[0];
export const USER_ROLE = USER_ROLES[1];

export type UserRole = (typeof USER_ROLES)[number];
