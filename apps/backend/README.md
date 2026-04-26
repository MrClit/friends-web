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

### 1️⃣ Variables de entorno

```bash
cp .env.example .env.development
# Edit .env.development — fill in OAuth credentials (Google, Microsoft), JWT secret, Cloudinary keys
```

### 2️⃣ Inicia la Base de Datos

```bash
docker compose up -d
```

> **Nota:** Usa `docker compose` (sin guión) si tienes Docker Desktop. Si no funciona, prueba `docker-compose` para instalaciones antiguas.

Esto iniciará PostgreSQL en un contenedor Docker. La base de datos estará disponible en `localhost:5432`.

### 3️⃣ Ejecuta las migraciones

```bash
pnpm migration:run
```

### 5️⃣ Inicia el Servidor Backend

**Desde la raíz del monorepo:**

```bash
pnpm --filter @friends/backend start:dev
```

**Desde este directorio (`apps/backend/`):**

```bash
pnpm start:dev
```

### 6️⃣ Verifica que Funciona

El servidor debería iniciarse en el puerto **3000** y verás:

```
🚀 Application is running on: http://localhost:3000/api
📚 Swagger documentation: http://localhost:3000/api/docs
🌐 CORS enabled for: http://localhost:5173
```

**Prueba el endpoint por defecto:**

```bash
curl http://localhost:3000/api
```

**Accede a la documentación Swagger:**

Abre en tu navegador: **http://localhost:3000/api/docs**

Swagger UI te permite:

- 📖 Ver todos los endpoints documentados
- 🧪 Probar endpoints interactivamente
- 📋 Ver schemas de DTOs y validaciones
- 📝 Generar código cliente automáticamente

---

## 🛑 Detener Todo

```bash
# Detener el servidor backend
# Presiona Ctrl+C en la terminal donde se está ejecutando

# Detener la base de datos
docker compose down
```

---

## ⚙️ Configuration

### Environment Variables

Este proyecto utiliza diferentes archivos `.env` según el ambiente.

### 📁 Archivos de Entorno

```
.env.development    # Variables de desarrollo (local)
.env.test           # Variables para tests automatizados (local)
.env.production     # Variables de producción (servidor)
.env.example        # Plantilla con todas las variables
.env.test.example   # Plantilla para entorno de tests
```

### Cómo Funciona

El archivo cargado se determina automáticamente por la variable `NODE_ENV`:

```typescript
// En app.module.ts
envFilePath: `.env.${process.env.NODE_ENV || 'development'}`;
```

- Si `NODE_ENV=development` → carga `.env.development`
- Si `NODE_ENV=production` → carga `.env.production`
- Por defecto (sin NODE_ENV) → carga `.env.development`

### Variables Disponibles

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

### Configuración Inicial

```bash
# Copia el archivo de ejemplo
cp .env.example .env.development

# Edita .env.development si necesitas credenciales diferentes
```

### 🔒 Seguridad

**⚠️ NUNCA subir a Git:**

- ❌ `.env.development` (contraseñas locales)
- ❌ `.env.production` (contraseñas de producción)
- ❌ `.env` (archivo genérico)

**✅ Subir a Git:**

- ✅ `.env.example` (plantilla sin valores sensibles)

### Ambientes de Ejecución

**Desarrollo Local:**

```bash
# Automáticamente usa .env.development
pnpm start:dev

# O explícitamente
NODE_ENV=development pnpm start:dev
```

**Producción:**

```bash
# Build con variables de producción
NODE_ENV=production pnpm build

# Start con variables de producción
NODE_ENV=production pnpm start:prod
```

**Testing:**

```bash
# Automáticamente usa .env.test (si existe)
pnpm test
```

### 📌 Notas Importantes

1. **Development:**
   - `TYPEORM_SYNC=false` → Usa migrations para gestión de schema
   - Logging SQL activado para debugging

2. **Production:**
   - `TYPEORM_SYNC=false` → Siempre usar migrations
   - Logging desactivado para performance
   - CORS configurado solo para dominios específicos

3. **Prioridad de carga:**
   - Variables de sistema > Variables en archivo .env

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

Usamos comandos explícitos por entorno para evitar confusiones entre código fuente TypeScript (`src`) y build de producción (`dist`).

```bash
# Local (TypeScript datasource)
pnpm migration:run:local
pnpm migration:revert:local

# Producción (Render, después de build)
pnpm migration:run:prod

# Start de producción con migraciones automáticas
pnpm start:prod:migrate
```

