# Environment Variables Configuration

## 📁 Archivos de Entorno

Este proyecto utiliza diferentes archivos `.env` según el ambiente:

```
.env.development    # Variables de desarrollo (local)
.env.production     # Variables de producción (servidor)
.env.example        # Plantilla con todas las variables (NO contiene valores sensibles)
```

## 🔧 Cómo Funciona

El archivo cargado se determina automáticamente por la variable `NODE_ENV`:

```typescript
// En app.module.ts
envFilePath: `.env.${process.env.NODE_ENV || 'development'}`;
```

- Si `NODE_ENV=development` → carga `.env.development`
- Si `NODE_ENV=production` → carga `.env.production`
- Por defecto (sin NODE_ENV) → carga `.env.development`

## 🚀 Uso

### Desarrollo Local

```bash
# Automáticamente usa .env.development
pnpm start:dev

# O explícitamente
NODE_ENV=development pnpm start:dev
```

### Producción

```bash
# Build con variables de producción
NODE_ENV=production pnpm build

# Start con variables de producción
NODE_ENV=production pnpm start:prod
```

### Testing

```bash
# Automáticamente usa .env.test (si existe)
pnpm test
```

## 📝 Variables Disponibles

### Server

- `PORT` - Puerto del servidor (default: 3000)
- `NODE_ENV` - Ambiente: development | production | test

### Database

- `DATABASE_HOST` - Host de PostgreSQL
- `DATABASE_PORT` - Puerto de PostgreSQL (default: 5432)
- `DATABASE_USER` - Usuario de PostgreSQL
- `DATABASE_PASSWORD` - Contraseña de PostgreSQL
- `DATABASE_NAME` - Nombre de la base de datos

### TypeORM

- `TYPEORM_SYNC` - Auto-sincronizar schema (⚠️ NUNCA true en producción)
- `TYPEORM_LOGGING` - Logging de queries SQL

### CORS

- `CORS_ORIGIN` - Orígenes permitidos para CORS

### JWT (futuro)

- `JWT_SECRET` - Secret para firmar tokens JWT
- `JWT_EXPIRATION` - Tiempo de expiración de tokens

## 🔒 Seguridad

### ⚠️ NUNCA subir a Git:

- ❌ `.env.development` (contraseñas locales)
- ❌ `.env.production` (contraseñas de producción)
- ❌ `.env` (archivo genérico)

### ✅ Subir a Git:

- ✅ `.env.example` (plantilla sin valores sensibles)
- ✅ Esta documentación

### Configuración en Producción

**Opción 1: Variables de entorno del sistema**

```bash
# En Railway, Render, Vercel, etc.
DATABASE_HOST=production-db-host.com
DATABASE_PASSWORD=secure-production-password
JWT_SECRET=random-secure-string-generated
```

**Opción 2: Archivo .env.production en servidor**

```bash
# Al deployar, crear .env.production en el servidor
scp .env.production user@server:/app/.env.production
```

## 🧪 Testing

Para tests, crea `.env.test` (opcional):

```bash
# .env.test
DATABASE_NAME=friends_db_test
TYPEORM_SYNC=true
TYPEORM_LOGGING=false
```

## 📌 Notas Importantes

1. **Development:**
   - `TYPEORM_SYNC=true` → TypeORM crea/actualiza tablas automáticamente
   - Logging SQL activado para debugging

2. **Production:**
   - `TYPEORM_SYNC=false` → Usar migrations para cambios de schema
   - Logging desactivado para performance
   - CORS configurado solo para dominios específicos

3. **Prioridad de carga:**
   - Variables de sistema > Variables en archivo .env
   - Permite sobrescribir valores específicos sin modificar archivos

## 🔄 Migración desde .env único

Si tenías un solo archivo `.env`:

1. Copia `.env` → `.env.development`
2. Crea `.env.production` con valores de producción
3. El sistema cargará automáticamente el correcto según NODE_ENV
