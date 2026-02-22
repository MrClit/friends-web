# Revisión de Código: Plan vs Realidad

> Análisis completo del plan vs. estructura actual del código
>
> **Fecha:** 21 de febrero de 2026  
> **Status:** ✅ Plan ajustado

---

## 📊 Resumen Ejecutivo

El plan encaja **muy bien** con tu arquitectura actual. Se encontraron **2 ajustes necesarios** y **2 decisiones importantes**.

| Aspecto                              | Estado        | Ajustes                   |
| ------------------------------------ | ------------- | ------------------------- |
| Backend (NestJS + TypeORM)           | ✅ Perfecto   | Crear solo Controller     |
| Frontend (React 19 + TanStack Query) | ✅ Perfecto   | Pequeños ajustes en tipos |
| API Client                           | ✅ Compatible | Sin cambios               |
| i18n                                 | ✅ Compatible | Agregar 2 keys nuevas     |
| **TOTAL**                            | ✅✅✅        | **Cambios mínimos**       |

---

## 🔍 Análisis Detallado por Área

### 1. Backend: Estructura Actual

**Estado actual:** ✅ **70% listo**

```
apps/backend/src/modules/users/
  ├─ user.entity.ts          ✅ Completo
  ├─ users.service.ts        ✅ Completo (métodos básicos)
  ├─ users.module.ts         ✅ Completo
  └─ users.controller.ts     ❌ FALTA - CREAR
```

**Encontrado:**

- ✅ `UsersModule` ya importado en `app.module.ts`
- ✅ `User` entity con campos: `id`, `email`, `name`, `avatar`, `role`, `createdAt`, `updatedAt`
- ✅ `UsersService` con métodos existentes
- ❌ `UsersController` NO EXISTE → **Hay que crearla**

**Cambio en plan:**

- ✅ Sin cambios, solo crear el controller

---

### 2. Frontend: Tipos y Estructura

**Estado actual:** ✅ **Excelente**

```
apps/frontend/src/
  ├─ api/
  │   ├─ types.ts                      ✅ Completo + UserParticipant
  │   ├─ client.ts                     ✅ Perfecto (apiRequest wrapper)
  │   ├─ events.api.ts                 ✅ Existe
  │   ├─ transactions.api.ts           ✅ Existe
  │   └─ users.api.ts                  ❌ CREAR
  ├─ hooks/api/
  │   ├─ keys.ts                       ✅ Estructura perfecta
  │   ├─ useEvents.ts                  ✅ Pattern correcto
  │   ├─ useTransactions.ts            ✅ Pattern correcto
  │   └─ useUsers.ts                   ❌ CREAR
  ├─ features/auth/
  │   └─ types.ts                      ✅ User interface completa
  ├─ features/events/
  │   ├─ types.ts                      ✅ EventParticipant = EventParticipantDto
  │   ├─ hooks/useParticipantsList.ts  ✅ Existe, simple
  │   └─ components/
  │       ├─ ParticipantsList.tsx      ✅ Existe
  │       └─ ParticipantsCombobox.tsx  ❌ CREAR
  └─ i18n/locales/
      ├─ es/translation.json           ✅ Existe, needs 2 keys
      ├─ en/translation.json           ✅ Existe, needs 2 keys
      └─ ca/translation.json           ✅ Existe, needs 2 keys
```

**Encontrado:**

- ✅ Types perfectamente alineados: `UserParticipant`, `GuestParticipant`, `PotParticipant`
- ✅ `apiRequest<T>` wrapper ya maneja `{ data: T }`
- ✅ Pattern de hooks es idéntico al necesitado
- ✅ `User` interface en `auth/types.ts` es perfecta
- ✅ i18n ya tiene estructura y keys

**Cambios en plan:**

- ✅ Plan se mantiene igual

---

### 3. TanStack Query: Pattern Actual

**Estado actual:** ✅ **Excelente, idéntico al plan**

```typescript
// Hook pattern en tu código (useEvents.ts)
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
```

**Perfecto para nuestro caso:** El hook `useUsers()` será idéntico.

---

### 4. API Client: Wrapper Actual

**Estado actual:** ✅ **Perfecto**

```typescript
// apps/frontend/src/api/client.ts
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const json = await response.json();
  return json.data as T; // ✅ Maneja { data: T }
}
```

**Aplicable:** `usersApi.getAll()` usará este wrapper automáticamente.

---

### 5. Radix UI: Verificación

