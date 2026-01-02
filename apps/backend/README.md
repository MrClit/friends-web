# @friends/backend

> NestJS backend API for Friends expense sharing platform

**Status:** ✅ Phase 1 Complete - Setup and Configuration Done

This is the backend workspace of the Friends monorepo, built with NestJS, TypeScript, and PostgreSQL.

---

## 🎯 Implementation Status

### ✅ Phase 1: Initial Setup (COMPLETED)

- [x] Install dependencies (NestJS + TypeORM + PostgreSQL)
- [x] Create folder structure (common, config, modules)
- [x] Configure environment variables (.env, .env.example)
- [x] Configure TypeORM with PostgreSQL
- [x] Configure CORS for frontend (localhost:5173)
- [x] Setup global validation pipes
- [x] Setup exception filters

### 🚧 Phase 2: Events Module (Next)

- [ ] Create Event entity with JSONB participants
- [ ] Create DTOs and validation
- [ ] Implement EventsService
- [ ] Implement EventsController
- [ ] Unit and E2E tests

---

## 📦 Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM
- **Validation:** class-validator + class-transformer
- **Config:** @nestjs/config

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (running locally or Docker)

### Database Setup

**Option 1: Using Docker (Recommended)**

```bash
# Start PostgreSQL in Docker
docker compose up -d

# Check logs
docker compose logs -f

# Stop database
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

> **Note:** Use `docker compose` (without hyphen) for Docker Desktop. If you get "command not found", install Docker Desktop from https://www.docker.com/products/docker-desktop

**Option 2: Install PostgreSQL locally**

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb friends_db
```

**Configure environment:**

```bash
cp .env.example .env
# Edit .env if you need different credentials
```

### Running the App

From the **monorepo root**:

```bash
# Install dependencies
pnpm install

# Start database (if using Docker)
cd apps/backend && docker compose up -d && cd ../..

# Start backend in development mode
pnpm --filter @friends/backend start:dev
```

From **this directory** (`apps/backend/`):

```bash
# Start database (Docker)
docker compose up -d

# Start development server
pnpm start:dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

**Available Scripts:**

```bash
pnpm start:dev      # Development mode with hot reload
pnpm start:debug    # Debug mode
pnpm start:prod     # Production mode
pnpm build          # Build for production
pnpm test           # Run unit tests
pnpm test:watch     # Run tests in watch mode
pnpm test:cov       # Generate coverage report
pnpm test:e2e       # Run E2E tests
pnpm lint           # Lint code
pnpm format         # Format code with Prettier
```

---

## 📦 Tech Stack (Planned)

- **Framework:** NestJS 10+
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM
- **Validation:** class-validator + class-transformer
- **Authentication:** Passport.js + JWT
- **API Docs:** Swagger/OpenAPI
- **Testing:** Jest + Supertest
- **Configuration:** @nestjs/config with environment variables

---

## 📂 Project Structure

```
src/
├── common/                         # ✅ Shared code (Phase 1)
│   ├── filters/                   # Exception filters
│   │   └── http-exception.filter.ts
│   ├── interceptors/              # Response transformers
│   │   └── transform.interceptor.ts
│   ├── pipes/                     # Validation pipes
│   │   └── validation.pipe.ts
│   ├── guards/                    # Auth guards (future)
│   └── decorators/                # Custom decorators (future)
│
├── config/                         # ✅ Configuration (Phase 1)
│   ├── database.config.ts         # TypeORM configuration
│   └── app.config.ts              # App settings
│
├── modules/                        # 🚧 Feature modules
│   ├── events/                    # 🚧 Phase 2
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.module.ts
│   │   ├── entities/
│   │   │   └── event.entity.ts
│   │   └── dto/
│   │       ├── create-event.dto.ts
│   │       └── update-event.dto.ts
│   │
│   └── transactions/              # 🚧 Phase 3
│       ├── transactions.controller.ts
│       ├── transactions.service.ts
│       ├── transactions.module.ts
│       ├── entities/
│       │   └── transaction.entity.ts
│       └── dto/
│           ├── create-transaction.dto.ts
│           ├── update-transaction.dto.ts
│           └── paginated-transactions.dto.ts
│
├── app.module.ts                   # ✅ Root module (Phase 1)
└── main.ts                         # ✅ Bootstrap (Phase 1)
```

**Legend:**

- ✅ Implemented (Phase 1)
- 🚧 Planned (Future phases)

---

## 🔌 API Endpoints (Planned)

### Events

```
GET    /api/events           # List all events
POST   /api/events           # Create event
GET    /api/events/:id       # Get event by ID
PATCH  /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event
```

### Transactions

```
GET    /api/events/:eventId/transactions      # List transactions for event
POST   /api/events/:eventId/transactions      # Create transaction
GET    /api/transactions/:id                  # Get transaction by ID
PATCH  /api/transactions/:id                  # Update transaction
DELETE /api/transactions/:id                  # Delete transaction
```

### Participants

```
GET    /api/events/:eventId/participants      # List participants for event
POST   /api/events/:eventId/participants      # Add participant
DELETE /api/participants/:id                  # Remove participant
```

### Authentication (Optional)

```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login
POST   /api/auth/refresh     # Refresh token
GET    /api/auth/profile     # Get current user
```

---

## 🗄️ Database Schema (Planned)

### Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  participants TEXT[], -- JSON array of participant names
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table

```sql
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

---

## ⚙️ Environment Variables (Planned)

Create a `.env` file:

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

---

## 🧪 Testing (Planned)

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

---

## 🔧 Development Setup (When Ready)

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 15+
- Docker (optional, for local database)

### Setup Steps

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Setup database:**

   ```bash
   # Using Docker
   docker run --name friends-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

   # Or install PostgreSQL locally
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run migrations:**

   ```bash
   pnpm migration:run
   ```

5. **Start development server:**

   ```bash
   pnpm start:dev
   ```

6. **Visit API docs:**
   Open [http://localhost:3000/api](http://localhost:3000/api) for Swagger UI

---

## 📝 Implementation Roadmap

- [ ] Setup NestJS project structure
- [ ] Configure TypeORM with PostgreSQL
- [ ] Implement Events module (CRUD)
- [ ] Implement Transactions module (CRUD)
- [ ] Implement Participants module
- [ ] Add validation pipes
- [ ] Setup Swagger/OpenAPI documentation
- [ ] Implement authentication (JWT)
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Setup CORS for frontend integration
- [ ] Implement WebSockets (optional)
- [ ] Add logging and monitoring
- [ ] Setup Docker deployment

---

## 🔗 Integration with Frontend

The backend will integrate with [@friends/frontend](../frontend/) via REST API:

```typescript
// Frontend API client example
import { Event } from '@friends/shared-types';

const API_BASE = 'http://localhost:3000/api';

export const api = {
  events: {
    getAll: () => fetch(`${API_BASE}/events`).then((r) => r.json()),
    getById: (id: string) => fetch(`${API_BASE}/events/${id}`).then((r) => r.json()),
    create: (data: CreateEventDto) =>
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },
};
```

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Swagger/OpenAPI Spec](https://swagger.io/specification/)

---

> Part of the Friends monorepo • [Back to root](../../)