Notas:

- `migration:run` y `migration:revert` siguen disponibles como alias de compatibilidad hacia `:local`.
- En producción mantener `TYPEORM_SYNC=false` y aplicar cambios de esquema solo con migraciones versionadas.

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
GET    /api/health        # Database health check
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
POST   /api/events           # Create event
GET    /api/events/:id       # Get event by ID
PATCH  /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event (cascade deletes transactions)
GET    /api/events/:id/kpis  # Get KPI calculations for an event
```

### Transactions

```
GET    /api/events/:eventId/transactions            # List transactions for an event
GET    /api/events/:eventId/transactions/paginated  # Date-paginated transactions
POST   /api/events/:eventId/transactions            # Create transaction
PATCH  /api/transactions/:id                        # Update transaction
DELETE /api/transactions/:id                        # Delete transaction
```

### Admin (ADMIN role required)

```
GET    /api/admin/users       # List all users
POST   /api/admin/users       # Create user
PATCH  /api/admin/users/:id   # Update user (role, status)
DELETE /api/admin/users/:id   # Soft-delete user
```

**Paginación de transacciones:**

```
GET /api/events/:eventId/transactions/paginated?numberOfDates=3&offset=0
```

**Query Parameters:**

- `numberOfDates` (opcional): Número de fechas únicas a retornar (default: 3, min: 1, max: 50)
- `offset` (opcional): Offset para paginación (default: 0, min: 0)

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

## 📤 Formato de Respuestas

### Envoltura Estándar para Respuestas Exitosas

Todas las respuestas exitosas (200, 201) están envueltas en un formato estándar:

```json
{
  "data": <contenido de la respuesta>
}
```

**Ejemplos:**

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

// POST /api/events (Created entity)
{
  "data": {
    "id": "uuid",
    "title": "New Event",
    "participants": [...]
  }
}
```

### Excepciones

**DELETE operations (204 No Content):**

- No retornan cuerpo de respuesta
- HTTP Status: 204

**Errores:**

- NO usan la envoltura `{ data }`
- Formato estandarizado con `HttpExceptionFilter`:

```json
{
  "statusCode": 404,
  "timestamp": "2026-01-03T12:00:00.000Z",
  "path": "/api/events/invalid-uuid",
  "method": "GET",
  "message": "Event with ID invalid-uuid not found"
}
```

### Implementación

- **Interceptor**: `TransformInterceptor` (activado globalmente)
- **Swagger**: Respuestas documentadas con `@ApiStandardResponse`
- **Cliente**: Siempre accede a `.data` para obtener el contenido

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
  participant_id VARCHAR(50) NOT NULL,      -- '0' para POT o ID de participante
  date DATE NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE payment_type_enum AS ENUM ('contribution', 'expense', 'compensation');
```

**Participant ID Especial:**

- `'0'`: Representa el "bote común" (POT) para gastos compartidos

---

## ⚠️ Dependencias de Base de Datos

### PostgreSQL Window Functions

El endpoint de **paginación de transacciones** (`GET /api/events/:eventId/transactions/paginated`) utiliza **window functions de PostgreSQL** (específicamente `DENSE_RANK()`) para optimizar el rendimiento al paginar por fechas únicas.

**Query optimizada:**

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

**Consideraciones:**

- ✅ **Window functions** son parte del estándar SQL:2003
- ✅ Soportadas por: **PostgreSQL 8.4+**, MySQL 8.0+, SQL Server 2005+, Oracle 8i+, SQLite 3.25+
- ⚠️ **Elementos específicos de PostgreSQL:**
  - Comillas dobles para columnas case-sensitive: `t."eventId"`
  - Si migras a otra BD, ajusta comillas (MySQL usa backticks `` `eventId` ``, SQL Server usa `[eventId]`)

**Impacto en migración de BD:**

- Si migras a otra BD moderna → Cambio menor (ajustar comillas)
- Si migras a BD sin window functions → Implementar fallback con 2 queries
- **Decisión:** Mantenemos optimización porque:
  - PostgreSQL es nuestro target principal
  - Beneficio en rendimiento > riesgo de migración
  - Migración de BD es poco frecuente

**Alternativa portable (no implementada):**

```typescript
// Fallback sin window functions (2 queries)
const dates = await getDates(eventId, numberOfDates, offset);
const transactions = await getTransactionsByDates(eventId, dates);
```

> 💡 **Tip:** Si en el futuro necesitas máxima portabilidad, refactoriza a TypeORM QueryBuilder o implementa fallback condicional por tipo de BD.

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

# E2E smoke tests (JWT real + DB real)
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Pre-PR local check (lint + unit + integration + e2e)
pnpm check:backend

# Debug tests
pnpm test:debug
```

