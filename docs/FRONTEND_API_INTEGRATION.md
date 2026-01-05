# Frontend API Integration - TanStack Query

**Fecha:** 4 de enero de 2026  
**Estado:** Implementación  
**Solución:** TanStack Query para integración del frontend React con el backend NestJS

---

## 📋 Contexto Actual del Frontend

### Arquitectura Existente

**Tech Stack:**

- React 19 + TypeScript
- Zustand con `persist` middleware (localStorage)
- Feature-based structure
- React Router DOM 7 (HashRouter)
- Vite 7

**Estado Actual:**

```typescript
// Zustand con persistencia en localStorage
export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (title, participants) => {
        /* ... */
      },
      removeEvent: (id) => {
        /* ... */
      },
      updateEvent: (id, title, participants) => {
        /* ... */
      },
    }),
    { name: 'events-storage' },
  ),
);
```

**Características Clave:**

- ✅ 2 stores principales: `useEventsStore`, `useTransactionsStore`
- ✅ Persistencia en localStorage
- ✅ KPIs calculados en frontend
- ✅ Paginación por fechas únicas
- ✅ Cascade delete y limpieza de participantes
- ✅ Sistema POT (participant_id = '0')
- ✅ 75 tests unitarios pasando (Vitest)

---

## 🎯 Requisitos para la Solución API

### Funcionalidades Necesarias

**1. Data Fetching:**

- Fetch inicial de events y transactions
- Sincronización con backend REST API
- Manejo de errores de red
- Loading states

**2. Data Mutations:**

- Crear, actualizar, eliminar events
- Crear, actualizar, eliminar transactions
- Optimistic updates para mejor UX
- Rollback en caso de error

**3. Caching:**

- Cache de events listados
- Cache de transactions por evento
- Invalidación de cache tras mutaciones
- Cache time configurable

**4. Paginación:**

- Paginación por fechas únicas (actual implementación)
- Infinite scroll potencial
- Estado de "hasMore" y "loadedDates"

**5. Performance:**

- Minimizar re-renders innecesarios
- Background refetch
- Prefetching cuando sea apropiado
- Deduplicación de requests

**6. Developer Experience:**

- TypeScript completo
- Integración con arquitectura feature-based
- Debugging y DevTools
- Baja curva de aprendizaje

---

## � TanStack Query (React Query v5)

**Descripción:** Librería especializada en data fetching, caching y sincronización servidor-cliente.

TanStack Query es la solución elegida para gestionar el estado del servidor en nuestra aplicación, reemplazando la persistencia en localStorage de Zustand por sincronización con el backend REST API.

### ✅ Características Principales

**1. Caching y Sincronización:**

- ✨ Cache automático con invalidación inteligente
- ✨ Revalidación automática (window focus, reconnect, interval)
- ✨ Deduplicación de requests
- ✨ Background refetch

**2. Developer Experience:**

- ✨ DevTools integradas (visualización de cache, queries)
- ✨ TypeScript first-class support
- ✨ Hooks intuitivos: `useQuery`, `useMutation`
- ✨ Error y loading states incluidos

**3. Optimistic Updates:**

- ✨ API simple para optimistic updates
- ✨ Rollback automático en caso de error
- ✨ Soporte para múltiples mutaciones simultáneas

**4. Paginación:**

- ✨ `useInfiniteQuery` para infinite scroll
- ✨ Soporte nativo para paginación cursor-based
- ✨ Gestión de "hasMore" y "fetchNextPage"

**5. Performance:**

- ✨ Minimiza re-renders (solo componentes suscritos)
- ✨ Prefetching fácil con `queryClient.prefetchQuery`
- ✨ Stale-while-revalidate pattern
- ✨ Suspense support (React 18+)

**6. Ecosistema:**

- ✨ Muy popular (40k+ stars en GitHub)
- ✨ Documentación excelente
- ✨ Comunidad activa
- ✨ Plugins (persistencia, devtools)

### 📊 Ejemplo de Implementación

