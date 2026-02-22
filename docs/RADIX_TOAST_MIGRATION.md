# 🍞 Sistema de Toasts con Radix UI

## Implementación Completada

Se ha refactorizado el sistema de toasts de `react-hot-toast` a **Radix UI** integrado con Zustand, i18n y TanStack Query.

### Archivos Creados

- `src/shared/store/useToastStore.ts` - Estado global de toasts
- `src/shared/hooks/useToast.ts` - Hook personalizado para disparar toasts
- `src/shared/components/Toast/Toast.tsx` - Componente Radix UI
- `src/shared/components/Toast/index.ts` - Barril de exports

### Cambios Realizados

- ✅ Reemplazado `react-hot-toast` por `@radix-ui/react-toast`
- ✅ Instalado `@radix-ui/react-toast` en el frontend
- ✅ Actualizado `App.tsx` para incluir el componente Toast
- ✅ Refactorizado `UserMenu.tsx` para usar `useToast()`
- ✅ Actualizado `toastUtils.ts` con documentación de migración

---

## 📖 Ejemplos de Uso

### 1. En Mutations (TanStack Query)

```typescript
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

export function useCreateEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      success('events.create_success');
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
    onError: (err: ApiError) => {
      error('events.create_error', err.message);
    },
  });
}
```

### 2. En Componentes

```typescript
import { useToast } from '@/shared/hooks/useToast';

export function EventForm() {
  const { success, info } = useToast();

  const handleAddParticipant = () => {
    // Lógica...
    success('events.participant_added');
  };

  const handleSelectEvent = () => {
    info('events.event_selected');
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 3. Borrar Evento

```typescript
export function useDeleteEvent() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) => eventsApi.delete(eventId),
    onSuccess: () => {
      success('events.delete_success');
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      // redirigir a home
    },
    onError: () => {
      error('events.delete_error');
    },
  });
}
```

### 4. Transacciones

```typescript
export function useCreateTransaction() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: (_, { eventId }) => {
      success('transactions.create_success');
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.byEvent(eventId),
      });
    },
    onError: () => {
      error('transactions.create_error');
    },
  });
}
```

---

## 🎨 Tipos de Toast Disponibles

```typescript
const { success, error, info } = useToast();

// Success (verde) - 3 segundos por defecto
success('events.create_success');
success('events.create_success', 'events.create_success_detail');
success('events.create_success', 'events.create_success_detail', 5000);

// Error (rojo) - 5 segundos por defecto
error('events.create_error');
error('events.create_error', 'events.create_error_detail');

// Info (azul) - 3 segundos por defecto
info('events.event_selected');
info('events.event_selected', 'events.event_selected_detail');
```

---

## 📝 Claves de Traducción Necesarias

Asegúrate de que en tus archivos de i18n tengas las claves:

```json
{
  "events": {
    "create_success": "Evento creado",
    "create_error": "Error al crear evento",
    "delete_success": "Evento eliminado",
    "delete_error": "Error al eliminar evento",
    "update_success": "Evento actualizado",
    "participant_added": "Participante añadido",
    "event_selected": "Evento seleccionado"
  },
  "transactions": {
    "create_success": "Transacción creada",
    "create_error": "Error al crear transacción",
    "update_success": "Transacción actualizada",
    "delete_success": "Transacción eliminada",
    "delete_error": "Error al eliminar transacción"
  },
  "user": {
    "logout_success": "Sesión cerrada"
  }
}
```

---

## ✨ Características

- ✅ Integrado con **i18next** - Traducciones automáticas
- ✅ Integrado con **TanStack Query** - Perfecto para mutations
- ✅ **Dark mode** - Soporte completo
- ✅ **Cola de toasts** - Múltiples toasts simultáneamente
- ✅ **Type-safe** - TypeScript desde el inicio
- ✅ **Radix UI** - Accesible y personalizable
- ✅ **Zustand** - Consistente con tu arquitectura

---

## 🔧 Próximos Pasos

1. Desinstalar `react-hot-toast` cuando ya no se use:

   ```bash
   pnpm --filter @friends/frontend remove react-hot-toast
   ```

2. Añadir las claves de i18n para todas las acciones (crear, actualizar, borrar, etc.)

3. Refactorizar todos los hooks de mutations para usar `useToast()`

4. Personalizar estilos según necesidad en `Toast.tsx`
