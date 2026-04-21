import { BadRequestException } from '@nestjs/common';
import { PaymentType } from '@friends/shared-types';
import { ParticipantValidationService } from './participant-validation.service';

describe('ParticipantValidationService', () => {
  let service: ParticipantValidationService;

  const participants = [
    { type: 'guest' as const, id: 'g1', name: 'Guest 1' },
    { type: 'user' as const, id: 'u1', name: 'User 1' },
  ];

  beforeEach(() => {
    service = new ParticipantValidationService();
  });

  describe('POT participant (id = "0")', () => {
    it('allows POT with expense', () => {
      expect(() => service.validateParticipantId('0', PaymentType.EXPENSE, participants)).not.toThrow();
    });

    it('throws when POT is used with contribution', () => {
      expect(() => service.validateParticipantId('0', PaymentType.CONTRIBUTION, participants)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateParticipantId('0', PaymentType.CONTRIBUTION, participants)).toThrow('POT');
    });

    it('throws when POT is used with compensation', () => {
      expect(() => service.validateParticipantId('0', PaymentType.COMPENSATION, participants)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateParticipantId('0', PaymentType.COMPENSATION, participants)).toThrow('POT');
    });
  });

  describe('user participant', () => {
    it.each([PaymentType.CONTRIBUTION, PaymentType.EXPENSE, PaymentType.COMPENSATION])(
      'allows user with paymentType %s',
      (paymentType) => {
        expect(() => service.validateParticipantId('u1', paymentType, participants)).not.toThrow();
      },
    );
  });

  describe('guest participant', () => {
    it.each([PaymentType.CONTRIBUTION, PaymentType.EXPENSE, PaymentType.COMPENSATION])(
      'allows guest with paymentType %s',
      (paymentType) => {
        expect(() => service.validateParticipantId('g1', paymentType, participants)).not.toThrow();
      },
    );
  });

  it('throws BadRequestException when participant id does not exist', () => {
    expect(() => service.validateParticipantId('invalid-id', PaymentType.EXPENSE, participants)).toThrow(
      BadRequestException,
    );
    expect(() => service.validateParticipantId('invalid-id', PaymentType.EXPENSE, participants)).toThrow(
      "Valid participant IDs: g1, u1 or '0' for POT",
    );
  });
});
