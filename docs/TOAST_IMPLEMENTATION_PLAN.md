# 🍞 Plan de Implementación Global de Toasts

## 📋 Tabla de Contenidos

1. [Análisis de Situaciones](#análisis-de-situaciones)
2. [Patrones de Toast por Tipo](#patrones-de-toast-por-tipo)
3. [Claves i18n Necesarias](#claves-i18n-necesarias)
4. [Implementación por Módulo](#implementación-por-módulo)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Checklist de Implementación](#checklist-de-implementación)

---

## ✅ Análisis de Situaciones

### 🟢 CASOS DONDE SI USAR TOAST

| Acción                              | Tipo         | Razón                              | Duración |
| ----------------------------------- | ------------ | ---------------------------------- | -------- |
| ✅ **Crear evento**                 | Success      | Confirmación de operación exitosa  | 4s       |
| ✅ **Actualizar evento**            | Success      | Cambios guardados                  | 4s       |
| ✅ **Borrar evento**                | Success      | Acción irreversible confirmada     | 4s       |
| ✅ **Crear transacción**            | Success      | Confirmación de gasto/contribución | 4s       |
| ✅ **Actualizar transacción**       | Success      | Cambios guardados                  | 4s       |
| ✅ **Borrar transacción**           | Success      | Acción irreversible confirmada     | 4s       |
| ✅ **Error en petición API**        | Error        | Informar al usuario de fallo       | 6s       |
| ✅ **Error de validación**          | Error        | Acción rechazada (form vacío, etc) | 6s       |
| ✅ **Logout exitoso**               | Success      | Estado importante de sesión        | 4s       |
| ✅ **Copiar al portapapeles**       | Info/Success | Confirmación rápida                | 3s       |
| ✅ **Agregar participante a lista** | Success      | Confirmación de adición            | 4s       |
| ✅ **Persistencia de preferencias** | Info         | Dark mode, idioma cambiados        | 3s       |

### 🔴 CASOS DONDE NO USAR TOAST

| Acción                              | Por Qué                  | Alternativa            |
| ----------------------------------- | ------------------------ | ---------------------- |
| ❌ **Navegación entre páginas**     | No es necesario feedback | Ninguna                |
| ❌ **Cambio de tema/idioma**        | Cambio visual obvio      | Ninguna (o info suave) |
| ❌ **Hover/Focus en botones**       | Ruido visual             | Ninguna                |
| ❌ **Loading de datos**             | Ya hay skeleton/spinner  | Loading state          |
| ❌ **Mensajes muy largos**          | Toast es para brevedad   | Modal/Dialog           |
| ❌ **Acciones reversibles menores** | No importante            | Ninguna                |

---

## 🎯 Patrones de Toast por Tipo

### Pattern 1: Mutation Success (4s)

```typescript
export function useCreateEvent() {
  const { success } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      success('events.create_success');
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
```

### Pattern 2: Mutation with Error Handling (6s error)

```typescript
export function useUpdateTransaction() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) => transactionsApi.update(id, data),
    onSuccess: (transaction) => {
      success('transactions.update_success');
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(transaction.eventId),
      });
    },
    onError: (error) => {
      error('transactions.update_error', error instanceof Error ? error.message : 'Unknown error');
    },
  });
}
```

### Pattern 3: Async Action con Retraso (necesario para logout)

```typescript
const handleLogout = () => {
  success('user.logout_success');
  // Esperar a que toast sea visible antes de navegar
  setTimeout(() => {
    logout();
    navigate('/login', { replace: true });
  }, 500);
};
```

### Pattern 4: Confirmación en Modal

```typescript
const handleConfirmDelete = useCallback(() => {
  if (transaction) {
    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        success('transactions.delete_success');
        onClose();
      },
      onError: () => {
        error('transactions.delete_error');
      },
    });
  }
}, [transaction, deleteTransaction, success, error, onClose]);
```

---

## 🌐 Claves i18n Necesarias

### Events (eventos)

```json
{
  "events": {
    "create_success": "Evento creado",
    "create_error": "Error al crear evento",
    "update_success": "Evento actualizado",
    "update_error": "Error al actualizar evento",
    "delete_success": "Evento eliminado",
    "delete_error": "Error al eliminar evento"
  }
}
```

### Transactions (transacciones)

```json
{
  "transactions": {
    "create_success": "Transacción creada",
    "create_error": "Error al crear transacción",
    "update_success": "Transacción actualizada",
    "update_error": "Error al actualizar transacción",
    "delete_success": "Transacción eliminada",
    "delete_error": "Error al eliminar transacción"
  }
}
```

### User (usuario)

```json
{
  "user": {
    "logout_success": "Sesión cerrada correctamente"
  }
}
```

### Common (común)

```json
{
  "common": {
    "success": "Exitoso",
    "error": "Error",
    "validation_error": "Por favor, completa todos los campos",
    "network_error": "Error de conexión. Intenta de nuevo"
  }
}
```

---

## 📁 Implementación por Módulo

### 1. **Events Module** (`src/hooks/api/useEvents.ts`)

**Cambios necesarios:**

- ✅ `useCreateEvent()` - Agregar toast success
- ✅ `useUpdateEvent()` - Agregar toast success + error
- ✅ `useDeleteEvent()` - Agregar toast success + error

**Tareas:**

```typescript
// ANTES
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

// DESPUÉS
export function useCreateEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      success('events.create_success');
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
    onError: () => {
      error('events.create_error');
    },
  });
}
```

### 2. **Transactions Module** (`src/hooks/api/useTransactions.ts`)

**Cambios necesarios:**

- ✅ `useCreateTransaction()` - Agregar toast success + error
- ✅ `useUpdateTransaction()` - Agregar toast success + error
- ✅ `useDeleteTransaction()` - Agregar toast success + error

### 3. **Header User Menu** (`src/shared/components/Header/UserMenu.tsx`)

**Cambios necesarios:**

- ✅ Retrasar logout para mostrar toast (ya hecho parcialmente)
- ✅ Importar `useNavigate`
- ✅ Aumentar duración de success toast a 4s

---

## 💻 Ejemplos de Código

### Ejemplo Completo: Hook useCreateEvent

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events.api';
import { queryKeys } from './keys';
import { useToast } from '@/shared/hooks/useToast';

export function useCreateEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      // Toast de éxito
      success('events.create_success');

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
    onError: (err: Error) => {
      // Toast de error con detalles
      error('events.create_error', err.message);
    },
  });
}
```

### Ejemplo: Modal con Delete Confirmado

```typescript
const handleConfirmDelete = useCallback(() => {
  if (transaction) {
    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        // Toast de éxito
        success('transactions.delete_success');

        // Cerrar modales
        setShowDeleteConfirm(false);
        resetForm();
        onClose();
      },
      onError: (error) => {
        // Toast de error
        error('transactions.delete_error');
        setErrorMessage('Intenta de nuevo');
      },
    });
  }
}, [transaction, deleteTransaction, success, error]);
```

---

## ✅ Checklist de Implementación

### Fase 1: Preparación i18n (1 hora)

- [ ] Agregar claves en `src/i18n/locales/es/translation.json`
- [ ] Agregar claves en `src/i18n/locales/en/translation.json`
- [ ] Agregar claves en `src/i18n/locales/ca/translation.json`

### Fase 2: Events Module (2 horas)

- [ ] Actualizar `useCreateEvent()` en `src/hooks/api/useEvents.ts`
- [ ] Actualizar `useUpdateEvent()` en `src/hooks/api/useEvents.ts`
- [ ] Actualizar `useDeleteEvent()` en `src/hooks/api/useEvents.ts`
- [ ] Importar `useToast` en archivo
- [ ] Testear cada mutation en el navegador

### Fase 3: Transactions Module (2 horas)

- [ ] Actualizar `useCreateTransaction()` en `src/hooks/api/useTransactions.ts`
- [ ] Actualizar `useUpdateTransaction()` en `src/hooks/api/useTransactions.ts`
- [ ] Actualizar `useDeleteTransaction()` en `src/hooks/api/useTransactions.ts`
- [ ] Importar `useToast` en archivo
- [ ] Testear cada mutation en el navegador

### Fase 4: UI Interactions (1 hora)

- [ ] Verificar UserMenu logout con retraso
- [ ] Aumentar duración en `useToast.ts` a 4s para success
- [ ] Testear que el toast se ve antes de navegar

### Fase 5: Testing & Polish (1 hora)

- [ ] Verificar toasts en modo oscuro
- [ ] Verificar toasts en mobile
- [ ] Verificar textos traducidos correctamente
- [ ] Verificar duración de cada tipo de toast
- [ ] Verificar que no hay toasts superpuestos innecesariamente

---

## 📊 Matriz de Decisión: ¿Usar Toast?

```
¿Es acción del usuario?
    ├─ NO → No mostrar nada
    └─ SI → ¿Es operación backend (API)?
        ├─ NO → ¿Cambio visual claro? (dark mode, idioma)
        │   ├─ SI → No mostrar
        │   └─ NO → Mostrar INFO (3s)
        └─ SI → ¿Es exitosa?
            ├─ SI → Mostrar SUCCESS (4s)
            └─ NO → ¿Es error importante?
                ├─ SI → Mostrar ERROR (6s)
                └─ NO → Considerar silent fail o log
