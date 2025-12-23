import { describe, it, expect, beforeEach } from 'vitest';
import { useEventsStore } from './useEventsStore';
import type { EventParticipant } from '../types';

/**
 * Tests for the Events Zustand store
 * Tests state management, persistence, and business logic
 */
describe('useEventsStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useEventsStore.setState({ events: [] });
    localStorage.clear();
  });

  describe('addEvent', () => {
    it('should add a new event', () => {
      const participants: EventParticipant[] = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ];

      useEventsStore.getState().addEvent('Summer Trip', participants);

      const { events } = useEventsStore.getState();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: 'Summer Trip',
        participants,
      });
      expect(events[0].id).toBe('test-uuid-1'); // From our mocked crypto.randomUUID
    });

    it('should add multiple events', () => {
      useEventsStore.getState().addEvent('Event 1', []);
      useEventsStore.getState().addEvent('Event 2', []);

      const { events } = useEventsStore.getState();
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
      expect(events[1].title).toBe('Event 2');
    });

    it('should generate unique IDs for each event', () => {
      useEventsStore.getState().addEvent('Event 1', []);
      useEventsStore.getState().addEvent('Event 2', []);

      const { events } = useEventsStore.getState();
      expect(events[0].id).toBe('test-uuid-1');
      expect(events[1].id).toBe('test-uuid-2');
    });
  });

  describe('updateEvent', () => {
    it('should update event title and participants', () => {
      const initialParticipants: EventParticipant[] = [
        { id: 'p1', name: 'Alice' },
      ];
      const updatedParticipants: EventParticipant[] = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ];

      useEventsStore.getState().addEvent('Old Title', initialParticipants);
      const eventId = useEventsStore.getState().events[0].id;

      useEventsStore.getState().updateEvent(eventId, 'New Title', updatedParticipants);

      const { events } = useEventsStore.getState();
      expect(events[0].title).toBe('New Title');
      expect(events[0].participants).toEqual(updatedParticipants);
    });

    it('should not update non-existent event', () => {
      useEventsStore.getState().addEvent('Event 1', []);
      const initialEvents = [...useEventsStore.getState().events];

      useEventsStore.getState().updateEvent('non-existent-id', 'New Title', []);

      const { events } = useEventsStore.getState();
      expect(events).toEqual(initialEvents);
    });
  });

  describe('removeEvent', () => {
    it('should remove an event by id', () => {
      useEventsStore.getState().addEvent('Event 1', []);
      useEventsStore.getState().addEvent('Event 2', []);
      
      const eventId = useEventsStore.getState().events[0].id;
      useEventsStore.getState().removeEvent(eventId);

      const { events } = useEventsStore.getState();
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Event 2');
    });

    it('should handle removing non-existent event', () => {
      useEventsStore.getState().addEvent('Event 1', []);
      
      useEventsStore.getState().removeEvent('non-existent-id');

      const { events } = useEventsStore.getState();
      expect(events).toHaveLength(1);
    });
  });

  describe('persistence', () => {
    it('should persist events to localStorage', () => {
      const participants: EventParticipant[] = [
        { id: 'p1', name: 'Alice' },
      ];

      useEventsStore.getState().addEvent('Test Event', participants);

      // Check localStorage was updated
      const stored = localStorage.getItem('events-storage');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.events).toHaveLength(1);
      expect(parsed.state.events[0].title).toBe('Test Event');
    });
  });
});
