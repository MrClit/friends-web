import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentType } from '@friends/shared-types';
import { UserParticipant, GuestParticipant, PotParticipant } from '../../events/entities/event.entity';

const POT_PARTICIPANT_ID = '0';

@Injectable()
export class ParticipantValidationService {
  validateParticipantId(
    participantId: string,
    paymentType: PaymentType,
    participants: (UserParticipant | GuestParticipant | PotParticipant)[],
  ): void {
    if (participantId === POT_PARTICIPANT_ID) {
      if (paymentType !== PaymentType.EXPENSE) {
        throw new BadRequestException(`POT participant can only be used with payment type 'expense'`);
      }
      return;
    }

    const participantExists = participants.some((p) => p.id === participantId);

    if (!participantExists) {
      const validIds = participants.map((p) => p.id).join(', ');
      throw new BadRequestException(
        `Participant with ID ${participantId} does not exist in this event. Valid participant IDs: ${validIds} or '0' for POT`,
      );
    }
  }
}
