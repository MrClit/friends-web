# Environment Variables Management

Este proyecto usa **Vite** para gestionar variables de entorno. Las variables se embeben en el código durante el build.

## 📁 Archivos de Entorno

### Commiteados al repositorio:

- `.env` - Valores por defecto base
- `.env.development` - Desarrollo local
- `.env.production` - Producción (GitHub Pages)
- `.env.test` - Tests (Vitest)
- `.env.local.example` - Plantilla de ejemplo

### NO commiteados (en .gitignore):

- `.env.local` - Overrides locales personales
- `.env.*.local` - Overrides específicos por entorno

## 🔑 Variables Disponibles

Todas las variables deben empezar con `VITE_` para ser expuestas al código:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Feature Flags
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=false

# App Metadata
VITE_APP_NAME=Friends
VITE_APP_VERSION=0.1.0
```

## 🎯 Precedencia de Carga

Vite carga los archivos en este orden (mayor a menor prioridad):

1. `.env.[mode].local` (ej: `.env.production.local`)
2. `.env.local`
3. `.env.[mode]` (ej: `.env.production`)
4. `.env`

## 💻 Uso en el Código

**✅ Recomendado** - Usar el helper `ENV`:

```typescript
import { ENV } from '@/config/env';

const apiUrl = ENV.API_URL;
const isDevMode = ENV.IS_DEV;
```

**❌ Evitar** - Acceso directo:

```typescript
// No hacer esto
const apiUrl = import.meta.env.VITE_API_URL;
```

## 🚀 Scripts NPM por Entorno

```bash
# Development (usa .env.development)
pnpm dev

# Production build (usa .env.production)
pnpm build

# Test (usa .env.test)
pnpm test

# Preview production build
pnpm preview
```

## 🛠️ Crear Overrides Locales

Si necesitas probar contra un backend diferente localmente:

```bash
# Copiar el ejemplo
cp .env.local.example .env.local

# Editar .env.local con tus valores
# Este archivo NO se commitea
```

## ⚠️ Importante

- **NUNCA** pongas secretos en estas variables (API keys privadas, passwords)
- Todo lo que definas aquí es **visible en el código del navegador**
- Solo variables con prefix `VITE_` son expuestas al código
- Las variables se embeben en tiempo de **build**, no runtime

## 🔍 Debugging

En desarrollo, el archivo `src/config/env.ts` logea la configuración en la consola:

```
🔧 Environment Configuration: {
  mode: 'development',
  apiUrl: 'http://localhost:3000/api',
  devtools: true,
  debug: true
}
```

## 📝 Añadir Nuevas Variables

1. Añade la variable en todos los archivos `.env*`:

   ```bash
   VITE_NUEVA_VARIABLE=valor
   ```

2. Actualiza el type en `src/vite-env.d.ts`:

   ```typescript
   interface ImportMetaEnv {
     readonly VITE_NUEVA_VARIABLE: string;
   }
   ```

3. Añade al helper `src/config/env.ts`:

   ```typescript
   export const ENV = {
     NUEVA_VARIABLE: import.meta.env.VITE_NUEVA_VARIABLE,
     // ...
   };
   ```

4. Usa en tu código:
   ```typescript
   import { ENV } from '@/config/env';
   console.log(ENV.NUEVA_VARIABLE);
   ```
