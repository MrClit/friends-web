export interface UserParticipant {
  type: 'user';
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  contributionTarget?: number;
}

export interface GuestParticipant {
  type: 'guest';
  id: string;
  name: string;
  contributionTarget?: number;
}

export interface PotParticipant {
  type: 'pot';
  id: '0';
}

export type EventParticipant = UserParticipant | GuestParticipant | PotParticipant;