```

---

## 🚀 Orden de Prioridad

1. **P0 - Critical**: Logout success (ya parcialmente implementado)
2. **P1 - High**: Events (create, update, delete)
3. **P2 - High**: Transactions (create, update, delete)
4. **P3 - Medium**: Error handling mejorado en mutations
5. **P4 - Nice-to-have**: Info toasts para acciones menores

---

## 💡 Notas Importantes

### ⚠️ No Mostrar Toasts en Estos Casos

- Cuando la navegación es inmediata (evita desorden)
- Cuando hay confirmación visual clara (e.g., elemento desapareció)
- Cuando el error es de validación en form (usar inline errors)

### 🎯 Best Practices Implementadas

1. ✅ **Toast centralizado** con Zustand
2. ✅ **Integración con i18n** - Traducciones automáticas
3. ✅ **Top-center positioning** - Visible sin interferencias
4. ✅ **Animación suave** - Slide-in desde arriba con fade-in
5. ✅ **Duración variable** - Success 4s, Error 6s
6. ✅ **Dismissible** - Click X o tiempo automático
7. ✅ **Dark mode** - Soporte completo

---

## 📝 Tiemp Estimado

- **Fase 1 (i18n)**: 30 min
- **Fase 2 (Events)**: 1 hora
- **Fase 3 (Transactions)**: 1 hora
- **Fase 4 (UI)**: 30 min
- **Fase 5 (Testing)**: 30 min

**Total**: ~3.5 horas
