import { BadRequestException } from '@nestjs/common';
import { ParticipantValidationService } from './participant-validation.service';

describe('ParticipantValidationService', () => {
  let service: ParticipantValidationService;

  beforeEach(() => {
    service = new ParticipantValidationService();
  });

  it('allows POT participant id', () => {
    expect(() =>
      service.validateParticipantId('0', [
        { type: 'guest', id: 'g1', name: 'Guest 1' },
        { type: 'user', id: 'u1', name: 'User 1' },
      ]),
    ).not.toThrow();
  });

  it('allows participant id that exists in event participants', () => {
    expect(() =>
      service.validateParticipantId('g1', [
        { type: 'guest', id: 'g1', name: 'Guest 1' },
        { type: 'user', id: 'u1', name: 'User 1' },
      ]),
    ).not.toThrow();
  });

  it('throws BadRequestException when participant id does not exist', () => {
    expect(() =>
      service.validateParticipantId('invalid-id', [
        { type: 'guest', id: 'g1', name: 'Guest 1' },
        { type: 'user', id: 'u1', name: 'User 1' },
      ]),
    ).toThrow(BadRequestException);

    expect(() =>
      service.validateParticipantId('invalid-id', [
        { type: 'guest', id: 'g1', name: 'Guest 1' },
        { type: 'user', id: 'u1', name: 'User 1' },
      ]),
    ).toThrow("Valid participant IDs: g1, u1 or '0' for POT");
  });
});
