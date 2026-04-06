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

- **auth.controller.ts**: Define los endpoints de autenticación (login, callback, `/me`).
- **auth.service.ts**: Orquestación de autenticación (delegación OAuth + emisión de JWT).
- **auth.module.ts**: Registra providers, estrategias y dependencias del módulo.
- **services/**:
  - **oauth-provider.service.ts**: Lógica común de validación/login OAuth para proveedores.
  - **avatar.service.ts**: Gestión de avatares en Cloudinary.
- **strategies/**:
  - **index.ts**: Registro centralizado de estrategias (`AUTH_STRATEGIES`).
  - **jwt/jwt.strategy.ts**: Validación JWT para rutas protegidas.
  - **oauth/google/google.strategy.ts**: Estrategia Passport Google.
  - **oauth/microsoft/microsoft.strategy.ts**: Estrategia Passport Microsoft.
  - **base/oauth-profile.ts**: Helpers comunes para parsear perfiles OAuth.
  - **base/oauth-validation.base.ts**: Flujo compartido de `validate` para estrategias OAuth.
- **roles/**:
  - **roles.decorator.ts**: Decorador `@Roles(...)`.
  - **roles.guard.ts**: Guard de autorización por rol.
- **\*.spec.ts**: Tests unitarios co-localizados.

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
- Mantén la extracción de campos OAuth en `strategies/base/oauth-profile.ts` para evitar duplicación.
- Mantén el manejo de errores/callback de Passport en `strategies/base/oauth-validation.base.ts`.
- Variables OAuth esperadas:
  - Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Microsoft: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CALLBACK_URL`

## 8. Añadir Un Nuevo Proveedor OAuth

Checklist recomendado:

1. Crear estrategia en `strategies/oauth/<provider>/<provider>.strategy.ts`.
2. Reutilizar helpers de `strategies/base/oauth-profile.ts` y `runOAuthValidation`.
3. Añadir método de delegación en `auth.service.ts` (si aplica) y enrutar al `OAuthProviderService`.
4. Registrar la estrategia en `strategies/index.ts` (`AUTH_STRATEGIES`).
5. Añadir endpoints en `auth.controller.ts` (`/auth/<provider>` y callback).
6. Añadir variables de entorno en `.env.*` y documentación.
7. Crear/ajustar tests (`*.spec.ts`) del provider nuevo.

---

**Resumen:**
El módulo `auth` implementa autenticación segura con Google y Microsoft, soporte JWT para sesiones API y autorización basada en roles, siguiendo buenas prácticas de NestJS y Passport.
