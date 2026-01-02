# Backend API Architecture Plan - NestJS RESTful API

**Fecha:** 1 de enero de 2026  
**Estado:** Planificación  
**Objetivo:** Diseñar la arquitectura RESTful API en NestJS para reemplazar LocalStorage del frontend React

---

## 📋 Análisis del Frontend Actual

### Entidades Principales

**Event:**
```typescript
interface Event {
  id: string;
  title: string;
  participants: EventParticipant[];
}

interface EventParticipant {
  id: string;
  name: string;
}
```

**Transaction:**
```typescript
type PaymentType = 'contribution' | 'expense' | 'compensation';

interface Transaction {
  id: string;
  title: string;
  paymentType: PaymentType;
  amount: number;
  participantId: string; // '0' para POT
  date: string; // ISO yyyy-mm-dd
  eventId: string;
}
```

### Relaciones
```
Events (1) ──── (N) Transactions
```

### Operaciones CRUD Frontend (Zustand)

**Events:**
- `addEvent(title, participants)` → Crear evento
- `updateEvent(id, title, participants)` → Actualizar evento
- `removeEvent(id)` → Eliminar evento + cascade delete transactions
- Lista completa de eventos

**Transactions:**
- `addExpense(expense)` → Crear transacción
- `updateTransaction(id, data)` → Actualizar transacción
- `removeTransaction(id)` → Eliminar transacción
- `deleteTransactionsByEvent(eventId)` → Cascade delete
- `clearParticipantFromEventTransactions(eventId, participantId)` → Limpiar participante
- `getTransactionsByEvent(eventId)` → Filtrar por evento
- `getTransactionsByEventPaginated(eventId, numberOfDates, offset)` → Paginación por fechas

### Características Especiales

1. **Sistema POT:** Participante especial con ID `'0'` que representa el bote común
2. **Paginación por fechas:** Agrupa transacciones por fecha y pagina
3. **KPIs calculados en frontend:** Balances, totales, compensaciones pendientes
4. **Cascade delete:** Al eliminar evento, se borran sus transacciones
5. **Limpieza de participantes:** Al quitar participante de evento, se limpia de transacciones

---

## 🏗️ Arquitectura Propuesta

### Recursos Principales (2 módulos)

#### 1. Módulo Events 
📍 `apps/backend/src/modules/events/`

**Entidad (TypeORM):**
```typescript
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('jsonb')
  participants: EventParticipant[]; // Almacenar como JSONB en PostgreSQL

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.event, {
    cascade: true, // Cascade delete
  })
  transactions: Transaction[];
}
```

**Endpoints REST:**
```
GET    /api/events                    # Listar todos los eventos
POST   /api/events                    # Crear evento
GET    /api/events/:id                # Obtener evento por ID
PATCH  /api/events/:id                # Actualizar evento
DELETE /api/events/:id                # Eliminar evento (cascade delete transactions)
GET    /api/events/:id/kpis           # [Opcional] KPIs agregados del evento
```

**DTOs:**
```typescript
// create-event.dto.ts
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventParticipantDto)
  participants: EventParticipantDto[];
}

// update-event.dto.ts
export class UpdateEventDto extends PartialType(CreateEventDto) {}

// event-participant.dto.ts
export class EventParticipantDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
```

---

#### 2. Módulo Transactions
📍 `apps/backend/src/modules/transactions/`

**Entidad (TypeORM):**
```typescript
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ['contribution', 'expense', 'compensation'],
  })
  paymentType: PaymentType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  participantId: string; // '0' para POT

  @Column('date')
  date: Date;

  @ManyToOne(() => Event, (event) => event.transactions, {
    onDelete: 'CASCADE', // Cascade delete cuando se elimina evento
  })
  event: Event;

  @Column()
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Endpoints REST (Anidados bajo events):**
```
# CRUD básico
GET    /api/events/:eventId/transactions              # Listar transactions de un evento
POST   /api/events/:eventId/transactions              # Crear transaction
GET    /api/events/:eventId/transactions/paginated    # Paginación por fechas
GET    /api/transactions/:id                          # Obtener transaction por ID
PATCH  /api/transactions/:id                          # Actualizar transaction
DELETE /api/transactions/:id                          # Eliminar transaction

