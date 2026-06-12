# lab-front — Plan de construcción

> Documentación completa para construir desde cero el frontend del sistema.
> Stack: **Next.js 16 + React 19 + Tailwind v4 + axios + TanStack Query**.

## Cómo usar esta carpeta

Esta carpeta **no contiene código**, solo planes y especificaciones. Seguís los archivos en orden y construís el repo `lab-front` desde cero. El front consume el back REST que vivirá en `lab-back`.

## Orden de lectura

1. **01-STACK.md** — Tecnologías y dependencias.
2. **02-SETUP.md** — Cómo crear el proyecto Next.js desde cero.
3. **03-ENV.md** — Variables de entorno.
4. **04-PAGES.md** — Todas las pantallas y qué endpoints consumen.
5. **05-COMPONENTS.md** — Componentes (domain, UI, layout).
6. **06-LIB.md** — Helpers (auth, supabase, api client, money, etc.).
7. **07-MIDDLEWARE.md** — Protección de rutas.
8. **08-DESIGN-TOKENS.md** — Colores, tipografía, spacing.
9. **09-API-CLIENT.md** — Cómo hablar con el back.
10. **10-DEPLOY.md** — Vercel.
11. **11-PLAN-ACCION.md** — Orden de tareas.

## Resumen del sistema

UI de gestión del laboratorio. Server Components fetch datos del back (REST con axios), Client Components manejan formularios e interactividad. Auth via Supabase (login client-side), token se manda como `Authorization: Bearer` en cada request al back.

## Pre-requisitos antes de arrancar

- El back (`lab-back`) ya está corriendo (local en `:4000` o en Railway).
- Tenés las credenciales de Supabase (URL + anon key).

## Reglas

- UI en español, código en inglés.
- Plata mostrada con `MoneyDisplay` (decimal.js bajo el capó).
- Toast notifications con sonner.
- `app/(app)/` requiere auth — middleware redirige a `/login` si no hay sesión.
- Sin dark mode (solo light, look médico profesional).
