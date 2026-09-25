import { Injectable, BadRequestException } from '@nestjs/common';
import { Event } from '../events/entities/event.entity';

/** The pot is a spending bucket, not a person: it can pay for an expense but never attends anything. */
export const POT_PARTICIPANT_ID = '0';

/**
 * Single owner of the rule deciding whether a participantId is valid within an event.
 *
 * The rule comes in two explicit variants, because the pot may pay for something but may not sit at a
 * table. Every module validating a participantId depends on this service instead of walking
 * event.participants on its own, so a change to the participant model means changing one place only.
 */
@Injectable()
export class EventParticipationService {
  /**
   * Accept any participant of the event, the pot included. Rules on what the pot may do (such as which
   * payment types it can take) belong to the caller.
   */
  assertParticipantOrPot(participants: Event['participants'] | null | undefined, participantId: string): void {
    if (participantId === POT_PARTICIPANT_ID) return;

    const eventParticipants = participants ?? [];

    if (!eventParticipants.some((p) => p.id === participantId)) {
      const validIds = eventParticipants.map((p) => p.id).join(', ');
      throw new BadRequestException(
        `Participant with ID ${participantId} does not exist in this event. Valid participant IDs: ${validIds} or '0' for POT`,
      );
    }
  }

  /** Accept only people taking part in the event: users and guests, never the pot. */
  assertPersonParticipant(participants: Event['participants'] | null | undefined, participantId: string): void {
    if (participantId === POT_PARTICIPANT_ID) {
      throw new BadRequestException('The pot does not take part in the calendar');
    }

    const isPerson = (participants ?? []).some((p) => p.type !== 'pot' && p.id === participantId);

    if (!isPerson) {
      throw new BadRequestException(`Participant with ID ${participantId} does not exist in this event`);
    }
  }
}