```typescript
// api/client.ts
const API_BASE = 'http://localhost:3000/api';

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const { data } = await res.json();
    return data;
  },

  create: async (dto: CreateEventDto): Promise<Event> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create event');
    const { data } = await res.json();
    return data;
  },

  // ... más métodos
};

// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/client';

export const eventKeys = {
  all: ['events'] as const,
  detail: (id: string) => ['events', id] as const,
};

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      // Invalidar cache para refetch
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
    },
  });
}

// Componente
function EventsList() {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {events?.map(event => <EventItem key={event.id} event={event} />)}
      <button onClick={() => createEvent.mutate({ title: 'New', participants: [] })}>
        Add Event
      </button>
    </div>
  );
}
```

### 🏗️ Arquitectura con TanStack Query

```
apps/frontend/src/
├── api/
│   ├── client.ts              # Fetch wrapper + base config
│   ├── events.api.ts          # Events endpoints
│   ├── transactions.api.ts    # Transactions endpoints
│   └── types.ts               # API types (DTOs)
│
├── hooks/
│   ├── api/
│   │   ├── useEvents.ts       # useQuery/useMutation para events
│   │   ├── useTransactions.ts # useQuery/useMutation para transactions
│   │   └── keys.ts            # Query keys centralizados
│   └── ...
│
├── features/
│   ├── events/
│   │   ├── store/             # ⚠️ Zustand para UI state local únicamente
│   │   │   └── useEventsUIStore.ts  # Filtros, modales, selections
│   │   └── components/
│   └── transactions/
│       ├── store/             # ⚠️ Zustand para UI state local
│       │   └── useTransactionsUIStore.ts
│       └── components/
│
└── providers/
    └── QueryProvider.tsx      # QueryClientProvider setup
```

**Separación de Responsabilidades:**

- 🔵 **React Query**: Estado del servidor (events, transactions de la API)
- 🟢 **Zustand**: Estado UI local (modales abiertos, filtros, selections)
- 🟡 **React Router**: Estado de navegación (rutas, params)

---

## 🏗️ Arquitectura Completa

### Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND APP                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │         UI Components (React 19)           │   │
│  └────────────────────────────────────────────┘   │
│           │                      │                 │
│           │                      │                 │
│           ▼                      ▼                 │
│  ┌──────────────────┐   ┌──────────────────┐     │
│  │  React Query     │   │  Zustand Stores  │     │
│  │  (Server State)  │   │  (UI State)      │     │
│  │                  │   │                  │     │
│  │ • Events data    │   │ • Modal open     │     │
│  │ • Transactions   │   │ • Filters        │     │
│  │ • Caching        │   │ • Selections     │     │
│  │ • Invalidation   │   │ • Form state     │     │
│  └──────────────────┘   └──────────────────┘     │
│           │                                        │
│           ▼                                        │
│  ┌────────────────────────────────────────────┐   │
│  │         API Client (Fetch Wrapper)         │   │
│  └────────────────────────────────────────────┘   │
│           │                                        │
└───────────┼────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────┐
│              NestJS Backend (REST API)              │
│                 localhost:3000/api                  │
└─────────────────────────────────────────────────────┘
```

### Estructura de Carpetas

```
apps/frontend/src/
│
├── api/                           # API layer
│   ├── client.ts                  # Base fetch wrapper
│   ├── events.api.ts              # Events endpoints
│   ├── transactions.api.ts        # Transactions endpoints
│   └── types.ts                   # API DTOs (request/response)
│
├── hooks/                         # Custom hooks
│   ├── api/                       # React Query hooks
│   │   ├── keys.ts                # Centralized query keys
│   │   ├── useEvents.ts           # useQuery/useMutation for events
│   │   ├── useTransactions.ts     # useQuery/useMutation for transactions
│   │   └── useEventKPIs.ts        # Computed KPIs from queries
│   └── ...                        # Other hooks
│
├── features/                      # Feature modules
│   ├── events/
│   │   ├── components/            # Event UI components
│   │   ├── store/                 # UI state (Zustand)
│   │   │   └── useEventsUIStore.ts
│   │   ├── types.ts               # Feature types
│   │   └── index.ts
│   │
│   └── transactions/
│       ├── components/
│       ├── store/                 # UI state (Zustand)
│       │   └── useTransactionsUIStore.ts
│       ├── types.ts
│       └── index.ts
│
├── providers/                     # Context providers
│   └── QueryProvider.tsx          # TanStack Query setup
│
└── lib/
    └── queryClient.ts             # Query client config
