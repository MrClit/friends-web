import { BadRequestException } from '@nestjs/common';
import { Event } from '../events/entities/event.entity';
import { EventParticipationService } from './event-participation.service';

describe('EventParticipationService', () => {
  let service: EventParticipationService;

  const participants: Event['participants'] = [
    { type: 'guest', id: 'g1', name: 'Guest 1' },
    { type: 'user', id: 'u1', name: 'User 1' },
    { type: 'pot', id: '0' },
  ];

  beforeEach(() => {
    service = new EventParticipationService();
  });

  describe('assertParticipantOrPot', () => {
    it.each(['u1', 'g1'])('accepts participant %s', (participantId) => {
      expect(() => service.assertParticipantOrPot(participants, participantId)).not.toThrow();
    });

    it('accepts the pot, even when the event does not list it', () => {
      expect(() => service.assertParticipantOrPot(participants, '0')).not.toThrow();
      expect(() => service.assertParticipantOrPot([], '0')).not.toThrow();
    });

    it('rejects an id outside the event, listing the valid ones', () => {
      const withoutPot = participants.filter((p) => p.type !== 'pot');

      expect(() => service.assertParticipantOrPot(withoutPot, 'stranger')).toThrow(
        new BadRequestException(
          "Participant with ID stranger does not exist in this event. Valid participant IDs: g1, u1 or '0' for POT",
        ),
      );
    });

    it('treats missing participants as an empty list', () => {
      expect(() => service.assertParticipantOrPot(null, 'u1')).toThrow(BadRequestException);
      expect(() => service.assertParticipantOrPot(undefined, '0')).not.toThrow();
    });
  });

  describe('assertPersonParticipant', () => {
    it.each(['u1', 'g1'])('accepts participant %s', (participantId) => {
      expect(() => service.assertPersonParticipant(participants, participantId)).not.toThrow();
    });

    it('rejects the pot, even when the event lists it', () => {
      expect(() => service.assertPersonParticipant(participants, '0')).toThrow(
        new BadRequestException('The pot does not take part in the calendar'),
      );
    });

    it('does not count a pot entry as a person, whatever its id', () => {
      const oddPot = [{ type: 'pot', id: 'p1' }] as unknown as Event['participants'];

      expect(() => service.assertPersonParticipant(oddPot, 'p1')).toThrow(BadRequestException);
    });

    it('rejects an id outside the event', () => {
      expect(() => service.assertPersonParticipant(participants, 'stranger')).toThrow(
        new BadRequestException('Participant with ID stranger does not exist in this event'),
      );
    });

    it('treats missing participants as an empty list', () => {
      expect(() => service.assertPersonParticipant(null, 'u1')).toThrow(BadRequestException);
    });
  });
});
