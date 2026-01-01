# Refactor: Event Detail Page Componentization

## Estado: ✅ COMPLETADO

Refactor completado exitosamente el 29 de diciembre de 2025.

## Objetivo
Refactorizar el componente `EventDetail` para mejorar la legibilidad, mantenibilidad y reutilización de código, siguiendo el patrón establecido en `KPIDetail`.

## Estado Inicial (Antes del Refactor)

### Estructura del componente EventDetail
- **Líneas de código**: ~128 líneas
- **Responsabilidades**: 
  - Gestión de estado de 3 modales (edit, delete, add transaction)
  - Cálculo de 4 KPIs
  - Renderizado de header con navegación
  - Renderizado de grid de KPIs
  - Renderizado de lista de transacciones
  - Gestión de navegación a detalles de KPI
  - Handlers de eventos (edit, delete, submit)

### Problemas Identificados
1. **Componente monolítico**: Mezcla lógica de presentación con gestión de estado
2. **Código repetitivo**: Los 4 KPIBox son casi idénticos con diferentes props
3. **Falta de reutilización**: El header podría reutilizarse en otras páginas de eventos
4. **Inconsistencia**: KPIDetail ya usa componentes separados (KPIDetailHeader, etc.)
5. **Dificulta testing**: Componente grande con múltiples responsabilidades

---

## Resultado Final

### EventDetail (Post-Refactor)
- **Líneas de código**: ~95 líneas (**26% reducción**)
- **Responsabilidades** (simplificadas):
  - Orquestación de componentes
  - Gestión de estado de modales
  - Cálculo de KPIs (usando stores)
  - Handlers de eventos

### Componentes Nuevos Creados

#### 1. EventDetailHeader (`src/features/events/components/EventDetailHeader.tsx`)
- **35 líneas**
- **Responsabilidad**: Header con navegación, título y menú contextual
- **Reutilizable**: Sí
- **Props**: `eventId`, `eventTitle`, `onBack`, `onEdit`, `onDelete`

#### 2. EventKPIGrid (`src/features/events/components/EventKPIGrid.tsx`)
- **66 líneas**
- **Responsabilidad**: Grid de 4 KPIs con navegación a detalles
- **Configuración centralizada**: `KPI_CONFIG` array
- **Props**: `eventId`, `potBalance`, `totalContributions`, `totalExpenses`, `pendingToCompensate`

### Archivos Modificados
1. ✅ `src/pages/EventDetail.tsx` - Refactorizado
2. ✅ `src/features/events/components/index.ts` - Exports añadidos
3. ✅ `src/features/events/index.ts` - Re-exports añadidos

### Mejoras Conseguidas
- ✅ **Código más limpio**: 26% menos líneas en EventDetail
- ✅ **Separación de responsabilidades**: Presentación vs. Lógica
- ✅ **Componentes reutilizables**: Header y Grid pueden usarse en otras vistas
- ✅ **Configuración centralizada**: KPI_CONFIG evita duplicación
- ✅ **Consistencia**: Mismo patrón que KPIDetail
- ✅ **Mejor testabilidad**: Componentes pequeños y enfocados
- ✅ **Imports limpios**: Uso de barrel exports `@/features/events`

## Estructura Propuesta

### 1. EventDetailHeader
**Ubicación**: `src/features/events/components/EventDetailHeader.tsx`

**Responsabilidades**:
- Botón de navegación hacia atrás
- Título del evento
- Menú contextual (editar/eliminar)