Preparación recomendada para e2e:

```bash
# 1) Crea tu archivo de entorno de tests
cp .env.test.example .env.test

# 2) Crea la base de datos de tests (una vez)
docker exec -it friends-postgres createdb -U postgres friends_db_test
```

> Si la base ya existe, el comando `createdb` puede devolver error y se puede ignorar.

---

## 🔧 Comandos Útiles

### Base de Datos

```bash
# Ver logs de la base de datos
docker compose logs -f

# Conectarse a PostgreSQL
docker exec -it friends-postgres psql -U postgres -d friends_db

# Reiniciar la base de datos (inicio limpio)
docker compose down -v && docker compose up -d

# Detener y remover volúmenes
docker compose down -v
```

### Backend

```bash
# Verificar estado del servidor
curl http://localhost:3000/api

# Health check
curl http://localhost:3000/api/health

# Ver logs (aparecen en la terminal en modo dev)
```

---

## � HTTP Requests - Testing Interactivo

Este proyecto incluye una colección de archivos `.http` para probar la API de forma interactiva directamente desde VS Code.

### Requisitos

**Extensión de VS Code:**

- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) de Huachao Mao

```bash
# Instalación rápida desde CLI
code --install-extension humao.rest-client
```

### Estructura de Archivos

```
http-requests/
├── _common.http          # Health check y variables comunes
├── events.http           # CRUD completo de eventos + casos de error
├── transactions.http     # CRUD completo de transacciones + paginación
└── .gitignore           # Ignora variables privadas
```

### Configuración de Variables

Los archivos `.http` usan variables que se configuran en `.vscode/settings.json`:

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

> **Nota:** Si no existe `.vscode/settings.json`, créalo en la raíz del monorepo con la configuración anterior.

### Cómo Usar

**1. Cambiar de Ambiente:**

- Abre cualquier archivo `.http`
- Haz clic en el selector de ambiente en la barra inferior de VS Code
- O usa: `Cmd+Shift+P` → "REST Client: Switch Environment"
- Selecciona `development` o `production`

**2. Ejecutar Requests:**

- Abre `http-requests/events.http` o `http-requests/transactions.http`
- Haz clic en "Send Request" que aparece sobre cada request
- O usa: `Cmd+Alt+R` (Mac) / `Ctrl+Alt+R` (Windows/Linux)
- Los resultados aparecen en un panel lateral

**3. Variables Dinámicas:**

Los archivos usan variables que se capturan automáticamente:

```http
### Crear evento y guardar su ID
# @name createEvent
POST {{baseUrl}}/events
Content-Type: {{contentType}}

{
  "title": "Mi Evento",
  "participants": [...]
}

### Guardar ID del evento creado
@createdEventId = {{createEvent.response.body.id}}

### Usar el ID en requests siguientes
GET {{baseUrl}}/events/{{createdEventId}}
```

### Colecciones Disponibles

#### **\_common.http**

```http
# Health check de la API
GET {{baseUrl}}/health
```

#### **events.http**

- ✅ Listar todos los eventos
- ✅ Crear evento con participantes
- ✅ Obtener evento por ID
- ✅ Actualizar título del evento
- ✅ Actualizar participantes del evento
- ✅ Eliminar evento (cascade delete)
- ❌ Casos de error (validación, 404, UUID inválido)

#### **transactions.http**

- ✅ Listar transacciones por evento
- ✅ Crear contribución
- ✅ Crear gasto de participante
- ✅ Crear gasto del POT (`participantId: "0"`)
- ✅ Crear compensación
- ✅ Obtener transacción por ID
- ✅ Actualizar transacción
- ✅ Eliminar transacción
- ✅ Paginación por fechas únicas
- ❌ Casos de error (validación, tipos inválidos)
- 🔄 Workflow completo de ejemplo

### Ejemplos de Uso

**Workflow típico con Events:**

```bash
1. Abre: http-requests/events.http
2. Ejecuta: "CREATE EVENT" (línea ~16)
3. El ID se guarda automáticamente en @createdEventId
4. Ejecuta: "GET EVENT BY ID" (usa @createdEventId)
5. Ejecuta: "UPDATE EVENT" (modifica el evento)
6. Ejecuta: "DELETE EVENT" (limpia)
```

