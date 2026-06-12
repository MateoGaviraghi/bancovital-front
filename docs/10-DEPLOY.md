# 10 — Deploy a Vercel

Vercel detecta Next.js automáticamente. Build directo, sin Docker.

## Pasos

### 1. Crear el proyecto en Vercel

1. https://vercel.com/new
2. Conectar con GitHub si no está ya.
3. **Import Project** → seleccionar el repo `lab-front`.
4. Vercel detecta Next.js automáticamente.
5. **Framework Preset**: Next.js (auto-detected)
6. **Root Directory**: dejá vacío o `/` (el `package.json` está en la raíz)

### 2. Variables de entorno

Settings → Environment Variables → agregar **una por una** o pegar bulk:

```
NEXT_PUBLIC_API_URL=https://lab-back-production-xxxx.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://lab-front-xxxx.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**IMPORTANTE:** marcar las 3 casillas — **Production, Preview, Development**.

### 3. Deploy

Click **Deploy**. Tarda 1-2 min.

Cuando termina, te da una URL pública: `https://lab-front-xxxx.vercel.app`.

### 4. Configurar CORS en el back

El back tiene `CORS_ALLOWED_ORIGINS`. Agregar el dominio que te dio Vercel:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://lab-front-xxxx.vercel.app
```

Esto se setea en Railway (env vars del servicio `lab-back`). Redeploy automático.

### 5. Dominio custom (opcional)

Vercel → Settings → Domains → Add Domain → seguir las instrucciones de DNS.

## Flujo de deploys

- Cada push a `main` → Vercel detecta → build → production deploy.
- Cada push a otra branch → preview deploy con URL única (`lab-front-git-feat-x.vercel.app`).
- Cada PR de GitHub → Vercel comenta el link del preview.

## vercel.json (opcional, en raíz)

Si querés customizar el build:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "pnpm build"
}
```

Generalmente no hace falta — Vercel detecta todo solo.

## Logs

Vercel dashboard → tu proyecto → **Deployments** → click en uno → tabs:
- **Building**: log del build de Next.
- **Functions**: logs runtime de Server Components / Server Actions / Route Handlers.

## Performance

Vercel hace por default:
- Edge cache para assets estáticos.
- CDN global.
- Auto-scaling de Server Components.
- ISR + cache de páginas si las configurás.

## Costo

- Free tier (Hobby): suficiente para arrancar. Incluye millones de requests, dominios.
- Pro ($20/mes): si crecés (más bandwidth, mejor cache, members del team).

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| "Module not found" durante build | falta una dep | `pnpm install`, asegurar `package.json` + `pnpm-lock.yaml` commiteados |
| Build OK pero blanco en runtime | env vars faltantes | revisar `NEXT_PUBLIC_*` están las 3 ambientes |
| 401 en todos los endpoints | `NEXT_PUBLIC_API_URL` apunta mal | verificar la URL incluye `/api` al final |
| CORS error en consola browser | back no acepta el dominio | agregar la URL de Vercel al `CORS_ALLOWED_ORIGINS` del back |
| Login redirige en loop | cookie de Supabase mal configurada | revisar `NEXT_PUBLIC_SUPABASE_URL` y `_ANON_KEY` correctos |

## Verificación post-deploy

```
1. Abrir https://lab-front-xxxx.vercel.app
2. Debería redirigir a /login
3. Login con un usuario admin del Supabase
4. Después del login, redirige a /
5. Sidebar muestra el branding (legalName del lab_config)
6. Navegar a /ordenes — tabla carga sin errores
```

Si algo falla, abrir DevTools → Network → ver qué request da error. Si es a `/api/...`, problema del back o del CORS. Si es a `*.supabase.co`, problema de auth keys.
