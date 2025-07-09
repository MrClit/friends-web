import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Event } from "../types";
import { generateId } from "../utils";

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
              id: generateId(),
              title,
              participants: participants.map((p) => ({
                id: generateId(),
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
