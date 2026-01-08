# Friends Monorepo - AI Coding Agent Instructions

## 🏗️ Monorepo Overview

Friends is a **pnpm monorepo** for managing shared expenses at events. The project is organized into workspaces for scalability and code sharing.

### Project Structure

```
friends-web/
├── apps/
│   ├── frontend/          # @friends/frontend - React 19 app
│   └── backend/           # @friends/backend - NestJS API
├── packages/
│   ├── shared-types/      # @friends/shared-types - Shared TypeScript types (planned)
│   └── shared-utils/      # @friends/shared-utils - Shared utilities (planned)
├── docs/                  # Documentation
├── .github/
│   └── workflows/         # CI/CD pipelines
├── package.json           # Root package (friends-monorepo)
└── pnpm-workspace.yaml    # Workspace configuration
```

### Package Manager (pnpm)

- **Version**: v10.27.0
- **Configuration**: `"packageManager": "pnpm@10.27.0"` in root package.json
- **Lock file**: `pnpm-lock.yaml` (committed to repository)
- **Workspace config**: `pnpm-workspace.yaml` defines workspaces in `apps/*` and `packages/*`

### Working with Workspaces

**Install dependencies:**

```bash
pnpm install              # Install all workspaces
```

**Run commands in specific workspace:**

```bash
pnpm --filter @friends/frontend dev
pnpm --filter @friends/frontend test
pnpm --filter @friends/backend start:dev
```

**Run commands in all workspaces:**

```bash
pnpm -r build            # Build all workspaces
pnpm -r test             # Test all workspaces
pnpm -r --parallel dev   # Run dev servers in parallel
```

**Add dependencies:**

```bash
# To specific workspace
pnpm --filter @friends/frontend add react-query
pnpm --filter @friends/backend add @nestjs/typeorm

# To root (dev dependencies shared across all workspaces)
pnpm add -D -w husky

# Workspace dependencies (internal)
pnpm --filter @friends/frontend add @friends/shared-types@workspace:*
```

### Monorepo Conventions

**Naming:**

- Workspaces use scoped names: `@friends/{workspace}`
- Frontend: `@friends/frontend`
- Backend: `@friends/backend`
- Shared packages: `@friends/shared-*`

**Imports between workspaces:**

```typescript
// Import from shared-types in frontend or backend
import { Event, Transaction } from '@friends/shared-types';

// Import from shared-utils
import { formatCurrency } from '@friends/shared-utils';
```

**Path references:**

- Use relative paths within a workspace: `import { cn } from '@/lib/utils'`
- Use package names for cross-workspace: `import { Event } from '@friends/shared-types'`

---

## 📱 Frontend (@friends/frontend)

Located in `apps/frontend/`. React 19 + TypeScript application for the UI.

### Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **State Management**: Zustand (with LocalStorage persistence)
- **Styling**: TailwindCSS v4 + @tailwindcss/vite
- **UI Components**: Radix UI primitives
- **Icons**: react-icons
- **Routing**: React Router DOM 7 (HashRouter)
- **i18n**: i18next + react-i18next (es, en, ca)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint 9 (flat config)

### Frontend Development Workflow

**From monorepo root:**

```bash
pnpm dev                 # Start frontend dev server
pnpm build              # Build frontend
pnpm test               # Run frontend tests
pnpm lint               # Lint frontend
```

**From `apps/frontend/`:**

```bash
pnpm dev                # Dev server at localhost:5173/friends-web/
pnpm build             # TypeScript check + Vite build
pnpm preview           # Preview production build
pnpm test              # Vitest watch mode
pnpm test:run          # Vitest single run
pnpm test:ui           # Vitest UI
pnpm test:coverage     # Coverage report
pnpm lint              # ESLint check
```

### Frontend Architecture

**Feature-Based Organization:**

```
apps/frontend/src/features/{feature}/
  ├─ components/       # Feature UI components
  ├─ store/           # Feature Zustand store
  ├─ types.ts         # Feature TypeScript types
  ├─ constants.ts     # Feature constants (optional)
  └─ index.ts         # Public API exports
```

- **Features**: `events`, `transactions`, `kpi`
- **Barrel exports**: `import { EventsList } from '@/features/events'`
- **Never import directly from store files** - use store hooks

**State Management (React Query + Minimal Zustand):**

- Server state is managed with React Query hooks under `apps/frontend/src/hooks/api` (queries, mutations, cache invalidation).
- The theme uses a small Zustand store in `apps/frontend/src/shared/store/useThemeStore.ts` (no persist middleware).
- On mutations (create, update, delete), invalidate relevant queries (e.g., events list and event detail) and selectively remove caches when appropriate.