# [Opcional] Agregaciones
GET    /api/events/:eventId/transactions/stats        # Estadísticas agregadas
```

**DTOs:**
```typescript
// create-transaction.dto.ts
export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['contribution', 'expense', 'compensation'])
  paymentType: PaymentType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  participantId: string; // Validar que exista en el evento o sea '0' (POT)

  @IsDateString()
  date: string; // ISO format
}

// update-transaction.dto.ts
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
```

**Validaciones Importantes:**
- Al crear/actualizar transaction, validar que `participantId` exista en `event.participants` o sea `'0'` (POT)
- Al eliminar evento, cascade delete automático de transactions (configurado en ORM)

---

## 🔍 Decisiones Arquitecturales Clave

### 1. Anidación de Recursos (Nested Routes)
✅ **Usar rutas anidadas para transactions bajo events**
```
POST /api/events/:eventId/transactions
```

**Ventajas:**
- Refleja la relación jerárquica 1:N
- Valida automáticamente que el eventId exista
- Más semántico y RESTful
- Alineado con la lógica del frontend

**Implementación en Controller:**
```typescript
@Controller('events/:eventId/transactions')
export class TransactionsController {
  @Post()
  create(
    @Param('eventId') eventId: string,
    @Body() createDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(eventId, createDto);
  }
}
```

---

### 2. Cascade Delete
✅ **Configurar a nivel de base de datos + ORM**

**Configuración TypeORM:**
```typescript
// En Event entity
@OneToMany(() => Transaction, (transaction) => transaction.event, {
  cascade: true,
})
transactions: Transaction[];

// En Transaction entity
@ManyToOne(() => Event, (event) => event.transactions, {
  onDelete: 'CASCADE',
})
event: Event;
```

**Migration SQL:**
```sql
ALTER TABLE transactions
ADD CONSTRAINT fk_event
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;
```

**Comportamiento:**
- Al eliminar un evento, sus transactions se borran automáticamente
- Replica la lógica actual del frontend: `deleteTransactionsByEvent()`

---

### 3. Participantes como JSONB
✅ **Almacenar como JSONB en PostgreSQL**

**Ventajas:**
- Simple y flexible
- No necesita tabla separada para participantes
- Búsquedas rápidas con índices JSONB
- Alineado con el modelo del frontend
- Fácil de sincronizar con Zustand

**Índice JSONB (opcional):**
```sql
CREATE INDEX idx_events_participants ON events USING GIN (participants);
```

**Alternativa:** Si necesitas búsquedas complejas por participante (ej: "todos los eventos donde participa X"), crear tabla `participants` con relación N:M.

---

### 4. Cálculos de KPIs
⚠️ **Dos opciones:**

#### Opción A: Calcular en Frontend (Recomendada Inicialmente)
- API solo devuelve transactions raw
- Frontend calcula balances, totales, pending, etc. (lógica actual)

**Ventajas:**
- ✅ Menos carga en servidor
- ✅ Más flexible para cambios de lógica de negocio
- ✅ No duplica código entre frontend/backend
- ✅ Implementación más rápida

**Desventajas:**
- ❌ Más datos transferidos (todas las transactions)
- ❌ Puede ser lento con muchas transactions

#### Opción B: Endpoint de Agregación en Backend
```typescript
GET /api/events/:eventId/kpis
```

**Response:**
```json
{
  "totalExpenses": 150.50,
  "totalContributions": 200.00,
  "totalCompensations": 15.00,
  "potBalance": 49.50,
  "pendingToCompensate": 35.00,
  "totalPotExpenses": 25.50,
  "participantBalances": [
    { "participantId": "1", "name": "Alice", "balance": 10.50 },
    { "participantId": "2", "name": "Bob", "balance": -5.25 }
  ],
  "participantContributions": [...],
  "participantExpenses": [...]
}
```

**Ventajas:**
- ✅ Menos datos transferidos
- ✅ Mejor rendimiento para móviles/conexiones lentas
- ✅ Cálculos optimizados con SQL

**Desventajas:**
- ❌ Duplica lógica de negocio
- ❌ Mantenimiento de dos cálculos (frontend y backend)

**Recomendación:** Empezar con **Opción A**, migrar a B si hay problemas de rendimiento.

---

### 5. Paginación por Fechas
Tu frontend usa paginación especial: agrupa transactions por fecha única y pagina por número de fechas.

**Implementación Backend:**
```typescript
// transactions.service.ts
async getTransactionsPaginated(
  eventId: string,
  numberOfDates = 3,
  offset = 0,
): Promise<PaginatedTransactionsDto> {
  // 1. Obtener fechas únicas ordenadas DESC
  const uniqueDates = await this.transactionsRepository
    .createQueryBuilder('t')
    .select('DISTINCT t.date', 'date')
    .where('t.eventId = :eventId', { eventId })
    .orderBy('t.date', 'DESC')
    .getRawMany();

  const totalDates = uniqueDates.length;
  const targetDates = uniqueDates.slice(offset, offset + numberOfDates);

  // 2. Obtener transactions de esas fechas
  const transactions = await this.transactionsRepository.find({
    where: {
      eventId,
      date: In(targetDates.map(d => d.date)),
    },
    order: {
      date: 'DESC',
      createdAt: 'DESC',
    },
  });

  return {
    transactions,
    hasMore: offset + numberOfDates < totalDates,
    totalDates,
    loadedDates: targetDates.length,
  };
}
```

**Endpoint:**
```
GET /api/events/:eventId/transactions/paginated?numberOfDates=3&offset=0
```

---

## 📦 Estructura de Carpetas Completa

```
apps/backend/
├── src/
│   ├── main.ts                       # Entry point
│   ├── app.module.ts                 # Root module
│   │
│   ├── common/                       # Código compartido
│   │   ├── decorators/              # Custom decorators
│   │   ├── filters/                 # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/            # Response interceptors
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/                   # Validation pipes
│   │   │   └── validation.pipe.ts
│   │   └── guards/                  # Auth guards (futuro)
│   │
│   ├── config/                       # Configuración
│   │   ├── database.config.ts       # TypeORM config
│   │   └── app.config.ts            # App config
│   │
│   └── modules/
│       │
│       ├── events/
│       │   ├── events.controller.ts
│       │   ├── events.service.ts
│       │   ├── events.module.ts
│       │   ├── entities/
│       │   │   └── event.entity.ts
│       │   └── dto/
│       │       ├── create-event.dto.ts
│       │       ├── update-event.dto.ts
│       │       └── event-participant.dto.ts
│       │
│       └── transactions/
│           ├── transactions.controller.ts
│           ├── transactions.service.ts
│           ├── transactions.module.ts
│           ├── entities/
│           │   └── transaction.entity.ts
│           └── dto/
│               ├── create-transaction.dto.ts
│               ├── update-transaction.dto.ts
│               └── paginated-transactions.dto.ts
│
├── test/                             # E2E tests
│   └── app.e2e-spec.ts
│
├── .env                              # Environment variables
├── .env.example                      # Ejemplo de .env
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Configuración Técnica

