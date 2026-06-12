# 03 — Variables de entorno

## Archivo `.env.local` (no commitear)

```env
# Back REST endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Public app URL (para magic link redirects, OAuth callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (anon key — safe para cliente)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Observability (opcionales)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

## `.env.example` (sí commitear, sin valores)

Misma estructura, valores vacíos.

## Documentación de cada variable

| Variable | Tipo | Required | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL | **Sí** | Base URL del back. Incluye `/api`. Ej: `http://localhost:4000/api` |
| `NEXT_PUBLIC_APP_URL` | URL | No | Para redirects de Supabase Auth (callbacks de magic link) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | **Sí** | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | **Sí** | Clave pública anon (segura para cliente) |
| `NEXT_PUBLIC_POSTHOG_KEY` | string | No | Analytics opcional |
| `NEXT_PUBLIC_SENTRY_DSN` | string | No | Error tracking opcional |

## Reglas críticas

1. **Prefijo `NEXT_PUBLIC_`** es OBLIGATORIO para que la variable sea accesible en el cliente (browser). Sin ese prefijo, solo funciona server-side.
2. **NUNCA poner `SUPABASE_SERVICE_ROLE_KEY` con prefijo `NEXT_PUBLIC_`**. Esa key se bundlea al cliente y queda expuesta. La service_role va SOLO en el back.
3. La `anon key` está diseñada para ser pública. RLS de Postgres restringe accesos. Está OK.
4. Después de cambiar una `NEXT_PUBLIC_*`, **hay que rebuildear** para que aplique al bundle del cliente. En Vercel: redeploy.

## Dónde van en cada entorno

| Variable | Local | Vercel |
|---|---|---|
| Todas | `.env.local` | Project Settings → Environment Variables → marcar Production + Preview + Development |

## Cómo obtener los valores de Supabase

1. Supabase Dashboard → tu proyecto
2. Project Settings → API
3. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## URL del back

- **Local:** `http://localhost:4000/api` (asumiendo `lab-back` corriendo en :4000 con prefijo `/api`).
- **Producción:** la URL de Railway del back. Ej: `https://lab-back-production-xxxx.up.railway.app/api`.

Importante: incluye `/api` al final. Sin esa parte, las requests fallan con 404.