**Transaction System:**
Three payment types:

- `contribution`: Money added to event pot
- `expense`: Money spent from pot by participant
- `compensation`: Reimbursements to balance accounts

Constants:

- `PAYMENT_TYPES`: Array of all payment types
- `PAYMENT_TYPE_CONFIG`: Centralized config with icons and color variants
- `POT_CONFIG`: Special config for pot expenses (piggy bank icon, orange colors)

**Pot System:**

- `POT_PARTICIPANT_ID = '0'`: Special ID representing common pot
- Pot can only make expenses (not contributions or compensations)
- Pot expenses shown in KPI details with orange styling

**KPI System:**

- `KPIType`: `'balance' | 'contributions' | 'expenses' | 'pending'`
- All KPIs computed per-event AND per-participant
- Helper: `isPotExpense(transaction)` to check pot expenses

**Internationalization (i18next):**

- Languages: `en`, `es` (default), `ca`
- Files: `apps/frontend/src/i18n/locales/{lang}/translation.json`
- Key naming: `<feature>.<context>.<key>` (e.g., `events.form.title`)
- Locale mapping: `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`
- In components: `const { t } = useTranslation()` then `t('key.path')`
- **Amount formatting**: Use `formatAmount(amount, currency = 'EUR', useGrouping = true)`
- **Date formatting**: Use `formatDateLong(dateStr)` for locale-aware dates

**Styling (TailwindCSS v4):**

- Uses `@tailwindcss/vite` plugin (not PostCSS)
- Utility helper: `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Theme: Teal primary, dark mode support
- Color conventions:
  - Teal: Primary UI
  - Blue: Contributions
  - Red: Expenses
  - Green: Balance/compensation
  - Yellow: Pending amounts
  - Orange: Pot expenses

**Path Aliases:**

```typescript
"@": "/src"  // Configured in vite.config.ts
```

Use `@/` for internal imports: `import { cn } from '@/lib/utils'`

**Routing (React Router DOM 7):**

- Uses `HashRouter` (GitHub Pages compatibility)
- Routes:
  - `/` - Home (events list)
  - `/event/:id` - Event detail
  - `/event/:id/kpi/:kpi` - KPI drill-down
- Navigation: `useNavigate()` hook
- Route params: `useParams<{ id: string }>()`

### API Client (Frontend)

- Use the request wrapper in `apps/frontend/src/api/client.ts` for consistent error handling.
- Backend responses are wrapped as `{ data: T }`; the client extracts `json.data`.
- Prefer colocated hooks under `apps/frontend/src/hooks/api` (queries, mutations, invalidations) over direct `fetch`.

### API Types (Frontend)

- Source of truth: see `apps/frontend/src/api/types.ts`.
- **Event**: `id`, `title`, `participants: { id, name }[]`, `createdAt`, `updatedAt`.
- **CreateEventDto**: `title`, `participants: { id, name }[]`.
- **UpdateEventDto**: optional `title`, optional `participants`.
- **PaymentType**: `'contribution' | 'expense' | 'compensation'`.
- **Transaction**: `id`, `eventId`, `participantId`, `paymentType`, `amount`, `title`, `date`, `createdAt`.
- **CreateTransactionDto**: `title`, `participantId`, `paymentType`, `amount`, `date`.
- **UpdateTransactionDto**: optional `title`, `participantId`, `paymentType`, `amount`, `date`.
- **PaginatedTransactionsResponse**: `transactions: Transaction[]`, `hasMore`, `totalDates`, `loadedDates`.

**Testing (Vitest + Testing Library):**

- Setup: `apps/frontend/src/test/setup.ts` (mocks localStorage, jest-dom matchers)
- Pattern: Co-locate tests (`*.test.ts` next to source)
- Examples: `useEventsStore.test.ts`, `TransactionItem.test.tsx`

### Frontend Code Conventions

**Naming:**

- camelCase: variables, functions
- PascalCase: components
- useCamelCase: hooks

**Components:**

- Functional components with hooks only (no classes)
- Default exports (not named exports)
- UI Primitives: Radix UI in `apps/frontend/src/components/ui/`
- Icons: react-icons (`FaHandHoldingUsd`, `FaWallet`, `FaHandshake`, `FaPiggyBank`, `MdArrowBack`)

**Forms:**

- Controlled components with validation
- Use `required` attribute
- Disable submit when invalid
- Show loading/disabled states
- Implement dirty state tracking for unsaved changes

**Type Safety:**

- No `any` types - use proper TypeScript
- Types defined in feature `types.ts`
- Export through feature `index.ts`
- Share types across features when needed

**Common Frontend Tasks:**

1. **Add new feature:**
   - Create `apps/frontend/src/features/{feature}/`
   - Add `types.ts`, `store/use{Feature}Store.ts`, `components/`
   - Create `constants.ts` if needed
   - Export via `index.ts`
   - Add translations for es, en, ca

2. **Add translations:**
   - Update all three locale files
   - Use nesting: `feature.component.key`
   - Support pluralization (`_one`, `_other`)

3. **Create KPIs:**
   - Add calculation to `useTransactionsStore`
   - Update `KPIType` union
   - Add KPI configuration
   - Create UI component
   - Add translations

---

# Friends Monorepo — Copilot Coding Context (Concise)
## 🔧 Backend (@friends/backend)

Located in `apps/backend/`. NestJS + TypeScript API.

- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest


```bash
pnpm dev:backend        # Start backend dev server
```

**From `apps/backend/`:**
```bash
pnpm start:dev          # Start in watch mode
pnpm build             # Build for production
pnpm start:prod        # Start production server
### API Behavior

