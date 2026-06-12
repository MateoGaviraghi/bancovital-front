# lab-front

Frontend del sistema de gestión de laboratorio bioquímico. Next.js 16 + React 19,
consume el backend REST (NestJS) ya deployado. UI en español, código en inglés.

## Stack

- Next.js 16 (App Router, Server Components) + React 19 + TypeScript
- Tailwind v4 (tokens via CSS custom properties, light-only)
- Radix UI primitives + class-variance-authority
- Supabase Auth (`@supabase/ssr`) + proxy de protección de rutas
- axios + TanStack Query 5
- react-hook-form, decimal.js, lucide-react, sonner
- Biome (lint + format)

## Setup local

```bash
pnpm install
cp .env.example .env.local   # completar con valores reales
pnpm dev                     # http://localhost:3000
```

### Variables de entorno (`.env.local`, NO se commitea)

```
NEXT_PUBLIC_API_URL=https://<back>/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

El anon key es seguro para el cliente (RLS protege los datos). Nunca poner el
service role key con prefijo `NEXT_PUBLIC_`.

## Scripts

| Comando | Acción |
|---|---|
| `pnpm dev` | Dev server (puerto 3000) |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome check |
| `pnpm lint:fix` | Biome check + autofix |

## Estructura

```
app/
  (auth)/login         # login público
  (app)/               # rutas protegidas (proxy.ts redirige a /login sin sesión)
    ordenes, pacientes, medicos, obras-sociales, practicas, reportes, admin
components/
  ui/                  # primitives (Radix + CVA)
  domain/              # lógica de negocio (forms, comboboxes, MoneyDisplay…)
  layout/              # sidebar, topbar, page-header
lib/
  api/                 # axios client/server + types (espejo manual de DTOs del back)
  auth/                # session helpers
  money.ts, reference-range.ts, cn.ts
proxy.ts               # protección de rutas (Next 16: reemplaza middleware.ts)
```

## Sincronización de tipos con el back

`lib/api/types.ts` es un **espejo manual** de los DTOs del backend (no hay package
compartido). Cuando el back cambia un DTO/entity, hay que actualizar este archivo
a mano y correr `pnpm typecheck`. Anotarlo en el PR del back.

## Deploy

Push a `main` → Vercel deploya producción. Las 4 variables `NEXT_PUBLIC_*` se
configuran en Vercel (Production/Preview/Development). El dominio de Vercel debe
estar en `CORS_ALLOWED_ORIGINS` del backend o las llamadas API fallan por CORS.

## Roles

`admin` · `recepcion` · `bioquimico` — leídos de `app_metadata.role` del JWT de
Supabase. Sin role en el token, la sesión se trata como no autenticada.