```

### División de Estado

**React Query (Server State):**

```typescript
// hooks/api/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { eventKeys } from './keys';

// ✅ Leer events desde API
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ✅ Crear event
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onMutate: async (newEvent) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: eventKeys.all });
      const previous = queryClient.getQueryData(eventKeys.all);
      queryClient.setQueryData(eventKeys.all, (old: Event[]) => [...old, { id: 'temp', ...newEvent }]);
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(eventKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
```

**Zustand (UI State):**

```typescript
// features/events/store/useEventsUIStore.ts
import { create } from 'zustand';

interface EventsUIState {
  // UI state local (NO persisted)
  selectedEventId: string | null;
  isModalOpen: boolean;
  filterText: string;

  // UI actions
  selectEvent: (id: string) => void;
  openModal: () => void;
  closeModal: () => void;
  setFilter: (text: string) => void;
}

export const useEventsUIStore = create<EventsUIState>()((set) => ({
  selectedEventId: null,
  isModalOpen: false,
  filterText: '',

  selectEvent: (id) => set({ selectedEventId: id }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setFilter: (text) => set({ filterText: text }),
}));
```

**Uso en Componente:**

```typescript
// features/events/components/EventsList.tsx
import { useEvents, useCreateEvent } from '@/hooks/api/useEvents';
import { useEventsUIStore } from '../store/useEventsUIStore';

export default function EventsList() {
  // Server state (React Query)
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();

  // UI state (Zustand)
  const { filterText, isModalOpen, openModal, closeModal } = useEventsUIStore();

  // Filtrado en cliente
  const filtered = events?.filter(e =>
    e.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = (dto: CreateEventDto) => {
    createEvent.mutate(dto, {
      onSuccess: () => closeModal(),
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <button onClick={openModal}>New Event</button>
      {filtered?.map(event => <EventItem key={event.id} event={event} />)}
      {isModalOpen && <EventModal onSubmit={handleCreate} onClose={closeModal} />}
    </>
  );
}
```

---

## 🔑 Query Keys Strategy

### Centralización de Query Keys

```typescript
// hooks/api/keys.ts
export const queryKeys = {
  events: {
    all: ['events'] as const,
    detail: (id: string) => ['events', id] as const,
    kpis: (id: string) => ['events', id, 'kpis'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    byEvent: (eventId: string) => ['transactions', 'event', eventId] as const,
    paginated: (eventId: string, params: { numberOfDates: number; offset: number }) =>
      ['transactions', 'event', eventId, 'paginated', params] as const,
    detail: (id: string) => ['transactions', id] as const,
  },
};
```

**Ventajas:**

- ✅ Autocompletado TypeScript
- ✅ Fácil de invalidar queries relacionadas
- ✅ Previene typos
- ✅ Un solo lugar para cambiar keys

**Uso:**

```typescript
// Invalidar todas las transactions de un evento
queryClient.invalidateQueries({
  queryKey: queryKeys.transactions.byEvent(eventId),
});

// Invalidar todos los events
queryClient.invalidateQueries({
  queryKey: queryKeys.events.all,
});
```

---

## 🔄 Manejo de Cascade Delete

### Problema Actual

Cuando eliminas un evento, debes también eliminar sus transacciones:

```typescript
// Actual (Zustand)
removeEvent: (id) => {
  const deleteTransactionsByEvent = useTransactionsStore.getState().deleteTransactionsByEvent;
  deleteTransactionsByEvent(id); // ⚠️ Manual

  set((state) => ({
    events: state.events.filter((e) => e.id !== id),
  }));
};
```

### Solución con React Query

**Backend ya hace cascade delete** (configurado en TypeORM), así que solo necesitas invalidar cache:

```typescript
// hooks/api/useEvents.ts
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // 1. Invalidar lista de events
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });

      // 2. Invalidar transactions del evento eliminado
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(deletedId),
      });

      // 3. Remover queries específicas del cache
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.transactions.byEvent(deletedId) });
    },
  });
}
```

**Ventaja:** Backend garantiza consistencia, frontend solo invalida cache.

---

## 📄 Paginación por Fechas Únicas

### Implementación con useInfiniteQuery

Tu paginación actual es especial: agrupa por fechas únicas, no por número de items.

**Backend endpoint:**

```
GET /api/events/:eventId/transactions/paginated?numberOfDates=3&offset=0
```

**Response:**

```typescript
{
  data: {
    transactions: Transaction[];
    hasMore: boolean;
    totalDates: number;
    loadedDates: number;
  }
}
```

**Hook con useInfiniteQuery:**

```typescript
// hooks/api/useTransactions.ts
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTransactionsPaginated(eventId: string, numberOfDates = 3) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions.paginated(eventId, { numberOfDates, offset: 0 }),
    queryFn: ({ pageParam = 0 }) =>
      transactionsApi.getPaginated(eventId, numberOfDates, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * numberOfDates; // offset incremental
    },
    initialPageParam: 0,
  });
}

