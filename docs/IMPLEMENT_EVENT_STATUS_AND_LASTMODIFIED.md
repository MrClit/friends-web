# Implementación: `Event.status` + `lastModified` calculado

Fecha: 2026-02-19

## Resumen

- Añadir `status` al modelo `Event` (`active` | `archived`).
- Devolver un campo `lastModified` calculado en lectura como el mayor entre `events.updated_at` y `MAX(transactions.updated_at)`.

## Índice

1. [Motivación](#1-motivación)
2. [Análisis de la situación actual](#2-análisis-de-la-situación-actual)
3. [Cambios backend (detallado)](#3-cambios-backend-detallado)
4. [Cambios frontend (detallado)](#4-cambios-frontend-detallado)
5. [Migraciones y comandos](#5-migraciones-y-comandos)
6. [Tests y validación](#6-tests-y-validación)
7. [Checklist de entrega](#7-checklist-de-entrega)
8. [Consideraciones de performance](#8-consideraciones-de-performance)

---

## 1. Motivación

**Objetivos:**

- Permitir a los usuarios **archivar eventos** sin eliminarlos, manteniendo el historial de transacciones.
- Mostrar la **fecha de última modificación real** de un evento, considerando tanto cambios al evento mismo como a cualquiera de sus transacciones relacionadas.
- Mejorar la UX mostrando el estado visual del evento (activo/archivado) en las tarjetas de eventos.

**Casos de uso:**

- Usuario completa un viaje y quiere archivarlo sin perder el historial.
- Usuario ve en la lista cuándo fue el último movimiento en cada evento (útil para identificar eventos activos vs. inactivos).
- Sistema puede filtrar eventos activos por defecto en la vista principal.

---

## 2. Análisis de la situación actual

### Backend

**Entidad Event actual:**

- ✅ Tiene `@UpdateDateColumn` (`updatedAt`) que se actualiza automáticamente al modificar el evento.
- ❌ **NO tiene campo `status`** → necesita añadirse.
- ❌ **NO calcula `lastModified`** considerando transacciones → necesita implementarse.

**Entidad Transaction actual:**

- ❌ **NO tiene `@UpdateDateColumn`** → necesita añadirse para rastrear modificaciones de transacciones.
- ✅ Tiene `@CreateDateColumn` (`createdAt`).
- ✅ Tiene relación `@ManyToOne` con Event.

**DTOs actuales:**

- `CreateEventDto` y `UpdateEventDto` **NO exponen `status`** → necesitan actualizarse.
- **NO hay DTO de respuesta** específico que exponga `lastModified` → necesita crearse o extender entity.

**Service actual:**

- `findAll()` y `findOne()` devuelven entities directamente sin cálculo de `lastModified`.
- Usa `enrichParticipants()` para enriquecer datos de usuarios → mismo patrón puede aplicarse para `lastModified`.

**Controller actual:**

- Expone endpoints estándar CRUD sin query params para filtrar por status.

### Frontend

**Tipos actuales (`apps/frontend/src/api/types.ts`):**

- Interface `Event` **NO incluye `status`** ni `lastModified` → necesitan añadirse.

**EventCard component:**

- ✅ Ya acepta `status?: 'active' | 'archived'` y `lastModified?: string | null` en props.
- ✅ Tiene `statusConfig` definido pero comentado con TODO.
- ❌ **NO formatea `lastModified`** correctamente → necesita usar helper de formateo.

**API client y hooks:**

- `eventsApi` devuelve `Event[]` y `Event` sin transformación de `lastModified`.
- `useEvents` y `useEvent` no requieren cambios (consumen tipos actualizados).

---

## 3. Cambios backend (paso a paso)

### 3.1. Añadir `@UpdateDateColumn` a Transaction entity

**Archivo:** `apps/backend/src/modules/transactions/entities/transaction.entity.ts`

**Cambios:**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

export type PaymentType = 'contribution' | 'expense' | 'compensation';

@Entity('transactions')
export class Transaction {
  // ... existing fields

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Motivación:** Rastrear cuándo se modificó una transacción para calcular `lastModified` del evento.

---

### 3.2. Añadir enum `EventStatus` y columna `status` a Event entity

**Archivo:** `apps/backend/src/modules/events/entities/event.entity.ts`

**Cambios:**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum EventStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// ... existing participant interfaces

@Entity('events')
export class Event {
  // ... existing fields

  @ApiProperty({
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    description: 'Event status: active or archived',
  })
  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.ACTIVE,
  })
  status: EventStatus;

  @Column('jsonb')
  participants: EventParticipant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.event, {
    cascade: true,
  })
  transactions: Transaction[];

  // Virtual field (not persisted, computed on read)
  lastModified?: Date;
}
```

**Notas:**

- `status` con valor por defecto `ACTIVE`.
- `lastModified` es campo virtual (no se persiste en DB).
- Añadir `@ApiProperty` para documentación Swagger.

---

### 3.3. Actualizar DTOs para incluir `status`

**Archivo:** `apps/backend/src/modules/events/dto/create-event.dto.ts`

**Cambios:**

```typescript
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title', example: 'Trip to Barcelona' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Summer vacation 2026' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Event icon identifier', example: 'beach' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.ACTIVE,
    description: 'Event status',
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ description: 'Array of event participants', isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  participants: any[];
}
```

**Archivo:** `apps/backend/src/modules/events/dto/update-event.dto.ts`

Ya extiende `PartialType(CreateEventDto)`, por lo que `status` será automáticamente opcional. No requiere cambios adicionales.

---

### 3.4. Implementar cálculo de `lastModified` en `EventsService`

**Archivo:** `apps/backend/src/modules/events/events.service.ts`

#### 3.4.1. Método privado para calcular `lastModified`

Añadir método después de `enrichParticipants`:

```typescript
/**
 * Calculate lastModified for event(s) as the greatest between event.updatedAt and max(transactions.updatedAt)
 * Works with one or multiple events, batching database queries for efficiency
 * @param events - Event or array of events to calculate lastModified
 */
private async calculateLastModified(events: Event | Event[]): Promise<void> {
  const eventArray = Array.isArray(events) ? events : [events];
  if (eventArray.length === 0) return;

  try {
    // For single event, use direct query
    if (eventArray.length === 1) {
      const event = eventArray[0];
      const result = await this.eventRepository
        .createQueryBuilder('event')
        .leftJoin('event.transactions', 'tx')
        .where('event.id = :id', { id: event.id })
        .select('GREATEST(event.updated_at, COALESCE(MAX(tx.updated_at), event.updated_at))', 'lastModified')
        .groupBy('event.id')
        .getRawOne();

      event.lastModified = result?.lastModified ? new Date(result.lastModified) : event.updatedAt;
      return;
    }

    // For multiple events, batch query with IN clause
    const eventIds = eventArray.map((e) => e.id);
    const results = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoin('event.transactions', 'tx')
      .where('event.id IN (:...ids)', { ids: eventIds })
      .select('event.id', 'eventId')
      .addSelect('GREATEST(event.updated_at, COALESCE(MAX(tx.updated_at), event.updated_at))', 'lastModified')
      .groupBy('event.id')
      .getRawMany();

    // Map results to events
    const lastModifiedMap = new Map(
      results.map((r) => [r.eventId, r.lastModified ? new Date(r.lastModified) : null]),
    );

    for (const event of eventArray) {
      event.lastModified = lastModifiedMap.get(event.id) ?? event.updatedAt;
    }
  } catch (err) {
    this.logger.warn(`Failed to calculate lastModified: ${(err as Error).message}`);
    // Fallback: use updatedAt
    for (const event of eventArray) {
      event.lastModified = event.updatedAt;
    }
  }
}
```

#### 3.4.2. Actualizar `findAll()` para calcular `lastModified`

```typescript
/**
 * Get all events ordered by creation date (newest first)
 * Enriches user participants with name/email/avatar from users table
 * Calculates lastModified considering event and transaction updates
 * @param status - Optional filter by status (active/archived), defaults to 'active'
 */
async findAll(status?: EventStatus): Promise<Event[]> {
  try {
    this.logger.log('Fetching all events');

    const whereCondition = status ? { status } : { status: EventStatus.ACTIVE };

    const events = await this.eventRepository.find({
      where: whereCondition,
      order: {
        createdAt: 'DESC',
      },
    });

    // Enrich all events' participants in one batch
    await this.enrichParticipants(events);

    // Calculate lastModified in batch
    await this.calculateLastModified(events);

    return events;
  } catch (error) {
    const err = error as Error;
    this.logger.error(`Failed to fetch events: ${err.message}`, err.stack);
    throw new InternalServerErrorException('Failed to fetch events');
  }
}
```

#### 3.4.3. Actualizar `findOne()` para calcular `lastModified`

```typescript
/**
 * Get a single event by ID
 * Enriches user participants with name/email/avatar from users table
 * Calculates lastModified considering event and transaction updates
 */
async findOne(id: string): Promise<Event> {
  try {
    this.logger.log(`Fetching event with ID: ${id}`);
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Enrich participants
    await this.enrichParticipants(event);

    // Calculate lastModified
    await this.calculateLastModified(event);

    return event;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    const err = error as Error;
    this.logger.error(`Failed to fetch event ${id}: ${err.message}`, err.stack);
    throw new InternalServerErrorException('Failed to fetch event');
  }
}
```

#### 3.4.4. Actualizar `create()` para manejar `status`

```typescript
/**
 * Create a new event
 */
async create(createEventDto: CreateEventDto): Promise<Event> {
  try {
    this.logger.log(`Creating new event: ${createEventDto.title}`);

    // Normalize participants (required for create, allowEmpty = false)
    const rawParticipants = (createEventDto as unknown as { participants?: unknown[] }).participants;
    const participantsTyped = this.normalizeParticipants(rawParticipants, false);

    // Create a clean event object without spreading to avoid TypeORM confusion with extra properties
    const event = this.eventRepository.create({
      title: createEventDto.title,
      description: createEventDto.description,
      icon: createEventDto.icon,
      status: createEventDto.status ?? EventStatus.ACTIVE,
      participants: participantsTyped,
    } as DeepPartial<Event>);

    const savedEvent = await this.eventRepository.save(event);

    // Set lastModified to createdAt for new events (no transactions yet)
    savedEvent.lastModified = savedEvent.updatedAt;

    this.logger.log(`Event created successfully with ID: ${savedEvent.id}`);
    return savedEvent;
  } catch (error) {
    const err = error as Error;
    this.logger.error(`Failed to create event: ${err.message}`, err.stack);
    throw new InternalServerErrorException('Failed to create event');
  }
}
```

#### 3.4.5. Actualizar `update()` para manejar `status` y calcular `lastModified`

```typescript
/**
 * Update an existing event
 */
async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
  try {
    this.logger.log(`Updating event with ID: ${id}`);

    // Verify event exists
    const event = await this.findOne(id);

    // Normalize participants if provided (allowEmpty = true for optional update)
    const rawParticipants = (updateEventDto as unknown as { participants?: unknown[] }).participants;
    const normalizedParticipants = this.normalizeParticipants(rawParticipants, true);

    // Create clean update object without spreading to avoid TypeORM confusion
    const cleanUpdate: DeepPartial<Event> = {};
    if (updateEventDto.title !== undefined) cleanUpdate.title = updateEventDto.title;
    if (updateEventDto.description !== undefined) cleanUpdate.description = updateEventDto.description;
    if (updateEventDto.icon !== undefined) cleanUpdate.icon = updateEventDto.icon;
    if (updateEventDto.status !== undefined) cleanUpdate.status = updateEventDto.status;
    if (normalizedParticipants !== undefined) cleanUpdate.participants = normalizedParticipants;

    const updatedEvent = this.eventRepository.merge(event, cleanUpdate);
    const savedEvent = await this.eventRepository.save(updatedEvent);

    // Calculate lastModified
    await this.calculateLastModified(savedEvent);

    this.logger.log(`Event ${id} updated successfully`);
    return savedEvent;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    const err = error as Error;
    this.logger.error(`Failed to update event ${id}: ${err.message}`, err.stack);
    throw new InternalServerErrorException('Failed to update event');
  }
}
```

**Notas importantes:**

- Usar `COALESCE(MAX(tx.updated_at), event.updated_at)` para manejar eventos sin transacciones.
- Query batch para `findAll()` optimiza performance al obtener múltiples eventos.
- Fallback a `event.updatedAt` si falla el cálculo.

---

### 3.5. Actualizar controller para exponer filtro de status (opcional)

**Archivo:** `apps/backend/src/modules/events/events.controller.ts`

**Cambios (opcional):**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventStatus } from './entities/event.entity';

@ApiTags('Events')
@Controller('events')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /api/events
   * Get all events, optionally filtered by status
   */
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter events by status (active/archived). Defaults to active.',
  })
  @ApiStandardResponse(200, 'Events retrieved successfully', Event, true)
  findAll(@Query('status') status?: EventStatus) {
    return this.eventsService.findAll(status);
  }

  // ... rest of methods unchanged
}
```

**Motivación:** Permite a frontend filtrar eventos archivados explícitamente con `GET /api/events?status=archived`.

---

### 3.6. Verificar imports en service

Asegurar que `EventStatus` se importe correctamente:

```typescript
import { Event, EventParticipant, EventStatus } from './entities/event.entity';
```

---

## 4. Cambios frontend (paso a paso)

### 4.1. Actualizar tipos en `apps/frontend/src/api/types.ts`

**Cambios:**

```typescript
export type EventStatus = 'active' | 'archived';

export interface Event {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  status: EventStatus; // REQUIRED field
  participants: EventParticipantDto[];
  createdAt: string;
  updatedAt: string;
  lastModified: string; // REQUIRED: ISO date string
}

export interface CreateEventDto {
  title: string;
  description?: string;
  icon?: string;
  status?: EventStatus; // Optional, defaults to 'active' in backend
  participants: EventParticipantDto[];
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  icon?: string;
  status?: EventStatus; // Allow updating status (archive/unarchive)
  participants?: EventParticipantDto[];
}

// ============= Transaction Types =============

export interface Transaction {
  id: string;
  eventId: string;
  participantId: string;
  paymentType: PaymentType;
  amount: number;
  title: string;
  date: string;
  createdAt: string;
  updatedAt: string; // NEW: Required field
}
```

**Notas:**

- `status` y `lastModified` son **requeridos** en respuestas del backend de Event.
- `status` es opcional en `CreateEventDto` (backend usa default).
- `lastModified` es string ISO para compatibilidad con JSON.
- **Transaction:** Añadir campo `updatedAt` que será devuelto por el backend después de ejecutar la migración.
- Los DTOs `CreateTransactionDto` y `UpdateTransactionDto` **NO necesitan** `updatedAt` porque es gestionado automáticamente por TypeORM con `@UpdateDateColumn`.

---

### 4.2. API client ya está correcto

**Archivo:** `apps/frontend/src/api/events.api.ts`

No requiere cambios. El `apiRequest` wrapper ya maneja desempaquetado de `{ data: T }` y devuelve el tipo correcto.

---

### 4.3. Hooks ya están correctos

**Archivo:** `apps/frontend/src/hooks/api/useEvents.ts`

No requiere cambios. Los hooks consumen los tipos actualizados automáticamente.

---

### 4.4. Actualizar `EventCard` component para mostrar `lastModified`

**Archivo:** `apps/frontend/src/features/events/components/EventCard.tsx`

**Cambios:**

1. Importar helper de formateo:

```typescript
import { formatDateLong } from '@/shared/utils/format';
```

2. Actualizar props interface (ya está correcta, solo verificar):

```typescript
export interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    status?: 'active' | 'archived';
    participants?: EventCardParticipant[];
    lastModified?: string | null; // ISO string
    icon?: React.ReactNode;
  };
  onClick?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

3. Actualizar renderizado para formatear `lastModified`:

```tsx
{
  /* Date section - bottom right */
}
<div className="text-right">
  <p className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-widest">
    {status === 'archived' ? 'Archivado' : 'Último cambio'}
  </p>
  {lastModified && (
    <p className="text-sm font-semibold text-slate-600 dark:text-emerald-200">{formatDateLong(lastModified)}</p>
  )}
</div>;
```

4. Remover comentarios TODO:

```tsx
// Remove: // TODO: aplicar active & archived en las Cards de eventos
// Remove: // TODO: integrar fecha de último cambio
```

**Motivación:** Mostrar la fecha formateada usando el helper existente del proyecto.

---

### 4.5. Verificar helper de formateo existe

**Archivo:** `apps/frontend/src/shared/utils/format.ts` (verificar que existe)

Debe tener:

```typescript
/**
 * Format date in long format using current locale
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "12 de febrero de 2026")
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

Si no existe, crear el archivo con las funciones de formateo necesarias.

---

### 4.6. Actualizar Home page para filtrar eventos (opcional)

**Archivo:** `apps/frontend/src/pages/Home.tsx` (o donde se renderice la lista)

**Opcional:** Añadir toggle para mostrar eventos archivados:

```tsx
const [showArchived, setShowArchived] = useState(false);
const { data: events } = useEvents(); // By default returns active events

// Add UI toggle
<Switch checked={showArchived} onCheckedChange={setShowArchived} label="Mostrar archivados" />;

// Filter events client-side or use separate query
const filteredEvents = showArchived
  ? events?.filter((e) => e.status === 'archived')
  : events?.filter((e) => e.status === 'active');
```

**Nota:** Si se implementa query param en backend, usar hook separado:

```typescript
// In useEvents.ts
export function useArchivedEvents() {
  return useQuery({
    queryKey: queryKeys.events.archived,
    queryFn: () => eventsApi.getAll({ status: 'archived' }),
    staleTime: 5 * 60 * 1000,
  });
}

// Update eventsApi.getAll
getAll: (params?: { status?: EventStatus }) =>
  apiRequest<Event[]>(`/events${params?.status ? `?status=${params.status}` : ''}`),
```

---

### 4.7. Añadir acción para archivar evento (opcional)

**Archivo:** `apps/frontend/src/features/events/components/EventActions.tsx` (o donde estén las acciones)

**Opcional:** Botón para archivar/desarchivar:

```tsx
const { mutate: updateEvent } = useUpdateEvent();

const handleToggleArchive = () => {
  updateEvent({
    id: event.id,
    data: {
      status: event.status === 'active' ? 'archived' : 'active',
    },
  });
};

<Button onClick={handleToggleArchive}>{event.status === 'active' ? 'Archivar' : 'Desarchivar'}</Button>;
```

---

## 5. Migraciones y comandos

### 5.1. Crear migration para añadir columnas

**Opción A: Generar migration automática con TypeORM CLI**

```bash
# Desde la raíz del monorepo
pnpm --filter @friends/backend run migration:generate -- AddEventStatusAndTransactionUpdatedAt

# O desde apps/backend/
cd apps/backend
pnpm run typeorm migration:generate src/migrations/AddEventStatusAndTransactionUpdatedAt -d src/data-source.ts
```

**Opción B: Crear migration manual**

Crear archivo: `apps/backend/src/migrations/XXXXXXXXXXXXXX-AddEventStatusAndTransactionUpdatedAt.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEventStatusAndTransactionUpdatedAt1708359600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column to events table
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['active', 'archived'],
        default: "'active'",
        isNullable: false,
      }),
    );

    // Add updated_at column to transactions table
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        isNullable: false,
      }),
    );

    // Set initial updated_at value for existing transactions to created_at
    await queryRunner.query(`
      UPDATE transactions
      SET updated_at = created_at
      WHERE updated_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('transactions', 'updated_at');
    await queryRunner.dropColumn('events', 'status');
  }
}
```

### 5.2. Ejecutar migration

```bash
# Desde la raíz del monorepo
pnpm --filter @friends/backend run migration:run:local

# O desde apps/backend/
cd apps/backend
pnpm run migration:run:local

# Producción (Render, tras build)
pnpm run migration:run:prod
```

### 5.3. Verificar migration aplicada

```bash
# Conectar a base de datos PostgreSQL
psql -h localhost -U postgres -d friends_db

# Verificar columna status en events
\d events

# Verificar columna updated_at en transactions
\d transactions

# Verificar datos
SELECT id, title, status FROM events LIMIT 5;
SELECT id, title, created_at, updated_at FROM transactions LIMIT 5;
```

### 5.4. Rollback si es necesario

```bash
# Desde la raíz del monorepo
pnpm --filter @friends/backend run migration:revert:local
```

> Nota: `migration:run` y `migration:revert` siguen existiendo como alias de compatibilidad hacia `:local`.

---

## 6. Tests y validación

### 6.1. Tests Backend

#### Unit Tests - EventsService

**Archivo:** `apps/backend/src/modules/events/events.service.spec.ts`

**Tests a añadir:**

```typescript
describe('calculateLastModified', () => {
  it('should return event.updatedAt when no transactions exist', async () => {
    const event = await service.findOne(eventId);
    expect(event.lastModified).toEqual(event.updatedAt);
  });

  it('should return max(transaction.updatedAt) when transactions are newer', async () => {
    // Create event
    const event = await service.create({ title: 'Test', participants: [...] });

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create transaction
    await transactionsService.create(event.id, { title: 'Test', ... });

    // Fetch event again
    const updatedEvent = await service.findOne(event.id);

    expect(updatedEvent.lastModified.getTime()).toBeGreaterThan(updatedEvent.updatedAt.getTime());
  });

  it('should batch calculate lastModified for multiple events', async () => {
    const events = await service.findAll();

    expect(events.length).toBeGreaterThan(0);
    events.forEach(event => {
      expect(event.lastModified).toBeInstanceOf(Date);
    });
  });
});

describe('Event status', () => {
  it('should create event with default status=active', async () => {
    const event = await service.create({ title: 'Test', participants: [...] });
    expect(event.status).toBe(EventStatus.ACTIVE);
  });

  it('should create event with custom status', async () => {
    const event = await service.create({
      title: 'Test',
      status: EventStatus.ARCHIVED,
      participants: [...]
    });
    expect(event.status).toBe(EventStatus.ARCHIVED);
  });

  it('should update event status', async () => {
    const event = await service.create({ title: 'Test', participants: [...] });
    const updated = await service.update(event.id, { status: EventStatus.ARCHIVED });
    expect(updated.status).toBe(EventStatus.ARCHIVED);
  });

  it('should filter events by status in findAll', async () => {
    // Create active and archived events
    await service.create({ title: 'Active', participants: [...] });
    await service.create({ title: 'Archived', status: EventStatus.ARCHIVED, participants: [...] });

    const activeEvents = await service.findAll(EventStatus.ACTIVE);
    const archivedEvents = await service.findAll(EventStatus.ARCHIVED);

    expect(activeEvents.every(e => e.status === EventStatus.ACTIVE)).toBe(true);
    expect(archivedEvents.every(e => e.status === EventStatus.ARCHIVED)).toBe(true);
  });
});
```

#### E2E Tests - Events Controller

**Archivo:** `apps/backend/test/events.e2e-spec.ts`

**Tests a añadir:**

```typescript
describe('GET /api/events', () => {
  it('should return events with lastModified field', () => {
    return request(app.getHttpServer())
      .get('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        if (res.body.data.length > 0) {
          expect(res.body.data[0]).toHaveProperty('lastModified');
          expect(res.body.data[0]).toHaveProperty('status');
        }
      });
  });

  it('should filter events by status=active', () => {
    return request(app.getHttpServer())
      .get('/api/events?status=active')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        const events = res.body.data;
        expect(events.every((e) => e.status === 'active')).toBe(true);
      });
  });

  it('should filter events by status=archived', () => {
    return request(app.getHttpServer())
      .get('/api/events?status=archived')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        const events = res.body.data;
        expect(events.every((e) => e.status === 'archived')).toBe(true);
      });
  });
});

describe('GET /api/events/:id', () => {
  it('should return event with lastModified field', () => {
    return request(app.getHttpServer())
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('lastModified');
        expect(res.body.data).toHaveProperty('status');
        expect(typeof res.body.data.lastModified).toBe('string');
      });
  });
});

describe('PATCH /api/events/:id', () => {
  it('should update event status', () => {
    return request(app.getHttpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'archived' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('archived');
      });
  });
});
```

---

### 6.2. Tests Frontend

#### Component Tests - EventCard

**Archivo:** `apps/frontend/src/features/events/components/EventCard.test.tsx`

**Tests a añadir:**

```typescript
import { render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test description',
    status: 'active' as const,
    participants: [],
    lastModified: '2026-02-19T10:30:00Z',
  };

  it('should render status badge for active event', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('should render status badge for archived event', () => {
    render(<EventCard event={{ ...mockEvent, status: 'archived' }} />);
    expect(screen.getByText('Archivado')).toBeInTheDocument();
  });

  it('should render lastModified date formatted', () => {
    render(<EventCard event={mockEvent} />);
    // Verify formatted date is displayed (depends on locale)
    expect(screen.getByText(/19.*febrero.*2026/i)).toBeInTheDocument();
  });

  it('should show "Último cambio" label for active events', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Último cambio')).toBeInTheDocument();
  });

  it('should show "Archivado" label for archived events', () => {
    render(<EventCard event={{ ...mockEvent, status: 'archived' }} />);
    expect(screen.getByText('Archivado')).toBeInTheDocument();
  });

  it('should not render date when lastModified is null', () => {
    render(<EventCard event={{ ...mockEvent, lastModified: null }} />);
    expect(screen.queryByText(/febrero/i)).not.toBeInTheDocument();
  });

  it('should apply correct styling for archived status', () => {
    const { container } = render(<EventCard event={{ ...mockEvent, status: 'archived' }} />);
    const badge = screen.getByText('Archivado');
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-500');
  });
});
```

#### Hook Tests - useEvents

**Archivo:** `apps/frontend/src/hooks/api/useEvents.test.ts`

**Tests a añadir:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents } from './useEvents';
import { eventsApi } from '@/api/events.api';

// Mock API
jest.mock('@/api/events.api');

describe('useEvents', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch events with lastModified field', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Event 1',
        status: 'active',
        lastModified: '2026-02-19T10:00:00Z',
        participants: [],
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
    ];

    (eventsApi.getAll as jest.Mock).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEvents);
    expect(result.current.data?.[0]).toHaveProperty('lastModified');
    expect(result.current.data?.[0]).toHaveProperty('status');
  });
});
```

---

### 6.3. Manual Testing Checklist

#### Backend API (Postman/REST Client)

- [ ] `GET /api/events` devuelve eventos con campos `status` y `lastModified`
- [ ] `GET /api/events?status=active` filtra solo eventos activos
- [ ] `GET /api/events?status=archived` filtra solo eventos archivados
- [ ] `GET /api/events/:id` devuelve evento con `lastModified` calculado correctamente
- [ ] `POST /api/events` con `status: 'archived'` crea evento archivado
- [ ] `POST /api/events` sin `status` crea evento con `status: 'active'` por defecto
- [ ] `PATCH /api/events/:id` con `{ status: 'archived' }` actualiza status
- [ ] Crear transaction en evento actualiza su `lastModified` (verificar haciendo GET después)
- [ ] Actualizar transaction actualiza `lastModified` del evento padre
- [ ] Eliminar transaction actualiza `lastModified` del evento padre

#### Frontend UI

- [ ] EventCard muestra badge "Activo" para eventos activos (verde)
- [ ] EventCard muestra badge "Archivado" para eventos archivados (gris)
- [ ] EventCard muestra fecha formateada de `lastModified` (ej: "19 de febrero de 2026")
- [ ] EventCard muestra "Último cambio" para eventos activos
- [ ] EventCard muestra "Archivado" para eventos archivados
- [ ] Home page muestra solo eventos activos por defecto
- [ ] Añadir transacción a evento actualiza fecha de "Último cambio" en tiempo real (después de refetch)
- [ ] Archivar evento cambia badge a "Archivado" y actualiza UI

#### Database

- [ ] Tabla `events` tiene columna `status` tipo ENUM con valores `active`, `archived`
- [ ] Tabla `transactions` tiene columna `updated_at` tipo TIMESTAMP
- [ ] Eventos existentes tienen `status = 'active'` por defecto
- [ ] Transacciones existentes tienen `updated_at = created_at` inicialmente

---

## 7. Checklist de entrega

### Backend

- [ ] **Entity Event:** Añadir enum `EventStatus` y columna `status` con `@Column` decorator
- [ ] **Entity Event:** Añadir campo virtual `lastModified?: Date` (no persistido)
- [ ] **Entity Event:** Añadir `@ApiProperty` para Swagger docs
- [ ] **Entity Transaction:** Añadir `@UpdateDateColumn` para `updatedAt`
- [ ] **DTO CreateEventDto:** Añadir validación opcional para `status`
- [ ] **DTO CreateEventDto:** Añadir `@ApiProperty` decorators
- [ ] **Service:** Implementar método privado `calculateLastModified()`
- [ ] **Service:** Actualizar `findAll()` para calcular `lastModified` y filtrar por `status`
- [ ] **Service:** Actualizar `findOne()` para calcular `lastModified`
- [ ] **Service:** Actualizar `create()` para manejar `status` opcional
- [ ] **Service:** Actualizar `update()` para permitir cambio de `status`
- [ ] **Service:** Importar `EventStatus` desde entity
- [ ] **Controller:** Añadir `@Query` decorator para filtro de status (opcional)
- [ ] **Controller:** Añadir `@ApiQuery` para documentación Swagger
- [ ] **Migration:** Crear migration para añadir columna `status` a `events`
- [ ] **Migration:** Crear migration para añadir columna `updated_at` a `transactions`
- [ ] **Migration:** Ejecutar migration en base de datos de desarrollo
- [ ] **Migration:** Ejecutar migration en base de datos de producción
- [ ] **Tests:** Añadir unit tests para `calculateLastModified()`
- [ ] **Tests:** Añadir unit tests para CRUD con `status`
- [ ] **Tests:** Añadir E2E tests para filtrado por status
- [ ] **Tests:** Verificar que `lastModified` se devuelve en responses

### Frontend

- [ ] **Types:** Actualizar interface `Event` con `status` y `lastModified` requeridos
- [ ] **Types:** Exportar type alias `EventStatus`
- [ ] **Types:** Actualizar `CreateEventDto` y `UpdateEventDto` con `status` opcional
- [ ] **Types:** Añadir campo `updatedAt` a interface `Transaction`
- [ ] **EventCard:** Importar `formatDateLong` helper
- [ ] **EventCard:** Actualizar renderizado de fecha con formateo
- [ ] **EventCard:** Remover comentarios TODO
- [ ] **EventCard:** Verificar styling de badges funciona correctamente
- [ ] **Utils:** Verificar que existe `formatDateLong()` en `format.ts`
- [ ] **Utils:** Si no existe, crear helper de formateo de fechas
- [ ] **Home/Lista:** (Opcional) Añadir filtro para mostrar eventos archivados
- [ ] **Actions:** (Opcional) Añadir botón para archivar/desarchivar eventos
- [ ] **Hooks:** (Opcional) Añadir `useArchivedEvents()` si se implementa filtrado
- [ ] **API:** (Opcional) Actualizar `eventsApi.getAll()` para soportar query params
- [ ] **Tests:** Añadir component tests para `EventCard` con diferentes status
- [ ] **Tests:** Verificar renderizado de `lastModified` formateada
- [ ] **Tests:** Añadir tests para hooks si hay cambios

### Documentation

- [ ] Actualizar `API_AUTH_CONTRACT.md` con nuevos campos en responses
- [ ] Actualizar `BACKEND_API_ARCHITECTURE.md` con lógica de `lastModified`
- [ ] Actualizar `FRONTEND_API_INTEGRATION.md` con nuevos campos
- [ ] Documentar en `.github/copilot-instructions.md` la feature de status

### Deployment

- [ ] Verificar variables de entorno no requieren cambios
- [ ] Ejecutar migrations en staging
- [ ] Ejecutar migrations en producción
- [ ] Verificar Swagger docs actualizadas en `/api/docs`
- [ ] Smoke test en producción

---

## 8. Consideraciones de performance

### Performance del cálculo de `lastModified`

**Estrategia actual: "Calcular al leer"**

✅ **Ventajas:**

- No duplica lógica de actualización en múltiples puntos
- Siempre consistente con datos actuales
- No requiere triggers de base de datos
- Más simple de mantener

⚠️ **Desventajas:**

- Query adicional con JOIN y GROUP BY en cada lectura
- No puede indexar directamente para ordenación
- Puede ser lento con muchos eventos y transacciones

### Alternativas para mejorar performance

#### Opción 1: Columna persistida + Trigger (PostgreSQL)

```sql
-- Añadir columna persistida
ALTER TABLE events ADD COLUMN last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Crear función trigger
CREATE OR REPLACE FUNCTION update_event_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET last_modified = GREATEST(NEW.updated_at, events.updated_at)
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en transactions
CREATE TRIGGER transaction_update_event_last_modified
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_event_last_modified();
```

✅ **Ventajas:**

- O(1) en lectura, query simple
- Puede indexar para ordenación rápida
- Mejor performance en listados grandes

⚠️ **Desventajas:**

- Trigger adicional aumenta complejidad
- Puede haber race conditions con concurrencia alta
- Más difícil de debuggear

#### Opción 2: Actualización explícita en service

Modificar `TransactionsService` para actualizar `event.updatedAt`:

```typescript
async create(eventId: string, dto: CreateTransactionDto): Promise<Transaction> {
  const transaction = await this.transactionRepository.save(...);

  // Trigger event update to bump updatedAt
  await this.eventRepository.update(
    { id: eventId },
    { updatedAt: new Date() } // Triggers @UpdateDateColumn
  );

  return transaction;
}
```

✅ **Ventajas:**

- Simple, usa TypeORM
- No requiere triggers
- `updatedAt` refleja última actividad real

⚠️ **Desventajas:**

- Lógica duplicada en create/update/delete de transactions
- Puede olvidarse en nuevos endpoints

### Recomendación

**Para MVP/baja escala:** Usar estrategia actual "calcular al leer"

- Suficiente para <10,000 eventos
- Más mantenible
- Menos propenso a bugs

**Para producción/alta escala:** Implementar Opción 1 (columna + trigger)

- Necesario cuando listados sean lentos (benchmark con datos reales)
- Añadir índice: `CREATE INDEX idx_events_last_modified ON events(last_modified DESC);`
- Permite paginación eficiente ordenada por fecha

### Benchmarks orientativos

| Eventos | Transactions | Query actual | Con columna indexada |
| ------- | ------------ | ------------ | -------------------- |
| 100     | 1,000        | ~20ms        | ~5ms                 |
| 1,000   | 10,000       | ~150ms       | ~10ms                |
| 10,000  | 100,000      | ~1,500ms     | ~15ms                |

_Estimaciones en hardware promedio con PostgreSQL 14+_

---

## 9. Referencias y recursos

### TypeORM Documentation

- [Relations](https://typeorm.io/relations)
- [Query Builder](https://typeorm.io/select-query-builder)
- [Migrations](https://typeorm.io/migrations)
- [Decorators](https://typeorm.io/decorator-reference)

### PostgreSQL Documentation

- [ENUM Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Timestamp Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
- [Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

### NestJS Documentation

- [Validation](https://docs.nestjs.com/techniques/validation)
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [TypeORM Integration](https://docs.nestjs.com/techniques/database)

### Testing

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest E2E](https://github.com/visionmedia/supertest)

---

## 10. Mejoras futuras y lecciones aprendidas

### Extensibilidad

**Posibles extensiones futuras:**

- Añadir más estados: `draft`, `completed`, `deleted` (soft delete)
- Añadir campo `lastModifiedBy` para rastrear quién hizo el último cambio
- Añadir `archivedAt` timestamp para filtros temporales
- Historial de cambios (audit log) con tabla `event_history`

### Lecciones aprendidas

**✅ Buenas prácticas aplicadas:**

- Campo virtual `lastModified` en entity evita duplicación de datos
- Batch queries en `findAll()` optimiza N+1 queries
- Enum de TypeScript + PostgreSQL garantiza type safety
- Fallback a `updatedAt` si falla cálculo
- Método privado `calculateLastModified()` reutilizable

**⚠️ Puntos de atención:**

- Monitorear performance de queries con JOIN en producción
- Considerar caché de eventos con `lastModified` si load es alto
- Documentar claramente que `lastModified` es calculado, no persistido
- Tests deben mockear `setTimeout` para evitar flakiness

### Métricas de éxito

**KPIs para validar implementación:**

- [ ] Tiempo de respuesta `GET /api/events` < 200ms (P95)
- [ ] Tiempo de respuesta `GET /api/events/:id` < 100ms (P95)
- [ ] 0 errores de cálculo de `lastModified` en logs
- [ ] Usuarios pueden archivar/desarchivar eventos sin bugs
- [ ] UI muestra fechas correctamente en todos los locales (es, en, ca)

---

## Anexo: Ejemplo completo de flujo

### Escenario: Usuario crea evento y añade transacciones

**1. Usuario crea evento**

```http
POST /api/events
{
  "title": "Viaje a Barcelona",
  "participants": [...]
}

Response:
{
  "data": {
    "id": "123",
    "title": "Viaje a Barcelona",
    "status": "active",
    "createdAt": "2026-02-19T10:00:00Z",
    "updatedAt": "2026-02-19T10:00:00Z",
    "lastModified": "2026-02-19T10:00:00Z"
  }
}
```

**2. Usuario añade transacción 1 hora después**

```http
POST /api/events/123/transactions
{
  "title": "Hotel",
  "amount": 200,
  ...
}
```

**3. Usuario consulta evento**

```http
GET /api/events/123

Response:
{
  "data": {
    "id": "123",
    "title": "Viaje a Barcelona",
    "status": "active",
    "createdAt": "2026-02-19T10:00:00Z",
    "updatedAt": "2026-02-19T10:00:00Z",
    "lastModified": "2026-02-19T11:00:00Z"  // ← Refleja creación de transaction
  }
}
```

**4. Usuario archiva evento**

```http
PATCH /api/events/123
{
  "status": "archived"
}

Response:
{
  "data": {
    "id": "123",
    "status": "archived",
    "updatedAt": "2026-02-19T12:00:00Z",
    "lastModified": "2026-02-19T12:00:00Z"  // ← Actualizado al archivar
  }
}
```

**5. Frontend muestra evento archivado**

```tsx
<EventCard
  event={{
    id: '123',
    title: 'Viaje a Barcelona',
    status: 'archived',
    lastModified: '2026-02-19T12:00:00Z',
  }}
/>

// Renderiza:
// Badge: "Archivado" (gris)
// Fecha: "19 de febrero de 2026"
```

---

**Fin del documento**

Este plan de implementación proporciona todos los detalles necesarios para implementar la feature de `status` y `lastModified` en eventos, cubriendo backend, frontend, tests, migraciones y consideraciones de performance.

**Fecha de última actualización:** 2026-02-19  
**Versión:** 2.0 (completa y detallada)  
**Autor:** GitHub Copilot + Victor (validación)
