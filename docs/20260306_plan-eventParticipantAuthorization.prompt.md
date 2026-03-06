## Plan: Autorizacion Por Participante En Eventos

Aplicaremos autorizacion basada en rol y pertenencia: `admin` puede ver/operar todo; `user` solo recursos de eventos donde participa como `participant.type = 'user'` con su `id`. Para evitar enumeracion de recursos, cuando un `user` no tenga acceso se respondera `404` (misma salida que recurso inexistente). Se implementara en backend y se ajustara UX frontend para tratar estos `404` de acceso de forma coherente.

**Steps**

1. Fase 1 - Base de autorizacion backend: definir un modelo de actor autenticado reutilizable (`id`, `role`) y un mecanismo consistente para obtenerlo en controladores (decorador `CurrentUser` o equivalente con `@Req`). Esta base desbloquea todos los checks posteriores. _Bloquea pasos 2-7_.
2. Fase 2 - Blindar rutas sin JWT: proteger `TransactionsController` (`/api/transactions/:id`) con `AuthGuard('jwt')` + `RolesGuard`, igual que el resto de endpoints protegidos. _Paralelo con paso 3_.
3. Fase 2 - Propagar actor en controladores de dominio: actualizar `EventsController` y `EventTransactionsController` para pasar el actor autenticado a la capa de servicio en todas las operaciones de lectura y escritura. _Paralelo con paso 2_.
4. Fase 3 - Reglas de acceso en eventos: refactorizar `EventsService` para que `findAll/findOne/update/remove/getKPIs` apliquen politica por rol. Regla: `admin` acceso total; `user` solo si participa. Para no filtrar informacion, denegar con `NotFoundException` cuando no participa. _Depende de 1 y 3_.
5. Fase 3 - Reglas de creacion en eventos: en `EventsService.create`, si el actor es `user`, autoanadir su participante `{ type: 'user', id: actor.id }` cuando no venga en `participants`; para `admin` mantener payload tal cual. Evitar duplicado del mismo `user` participant. _Depende de 1 y 3_.
6. Fase 4 - Reglas de acceso en transacciones por evento: en `TransactionsService` (`findByEvent`, `findByEventPaginated`, `create`), validar primero acceso al evento padre con la misma politica (`admin` todo, `user` participante). Si falla, `404`. _Depende de 1 y 3_.
7. Fase 4 - Reglas de acceso en transacciones por ID: en `TransactionsService` (`findOne`, `update`, `remove`) validar acceso al evento asociado a la transaccion antes de devolver/modificar/borrar. Si no hay acceso, `404`. Mantener `404` tambien para transaccion inexistente. _Depende de 1 y 3_.
8. Fase 4 - KPI y consistencia transversal: asegurar que `GET /events/:id/kpis` pasa por la misma validacion de acceso de evento antes de calcular KPIs para evitar bypass indirecto. _Depende de 4 y 6_.
9. Fase 5 - Tests e2e de eventos: extender `events.e2e-spec.ts` con matriz `admin/user` para listado, detalle, update, delete y KPI, incluyendo caso `404` por no participacion. Añadir caso de creacion por `user` sin auto-inclusion en payload y verificar auto-anadido. Incluir caso de autoexclusion permitida (update exitoso y acceso posterior denegado). _Depende de 4-5_.
10. Fase 5 - Tests e2e de transacciones: extender `transactions.e2e-spec.ts` con `404` por no participacion en endpoints nested y por ID, y `401` sin token en `/api/transactions/:id` tras blindaje. Validar que `admin` mantiene acceso global. _Depende de 2, 6 y 7_.
11. Fase 6 - UX frontend para nuevos `404` de acceso: ajustar pantallas de detalle (`EventDetail`, `KPIDetailView`, `TransactionsList`) para no mostrar errores tecnicos/retry inutil cuando el backend devuelve `404` por no acceso; mostrar mensaje funcional de no encontrado/sin acceso y CTA coherente (volver). _Depende de 4-8_.
12. Fase 6 - Tests frontend focalizados: actualizar `ErrorState.test.tsx` (y los tests de componentes tocados, si aplica) para cubrir comportamiento de mensaje y retry segun tipo de error. _Depende de 11_.
13. Fase 7 - Documentacion y contrato: actualizar documentacion API relevante para reflejar politica final (`admin` global, `user` por participacion, `404` en no acceso) y evitar desalineacion con frontend/e2e. _Paralelo con 9-12, cierra despues de verificar_.

**Relevant files**

