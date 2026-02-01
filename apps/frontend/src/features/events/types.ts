// Tipos relacionados con eventos
export interface EventParticipant {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  participants: EventParticipant[];
  // Icon key for the event (optional, maps to IconPicker choices)
  icon?: string;
}
