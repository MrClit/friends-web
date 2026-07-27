# @friends/backend

> NestJS backend API for Friends expense sharing platform

**Status:** ✅ Operational - Auth, Events, Transactions, Users, Admin, KPIs

Backend RESTful API built with NestJS, TypeScript, PostgreSQL and TypeORM. Provides a complete REST API for managing events, participants, transactions, and KPIs.

## Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Available Scripts](#%EF%B8%8F-available-scripts)
- [Migrations by Environment](#-migrations-by-environment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database](#%EF%B8%8F-database)
- [Configuration](#%EF%B8%8F-configuration)
- [Testing](#-testing)
- [Development Tools](#-development-tools)
- [Integration](#-integration-with-frontend)
- [Resources](#-resources)

---

## 📦 Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM 0.3
- **Validation:** class-validator + class-transformer
- **API Documentation:** Swagger/OpenAPI (@nestjs/swagger)
- **Configuration:** @nestjs/config
- **Testing:** Jest 30

---

## 🚀 Quick Start

### 1️⃣ Environment Variables

```bash
cp .env.example .env.development
# Edit .env.development — fill in OAuth credentials (Google, Microsoft), JWT secret, Cloudinary keys
```

### 2️⃣ Start the Database

```bash
docker compose up -d
```

> **Note:** Use `docker compose` (no hyphen) if you have Docker Desktop. If it doesn't work, try `docker-compose` for older installations.

This will start PostgreSQL in a Docker container. The database will be available at `localhost:5432`.

### 3️⃣ Run Migrations

```bash
pnpm migration:run
```

### 4️⃣ Start the Backend Server

**From the monorepo root:**

```bash
pnpm --filter @friends/backend start:dev
```

**From this directory (`apps/backend/`):**

```bash
pnpm start:dev
```

### 5️⃣ Verify It Works

The server should start on port **3000** and you'll see:

```
🚀 Application is running on: http://localhost:3000/api
📚 Swagger documentation: http://localhost:3000/api/docs
🌐 CORS enabled for: http://localhost:5173
```

**Test the default endpoint:**

```bash
curl http://localhost:3000/api
```

**Access Swagger Documentation:**

Open in your browser: **http://localhost:3000/api/docs**

Swagger UI lets you:

- 📖 View all documented endpoints
- 🧪 Test endpoints interactively
- 📋 View DTO schemas and validations
- 📝 Auto-generate client code

---

## 🛑 Stop Everything

```bash
# Stop the backend server
# Press Ctrl+C in the terminal where it's running

# Stop the database
docker compose down
```

---

## ⚙️ Configuration

### Environment Variables

This project uses different `.env` files depending on the environment.

### 📁 Environment Files

```
.env.development    # Development variables (local)
.env.test           # Automated test variables (local)
.env.production     # Production variables (server)
.env.example        # Template with all variables
.env.test.example   # Template for test environment
```

### How It Works

The loaded file is determined automatically by the `NODE_ENV` variable:

```typescript
// In app.module.ts
envFilePath: `.env.${process.env.NODE_ENV || 'development'}`;
```

- If `NODE_ENV=development` → loads `.env.development`
- If `NODE_ENV=production` → loads `.env.production`
- By default (no NODE_ENV) → loads `.env.development`

### Available Variables

```bash
# Server
PORT=3000
NODE_ENV=development                # development | production | test

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=friends_db
DATABASE_SSL=false

# TypeORM
TYPEORM_SYNC=false                  # ⚠️ NEVER true in production
TYPEORM_LOGGING=true

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=replace-with-secure-random
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=30

# Google OAuth2
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=replace-with-microsoft-client-id
MICROSOFT_CLIENT_SECRET=replace-with-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:3000/api/auth/microsoft/callback

# Cloudinary (avatar storage)
CLOUDINARY_CLOUD_NAME=replace-with-cloudinary-cloud-name
CLOUDINARY_API_KEY=replace-with-cloudinary-api-key
CLOUDINARY_API_SECRET=replace-with-cloudinary-api-secret

# Frontend URL (used for OAuth redirects)
FRONTEND_URL=http://localhost:5173/friends-web/#
```

### Initial Configuration

```bash
# Copy the example file
cp .env.example .env.development

# Edit .env.development if you need different credentials
```

### 🔒 Security

**⚠️ NEVER commit to Git:**

- ❌ `.env.development` (local passwords)
- ❌ `.env.production` (production passwords)
- ❌ `.env` (generic file)

**✅ OK to commit to Git:**

- ✅ `.env.example` (template without sensitive values)

**📋 Secret Policy:**

- Review [Security Policy](../../.github/SECURITY.md) for secret generation, rotation, and incident handling

### Runtime Environments

**Local Development:**

```bash
# Automatically uses .env.development
pnpm start:dev

# Or explicitly
NODE_ENV=development pnpm start:dev
```

**Production:**

```bash
# Build with production variables
NODE_ENV=production pnpm build

# Start with production variables
NODE_ENV=production pnpm start:prod
```

**Testing:**

```bash
# Automatically uses .env.test (if it exists)
pnpm test
```

### 📌 Important Notes

1. **Development:**
   - `TYPEORM_SYNC=false` → Use migrations for schema management
   - SQL logging enabled for debugging

2. **Production:**
   - `TYPEORM_SYNC=false` → Always use migrations
   - Logging disabled for performance
   - CORS configured for specific domains only

3. **Load priority:**
   - System variables > .env file variables

---

## �️ Available Scripts

```bash
# Development
pnpm start:dev      # Development mode con hot reload
pnpm start:debug    # Debug mode

# Production
pnpm build          # Build para producción
pnpm start:prod     # Ejecutar en producción

# Testing
pnpm test           # Run unit tests
pnpm test:unit      # Run unit tests (alias explícito)
pnpm test:watch     # Tests en watch mode
pnpm test:all       # Run unit + integration + e2e
pnpm test:e2e       # Run e2e smoke tests (requiere PostgreSQL)
pnpm test:run       # Run unit tests in CI mode
pnpm test:coverage  # Generar coverage report
pnpm check:backend  # Lint + full backend test suite

# Code Quality
pnpm lint           # Lint code
pnpm lint:fix       # Lint y auto-fix

# Utilidades
pnpm clean          # Limpiar directorio dist
```

---

## 🗃️ Migrations by Environment

We use explicit commands per environment to avoid confusion between TypeScript source code (`src`) and production build (`dist`).

```bash
# Local (TypeScript datasource)
pnpm migration:run:local
pnpm migration:revert:local

# Production (Render, after build)
pnpm migration:run:prod

# Production start with automatic migrations
pnpm start:prod:migrate
```

Notes:

- `migration:run` and `migration:revert` remain available as compatibility aliases to `:local`.
- In production keep `TYPEORM_SYNC=false` and apply schema changes only through versioned migrations.

---

## 📂 Project Structure

```
src/
├── common/                          # Shared code
│   ├── health.controller.ts        # Health check endpoint
│   ├── decorators/                 # @CurrentUser(), @ApiStandardResponse()
│   ├── filters/                    # HttpExceptionFilter (global)
│   ├── interceptors/               # TransformInterceptor — wraps responses in { data }
│   └── middleware/                 # Request context middleware
│
├── config/                          # Configuration
│   ├── database.config.ts          # TypeORM configuration
│   └── app.config.ts               # App settings
│
├── modules/                         # Feature modules
│   ├── auth/                        # OAuth2 + JWT auth
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── entities/               # RefreshToken entity
│   │   ├── roles/                  # RolesGuard + @Roles() decorator
│   │   ├── services/               # AvatarService, OAuthProviderService, RefreshTokenService
│   │   └── strategies/             # JWT, Google OAuth, Microsoft OAuth
│   │
│   ├── events/                      # Events + KPI calculations
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.module.ts
│   │   ├── entities/               # Event entity
│   │   ├── dto/
│   │   └── services/               # EventKPIsService, EventParticipantsService, EventQueryService
│   │
│   ├── transactions/                # Transactions
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── transactions.module.ts
│   │   ├── entities/               # Transaction entity
│   │   ├── dto/
│   │   └── services/               # ParticipantValidationService, TransactionPaginationService
│   │
│   ├── users/                       # Current user profile
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── user.entity.ts
│   │
│   └── admin/                       # Admin user management
│       ├── admin-users.controller.ts
│       ├── admin-users.service.ts
│       └── admin.module.ts
│
├── app.module.ts                    # Root module
└── main.ts                          # Bootstrap
```

---

## 🔌 API Documentation

### 📚 Interactive Documentation (Swagger)

**Accede a Swagger UI:**  
🔗 **http://localhost:3000/api/docs**

La documentación Swagger proporciona:

- ✅ Explorador interactivo de todos los endpoints
- ✅ Schemas completos de DTOs con validaciones
- ✅ Prueba de endpoints con respuestas en tiempo real
- ✅ Especificación OpenAPI exportable

---

### Health Check

```
GET    /api               # API status
GET    /api/health/live   # Liveness check
GET    /api/health/ready  # Readiness check
```

### Auth

```
GET    /api/auth/google              # Redirect to Google OAuth consent
GET    /api/auth/google/callback     # Google OAuth callback
GET    /api/auth/microsoft           # Redirect to Microsoft OAuth consent
GET    /api/auth/microsoft/callback  # Microsoft OAuth callback
POST   /api/auth/refresh             # Refresh access token (body: { refreshToken })
POST   /api/auth/logout              # Invalidate refresh token
GET    /api/auth/me                  # Current authenticated user
```

### Users (authenticated)

```
GET    /api/users         # List all users (for participant search)
GET    /api/users/search  # Search users by name/email
GET    /api/users/me      # Current user profile
PATCH  /api/users/me      # Update current user profile (name, avatar)
```

### Events

```
GET    /api/events           # List events (query: ?status=active|archived)
POST   /api/events           # Createte event
GET    /api/events/:id       # Get event by ID
PATCH  /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event (cascade deletes transactions)
GET    /api/events/:id/kpis  # Get KPI calculations for an event
```

### Transactions

```
GET    /api/events/:eventId/transactions            # List transactions for an event
GET    /api/events/:eventId/transactions/paginated  # Date-paginated transactions
POST   /api/events/:eventId/transactions            # Createte transaction
PATCH  /api/transactions/:id                        # Update transaction
DELETE /api/transactions/:id                        # Delete transaction
```

### Admin (ADMIN role required)

```
GET    /api/admin/users       # List all users
POST   /api/admin/users       # Createte user
PATCH  /api/admin/users/:id   # Update user (role, status)
DELETE /api/admin/users/:id   # Soft-delete user
```

**Paginación de transacciones:**

```
GET /api/events/:eventId/transactions/paginated?numberOfDates=3&offset=0
```

**Query Parameters:**

- `numberOfDates` (opcional): Número de fechas únicas a retornar (default: 3, min: 1, max: 50)
- `offset` (opcional): Offset para pagination (default: 0, min: 0)

**Respuesta:**

```json
{
  "data": {
    "transactions": [...],
    "hasMore": true,
    "totalDates": 10,
    "loadedDates": 3
  }
}
```

> 💡 **Tip:** Prueba este endpoint interactivamente en [Swagger UI](http://localhost:3000/api/docs) para ver las validaciones en acción.

---

## 📤 Response Format

### Standard Wrapper for Successful Responses

All successful responses (200, 201) are wrapped in a standard format:

```json
{
  "data": <response content>
}
```

**Examples:**

```json
// GET /api/events/:id (Single entity)
{
  "data": {
    "id": "uuid",
    "title": "Dinner Party",
    "participants": [...]
  }
}

// GET /api/events (Array)
{
  "data": [
    { "id": "uuid1", "title": "Event 1" },
    { "id": "uuid2", "title": "Event 2" }
  ]
}

// POST /api/events (Createted entity)
{
  "data": {
    "id": "uuid",
    "title": "New Event",
    "participants": [...]
  }
}
```

### Exceptions

**DELETE operations (204 No Content):**

- No response body returned
- HTTP Status: 204

**Errors:**

- Do NOT use `{ data }` wrapper
- Standardized format with `HttpExceptionFilter`:

```json
{
  "statusCode": 404,
  "timestamp": "2026-01-03T12:00:00.000Z",
  "path": "/api/events/invalid-uuid",
  "method": "GET",
  "message": "Event with ID invalid-uuid not found"
}
```

### Implementation

- **Interceptor**: `TransformInterceptor` (activated globally)
- **Swagger**: Responses documented with `@ApiStandardResponse`
- **Client**: Always access `.data` to get the content

---

## 🗄️ Database

### Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  participants JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Participants JSONB structure** — discriminated union:

```json
[
  { "type": "user", "id": "<uuid>", "name": "Alice", "avatar": "...", "contributionTarget": 50 },
  { "type": "guest", "id": "g-abc123", "name": "Bob", "contributionTarget": 30 },
  { "type": "pot", "id": "0" }
]
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  payment_type payment_type_enum NOT NULL,  -- 'contribution' | 'expense' | 'compensation'
  amount DECIMAL(10, 2) NOT NULL,
  participant_id VARCHAR(50) NOT NULL,      -- '0' for POT or participant ID
  date DATE NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE payment_type_enum AS ENUM ('contribution', 'expense', 'compensation');
```

**Special Participant ID:**

- `'0'`: Represents the "common pot" (POT) for shared expenses

---

## ⚠️ Database Dependencies

### PostgreSQL Window Functions

The **transaction pagination** endpoint (`GET /api/events/:eventId/transactions/paginated`) uses **PostgreSQL window functions** (specifically `DENSE_RANK()`) to optimize performance when paginating by unique dates.

**Optimized query:**

```sql
WITH RankedTransactions AS (
  SELECT
    t.*,
    DENSE_RANK() OVER (ORDER BY t.date DESC) as date_rank
  FROM transactions t
  WHERE t."eventId" = :eventId
)
SELECT * FROM RankedTransactions
WHERE date_rank > :offset AND date_rank <= :offset + :numberOfDates
ORDER BY date DESC, createdAt DESC;
```

**Considerations:**

- ✅ **Window functions** are part of the SQL:2003 standard
- ✅ Supported by: **PostgreSQL 8.4+**, MySQL 8.0+, SQL Server 2005+, Oracle 8i+, SQLite 3.25+
- ⚠️ **PostgreSQL-specific elements:**
  - Double quotes for case-sensitive columns: `t."eventId"`
  - If migrating to another DB, adjust quotes (MySQL uses backticks `` `eventId` ``, SQL Server uses `[eventId]`)

**Impact on database migration:**

- If migrating to another modern DB → Minor change (adjust quotes)
- If migrating to DB without window functions → Implement fallback with 2 queries
- **Decision:** We maintain the optimization because:
  - PostgreSQL is our primary target
  - Performance benefit > migration risk
  - DB migration is infrequent

**Portable alternative (not implemented):**

```typescript
// Fallback without window functions (2 queries)
const dates = await getDates(eventId, numberOfDates, offset);
const transactions = await getTransactionsByDates(eventId, dates);
```

> 💡 **Tip:** If you need maximum portability in the future, refactor to TypeORM QueryBuilder or implement conditional fallback by DB type.

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Full backend test suite (unit + integration + e2e)
pnpm test:all

# Unit tests (CI mode)
pnpm test:run

# Watch mode
pnpm test:watch

# E2E smoke tests (real JWT + real DB)
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Pre-PR local check (lint + unit + integration + e2e)
pnpm check:backend

# Debug tests
pnpm test:debug
```

Recommended preparation for e2e:

```bash
# 1) Createte your test environment file
cp .env.test.example .env.test

# 2) Createte the test database (once)
docker exec -it friends-postgres createdb -U postgres friends_db_test
```

> If the database already exists, the `createdb` command may return an error and can be ignored.

---

## 🔧 Useful Commands

### Database

```bash
# View database logs
docker compose logs -f

# Connect to PostgreSQL
docker exec -it friends-postgres psql -U postgres -d friends_db

# Restart the database (clean start)
docker compose down -v && docker compose up -d

# Stop and remove volumes
docker compose down -v
```

### Backend

```bash
# Check server status
curl http://localhost:3000/api

# Health check
curl http://localhost:3000/api/health/live

# View logs (appear in terminal in dev mode)
```

---

## � HTTP Requests - Interactive Testing

This project includes a collection of `.http` files to test the API interactively directly from VS Code.

### Requirements

**VS Code Extension:**

- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) by Huachao Mao

```bash
# Quick install from CLI
code --install-extension humao.rest-client
```

### File Structure

```
http-requests/
├── _common.http          # Health check and common variables
├── events.http           # Full event CRUD + error cases
├── transactions.http     # Full transaction CRUD + pagination
└── .gitignore           # Ignore private variables
```

### Variable Configuration

The `.http` files use variables configured in `.vscode/settings.json`:

```json
{
  "rest-client.environmentVariables": {
    "development": {
      "baseUrl": "http://localhost:3000/api",
      "contentType": "application/json"
    },
    "production": {
      "baseUrl": "https://your-production-url.com/api",
      "contentType": "application/json"
    }
  }
}
```

> **Note:** If `.vscode/settings.json` doesn't exist, create it in the monorepo root with the above configuration.

### How to Use

**1. Switch Environment:**

- Open any `.http` file
- Click the environment selector in the VS Code bottom bar
- Or use: `Cmd+Shift+P` → "REST Client: Switch Environment"
- Select `development` or `production`

**2. Execute Requests:**

- Open `http-requests/events.http` or `http-requests/transactions.http`
- Click "Send Request" that appears above each request
- Or use: `Cmd+Alt+R` (Mac) / `Ctrl+Alt+R` (Windows/Linux)
- Results appear in a side panel

**3. Dynamic Variables:**

Files use variables that are captured automatically:

```http
### Createte event and save its ID
# @name createEvent
POST {{baseUrl}}/events
Content-Type: {{contentType}}

{
  "title": "My Event",
  "participants": [...]
}

### Save the created event ID
@createdEventId = {{createEvent.response.body.id}}

### Use the ID in following requests
GET {{baseUrl}}/events/{{createdEventId}}
```

### Available Collections

#### **\_common.http**

```http
# API health check
GET {{baseUrl}}/health/live
```

#### **events.http**

- ✅ List all events
- ✅ Createte event with participants
- ✅ Get event by ID
- ✅ Update event title
- ✅ Update event participants
- ✅ Delete event (cascade delete)
- ❌ Error cases (validation, 404, invalid UUID)

#### **transactions.http**

- ✅ List transactions by event
- ✅ Createte contribution
- ✅ Createte participant expense
- ✅ Createte POT expense (`participantId: "0"`)
- ✅ Createte compensation
- ✅ Get transaction by ID
- ✅ Update transaction
- ✅ Delete transaction
- ✅ Pagination by unique dates
- ❌ Error cases (validation, invalid types)
- 🔄 Complete workflow example

### Usage Examples

**Typical workflow with Events:**

```bash
1. Open: http-requests/events.http
2. Execute: "CREATE EVENT" (line ~16)
3. ID is automatically saved to @createdEventId
4. Execute: "GET EVENT BY ID" (uses @createdEventId)
5. Execute: "UPDATE EVENT" (modify the event)
6. Execute: "DELETE EVENT" (cleanup)
```

**Typical workflow with Transactions:**

```bash
1. Open: http-requests/transactions.http
2. Change @eventId with a real ID from your DB (line ~9)
3. Execute: "CREATE TRANSACTION - Contribution"
4. Execute: "CREATE TRANSACTION - Expense"
5. Execute: "LIST TRANSACTIONS BY EVENT"
6. Execute: "GET PAGINATED TRANSACTIONS" (see pagination)
```

**Testing validations:**

```bash
1. Find the "ERROR CASES" section in any file
2. Execute invalid requests to see how the API responds
3. Check status codes: 400, 404, etc.
```

### Advantages over Postman/Thunder Client

- ✅ **Versionable:** `.http` files are included in the repo
- ✅ **No extra config:** Works directly in VS Code
- ✅ **Dynamic variables:** Captures responses automatically
- ✅ **Lightweight:** No external application needed
- ✅ **Living documentation:** Requests serve as usage examples

### Tips

- **Keyboard shortcuts:**
  - `Cmd+Alt+R` / `Ctrl+Alt+R`: Execute request
  - `Cmd+Alt+C` / `Ctrl+Alt+C`: Cancel request
  - `Cmd+Alt+H` / `Ctrl+Alt+H`: View history

- **Private environment variables:**
  - Createte `http-client.private.env.json` for tokens/secrets
  - This file is in `.gitignore` automatically

- **Multiple requests:**
  - Select multiple requests with `Shift+Click` on "Send Request"
  - Or use `Cmd+Alt+K` / `Ctrl+Alt+K` to execute all

---

## 🔗 Frontend Integration

The backend integrates with [@friends/frontend](../frontend/) via REST API.

### Response Format

**All successful responses are wrapped in `{ data: T }`:**

```typescript
// Example API client in frontend
const API_BASE = 'http://localhost:3000/api';

export const api = {
  events: {
    getAll: () =>
      fetch(`${API_BASE}/events`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data

    getById: (id: string) =>
      fetch(`${API_BASE}/events/${id}`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data

    create: (data: CreateteEventDto) =>
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data
  },

  transactions: {
    getByEvent: (eventId: string) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data

    getPaginated: (eventId: string, numberOfDates = 3, offset = 0) =>
      fetch(`${API_BASE}/events/${eventId}/transactions/paginated?numberOfDates=${numberOfDates}&offset=${offset}`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data

    create: (eventId: string, data: CreateteTransactionDto) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Access .data
  },
};
```

### Error Handling

```typescript
async function fetchEvent(id: string) {
  try {
    const response = await fetch(`${API_BASE}/events/${id}`);

    if (!response.ok) {
      const error = await response.json();
      // Error structure: { statusCode, timestamp, path, method, message }
      throw new Error(error.message);
    }

    const { data } = await response.json();
    return data; // Event object
  } catch (error) {
    console.error('Failed to fetch event:', error);
    throw error;
  }
}
```

- ✅ Unit tests

### Transactions Module

- ✅ Complete transaction CRUD
- ✅ Entity with UUID, title, paymentType (enum), amount, participantId, date
- ✅ ManyToOne relationship with Events (ON DELETE CASCADE)
- ✅ Validated DTOs (CreateteTransactionDto, UpdateTransactionDto, PaginationQueryDto)
- ✅ Service with complete business logic
- ✅ Controller with nested endpoints under events
- ✅ Pagination by unique dates (optimized with SQL window functions)
- ✅ POT support (participant_id = '0')
- ✅ Complete Swagger documentation
- ✅ Unit tests

### Health & Monitoring

- ✅ Health check endpoints (`/api/health/live`, `/api/health/ready`)
- ✅ Database connectivity check
- ✅ Contextual logging in all services

---

## 📚 Resources

### Official Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [class-validator Documentation](https://github.com/typestack/class-validator)

### Related Documentation

- [Frontend Integration](../frontend/README.md) - How the frontend consumes this API
- [Deployment Guide](../../DEPLOYMENT.md) - Canonical production deployment and rollback runbook
- [Security Policy](../../.github/SECURITY.md) - Secret management and security guidelines

---

**Part of the Friends monorepo**  
[← Back to monorepo root](../../README.md) | [View Frontend →](../frontend/README.md)
