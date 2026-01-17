# Plan de Implementación: Mover Cálculo de KPIs al Backend

## Fecha

20260111

## Motivaciones y Objetivos

Actualmente, los KPIs (Key Performance Indicators) de los eventos se calculan en el frontend usando un hook `useEventKPIs` que procesa las transacciones localmente. Esto genera carga innecesaria en el cliente, potencialmente duplica lógica de negocio, y puede llevar a inconsistencias si la lógica cambia. Mover el cálculo al backend mejora el rendimiento, centraliza la lógica de negocio, y permite caching y optimizaciones del lado servidor.

El objetivo es refactorizar el sistema para que el backend calcule y devuelva los KPIs a través de un nuevo endpoint, eliminando la lógica de cálculo del frontend.

## Análisis y Diseño de la Solución

### Arquitectura Actual

- **Frontend**: Hook `useEventKPIs` en `/apps/frontend/src/hooks/api/useEventKPIs.ts` calcula KPIs usando `useMemo` basado en transacciones obtenidas vía API.
- **Backend**: No hay cálculo de KPIs; solo se devuelven transacciones crudas.
- **Tipos**: Definidos en el hook del frontend.

### Arquitectura Propuesta

- **Backend**: Nuevo endpoint `GET /api/events/:id/kpis` que devuelve KPIs calculados.
- **Frontend**: Nuevo hook `useEventKPIs` que llama al endpoint del backend en lugar de calcular localmente.
- **Tipos**: Mover a `@friends/shared-types` (planeado) o definir en backend y frontend por separado inicialmente.

### Beneficios

- Reducción de carga en el frontend.
- Lógica de negocio centralizada.
- Posibilidad de caching en el backend (e.g., Redis).
- Mejor escalabilidad para eventos con muchas transacciones.
- Consistencia en cálculos.

### Desventajas

- Una llamada API adicional por evento (aunque mínima, ya que se puede cachear con React Query).
- Dependencia del backend para datos procesados.

### Lógica de Cálculo

La lógica actual se mantiene igual: sumar contribuciones, gastos, compensaciones; calcular balances por participante y del pot. Se implementará en TypeScript en el backend usando el mismo algoritmo.

## Implementación Plan y Pasos

1. **Crear DTO para KPIs en Backend**
   - Archivo: `/apps/backend/src/modules/events/dto/event-kpis.dto.ts`
   - Definir interfaz `EventKPIs` con todos los campos (totalExpenses, totalContributions, etc.)

2. **Agregar Método en EventsService**
   - Archivo: `/apps/backend/src/modules/events/events.service.ts`
   - Método: `getKPIs(eventId: string): Promise<EventKPIs>`
   - Inyectar `TransactionsService` o acceder directamente a transacciones.
   - Implementar lógica de cálculo idéntica a la del frontend.

3. **Agregar Endpoint en EventsController**
   - Archivo: `/apps/backend/src/modules/events/events.controller.ts`
   - Endpoint: `GET /api/events/:id/kpis`
   - Decoradores Swagger apropiados.

4. **Actualizar Tipos en Frontend**
   - Mover interfaz `EventKPIs` a `/apps/frontend/src/api/types.ts` o crear archivo separado.
   - Crear nueva función API en `/apps/frontend/src/api/events.api.ts`: `getKPIs(eventId: string)`

5. **Crear Nuevo Hook en Frontend**
   - Archivo: `/apps/frontend/src/hooks/api/useEventKPIs.ts` (reemplazar lógica)
   - Usar `useQuery` para llamar a `eventsApi.getKPIs(eventId)`
   - Mantener la misma interfaz de retorno.

6. **Actualizar Componentes que Usan el Hook**
   - Verificar que `EventDetail.tsx` y `KPIDetail.tsx` sigan funcionando sin cambios.

7. **Pruebas**
   - Backend: Unit tests para `getKPIs` en `events.service.spec.ts`
   - Frontend: Verificar que los datos sean idénticos.
   - E2E: Probar endpoint y UI.

## Checklist de Implementación

- [x] Crear `EventKPIsDto` en backend
- [x] Actualizar tipos en frontend
- [x] Implementar `getKPIs` en `EventsService`
- [x] Agregar endpoint en `EventsController`
- [x] Crear `getKPIs` en `events.api.ts`
- [x] Refactorizar `useEventKPIs` hook
- [x] Ejecutar tests y validar
- [x] Verificar UI funciona correctamente

## Mejoras y Lecciones Aprendidas

- **Implementación exitosa**: El cálculo de KPIs se movió completamente al backend, reduciendo carga en el cliente y centralizando la lógica de negocio.
- **Endpoint probado**: El endpoint `GET /api/events/:id/kpis` funciona correctamente, devolviendo KPIs calculados o errores apropiados (404 para eventos inexistentes).
- **Tipos consistentes**: Los tipos `EventKPIs` están definidos tanto en backend (DTO) como en frontend (API types), asegurando consistencia.
- **Tests actualizados**: Los tests del backend incluyen mocks para `TransactionsService` y pruebas para el nuevo método `getKPIs`.
- Considerar agregar caching en el backend para KPIs (e.g., invalidar al crear/actualizar transacciones).
- Futuro: Mover tipos a `@friends/shared-types` para consistencia.
- Lección: Centralizar lógica de negocio en el backend reduce duplicación y mejora mantenibilidad.