- Global API prefix: `/api` (configured in `main.ts`).
```
apps/backend/src/modules/{module}/
  ├─ {module}.service.ts       # Business logic
  ├─ {module}.module.ts        # Module definition
  ├─ entities/                 # TypeORM entities
  │  └─ {module}.entity.ts
  └─ dto/                      # Data Transfer Objects
     ├─ create-{module}.dto.ts
```

**Planned Modules:**

- `events`: Event CRUD operations
- `transactions`: Transaction management
- `auth`: Authentication (JWT)

**API Endpoints (Planned):**
```
# Events
GET    /api/events
GET    /api/events/:id
PATCH  /api/events/:id
DELETE /api/events/:id

# Transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

# Auth (optional)
**Database Schema (Planned):**

```sql
-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  participants TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  participant_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'contribution' | 'expense' | 'compensation'
  amount DECIMAL(10, 2) NOT NULL,
  concept VARCHAR(255),
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Environment Variables (Planned):**

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

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Backend Best Practices

**Naming Conventions:**

- camelCase: variables, functions, services
- PascalCase: classes, DTOs, entities
- kebab-case: file names (`events.controller.ts`)

**Architecture & Structure:**

- Follow NestJS modular architecture (one module per feature)
- Keep modules loosely coupled and highly cohesive
- Use dependency injection for all dependencies
- Separate business logic (services) from HTTP layer (controllers)
- Use repository pattern for database access
- Apply SOLID principles

**Controllers & Services:**

```typescript
// ✅ Controllers: HTTP layer only (routing, request/response)
@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }
}

// ✅ Services: Business logic only (no HTTP concerns)
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll() {
    return this.eventRepository.find();
  }
}

// ❌ Bad: Business logic in controller
@Controller('api/events')
export class EventsController {
  @Post()
  async create(@Body() dto: CreateEventDto) {
    // ❌ Don't do database operations in controllers
    return this.eventRepository.save(dto);
  }
}
```

**DTOs & Validation:**

- Use `class-validator` decorators on all DTOs
- Create separate DTOs for create/update operations
- Use `@ApiProperty()` for Swagger documentation
- Apply `ValidationPipe` globally with `transform: true` and `whitelist: true`
- Use `@Transform()` for data transformation (dates, numbers, etc.)
- Validate UUIDs with `@IsUUID()`, emails with `@IsEmail()`, etc.

```typescript
// ✅ Good: Validated DTO
export class CreateEventDto {
  @ApiProperty({ description: 'Event name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Event date', type: String, format: 'date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'List of participants', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
```

**Type Safety:**

- Use TypeScript strict mode
- Import types from `@friends/shared-types` when available
- Define entities with TypeORM decorators
- Never use `any` type

**Error Handling:**

- Use built-in HTTP exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, etc.
- Create custom exceptions when needed (extend `HttpException`)
- Use exception filters for global error handling
- Never expose sensitive information in error messages
- Log errors with context for debugging

```typescript
// ✅ Good: Specific exception
if (!event) {
  throw new NotFoundException(`Event with ID ${id} not found`);
}

// ❌ Bad: Generic error
throw new Error('Not found');
```

**Validation & Transformation:**

