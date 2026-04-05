# Módulo de Autenticación (`auth`)

## Índice

1. [Introducción](#introducción)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Estrategias de Autenticación](#estrategias-de-autenticación)
5. [Roles y Autorización](#roles-y-autorización)
6. [Testing](#testing)
7. [Notas y Buenas Prácticas](#notas-y-buenas-prácticas)

---

## 1. Introducción

El módulo `auth` gestiona la autenticación y autorización de usuarios en la API backend (NestJS). Permite el login mediante Google y Microsoft OAuth2, y protege rutas usando JWT y roles.

## 2. Estructura de Archivos

- **auth.controller.ts**: Define los endpoints de autenticación (login, callback, etc).
- **auth.service.ts**: Lógica principal de autenticación y validación de usuarios.
- **auth.module.ts**: Configura el módulo, importa estrategias y servicios.
- **google.strategy.ts**: Estrategia Passport para login con Google.
- **microsoft.strategy.ts**: Estrategia Passport para login con Microsoft.
- **jwt.strategy.ts**: Estrategia Passport para validar JWT en peticiones protegidas.
- **roles.decorator.ts**: Decorador para marcar rutas que requieren ciertos roles.
- **roles.guard.ts**: Guard que verifica si el usuario autenticado tiene el rol necesario.
- **\*.spec.ts**: Tests unitarios de los servicios, guards y estrategias.

## 3. Flujo de Autenticación

1. El usuario accede a `/auth/google` o `/auth/microsoft` para iniciar sesión con su proveedor.
2. El proveedor OAuth redirige al backend con el código de autorización.
3. `google.strategy.ts` o `microsoft.strategy.ts` validan el perfil y delegan en `auth.service.ts`.
4. `auth.controller.ts` genera un JWT y redirige al frontend a `/auth/callback` con el token.
5. Las rutas protegidas usan `jwt.strategy.ts` para validar el token.

## 4. Estrategias de Autenticación

- **GoogleStrategy**: Permite login OAuth2 con Google. Extrae email, nombre y avatar del perfil.
- **MicrosoftStrategy**: Permite login OAuth2 con Microsoft. Extrae email y nombre del perfil (con UPN como fallback de email).
- **JwtStrategy**: Valida el JWT en cada petición protegida. Si es válido, añade el usuario al request.

## 5. Roles y Autorización

- **roles.decorator.ts**: Permite anotar rutas con `@Roles('admin')`, etc.
- **roles.guard.ts**: Lee los roles del usuario autenticado y permite o deniega el acceso según corresponda.

## 6. Testing

- Archivos `*.spec.ts` prueban la lógica de autenticación, guards y estrategias usando mocks.
- `auth.controller.spec.ts` cubre callbacks OAuth de Google/Microsoft y `getProfile`.
- `google.strategy.spec.ts` y `microsoft.strategy.spec.ts` cubren validación de perfiles y delegación al servicio.

## 7. Notas y Buenas Prácticas

- Usa Passport.js para estrategias de autenticación.
- JWT se firma con clave secreta definida en variables de entorno.
- No exponer información sensible en los errores.
- Los roles permiten controlar el acceso granular a rutas.
- Variables OAuth esperadas:
  - Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Microsoft: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CALLBACK_URL`

---

**Resumen:**
El módulo `auth` implementa autenticación segura con Google y Microsoft, soporte JWT para sesiones API y autorización basada en roles, siguiendo buenas prácticas de NestJS y Passport.
