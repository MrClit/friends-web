import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event, EventParticipant } from "../types";
import { useTransactionsStore } from "../../transactions/store/useTransactionsStore";

interface EventsState {
  events: Event[];
  addEvent: (title: string, participants: EventParticipant[]) => void;
  removeEvent: (id: string) => void;
  updateEvent: (
    id: string,
    title: string,
    participants: EventParticipant[]
  ) => void;
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (title, participants) =>
        set((state) => ({
          events: [
            ...state.events,
            {
              id: crypto.randomUUID(),
              title,
              participants,
            },
          ],
        })),
      removeEvent: (id) => {
        const deleteTransactionsByEvent =
          useTransactionsStore.getState().deleteTransactionsByEvent;
        deleteTransactionsByEvent(id);

        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },
      updateEvent: (id, title, participants) =>
        set((state) => {
          const oldEvent = state.events.find((e) => e.id === id);
          if (oldEvent) {
            const oldIds = oldEvent.participants.map((p) => p.id);
            const newIds = participants.map((p) => p.id);
            const removedIds = oldIds.filter((oid) => !newIds.includes(oid));
            const clearParticipant = useTransactionsStore.getState().clearParticipantFromEventTransactions;
            removedIds.forEach((pid) => {
              clearParticipant(id, pid);
            });
          }
          return {
            events: state.events.map((e) =>
              e.id === id
                ? {
                    ...e,
                    title,
                    participants,
                  }
                : e
            ),
          };
        }),
    }),
    {
      name: "events-storage",
    }
  )
);
