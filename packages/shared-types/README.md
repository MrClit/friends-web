# @friends/shared-types

> Shared TypeScript types between frontend and backend

**Status:** 🚧 Planned - Not yet implemented

This package will contain all shared TypeScript type definitions used by both the frontend and backend applications.

---

## 📦 Installation

This is an internal workspace package. Add it as a dependency:

```json
// apps/frontend/package.json or apps/backend/package.json
{
  "dependencies": {
    "@friends/shared-types": "workspace:*"
  }
}
```

---

## 🎯 Purpose

- **Type Safety:** Ensure frontend and backend use the same data structures
- **Single Source of Truth:** Define types once, use everywhere
- **Refactoring Safety:** Changes propagate automatically
- **Development Speed:** No need to duplicate type definitions

---

## 📂 Planned Structure

```
src/
├── event.types.ts          # Event-related types
├── transaction.types.ts    # Transaction-related types
├── participant.types.ts    # Participant-related types
├── kpi.types.ts           # KPI and analytics types
├── common.types.ts        # Common/utility types
└── index.ts               # Barrel export
```

---

## 📝 Planned Types

### Event Types

```typescript
// src/event.types.ts
export interface Event {
  id: string;
  name: string;
  date: string; // ISO date string
  location?: string;
  participants: EventParticipant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventParticipant {
  id: string;
  name: string;
}

export interface CreateEventDto {
  name: string;
  date: string;
  location?: string;
  participants: string[]; // Array of participant names
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}
```

### Transaction Types

```typescript
// src/transaction.types.ts
export type PaymentType = 'contribution' | 'expense' | 'compensation';

export interface Transaction {
  id: string;
  eventId: string;
  participantId: string;
  type: PaymentType;
  amount: number;
  concept?: string;
  date: string; // ISO date string
  createdAt?: string;
}

export interface CreateTransactionDto {
  eventId: string;
  participantId: string;
  type: PaymentType;
  amount: number;
  concept?: string;
  date: string;
}

export interface UpdateTransactionDto extends Partial<Omit<CreateTransactionDto, 'eventId'>> {}
```

### KPI Types

```typescript
// src/kpi.types.ts
export type KPIType = 'balance' | 'contributions' | 'expenses' | 'pending';

export interface KPIParticipantItem {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  isPot?: boolean;
}

export interface KPIConfig {
  type: KPIType;
  title: string;
  description: string;
  icon: string;
}

export interface EventKPIs {
  balance: number;
  contributions: number;
  expenses: number;
  pending: number;
  potExpenses?: number;
}
```

### Common Types

```typescript
// src/common.types.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
}
```

---

## 🔧 Usage Examples

### Frontend (React)

```typescript
import { Event, Transaction, PaymentType } from '@friends/shared-types';

// Component props
interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
}

// State typing
const [events, setEvents] = useState<Event[]>([]);
const [transactions, setTransactions] = useState<Transaction[]>([]);

// Function parameters
function createTransaction(data: CreateTransactionDto): Promise<Transaction> {
  return fetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(res => res.json());
}
```

### Backend (NestJS)

```typescript
import { Event, CreateEventDto, UpdateEventDto } from '@friends/shared-types';

// Controller
@Controller('events')
export class EventsController {
  @Post()
  create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto);
  }
}

// Service
@Injectable()
export class EventsService {
  async findAll(): Promise<Event[]> {
    return this.eventRepository.find();
  }

  async findOne(id: string): Promise<Event> {
    return this.eventRepository.findOne({ where: { id } });
  }
}
```

---

## 📋 Package Configuration

**`package.json`:**
```json
{
  "name": "@friends/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~5.8.3"
  }
}
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

---

## 🎨 Best Practices

### 1. Keep Types Pure
```typescript
// ✅ Good - Pure type definition
export interface Event {
  id: string;
  name: string;
}

// ❌ Bad - Don't include logic or implementations
export interface Event {
  id: string;
  name: string;
  save(): Promise<void>; // Logic belongs in services
}
```

### 2. Use DTOs for API Boundaries
```typescript
// ✅ Separate types for creation vs. entity
export interface CreateEventDto {
  name: string;
  date: string;
}

export interface Event extends CreateEventDto {
  id: string;
  createdAt: string;
}
```

### 3. Leverage TypeScript Utilities
```typescript
// Partial for updates
export type UpdateEventDto = Partial<CreateEventDto>;

// Omit for derived types
export type EventWithoutParticipants = Omit<Event, 'participants'>;

// Pick for subsets
export type EventSummary = Pick<Event, 'id' | 'name' | 'date'>;
```

### 4. Document Complex Types
```typescript
/**
 * Represents a financial transaction in an event.
 * 
 * @property type - The transaction type: contribution (money in), 
 *                  expense (money out), or compensation (balancing)
 * @property amount - Amount in cents (to avoid floating point issues)
 */
export interface Transaction {
  type: PaymentType;
  amount: number;
}
```

---

## 🔄 Migration from Frontend Types

When creating this package, migrate types from:
- `apps/frontend/src/features/events/types.ts`
- `apps/frontend/src/features/transactions/types.ts`
- `apps/frontend/src/features/kpi/types.ts`

Then update frontend imports:
```typescript
// Before
import { Event } from '@/features/events/types';

// After
import { Event } from '@friends/shared-types';
```

---

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [NestJS DTOs](https://docs.nestjs.com/controllers#request-payloads)

---

> Part of the Friends monorepo • [Back to root](../../)
