import { create } from "zustand";

export interface Participant {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  participants: Participant[];
}

interface EventsState {
  events: Event[];
  addEvent: (title: string, participants: { name: string }[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  addEvent: (title, participants) =>
    set((state) => ({
      events: [
        ...state.events,
        {
          id: generateId(),
          title,
          participants: participants.map((p) => ({ id: generateId(), name: p.name })),
        },
      ],
    })),
}));