- Use `class-validator` decorators on all DTOs
- Apply `ValidationPipe` globally with `transform: true` and `whitelist: true`
- Use `@Transform()` for data transformation (dates, numbers, etc.)
- Validate UUIDs with `@IsUUID()`, emails with `@IsEmail()`, etc.
- Create custom validators for complex business rules

```typescript
// ✅ Good: Validated DTO
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
```

- **Authentication**: Use Passport.js with JWT strategy
- **Authorization**: Implement guards for role-based access control
- **CORS**: Configure whitelist of allowed origins (no `*` in production)
- **Rate Limiting**: Use `@nestjs/throttler` to prevent abuse
- **Helmet**: Add security headers with `helmet` middleware
- **Validation**: Always validate and sanitize user inputs
- **SQL Injection**: Use parameterized queries (TypeORM handles this)
- **Secrets**: Never commit secrets (use environment variables)
- **Password Hashing**: Use `bcrypt` with salt rounds >= 10

```typescript
// ✅ Good: Secure configuration
app.enableCors({
  origin: ['https://mrclit.github.io'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

// ❌ Bad: Insecure
app.enableCors({ origin: '*' });
```

**Database (TypeORM):**

- Define entities with proper decorators and relationships
- Use migrations for schema changes (never `synchronize: true` in production)
- Use transactions for multi-step operations
- Implement soft deletes when needed (`@DeleteDateColumn()`)
- Use indexes for frequently queried columns
- Avoid N+1 queries (use `relations` or `QueryBuilder`)
- Use UUIDs for primary keys (`@PrimaryGeneratedColumn('uuid')`)
- Always handle unique constraint violations

```typescript
// ✅ Good: Entity definition
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column('date')
  date: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.event, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ✅ Good: Using transactions
await this.dataSource.transaction(async (manager) => {
  await manager.save(event);
  await manager.save(transactions);
});
```

**Testing:**

- Write unit tests for services (business logic)
- Write E2E tests for controllers (API endpoints)
- Mock external dependencies (repositories, other services)
- Use descriptive test names: `should return 404 when event not found`
- Follow AAA pattern: Arrange, Act, Assert
- Use `Test.createTestingModule()` for dependency injection in tests
- Aim for >80% code coverage on critical paths

