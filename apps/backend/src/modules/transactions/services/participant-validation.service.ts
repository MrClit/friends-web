import { Injectable, BadRequestException } from '@nestjs/common';

const POT_PARTICIPANT_ID = '0';

@Injectable()
export class ParticipantValidationService {
  /**
   * Validate that participantId exists in event participants or is '0' (POT)
   * @throws BadRequestException if participantId is invalid
   */
  validateParticipantId(participantId: string, participants: Array<{ id: string; name: string }>): void {
    // Allow POT participant
    if (participantId === POT_PARTICIPANT_ID) {
      return;
    }

    // Check if participant exists in event
    const participantExists = participants.some((p) => p.id === participantId);

    if (!participantExists) {
      throw new BadRequestException(
        `Participant with ID ${participantId} does not exist in this event. Valid participant IDs: ${participants.map((p) => p.id).join(', ')} or '0' for POT`,
      );
    }
  }
}