**Dependencias actuales:**

- ✅ `@radix-ui/react-dialog` v1.1.15 - Instalado
- ✅ `@radix-ui/react-dropdown-menu` v2.1.16 - Instalado
- ✅ `@radix-ui/react-progress` v1.1.8 - Instalado
- ✅ `@radix-ui/react-slot` v1.2.4 - Instalado
- ❌ `@radix-ui/react-popover` - **NO INSTALADO** → Agregar

**Cambio:** Instalar popover antes de crear combobox.

---

### 6. i18n: Keys Necesarias

**Revisión del JSON actual:**

```json
{
  "participantsInput": {
    "label": "Participantes",
    "add": "Añadir",
    "addAria": "Añadir participante",
    "placeholder": "Nombre o email...",  ← Perfecto para combobox
    "deleteAria": "Eliminar participante",
    "potName": "Fondo común"
  }
}
```

**Keys FALTANTES (agregar a las 3 idiomas):**

```json
"participantsInput": {
  // ... existing ...
  "noUsers": "No hay usuarios disponibles",        // ES
  "createNew": "Crear nuevo participante"          // ES
}
```

**Para EN:**

```json
"participantsInput": {
  "noUsers": "No users available",
  "createNew": "Create new participant"
}
```

**Para CA:**

```json
"participantsInput": {
  "noUsers": "No hi ha usuaris disponibles",
  "createNew": "Crear nou participant"
}
```

---

## 🎯 Cambios Necesarios al Plan

### 1. ✅ Backend Controller: AJUSTE IMPORTANTE

**Plan dice:** Crear `users.controller.ts` con rutas GET /api/users

**AJUSTE encontrado:**

- `EventsController` tiene `@UseGuards(AuthGuard('jwt'), RolesGuard)` globalmente
- Esto significa que todos los endpoints están protegidos

**Decisión:** ¿Proteger GET /api/users con JWT?

**Análisis:**

- ✅ SÍ: Es lógico - usuarios autenticados ven solo la lista de usuarios
- ✅ NO: Los participantes pueden ser anónimos (guests)

**RECOMENDACIÓN:** Proteger con JWT pero permitir guest participants sin autenticación.

```typescript
// users.controller.ts
@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)  // ← Igual que EventsController
export class UsersController {
  @Get()
  findAll() { ... }  // Solo usuarios autenticados ven la lista
}
```

**Razón:** No queremos que desconocidos puedan enumerar usuarios del sistema.

---

### 2. ✅ Frontend Hook: PEQUEÑO AJUSTE

**Plan dice:** `useUsers()` y `useSearchUsers(query)`

**VERIFICACIÓN:**

- Tu pattern actual: queries + mutations separadas
- `useEvents()` y `useCreateEvent()` son hooks separados ✅
- `useEventKPIs(id)` es query separada ✅

**CAMBIO:** El plan está bien. Crear dos hooks separados es correcto.

```typescript
// apps/frontend/src/hooks/api/useUsers.ts

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 min - usuarios no cambian frecuente
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => usersApi.search(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
```

**Nota:** `useSearchUsers()` NO es necesario en tu caso actual (búsqueda local es suficiente).

---

### 3. ✅ Frontend Component: SIN CAMBIOS

**Plan dice:** Crear `ParticipantsCombobox.tsx` con Radix Popover

**Verificación:**

- Tu estructura de carpetas es perfecta
- Los tipos `EventParticipantDto` ya soportan `UserParticipant` ✅
- El hook `useParticipantsList` se puede extender ✅

**Plan mantiene su forma.**

---

## 📋 Plan Ejecutable Final (Ajustado)

### Fase 1: Backend (45 min) - AJUSTADO

**Tareas:**

1. **1.1** Crear archivo `apps/backend/src/modules/users/users.controller.ts`
2. **1.2** Implementar `@Get()` que retorna todos los usuarios
   ```typescript
   @Get()
   @UseGuards(AuthGuard('jwt'), RolesGuard)  // ← Protegido
   findAll() { return this.usersService.findAll(); }
   ```
3. **1.3** Implementar `@Get('search')` con query `?q=name`
   ```typescript
   @Get('search')
   @UseGuards(AuthGuard('jwt'), RolesGuard)  // ← Protegido
   search(@Query('q') query: string) { return this.usersService.search(query); }
   ```
