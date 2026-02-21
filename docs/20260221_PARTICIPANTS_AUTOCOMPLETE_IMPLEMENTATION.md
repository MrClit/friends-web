# Plan de Implementación: Autocomplete de Participantes con TanStack Query

> Agregar funcionalidad de autocomplete con lista de usuarios del backend al seleccionar participantes en eventos
>
> **Fecha:** 21 de febrero de 2026  
> **Status:** Pendiente de implementación

---

## 📋 Tabla de Contenidos

1. [Motivación y Objetivos](#motivación-y-objetivos)
2. [Análisis de Compatibilidad: TanStack Query + cmdk](#análisis-de-compatibilidad-tanstack-query--cmdk)
3. [Decisión: Por qué NO usar cmdk](#decisión-por-qué-no-usar-cmdk)
4. [Sistema Overview](#sistema-overview)
5. [Solución Diseñada](#solución-diseñada)
6. [Arquitectura Detallada](#arquitectura-detallada)
7. [Plan de Implementación Paso a Paso](#plan-de-implementación-paso-a-paso)
8. [Checklist Detallado](#checklist-detallado)
9. [Testing y Validación](#testing-y-validación)
10. [Deployment Notes](#deployment-notes)
11. [Referencias](#referencias)

---

## Motivación y Objetivos

### ¿Por qué?

Actualmente, al agregar participantes a un evento, el usuario debe:

- Escribir manualmente el nombre (sin sugerencias)
- No tiene referencia de usuarios existentes
- Experiencia de UX pobre

### Objetivos

✅ Mostrar lista de usuarios disponibles al escribir en el input  
✅ Permitir seleccionar usuarios de la lista  
✅ Mantener opción de agregar usuarios custom (no están en la lista)  
✅ Usar componentes Radix UI para accesibilidad  
✅ Integrar con TanStack Query para gestionar estado de datos  
✅ Mantener arquitectura modular y escalable

---

## Análisis de Compatibilidad: TanStack Query + cmdk

### ¿Qué es cmdk?

**cmdk** es una librería de comando/búsqueda que proporciona:

- Command palette UI
- Búsqueda local
- Filtrado rápido
- Accesibilidad built-in

**Link:** https://cmdk.paco.me/

---

### 🔍 Evaluación de Compatibilidad

| Aspecto             | TanStack Query              | cmdk                   | Compatibilidad           |
| ------------------- | --------------------------- | ---------------------- | ------------------------ |
| **Estado de datos** | Gestión de caché + fetching | Búsqueda local         | ✅ Totalmente compatible |
| **Patrón**          | Query + Mutation            | UI + Presentación      | ✅ Complementarios       |
| **Overhead**        | ~15KB                       | ~5KB                   | ✅ Ligero                |
| **Arquitectura**    | Servidor                    | Cliente                | ✅ Sin conflictos        |
| **Ejemplo común**   | `useQuery()` + `cmdk`       | Muy usado en industria | ✅ Patrón probado        |

### ✅ Por qué SON compatibles

```typescript
// Patrón ideal con TanStack Query + cmdk

// 1. TanStack Query trae datos del servidor
const { data: users, isLoading } = useQuery({
  queryKey: ['users', searchQuery],
  queryFn: () => usersApi.search(searchQuery),
  staleTime: 30 * 1000, // 30s
});

// 2. cmdk proporciona UI + búsqueda local
// (los datos ya están en cache de TanStack Query)
<Command>
  <CommandInput onChange={(e) => setSearchQuery(e.target.value)} />
  <CommandList>
    {users?.map(user => (
      <CommandItem key={user.id} onSelect={handleSelect}>
        {user.name}
      </CommandItem>
    ))}
  </CommandList>
</Command>
```

---

## Decisión: Por qué NO usar cmdk

### ⚠️ Razones contra cmdk en este caso

1. **Complejidad adicional innecesaria**
   - Tu UI es simple: input → lista de usuarios
   - cmdk está pensado para "command palettes" complejas
   - Añade una dependencia extra

2. **Ya tienes Radix UI**
   - `@radix-ui/react-popover` resuelve el dropdown
   - `@radix-ui/react-select` es alternative más simple
   - Mantiene consistencia con tu stack

3. **Búsqueda local es trivial**
   - Con `array.filter()` tienes suficiente
   - El filtrado es instantáneo (usuarios ya en caché)

4. **Overhead no justificado**
   - Proyecto medio → complejidad mínima
   - Futuro: si necesitas command palette global → ahí sí cmdk

### ✅ Solución elegida: Radix UI Popover + TanStack Query

**Ventajas:**

- ✅ Componentes Radix que ya usas
- ✅ TanStack Query para estado remoto
- ✅ Código simple y mantenible
- ✅ Accesibilidad integrada
- ✅ Zero overhead

---

## Sistema Overview

### Arquitectura de datos actual

```
ParticipantsList (props: participants, setParticipants)
  └─ useParticipantsList hook (estado local del input)
      └─ handleAddParticipant (add manual + tipo 'guest')
```

### Arquitectura propuesta

```
Backend (NestJS)
  └─ GET /api/users → [User]
     └─ GET /api/users/search?q=name → [User]

Frontend (React)
  └─ TanStack Query (useUsers hook)
      └─ Caché de usuarios en queryClient

  └─ ParticipantsList component
      └─ ParticipantsCombobox component
          ├─ useUsers() → fetch users from backend
          ├─ Input con popover (Radix UI)
          └─ Lista filtrada + opción "Crear nuevo"
```

---

## Solución Diseñada

### Flujo de usuario

```
1. Usuario hace click en input de participantes
   ↓
2. Se muestra popover con lista de usuarios
   ↓
3. Usuario escribe (filtra lista en tiempo real)
   ↓
4. Usuario puede:
   a) Click en usuario de la lista → se agrega
   b) Presionar Enter con texto custom → se agrega nuevo
```

### Componentes a crear/modificar

| Archivo                                                                 | Tipo       | Descripción                               |
| ----------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| `apps/backend/src/modules/users/users.controller.ts`                    | Backend    | NUEVO - Exponer endpoint GET /api/users   |
| `apps/frontend/src/hooks/api/useUsers.ts`                               | Hook       | NUEVO - Query para fetch de usuarios      |
| `apps/frontend/src/hooks/api/keys.ts`                                   | Hook       | MODIFICAR - Agregar queryKey para users   |
| `apps/frontend/src/api/users.api.ts`                                    | API        | NUEVO - Métodos API para users            |
| `apps/frontend/src/features/events/components/ParticipantsCombobox.tsx` | Componente | NUEVO - Combobox con Radix UI             |
| `apps/frontend/src/features/events/components/ParticipantsList.tsx`     | Componente | MODIFICAR - Reemplazar input por combobox |
| `apps/frontend/src/features/events/hooks/useParticipantsList.ts`        | Hook       | MODIFICAR - Mejorar lógica de búsqueda    |

---

## Arquitectura Detallada

### 1. Backend: Endpoint GET /api/users

**Ubicación:** `apps/backend/src/modules/users/users.controller.ts`

```typescript
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users (for participant selection)
   * @returns List of all users with basic info
   */
  @Get()
  @ApiOperation({ summary: 'Get all users for participant selection' })
  @ApiStandardResponse(200, 'Users retrieved successfully', UserDto, true)
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Search users by name or email
   * @param query - Search query string
   * @returns Filtered list of users
   */
  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiStandardResponse(200, 'Users found', UserDto, true)
  search(@Query('q') query: string) {
    return this.usersService.search(query);
  }
}
```

**Nota:** El módulo `users` ya existe, solo necesitamos exponer el controller.

---

### 2. Frontend: Hook de TanStack Query

**Ubicación:** `apps/frontend/src/hooks/api/useUsers.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { queryKeys } from './keys';

/**
 * Query hook to fetch all users for participant selection
 * @returns Query result with users list, loading state, and error
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes - users don't change often
    retry: 2,
  });
}

/**
 * Query hook to search users by name or email
 * @param query - Search query string
 * @returns Query result with filtered users
 */
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => usersApi.search(query),
    enabled: query.length > 0, // Only fetch if query has content
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
```

---

### 3. Query Keys: Extensión

**Ubicación:** `apps/frontend/src/hooks/api/keys.ts`

```typescript
export const queryKeys = {
  // ... eventos y transactions ...

  users: {
    /**
     * Key for all users (participant selection)
     */
    all: ['users'] as const,

    /**
     * Key for user search
     * @param query - Search string
     */
    search: (query: string) => ['users', 'search', query] as const,
  },
};
```

---

### 4. API Client: Users API

**Ubicación:** `apps/frontend/src/api/users.api.ts` (NUEVO)

```typescript
import { apiRequest } from './client';
import type { User } from '@/features/auth/types';

/**
 * Users API endpoints
 */
export const usersApi = {
  /**
   * Get all users for participant selection
   * @returns List of all users
   */
  getAll: () => apiRequest<User[]>('/users'),

  /**
   * Search users by name or email
   * @param query - Search query string
   * @returns Filtered list of users
   */
  search: (query: string) => apiRequest<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
};
```

---

### 5. Componente: ParticipantsCombobox

**Ubicación:** `apps/frontend/src/features/events/components/ParticipantsCombobox.tsx` (NUEVO)

```typescript
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { MdPersonAdd } from 'react-icons/md';
import { useUsers } from '@/hooks/api/useUsers';
import { cn } from '@/shared/utils/cn';
import Avatar from '@/shared/components/Avatar';
import type { EventParticipant } from '../types';

interface ParticipantsComboboxProps {
  onSelect: (participant: EventParticipant) => void;
  existingParticipants: EventParticipant[];
  inputValue: string;
  onInputChange: (value: string) => void;
}

export default function ParticipantsCombobox({
  onSelect,
  existingParticipants,
  inputValue,
  onInputChange,
}: ParticipantsComboboxProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: users = [], isLoading } = useUsers();

  // Filter out already added participants
  const availableUsers = useMemo(() => {
    const existingIds = new Set(
      existingParticipants
        .filter(p => p.type === 'user')
        .map(p => p.id)
    );
    return users.filter(user => !existingIds.has(user.id));
  }, [users, existingParticipants]);

  // Filter users by input
  const filteredUsers = useMemo(() => {
    if (!inputValue.trim()) return availableUsers;

    const query = inputValue.toLowerCase();
    return availableUsers.filter(
      user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [inputValue, availableUsers]);

  // Check if input is new user (not in list)
  const isNewUser = useMemo(() => {
    return (
      inputValue.trim().length > 0 &&
      !filteredUsers.some(
        u => u.name?.toLowerCase() === inputValue.toLowerCase()
      )
    );
  }, [inputValue, filteredUsers]);

  const handleSelectUser = useCallback((user: typeof users[0]) => {
    onSelect({
      id: user.id,
      type: 'user',
      name: user.name || user.email,
      avatar: user.avatar,
    });
    onInputChange('');
    setIsOpen(false);
  }, [onSelect, onInputChange]);

  const handleSelectNewUser = useCallback(() => {
    if (!inputValue.trim()) return;
    onSelect({
      id: crypto.randomUUID(),
      type: 'guest',
      name: inputValue.trim(),
    });
    onInputChange('');
    setIsOpen(false);
  }, [inputValue, onSelect, onInputChange]);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <div className="relative flex-1">
          <label htmlFor="participant-input" className="sr-only">
            {t('participantsInput.placeholder')}
          </label>
          <MdPersonAdd className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input
            id="participant-input"
            type="text"
            className="w-full pl-11 pr-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
            placeholder={t('participantsInput.placeholder')}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        </div>
      </Popover.Trigger>

      <Popover.Content
        className="w-full z-50 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-lg shadow-lg"
        side="bottom"
        align="start"
      >
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-slate-500">
              {t('common.loading')}
            </div>
          ) : filteredUsers.length === 0 && !isNewUser ? (
            <div className="p-3 text-sm text-slate-500">
              {t('participantsInput.noUsers')}
            </div>
          ) : (
            <>
              {/* Users list */}
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <Avatar
                    avatar={user.avatar}
                    name={user.name || user.email}
                    className="w-8 h-8 rounded-full text-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {user.name || user.email}
                    </p>
                    {user.name && (
                      <p className="text-xs text-slate-500 dark:text-emerald-400 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {/* New user option */}
              {isNewUser && (
                <button
                  onClick={handleSelectNewUser}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-colors border-t border-slate-200 dark:border-emerald-800"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    +
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {t('participantsInput.createNew')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-emerald-400">
                      {inputValue}
                    </p>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
```

---

### 6. Componente: ParticipantsList (MODIFICADO)

Se integra el combobox y mantiene la lógica actual de lista.

---

## Plan de Implementación Paso a Paso

### **Fase 1: Backend (30 min)**

- [ ] **1.1** Revisar `UsersController` y crear si no existe
- [ ] **1.2** Agregar método `findAll()` que devuelve todos los usuarios
- [ ] **1.3** Agregar método `search(query: string)` que filtra por nombre/email
- [ ] **1.4** Agregar DTOs para respuesta (UserDto)
- [ ] **1.5** Probar en Swagger: `GET /api/users` y `GET /api/users/search?q=test`

### **Fase 2: Frontend - Hooks y API (45 min)**

- [ ] **2.1** Crear archivo `apps/frontend/src/api/users.api.ts`
- [ ] **2.2** Crear hook `useUsers()` en `apps/frontend/src/hooks/api/useUsers.ts`
- [ ] **2.3** Crear hook `useSearchUsers()` en mismo archivo
- [ ] **2.4** Actualizar `queryKeys` en `apps/frontend/src/hooks/api/keys.ts`
- [ ] **2.5** Actualizar i18n con claves nuevas
- [ ] **2.6** Verificar en React DevTools que TanStack Query cache funciona

### **Fase 3: Frontend - Componente Combobox (60 min)**

- [ ] **3.1** Instalar `@radix-ui/react-popover` si falta
- [ ] **3.2** Crear componente `ParticipantsCombobox.tsx`
- [ ] **3.3** Implementar filtrado de usuarios
- [ ] **3.4** Implementar selección de usuario existente
- [ ] **3.5** Implementar creación de nuevo usuario
- [ ] **3.6** Estilos con Tailwind (dark mode)

### **Fase 4: Integración (30 min)**

- [ ] **4.1** Actualizar `ParticipantsList.tsx` para usar `ParticipantsCombobox`
- [ ] **4.2** Actualizar `useParticipantsList` hook si es necesario
- [ ] **4.3** Pruebas manuales end-to-end
- [ ] **4.4** Verificar accesibilidad (keyboard navigation, screen readers)

### **Fase 5: Testing (30 min)**

- [ ] **5.1** Tests unitarios para `useUsers` hook
- [ ] **5.2** Tests para filtrado en `ParticipantsCombobox`
- [ ] **5.3** Tests para selección de usuario/nuevo usuario
- [ ] **5.4** Tests de integración: crear evento con participantes

---

## Checklist Detallado

### Backend Checklist

```markdown
## Backend Implementation

- [ ] `UsersController` creado/actualizado
  - [ ] Método `findAll()` implementado
  - [ ] Método `search()` implementado
  - [ ] DTOs actualizados
  - [ ] Decoradores Swagger añadidos
  - [ ] Respuestas documentadas

- [ ] `UsersModule` expone controller
  - [ ] Controller importado en module
  - [ ] Rutas registradas correctamente

- [ ] Testing
  - [ ] Endpoint GET /api/users retorna lista
  - [ ] Endpoint GET /api/users/search?q=test filtra correctamente
  - [ ] Respuestas son válidas (no incluyen datos sensibles)
```

### Frontend API/Hooks Checklist

```markdown
## Frontend API & Hooks

- [ ] `apps/frontend/src/api/users.api.ts`
  - [ ] `usersApi.getAll()` implementado
  - [ ] `usersApi.search(query)` implementado
  - [ ] Manejo de errores

- [ ] `apps/frontend/src/hooks/api/useUsers.ts`
  - [ ] `useUsers()` query hook implementado
  - [ ] `useSearchUsers(query)` query hook implementado
  - [ ] staleTime y retry configurados

- [ ] `apps/frontend/src/hooks/api/keys.ts`
  - [ ] `queryKeys.users.all` añadido
  - [ ] `queryKeys.users.search()` añadido

- [ ] i18n keys
  - [ ] `participantsInput.noUsers` agregado
  - [ ] `participantsInput.createNew` agregado
  - [ ] Todas las idiomas (es, en, ca)
```

### Frontend Component Checklist

```markdown
## Frontend Component

- [ ] `ParticipantsCombobox.tsx`
  - [ ] Popover rendering correcto
  - [ ] Input filter funciona
  - [ ] Lista de usuarios muestra
  - [ ] Estados loading/error
  - [ ] Selección de usuario funciona
  - [ ] Creación de nuevo usuario funciona
  - [ ] Estilos responsive
  - [ ] Dark mode funciona
  - [ ] Accesibilidad (ARIA labels, keyboard nav)

- [ ] `ParticipantsList.tsx`
  - [ ] Integra ParticipantsCombobox
  - [ ] Lógica de agregar/eliminar funciona
  - [ ] Estado visual consistente

- [ ] `useParticipantsList.ts`
  - [ ] Hook actualizado si es necesario
  - [ ] Lógica de selección refactorizada
```

### Testing Checklist

```markdown
## Testing

- [ ] Hook tests
  - [ ] useUsers() returns data
  - [ ] useUsers() caches correctly
  - [ ] useSearchUsers() filters
- [ ] Component tests
  - [ ] ParticipantsCombobox renders
  - [ ] Filter works on input change
  - [ ] User selection works
  - [ ] New user creation works
- [ ] E2E tests
  - [ ] Create event with existing user
  - [ ] Create event with new user
  - [ ] Mix of existing + new users
```

---

## Testing y Validación

### Test Cases

#### **Query Hooks**

```typescript
// useUsers.ts
describe('useUsers', () => {
  it('should fetch all users on mount', async () => {
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3); // Mock data
  });

  it('should cache users for 10 minutes', () => {
    const { result } = renderHook(() => useUsers());
    expect(result.current.dataUpdatedAt).toBeDefined();
  });
});

// useSearchUsers.ts
describe('useSearchUsers', () => {
  it('should not fetch with empty query', () => {
    const { result } = renderHook(() => useSearchUsers(''));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should fetch when query has content', async () => {
    const { result } = renderHook(() => useSearchUsers('john'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

#### **Component**

```typescript
describe('ParticipantsCombobox', () => {
  it('should render input and popover', () => {
    render(<ParticipantsCombobox {...props} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should filter users on input change', async () => {
    render(<ParticipantsCombobox {...props} />);
    await userEvent.type(screen.getByRole('textbox'), 'john');
    await waitFor(() => {
      expect(screen.getByText(/john/i)).toBeInTheDocument();
    });
  });

  it('should show "create new" option for non-existing user', async () => {
    render(<ParticipantsCombobox {...props} />);
    await userEvent.type(screen.getByRole('textbox'), 'new user');
    expect(screen.getByText(/crear nuevo/i)).toBeInTheDocument();
  });

  it('should call onSelect when user clicked', async () => {
    const onSelect = vi.fn();
    render(<ParticipantsCombobox {...props} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Victor'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'user' })
    );
  });

  it('should call onSelect with guest type for new user', async () => {
    const onSelect = vi.fn();
    render(<ParticipantsCombobox {...props} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('textbox'), 'new');
    await userEvent.click(screen.getByText(/crear nuevo/i));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'guest' })
    );
  });
});
```

#### **E2E**

```typescript
describe('Participants Flow', () => {
  it('should create event with mixed participant types', async () => {
    // 1. Create event
    await userEvent.click(screen.getByRole('button', { name: /new event/i }));

    // 2. Add existing user
    const input = screen.getByPlaceholderText(/add participant/i);
    await userEvent.type(input, 'vic');
    await userEvent.click(screen.getByText('Victor'));

    // 3. Add new user
    await userEvent.type(input, 'new person');
    await userEvent.click(screen.getByText(/crear nuevo/i));

    // 4. Verify both appear
    expect(screen.getByText('Victor')).toBeInTheDocument();
    expect(screen.getByText('new person')).toBeInTheDocument();

    // 5. Create event
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(mockCreateEvent).toHaveBeenCalled();
  });
});
```

### Validación Manual

**Checklist de UI:**

- [ ] Input mostraría popover al hacer focus
- [ ] Escribir filtra usuarios en tiempo real
- [ ] Usuario existente se selecciona → se agrega a lista → input limpia
- [ ] Nuevo usuario se crea → se agrega a lista → input limpia
- [ ] Dark mode funciona
- [ ] Responsive en móvil
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader anuncios

---

## Deployment Notes

### Dependencias a instalar

```bash
# Frontend - Ya tienes Radix UI
pnpm --filter @friends/frontend add @radix-ui/react-popover
```

### Environment Variables

No se requieren nuevas variables de entorno.

### Backward Compatibility

✅ **Fully backward compatible**

- API actual `/events` no cambia
- Solo se agrega nuevo endpoint `/users`
- UI es completamente nueva (no reemplaza flujo viejo)

### Migration Guide

No hay migración de datos requerida.

### Monitoreo

**Métricas a seguir:**

- API latency de `/api/users`
- Cache hit rate de `useUsers` query
- Errores de búsqueda
- User adoption (participantes seleccionados vs creados)

---

## Referencias

### TanStack Query + Radix UI

- [TanStack Query docs](https://tanstack.com/query/latest)
- [React Query patterns](https://tanstack.com/query/latest/docs/react/important-defaults)
- [Radix UI Popover](https://www.radix-ui.com/docs/primitives/components/popover)
- [Radix UI Command (alternativa cmdk)](https://www.radix-ui.com/primitives)

### por qué NO usar cmdk

- [cmdk GitHub](https://github.com/pacocoursey/cmdk) - Excelente pero overkill para este caso
- [When to use command palettes](https://www.nngroup.com/articles/command-palettes/) - Aplicable solo a casos complejos

### Accesibilidad

- [ARIA autocomplete patterns](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Testing keyboard navigation](https://www.radix-ui.com/docs/primitives/components/select)

---

## Conclusión

### Decisiones principales

| Decisión                         | Razón                                            |
| -------------------------------- | ------------------------------------------------ |
| **Radix UI Popover vs cmdk**     | Simplifica, evita overhead, mantiene coherencia  |
| **TanStack Query para usuarios** | Cache automático, control de staleness, devtools |
| **Búsqueda local vs remota**     | Usuarios cambian rara vez, mejor UX offline      |
| **Mantener tipo 'guest'**        | Flexibilidad: usuarios custom + existentes       |

### Next Steps

Una vez implementado, posibles mejoras:

- [ ] Agregar roles visibles (admin, user)
- [ ] Agregar avatares dinámicos (gravatar, uploads)
- [ ] Sincronización en tiempo real (WebSocket)
- [ ] Command palette global (ahí sí cmdk)

---

**Última actualización:** 21 de febrero de 2026  
**Autor:** Assistant (GitHub Copilot)  
**Estado:** Listo para implementación