```typescript
// ✅ Good: Unit test structure
describe('EventsService', () => {
  let service: EventsService;
  let repository: Repository<Event>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get(getRepositoryToken(Event));
  });

  describe('findOne', () => {
    it('should return an event when found', async () => {
      // Arrange
      const mockEvent = { id: '1', name: 'Test' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockEvent);

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Logging & Monitoring:**

- Use built-in Logger or integrate Winston/Pino
- Log levels: `error`, `warn`, `log`, `debug`, `verbose`
- Include context in logs (module name, operation, user ID)
- Never log sensitive data (passwords, tokens, personal info)
- Use correlation IDs for request tracing
- Monitor performance metrics (response times, error rates)

```typescript
// ✅ Good: Contextual logging
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  async create(dto: CreateEventDto) {
    this.logger.log(`Creating event: ${dto.name}`);
    try {
      const event = await this.repository.save(dto);
      this.logger.log(`Event created successfully: ${event.id}`);
      return event;
    } catch (error) {
      this.logger.error(`Failed to create event: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

**API Design:**

- Follow REST conventions (GET, POST, PATCH, DELETE)
- Use plural resource names: `/api/events`, `/api/transactions`
- Use HTTP status codes correctly:
  - `200 OK`: Successful GET/PATCH
  - `201 Created`: Successful POST
  - `204 No Content`: Successful DELETE
  - `400 Bad Request`: Validation error
  - `401 Unauthorized`: Authentication required
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Resource doesn't exist
  - `500 Internal Server Error`: Unexpected error
- Version API: `/api/v1/events` (when breaking changes expected)
- Use pagination for list endpoints (`@Query('page')`, `@Query('limit')`)
- Document API with Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
- Return consistent response structure

```typescript
// ✅ Good: RESTful controller
@Controller('api/events')
@ApiTags('events')
export class EventsController {
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.eventsService.findAll(page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }
}
```

**Performance:**

- Use database indexes on frequently queried columns
- Implement caching for expensive operations (`@nestjs/cache-manager`)
- Use pagination for large datasets
- Avoid loading unnecessary relations (use `select` or `QueryBuilder`)
- Use connection pooling for database connections
- Implement compression middleware (`compression`)
- Profile slow queries and optimize them

**Configuration:**

- Use `@nestjs/config` for environment variables
- Validate configuration schema on startup
- Never hardcode values (URLs, ports, secrets)
- Use different configs for dev/staging/production
- Keep `.env` file in `.gitignore`

```typescript
// ✅ Good: Configuration module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

**Common Pitfalls to Avoid:**

- ❌ Mixing business logic in controllers
- ❌ Not validating DTOs
- ❌ Exposing internal errors to clients
- ❌ Using `synchronize: true` in production
- ❌ Not handling promise rejections
- ❌ Circular dependencies between modules
- ❌ Forgetting to add `@Injectable()` decorator
- ❌ Not using transactions for multi-step operations
- ❌ Hardcoding configuration values
- ❌ Not implementing pagination for lists

---

## 📦 Shared Packages

### @friends/shared-types (Planned)

Located in `packages/shared-types/`. Shared TypeScript types between frontend and backend.

**Purpose:**

- Single source of truth for data structures
- Type safety across workspaces
- Refactoring safety

**Structure:**

```
packages/shared-types/src/
├── event.types.ts          # Event, EventParticipant, CreateEventDto, UpdateEventDto
├── transaction.types.ts    # Transaction, PaymentType, CreateTransactionDto
├── kpi.types.ts           # KPIType, KPIConfig, EventKPIs
├── common.types.ts        # ApiResponse, PaginatedResponse, ErrorResponse
└── index.ts               # Barrel export
```

**Usage:**

```typescript
// In frontend or backend
import { Event, Transaction, PaymentType } from '@friends/shared-types';

const event: Event = {
  id: '1',
  name: 'Dinner',
  date: '2026-01-01',
  participants: [],
};
```

**Migration Plan:**

1. Create `packages/shared-types/` workspace
2. Move types from `apps/frontend/src/features/*/types.ts`
3. Add as dependency: `@friends/shared-types: "workspace:*"`
4. Update imports in frontend
5. Use same types in backend

### @friends/shared-utils (Planned)

Located in `packages/shared-utils/`. Shared utility functions.

**Potential utilities:**

- Currency formatting (if backend needs it)
- Date utilities
- Business logic validations
- Shared constants

---

## 🔀 Cross-Cutting Concerns

### TypeScript Configuration

**Root `tsconfig.json`:**

- Base configuration for all workspaces
- Extends in workspace-specific tsconfig files

**Workspace tsconfig:**

- Frontend: `apps/frontend/tsconfig.json` (React-specific)
- Backend: `apps/backend/tsconfig.json` (Node-specific)
- Shared: `packages/*/tsconfig.json` (Library-specific)

### Testing Strategy

**Unit Tests:**

- Frontend: Vitest + Testing Library
- Backend: Jest + Supertest
- Shared: Jest (when applicable)

**E2E Tests (Planned):**

- Integration tests between frontend and backend
- Playwright or Cypress for full user flows

**Test Commands:**

```bash
pnpm -r test:run        # Run all tests
pnpm test               # Run frontend tests (from root)
pnpm test:backend       # Run backend tests (when ready)
```

### Git Workflow

**Branch Strategy:**

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Convention:**

- Use conventional commits
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `frontend`, `backend`, `shared-types`, `monorepo`, `ci`

Examples:

```bash
feat(frontend): add transaction filtering
fix(backend): resolve database connection timeout
docs(monorepo): update README with workspace structure
chore(ci): update deployment workflow for monorepo
```

### CI/CD Pipelines

**GitHub Actions Workflows:**

**`.github/workflows/deploy.yml`** (Frontend deployment):

- Trigger: Push to `main`
- Jobs: build, deploy to GitHub Pages
- Uses pnpm with workspace filtering

**`.github/workflows/test.yml`** (Planned):

- Trigger: Pull requests, push to `develop`
- Jobs:
  - Lint all workspaces
  - Test frontend
  - Test backend
  - Type check shared-types

**Deployment:**

- Frontend: GitHub Pages (currently)
- Backend: Railway, Render, or Vercel (planned)
- Database: Managed PostgreSQL 17 (planned)

### Documentation

**Structure:**

- Root `README.md`: Monorepo overview
- `apps/frontend/README.md`: Frontend-specific docs
- `apps/backend/README.md`: Backend-specific docs
- `packages/*/README.md`: Package API documentation
- `docs/`: Extended documentation
  - `MONOREPO_MIGRATION.md`: Migration guide
  - `DEVELOPMENT.md`: Development setup
  - `ARCHITECTURE.md`: Architecture decisions

### Code Quality

**Linting:**

- Frontend: ESLint 9 (flat config)
- Backend: ESLint with NestJS plugin (planned)
- Shared: ESLint base config

**Formatting:**

- Prettier (optional, can be added to root)
- Consistent across all workspaces

**Type Checking:**

```bash
pnpm -r type-check      # Check all workspaces
```

### Environment Variables

**Frontend (`apps/frontend/.env`):**

```bash
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=false
VITE_APP_NAME=Friends
VITE_APP_VERSION=0.0.1
```

**Backend (`apps/backend/.env`):**

```bash
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/friends_db
JWT_SECRET=secret
CORS_ORIGIN=http://localhost:5173
```

---

## 📝 Common Monorepo Tasks

### Adding a New Workspace

1. **Create directory:**

   ```bash
   mkdir -p apps/new-app
   # or
   mkdir -p packages/new-package
   ```

2. **Create `package.json`:**

   ```json
   {
     "name": "@friends/new-app",
     "version": "0.0.0",
     "private": true
   }
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Add to documentation:**
   - Update root README
   - Create workspace README

### Working Across Workspaces

**Import shared types:**

```typescript
// Add dependency in workspace package.json
{
  "dependencies": {
    "@friends/shared-types": "workspace:*"
  }
}

// Import in code
import { Event } from '@friends/shared-types';
```

**Develop with hot reload:**

```bash
# Terminal 1: Frontend dev server
pnpm dev

# Terminal 2: Backend dev server (when ready)
pnpm dev:backend

# Or run both
pnpm -r --parallel dev
```

### Debugging Tips

**Frontend:**

- Use React DevTools browser extension
- Zustand DevTools (already configured)
- Vite's built-in error overlay

**Backend:**

- Use NestJS logger
- VS Code debugger with `launch.json`
- Attach to running process

**Monorepo:**

- Check workspace resolution: `pnpm list --depth 0`
- Verify symlinks: `ls -la node_modules/@friends`
- Clear cache: `pnpm store prune`

---

## 🎯 Next Steps for Implementation

1. ✅ Migrate to monorepo structure
2. ✅ Update documentation (READMEs)
3. 🚧 Create `@friends/backend` with NestJS
4. 🚧 Create `@friends/shared-types` package
5. 🚧 Migrate frontend types to shared-types
6. 🚧 Implement first API endpoints
7. 🚧 Connect frontend to backend API
8. 🚧 Add authentication
9. 🚧 Deploy backend
10. 🚧 Add E2E tests

---

**Last Updated:** January 1, 2026  
**Monorepo Status:** Configured, Frontend Active, Backend Active

### State Management (React Query + Minimal Zustand)

- **Server state via React Query**: hooks live under `apps/frontend/src/hooks/api` for queries, mutations, and cache invalidation.
- **Theme store**: `apps/frontend/src/shared/store/useThemeStore.ts` uses Zustand without persist middleware; syncs with localStorage and system preferences.
- **Cache strategy**: On mutations (create, update, delete), invalidate relevant queries (events list/detail, transactions by event) and selectively remove caches.

### Feature-Based Organization

```
src/features/{feature}/
  ├─ components/       # Feature UI components
  ├─ store/           # Feature Zustand store
  ├─ types.ts         # Feature TypeScript types
  ├─ constants.ts     # Feature constants (optional)
  └─ index.ts         # Public API exports
```

- Features: `events`, `transactions`, `kpi`
- Import from feature barrel exports: `import { EventsList } from '@/features/events'`
- **Never import directly from store files in components** - use store hooks
- Constants exported via `constants.ts` (e.g., `PAYMENT_TYPES`, `PAYMENT_TYPE_CONFIG` in transactions)

### Transaction System

Three payment types ([types.ts](../src/features/transactions/types.ts)):

- `contribution`: Money added to event pot
- `expense`: Money spent from pot by participant
- `compensation`: Reimbursements to balance accounts

**Payment Type Constants** ([constants.ts](../src/features/transactions/constants.ts)):

- `PAYMENT_TYPES`: Array of all payment types for iteration
- `PAYMENT_TYPE_CONFIG`: Centralized config with icon components and color variants (light/strong) for each type
- `POT_CONFIG`: Special config for pot expenses (piggy bank icon, orange colors)

**Pot System** ([pot.ts](../src/shared/constants/pot.ts)):

- `POT_PARTICIPANT_ID = '0'`: Special participant ID representing the common pot
- Pot can only make expenses (not contributions or compensations)
- Pot expenses shown in KPI details with special orange styling

**KPI calculations** in `useTransactionsStore`:

- `getPotBalanceByEvent`: contributions - compensations - expenses (includes pot expenses)
- `getPendingToCompensateByEvent`: expenses - compensations
- `getTotalPotExpensesByEvent`: Filter expenses by POT_PARTICIPANT_ID
- `getPotExpensesData`: Returns pot expenses data for KPI display
- **All KPIs computed per-event AND per-participant** (see store methods)
- Helper method `isPotExpense(transaction)`: Check if transaction is a pot expense

### KPI System

New feature structure: `src/features/kpi/`

- **Types** ([types.ts](../src/features/kpi/types.ts)):
  - `KPIType`: Union type for KPI identifiers (`'balance' | 'contributions' | 'expenses' | 'pending'`)
  - `KPIParticipantItem`: Display item with id, name, formatted value, and isPot flag
  - `KPIConfig`: Configuration interface for KPI components
- **Components** ([components/](../src/features/kpi/components/)):
  - `KPIDetailHeader`: Header with back button and title
  - `KPIParticipantsList`: List component that displays participants and pot with special styling
  - `KPIExplanation`: Displays contextual explanation for each KPI
- **Page**: [KPIDetail.tsx](../src/pages/KPIDetail.tsx) uses KPI feature components
- **Pot integration**: `expenses` KPI includes pot expenses when `getPotExpensesData()` returns data

### Internationalization (i18next)

- Three languages: `en`, `es` (default), `ca`
- Translation files: `src/i18n/locales/{lang}/translation.json`
- **Key naming**: Use pattern `<feature>.<context>.<key>` (e.g., `events.form.title`)
- **Locale mapping**: `getCurrentLocale()` from `src/i18n/index.ts` maps language codes to locale codes:
  - `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`
- **Pluralization**: Supports i18next pluralization (e.g., `participants_one`, `participants_other`)
- **Amount formatting**: Always use `formatAmount(amount, currency = 'EUR', useGrouping = true)` from `src/shared/utils/formatAmount.ts`
  - Uses `getCurrentLocale()` for locale-aware formatting
  - Default currency: EUR
  - Returns formatted string with currency symbol
- **Date formatting**: Use `formatDateLong(dateStr)` from `src/shared/utils/formatDateLong.ts`
  - Uses `getCurrentLocale()` for locale-aware formatting
  - Returns full format: weekday, year, month, day
- Both formatters automatically adapt to user's selected language
- In components: `const { t } = useTranslation()` then `t('key.path')`
- **Dynamic labels**: Use dynamic keys for context-sensitive translations (e.g., `t(\`transactionForm.participantLabel.${type}\`)`)

### Styling (TailwindCSS v4)

- **Use `@tailwindcss/vite` plugin** (not PostCSS) - see [vite.config.ts](../vite.config.ts#L7)
- Utility helper: `cn()` from `@/lib/utils` for conditional classes (uses `clsx` + `tailwind-merge`)
- Theme: Teal color scheme with dark mode support via `useThemeStore`
- Dark mode classes: Use `dark:` prefix (e.g., `dark:bg-teal-800`)
- **Color conventions**:
  - Teal: Primary color for UI (buttons, backgrounds, text)
  - Blue: Contributions (light: `bg-blue-100 text-blue-800`, dark: `dark:bg-blue-900 dark:text-blue-200`)
  - Red: Expenses (light: `bg-red-100 text-red-800`, dark: `dark:bg-red-900 dark:text-red-200`)
  - Green: Balance/compensation (light: `bg-green-100 text-green-800`, dark: `dark:bg-green-900 dark:text-green-200`)
  - Yellow: Pending amounts (light: `bg-yellow-100 text-yellow-800`, dark: `dark:bg-yellow-900 dark:text-yellow-200`)
  - Orange: Pot expenses (light/strong: `text-orange-800 dark:text-orange-200`, border: `border-orange-300 dark:border-orange-700`)
- **Responsive design**: Use `sm:`, `md:`, `lg:` prefixes for breakpoints
- **Animations**: Custom animations defined inline (e.g., `slideUp` in EventFormModal)

### Path Aliases

```typescript
"@": "/src"  // Configured in vite.config.ts
```

Always use `@/` imports: `import { cn } from '@/lib/utils'`

## Development Workflow

### Running the App

```bash
pnpm dev          # Dev server at localhost:5173
pnpm build        # TypeScript check + Vite build
pnpm preview      # Preview production build
```

### Testing (Vitest + Testing Library)

```bash
pnpm test         # Watch mode
pnpm test:run     # Single run
pnpm test:ui      # Vitest UI
pnpm test:coverage # Coverage report
```

- **Test setup**: [src/test/setup.ts](../src/test/setup.ts) - mocks localStorage, extends jest-dom matchers
- **Test pattern**: Co-locate tests with code (`*.test.ts` next to `*.ts`)
- Example: [useEventsStore.test.ts](../src/features/events/store/useEventsStore.test.ts)

### Code Quality

```bash
pnpm lint         # ESLint check
```

- Config: `eslint.config.js` (flat config format)
- Uses `@typescript-eslint`, `react-hooks`, `react-refresh` plugins

## Key Conventions

### Code Style

- **Naming**: camelCase for variables/functions, PascalCase for components, useCamelCase for hooks
- **Components**: Functional components with hooks only (no class components)
- **Composition**: Prefer component composition over logic duplication
- **Documentation**: JSDoc comments in English for functions and components
- **ID Generation**: Use `crypto.randomUUID()` for unique IDs

### Component Patterns

- **Default exports** for components (not named exports)
- **UI Primitives**: Radix UI for complex patterns (dropdowns, dialogs) in `src/components/ui/`
- **Icons**: Use react-icons for all icons
  - `FaHandHoldingUsd`: Contributions
  - `FaWallet`: Expenses
  - `FaHandshake`: Compensations
  - `FaPiggyBank`: Pot expenses
  - `MdArrowBack`: Navigation back
- **Forms**: Controlled components with validation, error handling, loading states
  - Use `required` attribute for form validation
  - Disable submit button when form is invalid
  - Show loading/disabled states during async operations
- **Modals**: State lifting pattern with submit/cancel actions (see [EventFormModal.tsx](../src/features/events/components/EventFormModal.tsx))
  - Implement dirty state tracking to prevent accidental data loss
  - Show confirmation dialog when closing with unsaved changes
  - Reset form state on close
- **Lists**: Use `map()` with unique `key` prop (prefer ID over index)
- **Conditional rendering**: Use ternary operator or `&&` for simple conditions
- **Transaction Type Selector**: Segmented control pattern with icons and labels ([TransactionTypeSelector.tsx](../src/features/transactions/components/TransactionTypeSelector.tsx))

### Type Safety

- **No `any` types** - use proper TypeScript types
- Domain types defined in feature `types.ts` files
- Export types through feature `index.ts`
- Share types across features when needed (e.g., `EventParticipant` used by transactions)

### Error Handling & Async

- Use try-catch for error handling
- Handle loading and error states explicitly
- Provide user feedback for async operations

### Demo Data

- Demo initializer: [DemoInitializer.tsx](../src/shared/components/DemoInitializer.tsx)
- Seed data: [demoData.ts](../src/shared/demo/demoData.ts)
- Checks localStorage before creating demo event

### Routing

- Uses `HashRouter` (for GitHub Pages compatibility)
- Routes in [App.tsx](../src/App.tsx):
  - `/` - Home (events list)
  - `/event/:id` - Event detail
  - `/event/:id/kpi/:kpi` - KPI detail drill-down
- **Navigation**: Use `useNavigate()` hook from react-router-dom
- **Route params**: Use `useParams<{ id: string }>()` for type-safe route parameters
- **KPI navigation**: KPI boxes are clickable and navigate to detail page

## Common Tasks

### Adding a New Feature

1. Create `src/features/{feature}/` directory
2. Add `types.ts`, `store/use{Feature}Store.ts`, `components/`
3. Create `constants.ts` if feature needs centralized configuration
4. Export public API via `index.ts`
5. Update imports in pages
6. Add translations for all three languages

### Adding Translations

1. Add keys to all three locale files: `src/i18n/locales/{en,es,ca}/translation.json`
2. Use consistent nesting: `feature.component.key`
3. Support pluralization when needed (add `_one` and `_other` variants)
4. Use dynamic keys for context-sensitive translations

### Creating New KPIs

1. Add calculation or selection logic to React Query hooks or local helpers.
2. Update `KPIType` union in `apps/frontend/src/features/kpi/types.ts`.
3. Add KPI configuration in KPIDetail page.
4. Create UI component in `features/events/components/` or use existing `KPIBox`.
5. Display in `EventDetail` page.
6. Add translations for KPI labels.

### Working with Transactions

1. Always use `PAYMENT_TYPE_CONFIG` for icons and colors.
2. Use `POT_PARTICIPANT_ID` when dealing with pot transactions.
3. Include pot option in transaction forms for expenses only.
4. Fetch and cache transactions by event via hooks in `apps/frontend/src/hooks/api/useTransactions.ts`.
5. Use type-safe `PaymentType` union for transaction types.