**Workflow típico con Transactions:**

```bash
1. Abre: http-requests/transactions.http
2. Cambia @eventId con un ID real de tu BD (línea ~9)
3. Ejecuta: "CREATE TRANSACTION - Contribución"
4. Ejecuta: "CREATE TRANSACTION - Gasto"
5. Ejecuta: "LIST TRANSACTIONS BY EVENT"
6. Ejecuta: "GET PAGINATED TRANSACTIONS" (ver paginación)
```

**Testing de validaciones:**

```bash
1. Busca la sección "ERROR CASES" en cualquier archivo
2. Ejecuta requests inválidos para ver cómo responde la API
3. Verifica códigos de estado: 400, 404, etc.
```

### Ventajas sobre Postman/Thunder Client

- ✅ **Versionable:** Los archivos `.http` se incluyen en el repo
- ✅ **Sin configuración extra:** Funciona directamente en VS Code
- ✅ **Variables dinámicas:** Captura respuestas automáticamente
- ✅ **Lightweight:** No requiere aplicación externa
- ✅ **Documentación viva:** Los requests sirven como ejemplos de uso

### Tips

- **Atajos de teclado:**
  - `Cmd+Alt+R` / `Ctrl+Alt+R`: Ejecutar request
  - `Cmd+Alt+C` / `Ctrl+Alt+C`: Cancelar request
  - `Cmd+Alt+H` / `Ctrl+Alt+H`: Ver historial

- **Variables de entorno privadas:**
  - Crea `http-client.private.env.json` para tokens/secrets
  - Este archivo está en `.gitignore` automáticamente

- **Múltiples requests:**
  - Selecciona varios requests con `Shift+Click` sobre "Send Request"
  - O usa `Cmd+Alt+K` / `Ctrl+Alt+K` para ejecutar todos

---

## 🔗 Integración con Frontend

El backend se integra con [@friends/frontend](../frontend/) vía REST API.

### Formato de Respuestas

**Todas las respuestas exitosas están envueltas en `{ data: T }`:**

```typescript
// Ejemplo de cliente API en el frontend
const API_BASE = 'http://localhost:3000/api';

export const api = {
  events: {
    getAll: () =>
      fetch(`${API_BASE}/events`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data

    getById: (id: string) =>
      fetch(`${API_BASE}/events/${id}`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data

    create: (data: CreateEventDto) =>
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data
  },

  transactions: {
    getByEvent: (eventId: string) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data

    getPaginated: (eventId: string, numberOfDates = 3, offset = 0) =>
      fetch(`${API_BASE}/events/${eventId}/transactions/paginated?numberOfDates=${numberOfDates}&offset=${offset}`)
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data

    create: (eventId: string, data: CreateTransactionDto) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((r) => r.json())
        .then((response) => response.data), // ⚠️ Accede a .data
  },
};
```

### Manejo de Errores

```typescript
async function fetchEvent(id: string) {
  try {
    const response = await fetch(`${API_BASE}/events/${id}`);

    if (!response.ok) {
      const error = await response.json();
      // Estructura de error: { statusCode, timestamp, path, method, message }
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

### Módulo Transactions

- ✅ CRUD completo de transacciones
- ✅ Entity con UUID, title, paymentType (enum), amount, participantId, date
- ✅ Relación ManyToOne con Events (ON DELETE CASCADE)
- ✅ DTOs validados (CreateTransactionDto, UpdateTransactionDto, PaginationQueryDto)
- ✅ Service con lógica de negocio completa
- ✅ Controller con endpoints anidados bajo events
- ✅ Paginación por fechas únicas (optimizada con SQL window functions)
- ✅ Soporte para POT (participant_id = '0')
- ✅ Swagger documentation completa
- ✅ Unit tests

### Health & Monitoring

- ✅ Health check endpoint (`/api/health`)
- ✅ Database connectivity check
- ✅ Logging contextual en todos los servicios

---

## 📚 Resources

### Official Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [class-validator Documentation](https://github.com/typestack/class-validator)

### Related Documentation

- [Frontend Integration](../frontend/README.md) - How the frontend consumes this API
- [API Integration Guide](../../docs/FRONTEND_API_INTEGRATION.md) - TanStack Query setup

---

**Part of the Friends monorepo**  
[← Back to monorepo root](../../README.md) | [View Frontend →](../frontend/README.md)
