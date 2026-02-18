import { Injectable, BadRequestException } from '@nestjs/common';
import { UserParticipant, GuestParticipant, PotParticipant } from '../../events/entities/event.entity';

const POT_PARTICIPANT_ID = '0';

@Injectable()
export class ParticipantValidationService {
  /**
   * Validate that participantId exists in event participants or is '0' (POT)
   * Supports both UserParticipant (references to User entity) and GuestParticipant
   * @throws BadRequestException if participantId is invalid
   */
  validateParticipantId(
    participantId: string,
    participants: (UserParticipant | GuestParticipant | PotParticipant)[],
  ): void {
    // Allow POT participant
    if (participantId === POT_PARTICIPANT_ID) {
      return;
    }

    // Check if participant exists in event (both User and Guest participants have id)
    const participantExists = participants.some((p) => p.id === participantId);

    if (!participantExists) {
      const validIds = participants.map((p) => p.id).join(', ');
      throw new BadRequestException(
        `Participant with ID ${participantId} does not exist in this event. Valid participant IDs: ${validIds} or '0' for POT`,
      );
    }
  }
}