- `/Users/victor/Projects/friends-web/apps/backend/src/modules/events/events.controller.ts` - Propagar actor autenticado en endpoints de eventos y KPI.
- `/Users/victor/Projects/friends-web/apps/backend/src/modules/events/events.service.ts` - Filtro por actor, checks de acceso, `404` por no participacion y auto-inclusion en create.
- `/Users/victor/Projects/friends-web/apps/backend/src/modules/transactions/transactions.controller.ts` - Blindar `TransactionsController` con guards y propagar actor en ambos controladores.
- `/Users/victor/Projects/friends-web/apps/backend/src/modules/transactions/transactions.service.ts` - Validacion de acceso por evento para nested y por transaction ID.
- `/Users/victor/Projects/friends-web/apps/backend/src/modules/events/services/event-kpis.service.ts` - Verificar que no exista bypass de acceso en KPI.
- `/Users/victor/Projects/friends-web/apps/backend/src/common/decorators/current-user.decorator.ts` - Nuevo decorador para extraer actor autenticado (si se adopta opcion decorador).
- `/Users/victor/Projects/friends-web/apps/backend/src/common/types/` - Tipo compartido para actor autenticado (nuevo archivo).
- `/Users/victor/Projects/friends-web/apps/backend/test/events.e2e-spec.ts` - Nueva cobertura de visibilidad y operaciones por rol/participacion.
- `/Users/victor/Projects/friends-web/apps/backend/test/transactions.e2e-spec.ts` - Nueva cobertura de acceso nested y por ID, incluyendo `401` y `404` esperados.
- `/Users/victor/Projects/friends-web/apps/frontend/src/pages/EventDetail.tsx` - Manejo UX de `404` de acceso/no encontrado.
- `/Users/victor/Projects/friends-web/apps/frontend/src/features/kpi/components/KPIDetailView.tsx` - Manejo UX de error uniforme para acceso/no encontrado.
- `/Users/victor/Projects/friends-web/apps/frontend/src/features/transactions/components/TransactionsList.tsx` - Manejo UX de error uniforme en lista transacciones.
- `/Users/victor/Projects/friends-web/apps/frontend/src/shared/components/ErrorState.tsx` - Ajuste de API del componente para mensajes/retry contextuales.
- `/Users/victor/Projects/friends-web/apps/frontend/src/shared/components/ErrorState.test.tsx` - Validar comportamiento nuevo de `ErrorState`.
- `/Users/victor/Projects/friends-web/apps/frontend/src/i18n/locales/es/translation.json` - Mensajes de no encontrado/sin acceso (si se introduce nueva key).
- `/Users/victor/Projects/friends-web/apps/frontend/src/i18n/locales/en/translation.json` - Mensajes de no encontrado/sin acceso (si se introduce nueva key).
- `/Users/victor/Projects/friends-web/apps/frontend/src/i18n/locales/ca/translation.json` - Mensajes de no encontrado/sin acceso (si se introduce nueva key).
- `/Users/victor/Projects/friends-web/docs/FRONTEND_API_INTEGRATION.md` - Ajustar contrato de consumo esperado en frontend.

**Verification**

1. Ejecutar backend e2e completo: `pnpm --filter @friends/backend test:e2e`.
2. Validar casos clave manuales con dos usuarios + un admin: `GET /api/events`, `GET/PATCH/DELETE /api/events/:id`, `GET /api/events/:id/kpis`, `GET/POST /api/events/:eventId/transactions`, `GET/PATCH/DELETE /api/transactions/:id`.
3. Confirmar matriz de resultados esperados:
4. `admin` siempre obtiene `200/201/204` cuando el recurso existe.
5. `user` solo obtiene `200/201/204` si participa; en caso contrario `404`.
6. Sin JWT, endpoints protegidos devuelven `401` (incluyendo `/api/transactions/:id`).
7. Verificar regla de create para `user`: aunque no mande su participante, queda incluido en el evento persistido.
8. Verificar regla de autoexclusion permitida: `user` puede quitarse, update responde OK y despues pierde acceso (`404`).
9. Ejecutar pruebas frontend afectadas: `pnpm --filter @friends/frontend test:run`.
10. Probar navegacion frontend real a evento no accesible y confirmar UX (mensaje funcional + sin bucles de retry inutiles).

**Decisions**

- Decidido por producto: no participante recibe `404 Not Found` (no `403`) para evitar filtrado de existencia.
- Decidido por producto: al crear evento, rol `user` se autoanade como participante si falta.
- Decidido por producto: se permite autoexclusion de un `user` en update; tras ello perdera acceso.
- Decidido por producto: alcance incluye backend + ajuste UX frontend.
- Alcance excluido explicitamente: cambios de permisos en `/api/users` y administracion de usuarios fuera del contexto de eventos/transacciones.

**Further Considerations**

1. Recomendado: si el volumen de eventos crece, priorizar filtro por participante en SQL (JSONB) en lugar de filtrar en memoria para `GET /events`.
2. Recomendado: consolidar checks de acceso en helpers internos reutilizables para reducir drift entre `EventsService` y `TransactionsService`.
3. Recomendado: revisar Swagger annotations para que reflejen con precision los nuevos `401/404` por politica de acceso.
