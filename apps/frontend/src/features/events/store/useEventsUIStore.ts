import { create } from 'zustand';

/**
 * Events UI State Store
 * Manages only UI-related state (no data persistence, no CRUD operations)
 * Server state is handled by React Query hooks in @/hooks/api/useEvents.ts
 */
interface EventsUIState {
  // UI state (no persist)
  selectedEventId: string | null;
  isModalOpen: boolean;
  filterText: string;

  // UI actions
  selectEvent: (id: string) => void;
  clearSelection: () => void;
  openModal: () => void;
  closeModal: () => void;
  setFilter: (text: string) => void;
  clearFilter: () => void;
}

export const useEventsUIStore = create<EventsUIState>()((set) => ({
  // Initial state
  selectedEventId: null,
  isModalOpen: false,
  filterText: '',

  // Actions
  selectEvent: (id) => set({ selectedEventId: id }),
  clearSelection: () => set({ selectedEventId: null }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setFilter: (text) => set({ filterText: text }),
  clearFilter: () => set({ filterText: '' }),
}));
