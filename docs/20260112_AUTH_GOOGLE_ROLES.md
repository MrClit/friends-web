# Plan de Implementación: Autenticación con Google y Roles (Admin/User)

**Fecha:** 2026-01-12  
**Proyecto:** Friends (Monorepo)

---

## Índice

1. [Motivación y Objetivos](#1-motivación-y-objetivos)
2. [Resumen del Sistema y Requisitos](#2-resumen-del-sistema-y-requisitos)
3. [Diseño de la Solución](#3-diseño-de-la-solución)
   - 3.1 [Flujo de Autenticación](#31-flujo-de-autenticación)
   - 3.2 [Estructura de Carpetas y Código](#32-estructura-de-carpetas-y-código)
   - 3.3 [Modelo de Usuario y Migración](#33-modelo-de-usuario-y-migración)
   - 3.4 [Contratos de API y Endpoints](#34-contratos-de-api-y-endpoints)
   - 3.5 [Gestión de Roles y Seguridad](#35-gestión-de-roles-y-seguridad)
   - 3.6 [Manejo de Errores y Logging](#36-manejo-de-errores-y-logging)
4. [Configuración Externa: Google Cloud Console](#4-configuración-externa-google-cloud-console)
5. [Plan de Implementación Paso a Paso](#5-plan-de-implementación-paso-a-paso)
6. [Checklist Detallado](#6-checklist-detallado)
7. [Pruebas y Validación](#7-pruebas-y-validación)
8. [Notas de Despliegue y Variables de Entorno](#8-notas-de-despliegue-y-variables-de-entorno)
9. [Referencias y Recursos](#9-referencias-y-recursos)
10. [Mejoras y Lecciones Aprendidas](#10-mejoras-y-lecciones-aprendidas)

---

## 1. Motivación y Objetivos

- Proteger el acceso a la aplicación y distinguir entre usuarios normales y administradores.
- Simplificar el login usando Google como proveedor de identidad (OAuth2).
- Permitir gestión de roles para futuras funcionalidades avanzadas (gestión de eventos, administración, etc).
- Control total sobre los usuarios permitidos: solo emails pre-registrados pueden acceder.

## 2. Resumen del Sistema y Requisitos

- Autenticación basada en Google OAuth2.
- Solo emails pre-registrados en la BBDD pueden acceder.
- Almacenar nombre y foto la primera vez que un usuario accede.
- Gestión de roles: 'admin' y 'user'.
- JWT para sesiones y protección de rutas.
- Frontend en React, backend en NestJS.

## 3. Diseño de la Solución

### 3.1. Flujo de Autenticación

1. El usuario pulsa "Login con Google" en el frontend.
2. El frontend redirige al backend (`/api/auth/google`).
3. El backend inicia el flujo OAuth2 con Google.
4. Tras autenticarse, Google redirige al backend (`/api/auth/google/callback`).
5. El backend obtiene el email del usuario desde Google y comprueba si existe en la tabla de usuarios de la BBDD.
6. Si el email NO existe en la tabla, rechaza el acceso (401 Unauthorized).
7. Si el email existe, la primera vez almacena el nombre y la foto del usuario en la tabla (si no están ya guardados).
8. El backend genera un JWT con el rol y responde al frontend (cookie httpOnly o body).
9. El frontend almacena el token y lo usa en las peticiones.
10. El backend protege rutas según el rol (guards).

### 3.2. Estructura de Carpetas y Código

#### Backend (`apps/backend/`)

- `src/modules/auth/` (nuevo módulo)
  - `auth.module.ts`
  - `auth.controller.ts`
  - `auth.service.ts`
  - `google.strategy.ts`
  - `jwt.strategy.ts`
  - `dto/`
- `src/modules/users/` (nuevo módulo)
  - `user.entity.ts`
  - `users.service.ts`
  - `users.module.ts`
- Entidad User en la base de datos (campos: id, email, name, avatar, role)
- Guards para roles (AdminGuard, UserGuard)
- Tabla de usuarios poblada manualmente (email y rol)

#### Frontend (`apps/frontend/`)

- `src/features/auth/` (nuevo feature)
  - `components/GoogleLoginButton.tsx`
  - `hooks/useAuth.ts`
  - `context/AuthContext.tsx`
  - `types.ts`
- Lógica para guardar el JWT y mostrar la UI según el rol
- Protección de rutas sensibles

### 3.3. Modelo de Usuario y Migración

- Tabla: `users`
- Campos: id (uuid), email (único), name, avatar, role (enum), created_at, updated_at
- Restricciones: email único, role validado por enum
- Ejemplo de entidad TypeORM:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ['admin', 'user'] })
  role: 'admin' | 'user';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### 3.4. Contratos de API y Endpoints

#### API Contract & Endpoints

Esta sección amplía los contratos de API para `/api/auth/*` con ejemplos concretos y guías para el frontend.

##### 1) GET /api/auth/google

- Description: Inicia el flujo OAuth2 con Google. Respuesta: HTTP 302 redirigiendo a Google.

##### 2) GET /api/auth/google/callback

- Description: Endpoint de callback. Google redirige aquí tras la autenticación. El backend valida el perfil de Google, comprueba que el email esté permitido (tabla `users`), persiste `name` y `avatar` en el primer acceso y emite un JWT.
- Success (HTTP 200):

```json
{
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "avatar": "...",
      "role": "user"
    }
  }
}
```

- Failure cases:
  - Email not allowed -> HTTP 401
  - Invalid Google token/profile -> HTTP 400 or 401

Failure example (HTTP 401):

```json
{
  "data": null,
  "error": {
    "statusCode": 401,
    "message": "Unauthorized"
  }
}
```

##### 3) GET /api/auth/me

- Description: Devuelve el perfil del usuario autenticado. Requiere header `Authorization: Bearer <jwt>`.
- Success (HTTP 200):

```json
{
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "avatar": "...",
    "role": "user"
  }
}
```

##### 4) POST /api/auth/logout

- Description: Opcional; limpieza de sesión (ej. limpiar cookie httpOnly) — implementación según necesidades.

##### Token handling (guía frontend)

- Preferido: devolver `token` en el body JSON y que el frontend lo almacene (ej., en memoria + `localStorage` con precauciones).
- Alternativa: usar cookie `HttpOnly`/`Secure` emitida por el backend.

Flujo recomendado para el frontend:

1. Usuario hace click en `Login with Google` → frontend navega a `/api/auth/google`.
2. Google redirige al backend; el backend responde con JSON con `token` y `user`.
3. Frontend guarda el token y lo usa en `Authorization: Bearer <token>` para peticiones siguientes.

##### Errores y códigos de estado

- `401 Unauthorized`: email no permitido, token inválido o expirado
- `403 Forbidden`: usuario autenticado pero sin rol requerido
- `400 Bad Request`: request inválido
- `500 Internal Server Error`: error inesperado del servidor

##### Notas de seguridad

- No exponer secretos en el frontend.
- Usar HTTPS en producción y cookies `HttpOnly` cuando sea posible.
- Usar expiraciones cortas en tokens; considerar refresh tokens si hace falta.

##### Snippet de integración (frontend)

```ts
// Después de recibir la respuesta JSON
const { token, user } = await response.json();
localStorage.setItem('token', token);
// Ejemplo: llamada autenticada
fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
```

##### Próximos pasos

- Añadir rutas `api/auth` en el frontend (feature `auth`) e implementar `useAuth`.
- Añadir pruebas E2E que simulen el flujo OAuth con un proveedor mock en CI.

### 3.5. Gestión de Roles y Seguridad

- Guards de rol en backend (ejemplo `RolesGuard` en NestJS)
- Decoradores `@UseGuards(RolesGuard)` en endpoints protegidos
- Protección de rutas y componentes en frontend según el rol
- JWT con expiración corta (ej: 1h) y refresh token si es necesario
- Cookies httpOnly y secure si se usan cookies
- Configuración de CORS para permitir solo el frontend
- Uso de HTTPS en producción
- No exponer secretos en el frontend

### 3.6. Manejo de Errores y Logging

- Loggear intentos de acceso denegados con email y timestamp
- Mensajes de error claros y sin información sensible

## 4. Configuración Externa: Google Cloud Console

1. Accede a https://console.cloud.google.com/ e inicia sesión con tu cuenta de Google.
2. Crea un nuevo proyecto (o selecciona uno existente).
3. Ve a "APIs y servicios" > "Pantalla de consentimiento OAuth" y configura:
   - Tipo de usuario: Externo (para apps públicas) o Interno (solo organización).
   - Nombre de la app, email de soporte y dominio autorizado (si aplica).
   - Añade los scopes necesarios (profile, email).
   - Guarda y publica la pantalla de consentimiento (modo testing es suficiente para desarrollo).
4. Ve a "APIs y servicios" > "Credenciales" y haz clic en "Crear credenciales" > "ID de cliente de OAuth".
   - Tipo de aplicación: Aplicación web.
   - Orígenes JavaScript autorizados:
     - http://localhost:5173 (desarrollo frontend)
   - URIs de redirección autorizados:
     - http://localhost:3000/api/auth/google/callback (desarrollo backend)
     - [Tu URL de producción]/api/auth/google/callback (cuando despliegues)
5. Haz clic en "Crear" y copia el Client ID y Client Secret.
6. Añade estos valores al archivo `.env` del backend:
   - GOOGLE_CLIENT_ID=...
   - GOOGLE_CLIENT_SECRET=...
7. (Opcional) Configura los dominios y URLs reales para producción.

> Nota: El uso de Google OAuth2 para autenticación es gratuito. Solo necesitas una cuenta de Google estándar.

## 5. Plan de Implementación Paso a Paso

### Backend

1. Crear módulo `auth` y configurar Passport con Google OAuth2
2. Crear módulo `users` y entidad User
3. Implementar endpoints de autenticación y validación
4. Validar email contra tabla usuarios y guardar nombre/foto la primera vez
5. Generar y devolver JWT con rol
6. Añadir guards para proteger rutas según rol
7. Añadir migración para tabla users (pre-poblar emails/roles)
8. Configurar variables de entorno

### Frontend

1. Crear feature `auth` con botón de login y contexto de usuario
2. Implementar lógica para guardar/leer el JWT
3. Mostrar UI condicional según el rol
4. Proteger rutas sensibles
5. Añadir logout

## 6. Checklist Detallado

- [x] Migración tabla users y pre-poblar emails/roles
- [x] Implementar entidad User y validaciones
- [x] Implementar UsersModule y UsersService
- [x] Configurar Passport y Google OAuth2
- [x] Implementar endpoints y lógica de validación
- [x] Generar y devolver JWT seguro
- [x] Implementar guards de rol y protección de rutas
- [x] Añadir logging y manejo de errores
- [x] Pruebas unitarias y de integración (unitarias implementadas; integraciones pendientes)
- [x] Configuración de variables de entorno y secrets
- [x] Documentar contratos de API y ejemplos
- [x] Configuración Google Cloud Console
- [x] Feature auth y login con Google en frontend
- [x] Contexto de usuario y gestión JWT en frontend
- [x] UI condicional por rol en frontend
- [x] Logout en frontend

### Ejemplo: Uso de `RolesGuard` y `@Roles`

Ejemplo de uso del decorador `@Roles` y `RolesGuard` dentro de la sección de roles:

```typescript
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  @Get('stats')
  @Roles('admin')
  getStats() {
    return { data: 'sensitive admin stats' };
  }
}
```

## 7. Pruebas y Validación

- Usuario permitido accede correctamente
- Usuario no permitido recibe 401
- Se almacena name/avatar la primera vez
- JWT inválido/expirado es rechazado
- Guards de rol funcionan correctamente
- Mock de Google OAuth2 para tests

## 8. Notas de Despliegue y Variables de Entorno

- `.env` ejemplo:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:5173
```

- No exponer secretos en el frontend
- Revisar configuración de dominios en Google Cloud Console para producción
- Usar HTTPS en producción

### Archivos de ejemplo

- Backend: `apps/backend/.env.example` (creado)
- Frontend: `apps/frontend/.env.example` (creado)

### Variables requeridas

- `JWT_SECRET`: secreto para firmar JWT (usar valor seguro en producción)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: credenciales de Google OAuth2
- `DB_*`: host/puerto/usuario/password/database para PostgreSQL
- `CORS_ORIGIN`: URL del frontend (ej. `http://localhost:5173`)
- `VITE_API_URL` (frontend): URL base hacia el backend API

### Gestión de secrets en CI/CD

- En GitHub Actions: guardar `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DB_PASSWORD` en `Settings > Secrets` y referenciarlos en el workflow con `secrets.JWT_SECRET`.
- Nunca comites archivos `.env` con valores reales. Mantener `.env.example` en el repositorio.
- Para despliegues (Netlify/Vercel/DigitalOcean): configurar las variables en el panel de entorno del servicio.

## 9. Referencias y Recursos

- [NestJS Auth Docs](https://docs.nestjs.com/security/authentication)
- [Passport Google OAuth2](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Identity OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [TypeORM Entities](https://typeorm.io/entities)
- [JWT Best Practices](https://jwt.io/introduction/)

## 10. Mejoras y Lecciones Aprendidas

- Se puede extender a otros providers (GitHub, Microsoft) fácilmente
- El sistema de roles permite escalar permisos en el futuro
- Usar JWT simplifica la integración frontend-backend
- Considerar refresh tokens y expiración para mayor seguridad
- El control de acceso por email permite máxima seguridad y flexibilidad

---