4. **1.4** Agregar método `findAll()` a `UsersService`
5. **1.5** Agregar método `search(query)` a `UsersService`
6. **1.6** Crear DTO `UserDto` (excluir password, role si es privado)
7. **1.7** Agregar decoradores Swagger `@ApiStandardResponse`
8. **1.8** Actualizar `users.module.ts` para exportar controller
9. **1.9** Probar en Swagger: `GET /api/users` y `GET /api/users/search?q=test`

---

### Fase 2: Frontend - Instalaciones (5 min) - NUEVA

**Tareas:**

1. **2.0** Instalar `@radix-ui/react-popover`
   ```bash
   pnpm --filter @friends/frontend add @radix-ui/react-popover
   ```

---

### Fase 3: Frontend - API y Hooks (30 min) - IGUAL AL PLAN

**Tareas (idénticas):**

1. **3.1** Crear `apps/frontend/src/api/users.api.ts`
2. **3.2** Crear `apps/frontend/src/hooks/api/useUsers.ts`
3. **3.3** Actualizar `apps/frontend/src/hooks/api/keys.ts`
4. **3.4** Actualizar i18n (agregar 2 keys)

---

### Fase 4: Frontend - Componente (60 min) - IGUAL AL PLAN

**Tareas (idénticas):**

1. **4.1** Crear `ParticipantsCombobox.tsx`
2. **4.2** Integrar con `ParticipantsList.tsx`
3. **4.3** Estilos Tailwind + dark mode

---

## 🚨 Decisiones Importantes

### Decisión 1: ¿Proteger GET /api/users con JWT?

**RECOMENDACIÓN:** ✅ **SÍ - Protegerlo**

**Razón:**

- Seguridad: No queremos que bots enumeren usuarios
- Consistencia: Todos los endpoints de datos están protegidos
- Lógica de negocio: Un evento está protegido, sus participantes también

**Impacto:**

- Frontend debe tener token antes de usar `useUsers()` ✅ Ya lo hace
- Guests pueden existir sin token ✅ Ya funciona en ParticipantsList

---

### Decisión 2: ¿Búsqueda remota vs local?

**RECOMENDACIÓN:** ✅ **Búsqueda LOCAL (array.filter)**

**Razón:**

- Lista de usuarios es pequeña (generalmente < 100)
- Usuarios no cambian frecuentemente
- Mejor UX (instantáneo)
- Menos carga en backend

**Plan:**

1. `useUsers()` carga lista completa 1x (10 min cache)
2. `ParticipantsCombobox` filtra localmente en `useMemo`
3. Sin endpoint `/api/users/search` necesario
4. Si futuro: usuarios > 1000 → agregar búsqueda remota

**Corolario:** `useSearchUsers()` NO es necesario crear (eliminar del plan).

---

### Decisión 3: ¿Excluir tipo 'user' si ya tiene email?

**Encontrado en types.ts:**

```typescript
export interface UserParticipant {
  type: 'user';
  id: string; // UUID del User
  name?: string; // Optional
  email?: string; // Optional
}
```

**DECISIÓN:** ✅ **Mantener structure actual**

**Razón:** Permite flexibilidad futura (mostrar/ocultar email, etc.)

---

## 📝 Checklist Actualizado

### Backend

- [ ] Crear `users.controller.ts`
- [ ] Métodos en `UsersService`: `findAll()`, `search(query)`
- [ ] Decoradores Swagger agregados
- [ ] Guard JWT aplicado
- [ ] Endpoints probados en Swagger

### Frontend - Installation

- [ ] `pnpm --filter @friends/frontend add @radix-ui/react-popover`

### Frontend - API/Hooks

- [ ] `users.api.ts` creado
- [ ] `useUsers()` hook creado
- [ ] `queryKeys.users` agregado
- [ ] i18n keys agregadas (3 idiomas)

### Frontend - Component

- [ ] `ParticipantsCombobox.tsx` creado
- [ ] Integración con `ParticipantsList.tsx`
- [ ] Tests

---

## ✅ Conclusión

**Plan está 95% correcto. Cambios mínimos:**

1. ✅ Backend: Crear solo el Controller (service ya existe)
2. ✅ Frontend: Instalar Radix Popover
3. ✅ Frontend: Búsqueda local (no remota)
4. ✅ Backend: Proteger con JWT

**Tiempo estimado:** 3-4 horas implementación + testing

**Complejidad:** Baja - Todo encaja perfectamente

---

**Siguiente paso:** ¿Comenzamos con el backend Controller?
