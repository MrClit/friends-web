# @friends/backend

> NestJS backend API for Friends expense sharing platform

**Status:** ✅ Operacional - Events y Transactions implementados

Backend RESTful API del monorepo Friends, construido con NestJS, TypeScript, PostgreSQL y TypeORM.

---

## 📦 Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM 0.3
- **Validation:** class-validator + class-transformer
- **Configuration:** @nestjs/config
- **Testing:** Jest 30

---

## 🚀 Quick Start

### 1️⃣ Inicia la Base de Datos

```bash
docker compose up -d
```

> **Nota:** Usa `docker compose` (sin guión) si tienes Docker Desktop. Si no funciona, prueba `docker-compose` para instalaciones antiguas.

Esto iniciará PostgreSQL en un contenedor Docker. La base de datos estará disponible en `localhost:5432`.

### 2️⃣ Inicia el Servidor Backend

**Desde la raíz del monorepo:**

```bash
pnpm --filter @friends/backend start:dev
```

**Desde este directorio (`apps/backend/`):**

```bash
pnpm start:dev
```

### 3️⃣ Verifica que Funciona

El servidor debería iniciarse en el puerto **3000** y verás:

```
🚀 Application is running on: http://localhost:3000/api
🌐 CORS enabled for: http://localhost:5173
```

Prueba el endpoint por defecto:

```bash
curl http://localhost:3000/api
```

---

## 🛑 Detener Todo

```bash
# Detener el servidor backend
# Presiona Ctrl+C en la terminal donde se está ejecutando

# Detener la base de datos
docker compose down
```

---

## ⚙️ Variables de Entorno

Este proyecto utiliza diferentes archivos `.env` según el ambiente.

### 📁 Archivos de Entorno