// Componente con Infinite Scroll
function TransactionsList({ eventId }: { eventId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsPaginated(eventId);

  const allTransactions = data?.pages.flatMap(page => page.transactions) ?? [];

  return (
    <div>
      {allTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## 🧪 Testing con React Query

### Setup de Tests

```typescript
// test/utils/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retry en tests
        cacheTime: 0, // No cache
      },
    },
  });
}

export function renderWithQuery(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

### Test de Hooks

```typescript
// hooks/api/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from './useEvents';
import { createTestQueryClient } from '@/test/utils/test-utils';

describe('useEvents', () => {
  it('should fetch events', async () => {
    const { result } = renderHook(() => useEvents(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});
```

---

## 🚀 Migración Incremental

### Fase 1: Setup Inicial ✅

**Objetivo:** Instalar dependencias y configurar la infraestructura base de TanStack Query.

**Tareas:**

1. ✅ **Instalar dependencias:**

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

2. ✅ **Configurar QueryClient:**

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

3. ✅ **Crear Provider:**

```typescript
// providers/QueryProvider.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

4. ✅ **Añadir Provider en App:**

```typescript
// App.tsx
import { QueryProvider } from './providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <Router>
        {/* ... */}
      </Router>
    </QueryProvider>
  );
}
```

5. ✅ **Configurar variable de entorno:**

```bash
# apps/frontend/.env
VITE_API_URL=http://localhost:3000/api
```

---

### Fase 2: API Layer ✅

**Objetivo:** Crear la capa de comunicación con el backend REST API.

**Tareas:**

1. ✅ **Crear API client base:**

```typescript
// api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      response.statusText,
      error.message || `Request failed with status ${response.status}`,
    );
  }

  // Backend envuelve respuestas en { data: T }
  if (response.status === 204) {
    return undefined as T; // No content
  }

  const json = await response.json();
  return json.data as T; // Extraer .data automáticamente
}
```

2. ✅ **Crear tipos de API:**

```typescript
// api/types.ts
export interface CreateEventDto {
  title: string;
  participants: EventParticipantDto[];
}

export interface UpdateEventDto {
  title?: string;
  participants?: EventParticipantDto[];
}

export interface EventParticipantDto {
  id: string;
  name: string;
}

// ... más DTOs
```

3. ✅ **Crear eventos API:**

```typescript
// api/events.api.ts
import { apiRequest } from './client';
import type { Event, CreateEventDto, UpdateEventDto } from './types';

export const eventsApi = {
  getAll: () => apiRequest<Event[]>('/events'),
  getById: (id: string) => apiRequest<Event>(`/events/${id}`),
  create: (dto: CreateEventDto) =>
    apiRequest<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: UpdateEventDto) =>
    apiRequest<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/events/${id}`, {
      method: 'DELETE',
    }),
};
```

4. ✅ **Crear transactions API:**

```typescript
// api/transactions.api.ts
import { apiRequest } from './client';
import type { Transaction, CreateTransactionDto, UpdateTransactionDto } from './types';

export const transactionsApi = {
  getByEvent: (eventId: string) => apiRequest<Transaction[]>(`/events/${eventId}/transactions`),

  getPaginated: (eventId: string, numberOfDates: number, offset: number) =>
    apiRequest<PaginatedTransactionsResponse>(
      `/events/${eventId}/transactions/paginated?numberOfDates=${numberOfDates}&offset=${offset}`,
    ),

  getById: (id: string) => apiRequest<Transaction>(`/transactions/${id}`),

  create: (eventId: string, dto: CreateTransactionDto) =>
    apiRequest<Transaction>(`/events/${eventId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateTransactionDto) =>
    apiRequest<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};
```

---

### Fase 3: Query Hooks ✅

**Objetivo:** Crear todos los hooks de React Query para interactuar con la API.

**Tareas:**

1. ✅ **Crear query keys centralizados:**

```typescript
// hooks/api/keys.ts
export const queryKeys = {
  events: {
    all: ['events'] as const,
    detail: (id: string) => ['events', id] as const,
    kpis: (id: string) => ['events', id, 'kpis'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    byEvent: (eventId: string) => ['transactions', 'event', eventId] as const,
    paginated: (eventId: string, params: { numberOfDates: number; offset: number }) =>
      ['transactions', 'event', eventId, 'paginated', params] as const,
    detail: (id: string) => ['transactions', id] as const,
  },
};
```

2. ✅ **Crear hooks de Events:**

```typescript
// hooks/api/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { queryKeys } from './keys';

// Listar todos los eventos
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

// Obtener evento por ID
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

// Crear evento
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

// Actualizar evento
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) => eventsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
    },
  });
}

// Eliminar evento (con cascade delete)
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byEvent(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.transactions.byEvent(deletedId) });
    },
  });
}
```

3. ✅ **Crear hooks de Transactions:**

```typescript
// hooks/api/useTransactions.ts
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions.api';
import { queryKeys } from './keys';

// Listar transactions de un evento
export function useTransactionsByEvent(eventId: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byEvent(eventId),
    queryFn: () => transactionsApi.getByEvent(eventId),
    enabled: !!eventId,
  });
}

// Paginación por fechas únicas
export function useTransactionsPaginated(eventId: string, numberOfDates = 3) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions.paginated(eventId, { numberOfDates, offset: 0 }),
    queryFn: ({ pageParam = 0 }) => transactionsApi.getPaginated(eventId, numberOfDates, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * numberOfDates;
    },
    initialPageParam: 0,
    enabled: !!eventId,
  });
}

// Obtener transaction por ID
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
}

// Crear transaction
export function useCreateTransaction(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
}

// Actualizar transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) => transactionsApi.update(id, data),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(transaction.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transaction.id),
      });
    },
  });
}

// Eliminar transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: (_, deletedId, context) => {
      // Invalidar todas las queries de transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
```

4. **Crear hook de KPIs:**

```typescript
// hooks/api/useEventKPIs.ts
import { useMemo } from 'react';
import { useTransactionsByEvent } from './useTransactions';

export function useEventKPIs(eventId: string) {
  const { data: transactions, isLoading } = useTransactionsByEvent(eventId);

  const kpis = useMemo(() => {
    if (!transactions) return null;

    // Calcular KPIs (mantener lógica actual de Zustand)
    const totalExpenses = transactions.filter((t) => t.paymentType === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const totalContributions = transactions
      .filter((t) => t.paymentType === 'contribution')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCompensations = transactions
      .filter((t) => t.paymentType === 'compensation')
      .reduce((sum, t) => sum + t.amount, 0);

    const potBalance = totalContributions - totalCompensations - totalExpenses;
    const pendingToCompensate = totalExpenses - totalCompensations;

    // ... más cálculos según lógica actual

    return {
      totalExpenses,
      totalContributions,
      totalCompensations,
      potBalance,
      pendingToCompensate,
    };
  }, [transactions]);

  return { kpis, isLoading };
}
```

---

### Fase 4: Refactorizar Stores ✅

**Objetivo:** Transformar stores de Zustand para manejar solo estado UI local, eliminando persist y CRUD operations.

**Tareas:**

1. ✅ **Refactorizar `useEventsStore` → `useEventsUIStore`:**

```typescript
// features/events/store/useEventsUIStore.ts
import { create } from 'zustand';

interface EventsUIState {
  // UI state local (NO persisted)
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
  selectedEventId: null,
  isModalOpen: false,
  filterText: '',

  selectEvent: (id) => set({ selectedEventId: id }),
  clearSelection: () => set({ selectedEventId: null }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setFilter: (text) => set({ filterText: text }),
  clearFilter: () => set({ filterText: '' }),
}));
```

2. **Refactorizar `useTransactionsStore` → `useTransactionsUIStore`:**

```typescript
// features/transactions/store/useTransactionsUIStore.ts
import { create } from 'zustand';

interface TransactionsUIState {
  // UI state local (NO persisted)
  isModalOpen: boolean;
  filterType: PaymentType | 'all';
  selectedTransactionId: string | null;

  // UI actions
  openModal: () => void;
  closeModal: () => void;
  setFilterType: (type: PaymentType | 'all') => void;
  selectTransaction: (id: string) => void;
  clearSelection: () => void;
}

export const useTransactionsUIStore = create<TransactionsUIState>()((set) => ({
  isModalOpen: false,
  filterType: 'all',
  selectedTransactionId: null,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setFilterType: (type) => set({ filterType: type }),
  selectTransaction: (id) => set({ selectedTransactionId: id }),
  clearSelection: () => set({ selectedTransactionId: null }),
}));
```

3. **Actualizar exports de features:**

```typescript
// features/events/index.ts
export * from './components';
export { useEventsUIStore } from './store/useEventsUIStore';
export * from './types';
```

---

### Fase 5: Migrar Componentes

**Objetivo:** Actualizar todos los componentes para usar React Query hooks en lugar de Zustand stores.

**Tareas:**

1. **Migrar componentes de Events:**

```typescript
// features/events/components/EventsList.tsx
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/api/useEvents';
import { useEventsUIStore } from '../store/useEventsUIStore';

export default function EventsList() {
  // Server state (React Query)
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  // UI state (Zustand)
  const { filterText, isModalOpen, openModal, closeModal } = useEventsUIStore();

  // Filtrado en cliente
  const filtered = events?.filter(e =>
    e.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = (dto: CreateEventDto) => {
    createEvent.mutate(dto, {
      onSuccess: () => closeModal(),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar evento y sus transacciones?')) {
      deleteEvent.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <button onClick={openModal}>Nuevo Evento</button>
      {filtered?.map(event => (
        <EventItem
          key={event.id}
          event={event}
          onDelete={handleDelete}
        />
      ))}
      {isModalOpen && <EventFormModal onSubmit={handleCreate} onClose={closeModal} />}
    </>
  );
}
```

```typescript
// features/events/components/EventDetail.tsx
import { useEvent, useUpdateEvent } from '@/hooks/api/useEvents';
import { useParams } from 'react-router-dom';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id!);
  const updateEvent = useUpdateEvent();

  if (isLoading) return <LoadingSpinner />;
  if (!event) return <NotFound />;

  return <div>{/* ... */}</div>;
}
```

2. **Migrar componentes de Transactions:**

```typescript
// features/transactions/components/TransactionsList.tsx
import { useTransactionsPaginated, useCreateTransaction } from '@/hooks/api/useTransactions';
import { useTransactionsUIStore } from '../store/useTransactionsUIStore';

export default function TransactionsList({ eventId }: { eventId: string }) {
  // Server state (React Query)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsPaginated(eventId);
  const createTransaction = useCreateTransaction(eventId);

  // UI state (Zustand)
  const { isModalOpen, openModal, closeModal } = useTransactionsUIStore();

  const allTransactions = data?.pages.flatMap(page => page.transactions) ?? [];

  return (
    <>
      <button onClick={openModal}>Nueva Transacción</button>
      {allTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
        </button>
      )}

      {isModalOpen && (
        <TransactionFormModal
          onSubmit={(data) => createTransaction.mutate(data)}
          onClose={closeModal}
        />
      )}
    </>
  );
}
```

3. **Migrar páginas:**

```typescript
// pages/Home.tsx
import EventsList from '@/features/events/components/EventsList';

export default function Home() {
  return (
    <div>
      <h1>Eventos</h1>
      <EventsList />
    </div>
  );
}
```

```typescript
// pages/EventDetail.tsx
import EventDetail from '@/features/events/components/EventDetail';
import TransactionsList from '@/features/transactions/components/TransactionsList';
import { useParams } from 'react-router-dom';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <EventDetail />
      <TransactionsList eventId={id!} />
    </div>
  );
}
```

```typescript
// pages/KPIDetail.tsx
import { useEventKPIs } from '@/hooks/api/useEventKPIs';
import { useParams } from 'react-router-dom';

export default function KPIDetail() {
  const { id, kpi } = useParams<{ id: string; kpi: string }>();
  const { kpis, isLoading } = useEventKPIs(id!);

  if (isLoading) return <LoadingSpinner />;

  return <div>{/* Mostrar KPI específico */}</div>;
}
```

---

### Fase 6: Cleanup

**Objetivo:** Limpiar código antiguo y completar la migración.

**Tareas:**

1. **Eliminar archivos de stores antiguos:**

```bash
# Eliminar stores de Zustand con persist
rm apps/frontend/src/features/events/store/useEventsStore.ts
rm apps/frontend/src/features/transactions/store/useTransactionsStore.ts
```

2. **Limpiar localStorage:**

```typescript
// Ejecutar una vez en desarrollo para limpiar keys antiguas
localStorage.removeItem('events-storage');
localStorage.removeItem('transactions-storage');
```

O crear un script de migración:

```typescript
// scripts/clearOldStorage.ts
export function clearOldStorage() {
  const oldKeys = ['events-storage', 'transactions-storage'];
  oldKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      console.log(`Removing old storage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
}

// Llamar una vez al inicio de la app
clearOldStorage();
```

3. **Actualizar documentación:**

- Actualizar README con nueva arquitectura
- Documentar hooks de React Query
- Actualizar diagramas de arquitectura

4. **Verificar imports:**

```bash
# Buscar imports rotos
pnpm run lint
pnpm run build
```

5. **Review final:**

- ✅ Todos los tests pasan
- ✅ No hay errores de TypeScript
- ✅ No hay imports de stores antiguos
- ✅ DevTools de React Query funcionan
- ✅ La aplicación funciona correctamente end-to-end

---

## 📋 Checklist de Migración

### Setup ✅

- [x] Instalar `@tanstack/react-query`
- [x] Instalar `@tanstack/react-query-devtools` (dev)
- [x] Crear `lib/queryClient.ts`
- [x] Crear `providers/QueryProvider.tsx`
- [x] Añadir provider en `App.tsx`
- [x] Configurar variable `VITE_API_URL` en `.env`

### API Layer ✅

- [x] Crear `api/client.ts` con `apiRequest` wrapper
- [x] Crear `api/types.ts` con DTOs
- [x] Crear `api/events.api.ts`
- [x] Crear `api/transactions.api.ts`
- [x] Crear custom `ApiError` class

### Query Hooks ✅

- [x] Crear `hooks/api/keys.ts` con query keys
- [x] Crear `hooks/api/useEvents.ts`
  - [x] `useEvents()` - Listar
  - [x] `useEvent(id)` - Detalle
  - [x] `useCreateEvent()` - Crear
  - [x] `useUpdateEvent()` - Actualizar
  - [x] `useDeleteEvent()` - Eliminar (con cascade)
- [x] Crear `hooks/api/useTransactions.ts`
  - [x] `useTransactionsByEvent(eventId)` - Listar
  - [x] `useTransactionsPaginated(eventId)` - Paginación
  - [x] `useTransaction(id)` - Detalle
  - [x] `useCreateTransaction(eventId)` - Crear
  - [x] `useUpdateTransaction()` - Actualizar
  - [x] `useDeleteTransaction()` - Eliminar
- [x] Crear `hooks/api/useEventKPIs.ts` - KPIs calculados

### Refactorizar Stores ✅

- [x] Refactorizar `useEventsStore` → `useEventsUIStore`
  - [x] Remover persist
  - [x] Solo mantener UI state (modales, selections)
  - [x] Remover CRUD operations
- [x] Refactorizar `useTransactionsStore` → `useTransactionsUIStore`
  - [x] Remover persist
  - [x] Solo mantener UI state (filtros, paginación UI)
  - [x] Remover CRUD operations

### Migrar Componentes ✅

- [x] Migrar `features/events/components/`
  - [x] `EventsList.tsx`
  - [x] `EventFormModal.tsx`
- [x] Migrar `features/transactions/components/`
  - [x] `TransactionsList.tsx`
  - [x] `TransactionItem.tsx`
  - [x] `TransactionModal.tsx`
- [x] Migrar `pages/`
  - [x] `Home.tsx`
  - [x] `EventDetail.tsx`
  - [x] `KPIDetail.tsx`

### Testing 🚧 (Pendiente - Ver Futuras Mejoras)

- [ ] Crear `test/utils/test-utils.tsx` con helpers
- [ ] Migrar tests de stores a tests de hooks
- [ ] Añadir tests de integración con React Query
- [ ] Verificar coverage mantiene >80%

### Cleanup ✅ (Completado)

- [x] Remover lógica de persist de Zustand
- [x] Limpiar localStorage keys antiguas
- [x] Actualizar documentación
- [x] Verificar no hay imports rotos

---

## 🔮 Futuras Mejoras

### 1. Testing Completo con React Query 🚧

**Objetivo:** Migrar tests de Zustand stores a tests de React Query hooks y añadir tests de integración.

**Nota:** Esta fase se ha pospuesto para enfocarnos primero en completar la migración funcional. Se implementará después del Cleanup.

**Tareas pendientes:**

1. **Crear utilidades de testing:**

```typescript
// test/utils/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithQuery(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
}
```

2. **Migrar tests de stores a hooks:**

```typescript
// hooks/api/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEvents, useCreateEvent } from './useEvents';
import { createTestQueryClient } from '@/test/utils/test-utils';

describe('useEvents', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch events successfully', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('should handle errors', async () => {
    // Mock error response
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateEvent', () => {
  it('should create event and invalidate cache', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate({
        title: 'New Event',
        participants: [],
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

3. **Añadir tests de integración:**

```typescript
// features/events/components/EventsList.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsList from './EventsList';
import { renderWithQuery } from '@/test/utils/test-utils';

describe('EventsList Integration', () => {
  it('should display events and handle creation', async () => {
    renderWithQuery(<EventsList />);

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
    });

    // Open modal
    const createButton = screen.getByText('Nuevo Evento');
    await userEvent.click(createButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

4. **Verificar coverage:**

```bash
pnpm test:coverage
```

Asegurarse de mantener >80% de cobertura.

---

### 2. Prefetching

```typescript
// Prefetch al hover sobre un evento
function EventItem({ event }: { event: Event }) {
  const queryClient = useQueryClient();

  const prefetchTransactions = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.byEvent(event.id),
      queryFn: () => transactionsApi.getByEvent(event.id),
    });
  };

  return (
    <Link
      to={`/event/${event.id}`}
      onMouseEnter={prefetchTransactions}
    >
      {event.title}
    </Link>
  );
}
```

### 3. Persistencia de Cache (Plugin)

```bash
pnpm add @tanstack/query-persist-client-core
pnpm add @tanstack/query-sync-storage-persister
```

```typescript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 horas
});
```

### 4. Optimistic Updates Avanzados

Con múltiples mutaciones dependientes.

### 4. Endpoint de Agregación de KPIs en Backend

Si la aplicación crece y calcular KPIs en el cliente se vuelve lento (miles de transacciones), migrar cálculos al backend.

**Beneficios:**

- Menos datos transferidos (solo KPIs calculados)
- Mejor rendimiento en dispositivos móviles
- Cálculos optimizados con SQL agregado

**Implementación:**

```typescript
// Backend: GET /api/events/:eventId/kpis
@Get(':id/kpis')
async getKPIs(@Param('id') eventId: string) {
  return this.eventsService.calculateKPIs(eventId);
}

// Frontend: hooks/api/useEventKPIs.ts
export function useEventKPIs(eventId: string) {
  return useQuery({
    queryKey: queryKeys.events.kpis(eventId),
    queryFn: () => eventsApi.getKPIs(eventId),
    staleTime: 2 * 60 * 1000, // Cache 2 minutos
  });
}
```

### 5. Websockets (Real-time)

Si en el futuro necesitas sincronización real-time entre usuarios.

---

## 📚 Recursos

### Documentación Oficial

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Examples](https://tanstack.com/query/latest/docs/react/examples/react/simple)

### Tutoriales Recomendados

- [Practical React Query](https://tkdodo.eu/blog/practical-react-query) - Serie completa por un maintainer
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-best-practices) - Guía de buenas prácticas

### Videos

- [TanStack Query in 100 Seconds](https://www.youtube.com/watch?v=novnyCaa7To)
- [React Query Tutorial](https://www.youtube.com/watch?v=r8Dg0KVnfMA) - Completo

---

**Última actualización:** 4 de enero de 2026  
**Estado:** Listo para implementación
