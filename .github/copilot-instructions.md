# Friends - AI Coding Agent Instructions

> Expense sharing platform • React 19 + NestJS + PostgreSQL • pnpm monorepo

**Live Demo:** [https://mrclit.github.io/friends-web/](https://mrclit.github.io/friends-web/)

---

## 🏗️ Monorepo Structure

**Workspaces:**

- `@friends/frontend` - React 19 + TanStack Query UI (`apps/frontend/`)
- `@friends/backend` - NestJS + TypeORM API (`apps/backend/`)
- `@friends/shared-types` - Shared TypeScript types (planned)

**Package Manager:** pnpm v10.27.0 • Workspaces in `apps/*` and `packages/*`

**Quick Commands:**

```bash
pnpm install                              # Install all workspaces
pnpm dev                                  # Frontend dev (localhost:5173)
pnpm dev:backend                          # Backend dev (localhost:3000)
pnpm --filter @friends/frontend test      # Run frontend tests
pnpm --filter @friends/backend test       # Run backend tests
pnpm -r build                             # Build all workspaces
```

**Workspace Dependencies:**

```bash
# Add to workspace
pnpm --filter @friends/frontend add lodash

# Add workspace dependency
pnpm --filter @friends/frontend add @friends/shared-types@workspace:*

# Add to root (shared dev deps)
pnpm add -D -w prettier
```

---

## 📱 Frontend (@friends/frontend)

**Stack:** React 19 • TypeScript • Vite • TanStack Query • Zustand (theme only) • TailwindCSS v4 • i18next

### Architecture Patterns

**Feature-Based Structure:**

```
src/features/{feature}/
  ├─ components/       # Feature UI
  ├─ types.ts         # Feature types
  ├─ constants.ts     # Config (e.g., PAYMENT_TYPE_CONFIG)
  └─ index.ts         # Barrel exports
```

**Export Convention: Named Exports Only**

- Always use **named exports** (`export function`, `export const`). Never use `export default`.
- Barrel files (`index.ts`) re-export with `export { X } from './X'` (not `export { default as X }`).
- For `React.memo` components, export as named const: `export const Foo = memo(function Foo() { ... })`.
- For `React.lazy`, use the adapter pattern: `lazy(() => import('./Foo').then(m => ({ default: m.Foo })))`.
- JSON file imports are the only exception (e.g., i18n translation files).

**State Management:**

- **Server State:** TanStack Query hooks in `src/hooks/api/` (queries, mutations, cache invalidation) - fully API-backed
- **UI State:** Minimal Zustand for theme only (`src/shared/store/useThemeStore.ts`)
- **localStorage:** Only used for language preference (i18n) - all event/transaction data comes from backend API

**API Integration:**

- Request wrapper: `src/api/client.ts` (handles `{ data: T }` unwrapping)
- API methods: `src/api/events.api.ts`, `src/api/transactions.api.ts`
- Hooks: `src/hooks/api/useEvents.ts`, `src/hooks/api/useTransactions.ts`
- Query keys: `src/hooks/api/keys.ts` (centralized)

**Key Patterns:**

```typescript
// Query hook pattern
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

// Mutation with cache invalidation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
```

### Domain Model

**Transaction Types:** `'contribution' | 'expense' | 'compensation'`

- Contributions: Money added to pot (blue)
- Expenses: Money spent (red)
- Compensations: Reimbursements (green)

**POT System:** Special participant `id: '0'` for shared expenses (orange UI)

**Config:** `src/features/transactions/constants.ts`

```typescript
PAYMENT_TYPE_CONFIG = {
  contribution: { icon: FaHandHoldingUsd, colors: { light: 'blue-100', strong: 'blue-800' } },
  expense: { icon: FaWallet, colors: { light: 'red-100', strong: 'red-800' } },
  compensation: { icon: FaHandshake, colors: { light: 'green-100', strong: 'green-800' } },
};
POT_CONFIG = { icon: FaPiggyBank, colors: { light: 'orange-100', strong: 'orange-800' } };
```

### i18n (i18next)

- **Languages:** `es` (default), `en`, `ca`
- **Pattern:** `feature.context.key` (e.g., `events.form.title`)
- **Formatting:** `formatAmount(amount, 'EUR')` for currency, `formatDateLong(date)` for dates
- **Locale mapping:** `'es'` → `'es-ES'`, `'en'` → `'en-US'`, `'ca'` → `'ca-ES'`

### Styling (TailwindCSS v4)

- **Plugin:** `@tailwindcss/vite` (not PostCSS)
- **Helper:** `cn()` from `@/lib/utils` for conditional classes
- **Theme:** Teal primary, semantic colors (blue=contributions, red=expenses, green=balance, orange=pot)
- **Dark mode:** `dark:` prefix, synced via `useThemeStore`

### Routing (React Router DOM 7)

- **HashRouter** (GitHub Pages compatibility)
- **Routes:** `/` (Home), `/event/:id` (Detail), `/event/:id/kpi/:kpi` (KPI drill-down)
- **Navigation:** `useNavigate()`, `useParams<{ id: string }>()`

### Testing (Vitest + Testing Library)

- Co-locate tests: `*.test.ts` next to source
- Setup: `src/test/setup.ts` (localStorage mocks, jest-dom)
- Run: `pnpm test` (watch), `pnpm test:run` (CI), `pnpm test:coverage`

### Common Tasks

**Add feature:**

1. Create `src/features/{feature}/` with types, components, constants
2. Export via `index.ts`
3. Add translations to `src/i18n/locales/{en,es,ca}/translation.json`

**Add API endpoint:**

1. Add method to `src/api/{resource}.api.ts`
2. Create hook in `src/hooks/api/use{Resource}.ts`
3. Update query keys in `src/hooks/api/keys.ts`
4. Use hook in component

---

## 🔧 Backend (@friends/backend)

**Stack:** NestJS • TypeORM • PostgreSQL • Swagger/OpenAPI

### Architecture

**Modular Structure:**

```
src/modules/{module}/
  ├─ {module}.controller.ts    # HTTP layer (routes, validation)
  ├─ {module}.service.ts       # Business logic
  ├─ {module}.module.ts        # Module definition
  ├─ entities/                 # TypeORM entities
  └─ dto/                      # Data Transfer Objects
```

**Global Configuration:**

- **API Prefix:** `/api` (all endpoints under `/api/*`)
- **Swagger Docs:** `/api/docs` (auto-generated)
- **CORS:** Configured for frontend origin (env: `CORS_ORIGIN`)
- **Response Format:** All responses wrapped as `{ data: T }` via `TransformInterceptor`
- **Validation:** Global `ValidationPipe` with `whitelist: true`, `transform: true`

### Key Patterns

**Standard Controller Pattern:**

```typescript
@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiStandardResponse(200, 'Event retrieved', Event)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }
}
```

**Service with Error Handling:**

```typescript
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }
}
```

**Entity with Relations:**

```typescript
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  participants: EventParticipant[];

  @OneToMany(() => Transaction, (tx) => tx.event, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### API Endpoints

**Events:**

```
GET    /api/events              # List all events
GET    /api/events/:id          # Get event by ID
POST   /api/events              # Create event
PATCH  /api/events/:id          # Update event
DELETE /api/events/:id          # Delete event (cascade to transactions)
GET    /api/events/:id/transactions  # Get event transactions (paginated)
```

**Transactions:**

```
POST   /api/events/:eventId/transactions          # Create transaction
GET    /api/events/:eventId/transactions          # Paginated list (query: page, limit)
PATCH  /api/transactions/:id                      # Update transaction
DELETE /api/transactions/:id                      # Delete transaction
```

### Database (TypeORM + PostgreSQL)

**Configuration:** `src/config/database.config.ts` (uses `ConfigService` for env vars)

**Entities:**

- `Event`: `id`, `title`, `participants` (JSONB), `createdAt`, `updatedAt`
- `Transaction`: `id`, `eventId`, `participantId`, `paymentType`, `amount`, `title`, `date`, `createdAt`

**Environment Variables:**

```bash
# .env.development
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=friends_db
CORS_ORIGIN=http://localhost:5173
```

### Development

```bash
# From root
pnpm dev:backend          # Start in watch mode

# From apps/backend/
pnpm start:dev           # Watch mode
pnpm build               # Production build
pnpm test                # Run tests
pnpm lint                # ESLint check
```

**Database Setup:**

```bash
# Docker Compose (from apps/backend/)
docker-compose up -d     # Start PostgreSQL container
```

### Best Practices

**1. Separation of Concerns:**

- Controllers handle HTTP (routing, validation, status codes)
- Services contain business logic only
- Entities define data structure and relations

**2. Validation:**

```typescript
// DTOs with class-validator
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventParticipantDto)
  participants: EventParticipantDto[];
}
```

**3. Error Handling:**

- Use NestJS exceptions: `NotFoundException`, `BadRequestException`, etc.
- Log with context: `this.logger.error('Event not found', { id })`
- Never expose sensitive data in errors

**4. Testing:**

- Unit tests: Mock repositories, test service logic
- E2E tests: Test full API endpoints with test database

**5. API Documentation:**

- Use Swagger decorators: `@ApiOperation`, `@ApiResponse`, `@ApiProperty`
- Custom decorator: `@ApiStandardResponse(status, description, type, isArray?)`

---

## 🔀 Git & CI/CD

**Commit Convention:**

- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `frontend`, `backend`, `shared-types`, `ci`

**Examples:**

```bash
feat(frontend): add transaction filtering
fix(backend): resolve database connection timeout
docs(monorepo): update workspace structure
```

**CI/CD Workflows:**

- `.github/workflows/deploy.yml` - Frontend deployment to GitHub Pages
- Tests run on PR to main/develop branches

---

## 📝 Common Development Tasks

### Testing Both Workspaces

```bash
pnpm -r test:run              # All tests
pnpm --filter @friends/frontend test:coverage
pnpm --filter @friends/backend test
```

### Debugging

**Frontend:**

- React DevTools extension
- TanStack Query DevTools (enabled in dev)
- Vite error overlay

**Backend:**

- NestJS Logger with context
- VS Code debugger
- Swagger docs at `/api/docs`

**Monorepo:**

```bash
pnpm list --depth 0           # Check workspace resolution
ls -la node_modules/@friends  # Verify symlinks
pnpm store prune             # Clear cache
```

### Environment Setup

**Frontend (`.env`):**

```bash
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEVTOOLS=true
```

**Backend (`.env.development`):**

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=friends_db
CORS_ORIGIN=http://localhost:5173
```

