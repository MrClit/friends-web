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

El módulo `auth` gestiona la autenticación y autorización de usuarios en la API backend (NestJS). Permite el login mediante Google OAuth2 y protege rutas usando JWT y roles.

## 2. Estructura de Archivos

- **auth.controller.ts**: Define los endpoints de autenticación (login, callback, etc).
- **auth.service.ts**: Lógica principal de autenticación y validación de usuarios.
- **auth.module.ts**: Configura el módulo, importa estrategias y servicios.
- **google.strategy.ts**: Estrategia Passport para login con Google.
- **jwt.strategy.ts**: Estrategia Passport para validar JWT en peticiones protegidas.
- **roles.decorator.ts**: Decorador para marcar rutas que requieren ciertos roles.
- **roles.guard.ts**: Guard que verifica si el usuario autenticado tiene el rol necesario.
- **\*.spec.ts**: Tests unitarios de los servicios, guards y estrategias.

## 3. Flujo de Autenticación

1. El usuario accede a `/auth/google` para iniciar sesión con Google.
2. Google redirige al backend con el código de autorización.
3. `google.strategy.ts` valida el usuario y genera un JWT.
4. El JWT se devuelve al frontend y se usa en siguientes peticiones.
5. Las rutas protegidas usan `jwt.strategy.ts` para validar el token.

## 4. Estrategias de Autenticación

- **GoogleStrategy**: Permite login OAuth2 con Google. Extrae perfil y crea/actualiza usuario en la base de datos.
- **JwtStrategy**: Valida el JWT en cada petición protegida. Si es válido, añade el usuario al request.

## 5. Roles y Autorización

- **roles.decorator.ts**: Permite anotar rutas con `@Roles('admin')`, etc.
- **roles.guard.ts**: Lee los roles del usuario autenticado y permite o deniega el acceso según corresponda.

## 6. Testing

- Archivos `*.spec.ts` prueban la lógica de autenticación, guards y estrategias usando mocks.

## 7. Notas y Buenas Prácticas

- Usa Passport.js para estrategias de autenticación.
- JWT se firma con clave secreta definida en variables de entorno.
- No exponer información sensible en los errores.
- Los roles permiten controlar el acceso granular a rutas.

---

**Resumen:**
El módulo `auth` implementa autenticación segura con Google y JWT, y autorización basada en roles, siguiendo buenas prácticas de NestJS y Passport.