**Props**:
```typescript
interface EventDetailHeaderProps {
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Inspiración**: Similar a `KPIDetailHeader` pero incluye el menú contextual

---

### 2. EventKPIGrid
**Ubicación**: `src/features/events/components/EventKPIGrid.tsx`

**Responsabilidades**:
- Renderizar el grid de 4 KPIs
- Gestionar la navegación a detalles de KPI
- Usar traducción internacionalizada

**Props**:
```typescript
interface EventKPIGridProps {
  eventId: string;
  potBalance: number;
  totalContributions: number;
  totalExpenses: number;
  pendingToCompensate: number;
}
```

**Implementación interna**:
- Usa `useNavigate()` para navegación a `/event/:id/kpi/:kpiType`
- Usa `useTranslation()` para labels
- Renderiza 4 `KPIBox` con las props correspondientes

---

### 3. EventDetail (Refactorizado)
**Ubicación**: `src/pages/EventDetail.tsx`

**Responsabilidades** (reducidas):
- Orquestación de componentes
- Gestión de estado de modales (edit, delete, add transaction)
- Cálculo de KPIs usando los hooks de store
- Handlers de eventos (submit, confirm, cancel)

**Estructura final** (~50-60 líneas):
```tsx
export default function EventDetail() {
  // 1. Hooks y estado
  const { id } = useParams();
  const navigate = useNavigate();
  const event = useEventsStore(...);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  
  // 2. Cálculo de KPIs
  const totalExpenses = getTotalExpensesByEvent(event.id);
  // ... otros KPIs
  
  // 3. Handlers
  const handleEditSubmit = (...) => { ... };
  const handleBack = () => navigate('/');
  
  // 4. Renderizado
  return (
    <div className="...">
      <EventDetailHeader 
        eventId={event.id}
        eventTitle={event.title}
        onBack={handleBack}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />
      
      <EventKPIGrid 
        eventId={event.id}
        potBalance={potBalance}
        totalContributions={totalContributions}
        totalExpenses={totalExpenses}
        pendingToCompensate={pendingToCompensate}
      />
      
      <TransactionsList event={event} />
      
      <FloatingActionButton ... />
      
      {/* Modales */}
      <EventFormModal ... />
      <TransactionModal ... />
      <ConfirmDialog ... />
    </div>
  );
}
```

---

## Plan de Implementación

### Fase 1: Crear EventDetailHeader
1. Crear archivo `src/features/events/components/EventDetailHeader.tsx`
2. Extraer JSX del header desde EventDetail
3. Definir interface `EventDetailHeaderProps`
4. Implementar componente con props
5. Exportar desde `src/features/events/components/index.ts`
6. Añadir re-export en `src/features/events/index.ts`

**Consideraciones**:
- Usar `MdArrowBack` de react-icons
- Importar `EventContextMenu` del mismo feature
- Mantener estilos existentes (gradient backgrounds, responsive)

---

### Fase 2: Crear EventKPIGrid
1. Crear archivo `src/features/events/components/EventKPIGrid.tsx`
2. Extraer lógica del grid de KPIs desde EventDetail
3. Definir interface `EventKPIGridProps`
4. Implementar componente con:
   - `useNavigate()` para navegación
   - `useTranslation()` para i18n
   - Grid responsive (2 cols en mobile, 4 en desktop)
5. Exportar desde `src/features/events/components/index.ts`
6. Añadir re-export en `src/features/events/index.ts`

**Configuración de KPIs**:
```typescript
const KPI_CONFIG = [
  {
    key: 'balance',
    labelKey: 'eventDetail.kpi.pot',
    valueKey: 'potBalance',
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  // ... otros 3 KPIs
];
```

---

### Fase 3: Refactorizar EventDetail
1. Importar nuevos componentes: `EventDetailHeader`, `EventKPIGrid`
2. Eliminar TODO comment (línea 18)
3. Reemplazar JSX del header por `<EventDetailHeader />`
4. Reemplazar JSX del grid por `<EventKPIGrid />`
5. Crear handler `handleBack` para navegación
6. Pasar props correctas a cada componente
7. Mantener modales y FAB en el componente principal

**Imports finales**:
```typescript
import { EventDetailHeader, EventKPIGrid } from '@/features/events';
```

---

### Fase 4: Testing (Opcional pero Recomendado)
1. Crear `EventDetailHeader.test.tsx`
   - Test: Renderiza título correctamente
   - Test: Llama onBack al hacer click en botón
   - Test: Abre menú contextual
2. Crear `EventKPIGrid.test.tsx`
   - Test: Renderiza 4 KPIBox
   - Test: Navega correctamente al hacer click
   - Test: Usa traducciones correctas

---

## Traducciones Necesarias

### Verificar existencia en los 3 idiomas (es, en, ca)
- `eventDetail.kpi.pot`
- `eventDetail.kpi.contributions`
- `eventDetail.kpi.expenses`
- `eventDetail.kpi.pending`

**Acción**: Verificar que ya existen (probablemente sí). Si no, añadir.

---

## Beneficios Esperados

### Mantenibilidad
- Componentes más pequeños y enfocados
- Más fácil de entender y modificar
- Mejor separación de responsabilidades

### Reutilización
- `EventDetailHeader` puede usarse en otras páginas de eventos
- `EventKPIGrid` puede reutilizarse si se añaden vistas de KPIs

### Consistencia
- Patrón similar a `KPIDetail` (ya implementado)
- Estructura predecible para nuevos componentes

### Testing
- Componentes más pequeños = tests más simples
- Cada componente testeable de forma aislada
- Mocks más sencillos

### Performance (minor)
- React puede re-renderizar secciones específicas
- Menor re-renderizado si solo cambia el estado de modales

---

## Checklist de Implementación

- [x] Fase 1: Crear EventDetailHeader
  - [x] Crear componente
  - [x] Definir props interface
  - [x] Exportar desde barrel exports
  - [ ] (Opcional) Crear tests
- [x] Fase 2: Crear EventKPIGrid
  - [x] Crear componente
  - [x] Definir props interface
  - [x] Implementar configuración de KPIs
  - [x] Exportar desde barrel exports
  - [ ] (Opcional) Crear tests
- [x] Fase 3: Refactorizar EventDetail
  - [x] Importar nuevos componentes
  - [x] Reemplazar JSX por componentes
  - [x] Eliminar código duplicado
  - [x] Eliminar TODO comment
- [x] Fase 4: Verificación
  - [x] App funciona sin errores
  - [x] Navegación funciona correctamente
  - [x] Modales abren/cierran correctamente
  - [x] KPIs muestran valores correctos
  - [x] Responsive design se mantiene
  - [x] Dark mode funciona
  - [x] Traducciones funcionan en los 3 idiomas

---

## Notas Adicionales

### ¿Por qué no componentizar los modales?
Los modales gestionan estado específico de la página (`open/close`) y callbacks que son únicos para EventDetail. Mantenerlos en el componente principal simplifica la gestión de estado y evita prop drilling innecesario.

### Patrón de exportación
Seguir el patrón del proyecto:
1. Exportar desde `components/index.ts`
2. Re-exportar desde feature `index.ts`
3. Importar usando alias: `import { Component } from '@/features/events'`

### Estilos
Mantener todos los estilos existentes (Tailwind classes) para evitar regresiones visuales.

---

## Referencias
- KPI Detail refactor: `docs/REFACTOR_KPI_DETAIL.md`
- KPI components: `src/features/kpi/components/`
- Events feature structure: `src/features/events/`

---

## Resultados de la Implementación

### Archivos Creados
```
src/features/events/components/
  ├─ EventDetailHeader.tsx   (35 líneas)
  └─ EventKPIGrid.tsx        (66 líneas)
```

### Reducción de Complejidad
- **Antes**: 1 archivo de 128 líneas
- **Después**: 3 archivos especializados (95 + 35 + 66 = 196 líneas totales)
- **EventDetail**: 128 → 95 líneas (-26%)
- **Beneficio**: Aunque hay más líneas totales, cada componente es más simple, testeable y reutilizable

### Verificación Funcional Completada
- ✅ Navegación: Back button y drill-down a KPI details funcional
- ✅ Modales: Edit, delete y add transaction abren/cierran correctamente
- ✅ KPIs: Valores calculados y mostrados correctamente
- ✅ Responsive: Grid 2x2 en mobile, 1x4 en desktop
- ✅ Dark mode: Estilos adaptados correctamente
- ✅ i18n: Traducciones en español, inglés y catalán funcionando
- ✅ TypeScript: Sin errores de compilación

### Lecciones Aprendidas
1. **Configuración centralizada** (`KPI_CONFIG`) elimina código repetitivo elegantemente
2. **Barrel exports** mejoran la experiencia de desarrollo con imports limpios
3. **Patrón de composición** facilita testing unitario de cada componente
4. **Separar presentación de lógica** hace el código más predecible y mantenible

### Próximos Pasos Sugeridos (Opcional)
- [ ] Crear tests unitarios para `EventDetailHeader`
- [ ] Crear tests unitarios para `EventKPIGrid`
- [ ] Considerar extraer modales a un componente `EventModals` si se reutilizan
- [ ] Documentar componentes con Storybook (si se añade en el futuro)