### Base de Datos: PostgreSQL 15+

**Esquema SQL:**
```sql
-- Tabla Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  participants JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice JSONB para búsquedas en participants
CREATE INDEX idx_events_participants ON events USING GIN (participants);

-- Tabla Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('contribution', 'expense', 'compensation')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  participant_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  event_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_event
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE CASCADE
);

-- Índices para optimizar queries
CREATE INDEX idx_transactions_event_id ON transactions(event_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_event_date ON transactions(event_id, date DESC);
```

### Environment Variables

**`.env` file:**
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=friends_db

# TypeORM
TYPEORM_SYNC=false  # Usar migrations en producción
TYPEORM_LOGGING=true

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT (futuro)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
```

### TypeORM Configuration

**`config/database.config.ts`:**
```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('TYPEORM_LOGGING') === 'true',
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
});
```

---

## 🚀 Plan de Implementación (Paso a Paso)

### Fase 1: Setup Inicial ✅ COMPLETADA
- [x] Instalar dependencias NestJS + TypeORM + PostgreSQL
- [x] Configurar TypeORM con PostgreSQL local
- [x] Configurar variables de entorno
- [x] Configurar CORS para frontend localhost:5173
- [x] Setup validation pipes globales
- [x] Setup exception filters

**Dependencias instaladas:**
```bash
@nestjs/typeorm typeorm pg
@nestjs/config
class-validator class-transformer
```

**Archivos creados:**
- ✅ `src/config/database.config.ts` - Configuración TypeORM
- ✅ `src/config/app.config.ts` - Configuración de la aplicación
- ✅ `src/common/filters/http-exception.filter.ts` - Manejo global de errores
- ✅ `src/common/interceptors/transform.interceptor.ts` - Transformación de respuestas
- ✅ `src/common/pipes/validation.pipe.ts` - Validación global
- ✅ `src/common/health.controller.ts` - Endpoint de salud
- ✅ `.env` y `.env.example` - Variables de entorno
- ✅ `docker-compose.yml` - PostgreSQL en Docker
- ✅ `QUICKSTART.md` - Guía rápida de inicio

**Estructura de carpetas creada:**
- ✅ `src/common/{decorators,filters,interceptors,pipes,guards}`
- ✅ `src/config`
- ✅ `src/modules/events/{entities,dto}`
- ✅ `src/modules/transactions/{entities,dto}`

---

### Fase 2: Módulo Events
- [ ] Crear Event entity con JSONB participants
- [ ] Crear DTOs (CreateEventDto, UpdateEventDto, EventParticipantDto)
- [ ] Implementar EventsService
  - [ ] findAll()
  - [ ] findOne(id)
  - [ ] create(dto)
  - [ ] update(id, dto)
  - [ ] remove(id) con cascade
- [ ] Implementar EventsController
- [ ] Tests unitarios del service
- [ ] Tests E2E de los endpoints

---

### Fase 3: Módulo Transactions
- [ ] Crear Transaction entity con relación a Event
- [ ] Crear DTOs (CreateTransactionDto, UpdateTransactionDto)
- [ ] Implementar TransactionsService
  - [ ] findByEvent(eventId)
  - [ ] findByEventPaginated(eventId, numberOfDates, offset)
  - [ ] findOne(id)
  - [ ] create(eventId, dto) con validación de participantId
  - [ ] update(id, dto)
  - [ ] remove(id)
- [ ] Implementar TransactionsController (rutas anidadas)
- [ ] Tests unitarios del service
- [ ] Tests E2E de los endpoints

---

### Fase 4: Validaciones y Lógica de Negocio
- [ ] Validar que participantId exista en event.participants o sea '0' (POT)
- [ ] Implementar custom decorator @ValidParticipant
- [ ] Manejar errores de participante no válido
- [ ] Verificar cascade delete funciona correctamente

---

### Fase 5: [Opcional] Agregaciones de KPIs
- [ ] Crear endpoint GET /api/events/:eventId/kpis
- [ ] Implementar cálculos en TransactionsService:
  - [ ] getTotalExpenses(eventId)
  - [ ] getTotalContributions(eventId)
  - [ ] getPotBalance(eventId)
  - [ ] getPendingToCompensate(eventId)
  - [ ] getParticipantBalances(eventId)
- [ ] Optimizar queries con SQL agregado

---

### Fase 6: Migrations y Producción
- [ ] Deshabilitar TypeORM sync
- [ ] Crear migrations iniciales
- [ ] Configurar scripts de migración

- [ ] Setup para Railway/Render/Vercel
- [ ] Configurar PostgreSQL en producción
- [ ] Variables de entorno de producción

---

### Fase 7: Migración del Frontend
- [ ] Instalar React Query o SWR
- [ ] Crear cliente API (axios/fetch)
- [ ] Migrar useEventsStore a usar API
  - [ ] Reemplazar persist con fetch
  - [ ] Mantener cache con React Query
- [ ] Migrar useTransactionsStore a usar API
- [ ] Remover persist de Zustand
- [ ] Testing end-to-end completo
- [ ] Deploy frontend + backend

---

## 🔄 Migración de Frontend a API

### Cambios en Zustand Stores

**Antes (LocalStorage):**
```typescript
// useEventsStore.ts
export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (title, participants) =>
        set((state) => ({
          events: [
            ...state.events,
            { id: crypto.randomUUID(), title, participants },
          ],
        })),
    }),
    { name: 'events-storage' }
  )
);
```

**Después (API):**
```typescript
// useEventsStore.ts
export const useEventsStore = create<EventsState>()((set) => ({
  events: [],
  
  addEvent: async (title, participants) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, participants }),
    });
    
    if (!response.ok) throw new Error('Failed to create event');
    
    const newEvent = await response.json();
    set((state) => ({ events: [...state.events, newEvent] }));
  },
  
  fetchEvents: async () => {
    const response = await fetch('/api/events');
    const events = await response.json();
    set({ events });
  },
}));
```

### Integración con React Query (Recomendado)

**Ventajas:**
- ✅ Cache automático
- ✅ Sincronización servidor-cliente
- ✅ Optimistic updates
- ✅ Retry logic
- ✅ Background refetch
- ✅ Loading/error states

**Ejemplo:**
```typescript
// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events');
      return res.json();
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEventDto) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
- Tests de services (lógica de negocio)
- Tests de entities (validaciones)
- Mocks de repositorios TypeORM