---

## 🤖 Copilot Code Generation Workflow

### Code Documentation Standards

**Language:** All code comments, documentation, and JSDoc annotations must be written in **English**.

- Inline comments: `// Calculate total balance`
- Block comments: `/* ... */`
- JSDoc: `/** @param {string} id - The event ID */`
- Component documentation: Always in English
- Function/method descriptions: Always in English

This applies to:

- Source code comments (TypeScript, JavaScript)
- Component documentation headers
- Function/method documentation
- Type definitions and interfaces
- README files and inline docs

**Exception:** User-facing content (i18n translation files) should remain in their respective languages.

---

When generating an implementation plan for a new feature, refactor, or fix involving multiple files, the documentation in `/docs` must follow this standard structure to maximize clarity, reproducibility, and navigability for both LLMs and human developers:

### Required Implementation Plan Structure

1. **Table of Contents**
   - List all main sections and subsections with anchors for easy navigation.

2. **Motivation and Objectives**
   - Why is this feature/change being implemented?
   - Concrete goals and scope.

3. **System Overview and Requirements**
   - Brief context, dependencies, and prerequisites.

4. **Solution Design**
   - 4.1. Detailed flow (diagrams, pseudocode, or clear step-by-step)
   - 4.2. Folder/file structure and affected areas
   - 4.3. Data models and migrations (with examples)
   - 4.4. API contracts (endpoints, request/response, errors)
   - 4.5. Security, roles, and validations
   - 4.6. Error handling and logging

5. **External Configuration and Prerequisites**
   - Steps for configuring external services, environment variables, etc.

6. **Step-by-Step Implementation Plan**
   - Ordered list of technical tasks, with atomic subtasks.

7. **Detailed Checklist**
   - Granular verification list, aligned with the plan.

8. **Testing and Validation**
   - Recommended test cases, mocks, and acceptance criteria.

9. **Deployment Notes and Environment Variables**
   - Example configuration, security warnings.

10. **References and Resources**
    - Links to official docs, articles, and relevant examples.

11. **Improvements and Lessons Learned**
    - Reflection on extensibility, possible improvements, and learnings.

### Additional Requirements

- The plan must be self-contained and easy to navigate.
- Include code examples, migrations, and API contracts where relevant.
- Explain the motivation for the structure at the end of the document.
- The level of detail must allow any LLM or developer to implement the feature without ambiguity or context switching.

---

**Last Updated:** January 12, 2026  
**Status:** Frontend ✅ Active • Backend ✅ Active
