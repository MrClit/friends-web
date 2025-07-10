import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event } from "../types";

interface EventsState {
  events: Event[];
  addEvent: (title: string, participants: { name: string }[]) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, title: string, participants: { name: string }[]) => void;
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
              participants: participants.map((p) => ({
                id: crypto.randomUUID(),
                name: p.name,
              })),
            },
          ],
        })),
      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),
      updateEvent: (id, title, participants) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  title,
                  participants: participants.map((p) => ({ name: p.name })),
                }
              : e
          ),
        })),
    }),
    {
      name: "events-storage",
    }
  )
);
