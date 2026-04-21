export const EventStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
