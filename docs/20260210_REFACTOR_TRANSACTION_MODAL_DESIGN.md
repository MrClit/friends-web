# Refactor TransactionModal - Diseño UX/UI Mejorado

**Fecha:** 10 de febrero de 2026  
**Autor:** GitHub Copilot  
**Estado:** ✅ Planificación completada

---

## Tabla de Contenidos

1. [Motivación y Objetivos](#motivación-y-objetivos)
2. [Análisis Comparativo](#análisis-comparativo)
3. [Diseño de la Solución](#diseño-de-la-solución)
4. [Plan de Implementación Detallado](#plan-de-implementación-detallado)
5. [Checklist de Verificación](#checklist-de-verificación)
6. [Testing y Validación](#testing-y-validación)
7. [Referencias](#referencias)

---

## Motivación y Objetivos

### Contexto

Actualmente, `TransactionModal.tsx` utiliza un diseño funcional pero visualmente inconsistente con el diseño UX/UI moderno definido en `modal-transaction.html`. El modal existente no aprovecha completamente los componentes UI reutilizables (`Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter`) utilizados en otros modales como `EventFormModal.tsx`.

### Objetivos

1. **Consistencia Visual**: Adaptar TransactionModal al diseño del archivo HTML de referencia
2. **Reutilización de Componentes**: Usar la estructura de diálogo de EventFormModal (DialogHeader, DialogBody, DialogFooter)
3. **Mejora UX**: Implementar las mejores prácticas de diseño:
   - Espaciado consistente (px-8 pt-8 pb-4 para header)
   - Bordes y separadores visuales
   - Footer con fondo distinguido (bg-slate-50 dark:bg-emerald-900/20)
   - Botones modernos con border-radius más amplio (rounded-2xl)
   - Área de scroll personalizada con custom-scrollbar
4. **Responsive Design**: Mantener funcionalidad en móvil y desktop
5. **Accesibilidad**: Preservar interacciones con teclado y ARIA labels

### Alcance

- ✅ Reestructurar layout del modal
- ✅ Actualizar estilos de inputs y selects
- ✅ Mejorar TransactionTypeSelector con diseño de segmented control
- ✅ Actualizar TransactionForm con nuevos estilos
- ✅ Implementar footer con fondo diferenciado
- ✅ Añadir scroll personalizado en body
- ❌ Cambios en lógica de negocio (fuera de alcance)
- ❌ Modificación de tipos o API (fuera de alcance)

---

## Análisis Comparativo

### Estado Actual (TransactionModal.tsx)

**Estructura:**

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader className="border-b border-slate-200...">
      <h2>Título</h2>
      <DialogCloseButton />
    </DialogHeader>

    <DialogBody className="px-6 py-4">
      <TransactionTypeSelector />
      <TransactionForm />
    </DialogBody>

    <DialogFooter className="px-6 py-4 border-t...">{/* Botón delete inline */}</DialogFooter>
  </DialogContent>
</Dialog>
```

**Problemas identificados:**

1. ❌ DialogContent importado incorrectamente de `@radix-ui/react-dialog` en lugar de `@/shared/components/ui`
2. ❌ Padding inconsistente (px-6 vs px-8 en EventFormModal)
3. ❌ Footer sin fondo diferenciado
4. ❌ Botón de guardar dentro del form (no en footer)
5. ❌ Sin scroll personalizado
6. ❌ TransactionTypeSelector con diseño básico (no segmented control moderno)
7. ❌ Inputs con diseño simple (no rounded-2xl ni iconos)

### Diseño Objetivo (modal-transaction.html)

**Estructura:**

```html
<div class="modal">
  <!-- Header con px-8 pt-8 pb-4 -->
  <header class="px-8 pt-8 pb-4">
    <h3>Añadir Transacción</h3>
    <button>close</button>
  </header>

  <!-- Body con scroll y custom-scrollbar -->
  <div class="overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar">
    <!-- Segmented Control (3 botones) -->
    <div class="segmented-control">...</div>

    <!-- Form fields -->
    <form class="space-y-8">
      <input class="rounded-2xl px-5 py-4" />
      <select class="rounded-2xl pl-12 pr-12 py-4" />
    </form>
  </div>

  <!-- Footer con fondo diferenciado -->
  <footer class="px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-emerald-900/20">
    <button>Cancelar</button>
    <button>Guardar</button>
  </footer>
</div>
```

**Características clave:**

- ✅ Segmented control responsive (colapsa iconos en móvil)
- ✅ Inputs con rounded-2xl, padding generoso (px-5 py-4)
- ✅ Select con iconos (person a la izquierda, arrow abajo a la derecha)
- ✅ Footer con fondo visual (bg-slate-50/50 dark:bg-emerald-900/20)
- ✅ Botones con diseño moderno (rounded-2xl, sombras)
- ✅ Scroll personalizado (custom-scrollbar)
- ✅ Labels con font-bold

### Comparación con EventFormModal.tsx

**Similitudes a replicar:**

```tsx
<DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
  <DialogTitle>{title}</DialogTitle>
  <DialogCloseButton />
</DialogHeader>

<DialogBody>
  {/* Contenido con scroll */}
</DialogBody>

<DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-emerald-900/20 flex items-center justify-end gap-3 border-t border-emerald-100 dark:border-emerald-800/30">
  <DialogCloseButton>{t('cancel')}</DialogCloseButton>
  <DialogPrimaryButton>{t('save')}</DialogPrimaryButton>
</DialogFooter>
```

**Diferencias específicas:**

- EventFormModal: `onInteractOutside` y `onEscapeKeyDown` para ConfirmDialog
- TransactionModal: Delete button debe estar en el footer (no en DialogFooter separado)

---

## Diseño de la Solución

### 3.1. Arquitectura de Componentes

```
TransactionModal (container)
├── Dialog (Radix primitive)
│   └── DialogContent (@/shared/components/ui) ← FIX: import correcto
│       ├── DialogHeader
│       │   ├── DialogTitle
│       │   └── DialogCloseButton
│       ├── DialogBody (scrollable con custom-scrollbar)
│       │   ├── TransactionTypeSelector (refactorizado)
│       │   └── TransactionForm (refactorizado)
│       └── DialogFooter (bg diferenciado)
│           ├── Delete Button (condicional)
│           ├── Cancel Button (DialogCloseButton)
│           └── Save Button (DialogPrimaryButton)
└── ConfirmDialog (delete confirmation)
```

### 3.2. Especificaciones de Diseño

#### Header

```tsx
className = 'px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent';
```

- Padding: `px-8` (horizontal), `pt-8` (top), `pb-4` (bottom)
- Layout: `flex justify-between items-center`
- Border: `border-b border-transparent` (preparado para animación)

#### Body

```tsx
className = 'flex-1 overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar';
```

- Padding: `px-6 sm:px-8` (responsive), `py-2`
- Scroll: `overflow-y-auto` con clase `custom-scrollbar`
- Flex: `flex-1` para ocupar espacio disponible

#### Footer

```tsx
className =
  'px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-emerald-900/20 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 border-t border-emerald-100/50 dark:border-emerald-800/30';
```

- Padding: `px-6 sm:px-8 py-6`
- Background: `bg-slate-50/50 dark:bg-emerald-900/20` (diferenciado)
- Layout: `flex-col-reverse sm:flex-row` (botones stack en móvil)
- Border: `border-t border-emerald-100/50 dark:border-emerald-800/30`

### 3.3. Componente TransactionTypeSelector

**Diseño Actual:**

```tsx
<div className="flex w-full bg-teal-50 dark:bg-teal-800 rounded-full p-1">
  <button className="flex-1 flex items-center justify-center gap-2 px-2 py-2">
    <Icon />
    <span>Label</span>
  </button>
</div>
```

**Diseño Objetivo (Segmented Control):**

```tsx
<div className="segmented-control">
  <button className="segmented-control-item active">
    <span className="material-symbols-outlined">icon</span>
    <span>Label</span>
  </button>
</div>
```

**CSS Classes:**

```css
.segmented-control {
  @apply flex p-1.5 bg-slate-100/80 dark:bg-emerald-900/40 rounded-2xl w-full max-w-md mx-auto;
}

.segmented-control-item {
  @apply flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300;
  flex: 1 1 0%;
}

.segmented-control-item.active {
  @apply bg-brand-vibrant text-white shadow-lg shadow-brand-vibrant/20 ring-1 ring-white/10;
}

/* Responsive: colapsar a iconos en móvil */
@media (max-width: 640px) {
  .segmented-control-item:not(.active) {
    flex: 0 0 56px;
    @apply px-0;
  }
  .segmented-control-item:not(.active) span:not(.icon) {
    display: none;
  }
}
```

**Implementación React:**

- Usar Tailwind classes en lugar de CSS custom
- Variante móvil: ocultar texto en botones no activos
- Animaciones con `transition-all duration-300`
- Colores: `bg-emerald-500` (teal en su lugar) para active

### 3.4. Componente TransactionForm

**Inputs:**

```tsx
<input
  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-brand-vibrant focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
  placeholder="Ej. Cena en el puerto"
/>
```

**Select con iconos:**

```tsx
<div className="relative group">
  {/* Icon izquierdo */}
  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
    <span className="material-symbols-outlined text-[22px]">person</span>
  </div>

  <select className="w-full pl-12 pr-12 py-4 rounded-2xl... appearance-none">
    <option>...</option>
  </select>

  {/* Icon derecho (arrow) */}
  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
    <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
  </div>
</div>
```

**Labels:**

```tsx
<label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">{t('label')}</label>
```

### 3.5. Estilos Globales

**Custom Scrollbar (añadir a index.css):**

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-emerald-200 dark:bg-emerald-800 rounded-full;
}
```

### 3.6. Gestión de Estado del Delete

**Problema:** Footer único con delete button condicional

**Solución:**

```tsx
<DialogFooter>
  <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
    {transaction && (
      <button
        onClick={handleDelete}
        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white"
      >
        {t('delete')}
      </button>
    )}
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:ml-auto">
      <DialogCloseButton>{t('cancel')}</DialogCloseButton>
      <DialogPrimaryButton form="transaction-form">{t('save')}</DialogPrimaryButton>
    </div>
  </div>
</DialogFooter>
```

---

## Plan de Implementación Detallado

### Fase 1: Preparación (Estilos Globales)

#### Task 1.1: Añadir custom-scrollbar a index.css

**Archivo:** `apps/frontend/src/index.css`

```css
/* Añadir al final del archivo */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-emerald-200 dark:bg-emerald-800 rounded-full;
}
```

### Fase 2: Refactor de TransactionTypeSelector

#### Task 2.1: Actualizar diseño del selector

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionTypeSelector.tsx`

**Cambios:**

1. Contenedor: cambiar de `rounded-full` a `rounded-2xl`, padding de `p-1` a `p-1.5`
2. Background: `bg-slate-100/80 dark:bg-emerald-900/40` (en lugar de teal-50/800)
3. Botones: `rounded-xl` (en lugar de rounded-full), `py-3 px-4` (en lugar de py-2 px-2)
4. Active state: `bg-emerald-500` con shadow-lg
5. Agregar responsive: ocultar texto en botones no activos en móvil

**Código objetivo:**

```tsx
<div className="flex p-1.5 bg-slate-100/80 dark:bg-emerald-900/40 rounded-2xl w-full max-w-md mx-auto">
  {PAYMENT_TYPES.map((type) => {
    const config = PAYMENT_TYPE_CONFIG[type];
    const IconComponent = config.IconComponent;
    const isActive = value === type;

    return (
      <button
        key={type}
        className={cn(
          'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300',
          'flex-1',
          isActive && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/10',
          !isActive &&
            'text-slate-500 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-white hover:bg-white/50 dark:hover:bg-emerald-800/30',
        )}
        onClick={() => onChange(type)}
        type="button"
      >
        <IconComponent className="text-base" />
        <span className={cn(!isActive && 'hidden sm:inline')}>{t(`transactionTypeSelector.${type}`)}</span>
      </button>
    );
  })}
</div>
```

### Fase 3: Refactor de TransactionForm

#### Task 3.1: Actualizar estilos de inputs

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionForm.tsx`

**Cambios:**

1. Labels: añadir `font-bold`, cambiar a `text-slate-700 dark:text-emerald-100`
2. Inputs: cambiar a `rounded-2xl`, padding `px-5 py-4`, nuevo esquema de colores
3. Select: añadir iconos (FaUser a la izquierda, arrow abajo a la derecha)
4. Remover botón de submit (moverlo al footer del modal)
5. Añadir `id="transaction-form"` al form para el botón externo

**Código objetivo (estructura):**

```tsx
<form id="transaction-form" className="space-y-8 pb-6" onSubmit={onSubmit}>
  {/* Title input */}
  <div className="space-y-2">
    <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
      {t('transactionForm.titleLabel')}
    </label>
    <input
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
      placeholder={t('transactionForm.titlePlaceholder')}
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />
  </div>

  {/* Amount + Date grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {/* Amount input con € symbol */}
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
        {t('transactionForm.amountLabel')}
      </label>
      <div className="relative">
        <input
          className="w-full pl-5 pr-12 py-4 rounded-2xl..."
          placeholder="0,00"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
      </div>
    </div>

    {/* Date input */}
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
        {t('transactionForm.dateLabel')}
      </label>
      <input
        className="w-full px-5 py-4 rounded-2xl..."
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
    </div>
  </div>

  {/* Participant select con iconos */}
  <div className="space-y-2">
    <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
      {t(`transactionForm.participantLabel.${type}`)}
    </label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
        <FaUser className="text-[18px]" />
      </div>
      <select
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white font-medium appearance-none cursor-pointer"
        value={from}
        onChange={(e) => setParticipantId(e.target.value)}
        required
      >
        <option value="" disabled>
          {t('transactionForm.participantPlaceholder')}
        </option>
        {type === 'expense' && <option value={POT_PARTICIPANT_ID}>{t('transactionForm.potOption')}</option>}
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <FaChevronDown className="text-[14px]" />
      </div>
    </div>
  </div>
</form>
```

#### Task 3.2: Añadir traducciones

**Archivo:** `apps/frontend/src/i18n/locales/*/translation.json`

```json
{
  "transactionForm": {
    "titlePlaceholder": "Ej. Cena en el puerto"
  }
}
```

### Fase 4: Refactor de TransactionModal

#### Task 4.1: Corregir import de DialogContent

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionModal.tsx`

```tsx
// ANTES (incorrecto)
import { DialogContent } from '@radix-ui/react-dialog';

// DESPUÉS (correcto)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
  DialogPrimaryButton,
} from '@/shared/components/ui';
```

#### Task 4.2: Reestructurar el layout

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionModal.tsx`

**Nueva estructura:**

```tsx
<Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
  <DialogContent>
    {/* Header */}
    <DialogHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-transparent">
      <DialogTitle>{transaction ? t('transactionModal.editTitle') : t('transactionModal.addTitle')}</DialogTitle>
      <DialogCloseButton
        onClick={closeModal}
        disabled={createTransaction.isPending || updateTransaction.isPending}
        aria-label={t('common.close')}
      />
    </DialogHeader>

    {/* Body con scroll */}
    <DialogBody className="flex-1 overflow-y-auto px-6 sm:px-8 py-2 custom-scrollbar">
      <div className="space-y-8 pb-6">
        {/* TransactionTypeSelector */}
        <div className="flex justify-center">
          <TransactionTypeSelector value={type} onChange={setType} />
        </div>

        {/* TransactionForm (sin botón submit) */}
        <TransactionForm
          type={type}
          title={title}
          setTitle={setTitle}
          amount={amount}
          setAmount={setAmount}
          date={date}
          setDate={setDate}
          from={participantId}
          setParticipantId={setParticipantId}
          participants={event.participants}
          onSubmit={handleSubmit}
        />
      </div>
    </DialogBody>

    {/* Footer con botones */}
    <DialogFooter className="px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-emerald-900/20 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 border-t border-emerald-100/50 dark:border-emerald-800/30">
      {/* Delete button (condicional) */}
      {transaction && (
        <button
          onClick={handleDelete}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95"
          disabled={deleteTransaction.isPending}
        >
          {deleteTransaction.isPending ? t('transactionModal.deleting') : t('transactionModal.delete')}
        </button>
      )}

      {/* Spacer para empujar botones a la derecha en desktop */}
      {transaction && <div className="hidden sm:block sm:flex-1" />}

      {/* Cancel + Save */}
      <DialogCloseButton
        onClick={closeModal}
        disabled={createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending}
        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-500 dark:text-emerald-300 hover:bg-slate-200/50 dark:hover:bg-emerald-800/50 transition-colors"
      >
        {t('transactionModal.cancel')}
      </DialogCloseButton>

      <DialogPrimaryButton
        form="transaction-form"
        type="submit"
        disabled={
          !title || !amount || !date || !participantId || createTransaction.isPending || updateTransaction.isPending
        }
        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 sm:px-12 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
      >
        {createTransaction.isPending || updateTransaction.isPending
          ? t('transactionModal.saving')
          : t('transactionModal.save')}
      </DialogPrimaryButton>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Task 4.3: Añadir traducciones para loading states

**Archivo:** `apps/frontend/src/i18n/locales/*/translation.json`

```json
{
  "transactionModal": {
    "saving": "Guardando...",
    "deleting": "Eliminando..."
  }
}
```

### Fase 5: Verificación de Componentes UI

#### Task 5.1: Verificar DialogPrimaryButton existe

**Archivo:** `apps/frontend/src/shared/components/ui/dialog.tsx`

Si no existe, crear componente:

```tsx
const DialogPrimaryButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl px-6 py-3.5 font-bold',
        'bg-emerald-500 hover:bg-emerald-600 text-white',
        'shadow-lg shadow-emerald-500/25',
        'transition-all active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-emerald-400',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
);
DialogPrimaryButton.displayName = 'DialogPrimaryButton';
```

Y exportar:

```tsx
export { DialogPrimaryButton };
```

---

## Checklist de Verificación

### Diseño Visual

- [ ] Header con padding `px-8 pt-8 pb-4`
- [ ] DialogTitle con tamaño `text-2xl font-extrabold`
- [ ] DialogCloseButton alineado a la derecha
- [ ] Body con `overflow-y-auto` y clase `custom-scrollbar`
- [ ] Footer con fondo `bg-slate-50/50 dark:bg-emerald-900/20`
- [ ] Border top en footer con color emerald
- [ ] Botones con `rounded-2xl`

### TransactionTypeSelector

- [ ] Contenedor con `rounded-2xl` y `max-w-md mx-auto`
- [ ] Background `bg-slate-100/80 dark:bg-emerald-900/40`
- [ ] Botón activo con `bg-emerald-500` y shadow
- [ ] Texto oculto en botones no activos en móvil (`hidden sm:inline`)
- [ ] Transiciones suaves (`transition-all duration-300`)

### TransactionForm

- [ ] Labels con `font-bold text-sm`
- [ ] Inputs con `rounded-2xl px-5 py-4`
- [ ] Input de amount con símbolo € a la derecha
- [ ] Grid responsive para amount + date (`grid-cols-1 sm:grid-cols-2`)
- [ ] Select con icono FaUser a la izquierda
- [ ] Select con icono FaChevronDown a la derecha
- [ ] Select con `appearance-none` para ocultar arrow nativo
- [ ] Form sin botón submit (removido)
- [ ] Form con `id="transaction-form"`

### TransactionModal

- [ ] Import correcto de DialogContent desde `@/shared/components/ui`
- [ ] DialogBody con clase `custom-scrollbar`
- [ ] Footer con layout responsive (`flex-col-reverse sm:flex-row`)
- [ ] Delete button condicional (solo en edit mode)
- [ ] Delete button con estilo rojo (`bg-red-500 hover:bg-red-600`)
- [ ] Cancel y Save buttons con estilos correctos
- [ ] DialogPrimaryButton con `form="transaction-form"`
- [ ] Loading states en botones (saving, deleting)
- [ ] Disabled states correctos en todos los botones

### Accesibilidad

- [ ] DialogCloseButton con `aria-label={t('common.close')}`
- [ ] Botones con estados disabled visuales
- [ ] Focus ring en todos los inputs y botones
- [ ] Labels asociados correctamente con inputs

### Responsive Design

- [ ] Padding responsive (`px-6 sm:px-8`)
- [ ] Grid responsive en form
- [ ] Botones stack en móvil, row en desktop
- [ ] TransactionTypeSelector colapsa iconos en móvil
- [ ] Botones full width en móvil, auto en desktop

### Funcionalidad

- [ ] Modal se abre y cierra correctamente
- [ ] Type selector cambia el estado
- [ ] Form submit funciona con botón externo
- [ ] Delete confirmation se muestra correctamente
- [ ] Validación de campos requeridos funciona
- [ ] Loading states durante mutations
- [ ] Error handling preservado

---

## Testing y Validación

### Test Manual

#### Escenario 1: Crear Nueva Transacción

1. Abrir modal (botón "Añadir Transacción")
2. Verificar título "Añadir Transacción"
3. Selector de tipo debe mostrar "Contribución" activo por defecto
4. Cambiar a "Gasto" → verificar label cambia de "Recibido de" a "Pagado por"
5. Llenar todos los campos
6. Click en "Guardar" → debe crear la transacción
7. Modal debe cerrarse

#### Escenario 2: Editar Transacción Existente

1. Click en transacción existente
2. Verificar título "Editar Transacción"
3. Verificar campos pre-llenados
4. Modificar algún campo
5. Click en "Guardar" → debe actualizar
6. Modal debe cerrarse

#### Escenario 3: Eliminar Transacción

1. Abrir modal de edición
2. Verificar botón "Eliminar" visible
3. Click en "Eliminar"
4. Verificar ConfirmDialog se abre
5. Confirmar eliminación
6. Modal debe cerrarse

#### Escenario 4: Responsive

1. Abrir modal en viewport móvil (< 640px)
2. Verificar TransactionTypeSelector solo muestra iconos en botones no activos
3. Verificar botones stack verticalmente
4. Verificar grid de amount+date colapsa a columna única

#### Escenario 5: Dark Mode

1. Activar dark mode
2. Verificar colores de fondo (emerald-950, emerald-900/20)
3. Verificar texto blanco/emerald-100
4. Verificar borders emerald-800
5. Verificar scrollbar color

#### Escenario 6: Accesibilidad

1. Navegar con Tab entre campos
2. Verificar focus ring visible
3. Cerrar modal con Escape
4. Verificar screen reader labels

### Tests Automatizados (Vitest)

**Archivo:** `apps/frontend/src/features/transactions/components/TransactionModal.test.tsx`

```typescript
describe('TransactionModal', () => {
  it('should render with correct styles', () => {
    // Verificar classes CSS aplicadas
  });

  it('should show delete button only in edit mode', () => {
    // Verificar botón delete condicional
  });

  it('should submit form with external button', () => {
    // Verificar submit con form="transaction-form"
  });

  it('should display loading states during mutations', () => {
    // Verificar "Guardando..." y "Eliminando..."
  });

  it('should be responsive', () => {
    // Verificar responsive breakpoints
  });
});
```

### Criterios de Aceptación

✅ **Visual:**

- Modal tiene diseño moderno con bordes redondeados y espaciado generoso
- Colores consistentes con design system (emerald/teal, slate)
- Footer con fondo diferenciado
- Scroll personalizado con thumb visible

✅ **UX:**

- Transiciones suaves en todos los estados
- Feedback visual en hover y focus
- Loading states claros
- Botones deshabilitados durante operaciones asíncronas

✅ **Responsive:**

- Layout se adapta a móvil y desktop
- Botones stack en móvil
- TransactionTypeSelector colapsa iconos en móvil

✅ **Funcionalidad:**

- Todas las operaciones CRUD funcionan
- Validación de campos
- ConfirmDialog para delete
- Cierre con Escape y click fuera

---

## Referencias

### Archivos de Diseño

- [modal-transaction.html](../designs/modal-transaction.html) - Diseño UX/UI objetivo
- [EventFormModal.tsx](../../apps/frontend/src/features/events/components/EventFormModal.tsx) - Patrón de estructura

### Componentes Reutilizables

- [dialog.tsx](../../apps/frontend/src/shared/components/ui/dialog.tsx) - Primitivas de Dialog
- [ConfirmDialog.tsx](../../apps/frontend/src/shared/components/ConfirmDialog.tsx) - Diálogo de confirmación

### Documentos Relacionados

- [FRONTEND_ARCHITECTURE_REFACTOR.md](./20260117_FRONTEND_ARCHITECTURE_REFACTOR.md) - Arquitectura general
- [REFACTOR_TRANSACTION_TYPES_CONSTANTS.md](./REFACTOR_TRANSACTION_TYPES_CONSTANTS.md) - Tipos de transacciones

### Tecnologías

- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) - Primitivas accesibles
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility classes
- [React Hook Form](https://react-hook-form.com/) - (no usado actualmente, consideración futura)

---

## Motivación de la Estructura del Documento

Este documento sigue la estructura estándar definida en las instrucciones de Copilot para planes de refactor porque:

1. **Navegabilidad**: TOC y anchors permiten saltar a secciones específicas
2. **Contexto completo**: Motivación y análisis comparativo establecen el "por qué"
3. **Guía paso a paso**: Plan de implementación detallado es ejecutable sin ambigüedad
4. **Verificación**: Checklist granular asegura que nada se olvide
5. **Reproducibilidad**: Cualquier LLM o desarrollador puede implementar sin contexto adicional
6. **Trazabilidad**: Referencias permiten volver a la fuente de verdad

Este nivel de detalle maximiza la eficiencia de implementación y minimiza errores, siguiendo las mejores prácticas de documentación técnica establecidas en el proyecto.

---

**Estado:** ✅ Documento completado - Listo para implementación  
**Próximo paso:** Implementar Fase 1 (Estilos globales)