```
.env.development    # Variables de desarrollo (local)
.env.production     # Variables de producción (servidor)
.env.example        # Plantilla con todas las variables
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
PORT=3000                           # Puerto del servidor
NODE_ENV=development                # Ambiente: development | production | test

# Database
DATABASE_HOST=localhost             # Host de PostgreSQL
DATABASE_PORT=5432                  # Puerto de PostgreSQL
DATABASE_USER=postgres              # Usuario de PostgreSQL
DATABASE_PASSWORD=postgres          # Contraseña de PostgreSQL
DATABASE_NAME=friends_db            # Nombre de la base de datos

# TypeORM
TYPEORM_SYNC=false                  # ⚠️ NUNCA true en producción
TYPEORM_LOGGING=true                # Logging de queries SQL

# CORS
CORS_ORIGIN=http://localhost:5173   # Orígenes permitidos para CORS

# JWT (futuro)
JWT_SECRET=your-secret-key          # Secret para firmar tokens JWT
JWT_EXPIRATION=1d                   # Tiempo de expiración de tokens
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

## 📂 Estructura del Proyecto

```
src/
├── common/                         # Código compartido
│   ├── health.controller.ts       # Health check endpoint
│   ├── filters/                   # Exception filters
│   │   └── http-exception.filter.ts
│   ├── interceptors/              # Response transformers
│   │   └── transform.interceptor.ts
│   ├── pipes/                     # Validation pipes (futuro)
│   ├── guards/                    # Auth guards (futuro)
│   └── decorators/                # Custom decorators (futuro)
│
├── config/                         # Configuración
│   ├── database.config.ts         # TypeORM configuration
│   └── app.config.ts              # App settings (futuro)
│
├── modules/                        # Feature modules
│   ├── events/                    # ✅ Events module
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.module.ts
│   │   ├── entities/
│   │   │   └── event.entity.ts
│   │   └── dto/
│   │       ├── create-event.dto.ts
│   │       ├── update-event.dto.ts
│   │       └── event-participant.dto.ts
│   │
│   └── transactions/              # ✅ Transactions module
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
├── app.module.ts                   # Root module
├── app.controller.ts               # Default controller
├── app.service.ts                  # Default service
└── main.ts                         # Bootstrap application
```

---

## 🔌 API Endpoints

### Health Check

```
GET    /api               # API status
GET    /api/health        # Database health check
```

### Events

```
GET    /api/events           # Listar todos los eventos
POST   /api/events           # Crear evento
GET    /api/events/:id       # Obtener evento por ID
PATCH  /api/events/:id       # Actualizar evento
DELETE /api/events/:id       # Eliminar evento (cascade delete transactions)
```

### Transactions

```
GET    /api/events/:eventId/transactions            # Listar transacciones de un evento
GET    /api/events/:eventId/transactions/paginated  # Transacciones paginadas por fechas
POST   /api/events/:eventId/transactions            # Crear transacción
GET    /api/transactions/:id                        # Obtener transacción por ID
PATCH  /api/transactions/:id                        # Actualizar transacción
DELETE /api/transactions/:id                        # Eliminar transacción
DELETE /api/transactions/by-ids                     # Eliminar múltiples transacciones
```

**Paginación de transacciones:**

```
GET /api/events/:eventId/transactions/paginated?numberOfDates=3&offset=0
```

- `numberOfDates`: Número de fechas únicas a retornar (default: 3)
- `offset`: Offset para paginación (default: 0)

---

## 🗄️ Database Schema

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

**Participants JSONB structure:**

```json
[
  { "id": "1", "name": "Alice" },
  { "id": "2", "name": "Bob" }
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

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Debug tests
pnpm test:debug
```

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev      # Development mode con hot reload
pnpm start:debug    # Debug mode

# Producción
pnpm build          # Build para producción
pnpm start:prod     # Ejecutar en producción

# Testing
pnpm test           # Run unit tests
pnpm test:watch     # Tests en watch mode
pnpm test:coverage  # Generar coverage report

# Code Quality
pnpm lint           # Lint code
pnpm lint:fix       # Lint y auto-fix

# Utilidades
pnpm clean          # Limpiar directorio dist
```

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

## �🔗 Integración con Frontend

El backend se integra con [@friends/frontend](../frontend/) vía REST API:

```typescript
// Ejemplo de cliente API en el frontend
const API_BASE = 'http://localhost:3000/api';

export const api = {
  events: {
    getAll: () => fetch(`${API_BASE}/events`).then((r) => r.json()),
    getById: (id: string) =>
      fetch(`${API_BASE}/events/${id}`).then((r) => r.json()),
    create: (data: CreateEventDto) =>
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },
  transactions: {
    getByEvent: (eventId: string) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`).then((r) => r.json()),
    create: (eventId: string, data: CreateTransactionDto) =>
      fetch(`${API_BASE}/events/${eventId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },
};
```

---

## ✅ Características Implementadas

### Configuración Base

- ✅ NestJS 11 con TypeScript
- ✅ TypeORM con PostgreSQL
- ✅ Variables de entorno por ambiente (.env.development, .env.production)
- ✅ CORS configurado para frontend (localhost:5173)
- ✅ Global validation pipes
- ✅ Global exception filters
- ✅ Transform interceptor para respuestas consistentes

### Módulo Events

- ✅ CRUD completo de eventos
- ✅ Entity con UUID, title, participants (JSONB), timestamps
- ✅ DTOs validados (CreateEventDto, UpdateEventDto)
- ✅ Service con logging y error handling
- ✅ Controller con endpoints RESTful
- ✅ Cascade delete de transactions
- ✅ Unit tests

### Módulo Transactions

- ✅ CRUD completo de transacciones
- ✅ Entity con UUID, title, paymentType (enum), amount, participantId, date
- ✅ Relación ManyToOne con Events (ON DELETE CASCADE)
- ✅ DTOs validados (CreateTransactionDto, UpdateTransactionDto)
- ✅ Service con lógica de negocio completa
- ✅ Controller con endpoints anidados bajo events
- ✅ Paginación por fechas únicas
- ✅ Eliminación batch por IDs
- ✅ Soporte para POT (participant_id = '0')
- ✅ Unit tests

### Health & Monitoring

- ✅ Health check endpoint (`/api/health`)
- ✅ Database connectivity check
- ✅ Logging contextual en todos los servicios

---

## 📚 Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [class-validator Documentation](https://github.com/typestack/class-validator)

---

> Part of the Friends monorepo • [Back to root](../../)