### E2E Tests (Supertest)
- Tests de endpoints completos
- Base de datos de test (PostgreSQL en memoria o contenedor Docker)
- Seed data para tests

**Ejemplo:**
```typescript
// events.e2e-spec.ts
describe('Events (e2e)', () => {
  it('POST /api/events should create event', () => {
    return request(app.getHttpServer())
      .post('/api/events')
      .send({
        title: 'Test Event',
        participants: [{ id: '1', name: 'Alice' }],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Test Event');
      });
  });
});
```

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Validación de Entrada
- ✅ Usar class-validator en todos los DTOs
- ✅ Validar tipos, longitudes, formatos
- ✅ Sanitizar inputs para prevenir SQL injection

### 2. CORS
```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

### 3. Rate Limiting (futuro)
```bash
pnpm add @nestjs/throttler
```

### 4. Helmet (seguridad HTTP)
```bash
pnpm add helmet
```

### 5. Logging
- ✅ Usar NestJS Logger
- ✅ Log de errores
- ✅ Log de requests importantes

---

## 📊 Métricas y Monitoreo (Futuro)

- **Logging:** Winston o Pino
- **Monitoreo:** Sentry para errors
- **APM:** New Relic o DataDog
- **Health checks:** `/health` endpoint

---

## 🚢 Deployment

### Backend Options:
1. **Railway** - PostgreSQL incluido, fácil setup
2. **Render** - Free tier con PostgreSQL
3. **Vercel** - Serverless (necesita adaptador)
4. **Fly.io** - Contenedores, buen free tier

### Frontend (Actual):
- GitHub Pages (estático)

### Base de Datos:
- **Supabase** - PostgreSQL managed (free tier generoso)
- **Neon** - Serverless PostgreSQL
- **Railway/Render** - PostgreSQL incluido

---

## 📚 Referencias

### NestJS Docs:
- [TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [Validation](https://docs.nestjs.com/techniques/validation)
- [Exception Filters](https://docs.nestjs.com/exception-filters)

### Best Practices:
- [REST API Design](https://restfulapi.net/)
- [NestJS Best Practices](https://github.com/nestjs/nest/tree/master/sample)

---

## 📝 Notas Adicionales

### Consideraciones para Escalabilidad:

1. **Si creces a miles de transactions:**
   - Añadir índices adicionales
   - Implementar caching con Redis
   - Calcular KPIs en backend

2. **Si necesitas búsqueda compleja de participantes:**
   - Migrar participants a tabla separada
   - Relación N:M entre Events y Participants

3. **Si necesitas multi-tenancy (equipos/grupos):**
   - Añadir entidad Organization/Team
   - Relación: Organization → Events → Transactions

4. **Si añades autenticación:**
   - Implementar módulo Auth con Passport + JWT
   - Relación: User → Events (creador)
   - Middleware de autorización

---

## ✅ Checklist de Implementación

### Backend Setup ✅ COMPLETADO
- [x] Inicializar NestJS app
- [x] Configurar PostgreSQL local (Docker)
- [x] Configurar TypeORM
- [x] Setup env variables
- [x] Configurar CORS
- [x] Global validation pipes
- [x] Global exception filters
- [x] Health check endpoint
- [x] Estructura de carpetas

### Events Module 🚧 SIGUIENTE
- [ ] Entity + DTOs
- [ ] Service + Controller
- [ ] Tests
- [ ] E2E tests

### Transactions Module
- [ ] Entity + DTOs
- [ ] Service + Controller (nested routes)
- [ ] Validación de participantId
- [ ] Paginación por fechas
- [ ] Tests
- [ ] E2E tests

### Production Ready
- [ ] Migrations setup
- [ ] Error handling
- [ ] Logging
- [ ] Deploy backend
- [ ] Deploy database
- [ ] Migrar frontend a API
- [ ] Deploy frontend actualizado

---

**Última actualización:** 2 de enero de 2026  
**Estado actual:** ✅ Fase 1 completada  
**Próximo paso:** Fase 2 - Implementar módulo Events
