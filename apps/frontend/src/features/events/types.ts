// Event types aligned with backend API contracts
import type {
  CreateEventDto,
  Event as ApiEvent,
  EventParticipantDto,
  ParticipantReplacementDto,
  UpdateEventDto,
} from '@/api/types';

export type EventParticipant = EventParticipantDto;
export type Event = ApiEvent;
export type ParticipantReplacement = ParticipantReplacementDto;

export type EventFormData = {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  participants: EventParticipant[];
  participantReplacements?: ParticipantReplacement[];
};

export type CreateEventInput = CreateEventDto;
export type UpdateEventInput = UpdateEventDto;
