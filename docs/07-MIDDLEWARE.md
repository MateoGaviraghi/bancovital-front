# 07 — Middleware

Archivo `middleware.ts` en la raíz. Intercepta TODAS las requests antes de llegar al router de Next.

## Responsabilidades

1. Redirigir a `/login` si no hay sesión y la ruta es protegida.
2. Redirigir al home si hay sesión y la ruta es `/login` (no quiero ver login estando logueado).
3. Mantener el cookie de Supabase fresco.

## Implementación

```ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/forgot-password'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({ name, value, ...options });
          }
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // No autenticado intentando entrar a ruta protegida → /login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado intentando entrar a /login → /
  if (user && isPublic) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match TODOS los paths EXCEPTO:
     * - _next/static (assets de Next)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - .png/.svg/.jpg/.webp en raíz
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Comportamiento

| Caso | Resultado |
|---|---|
| Usuario logueado → `/` | Pasa, renderiza home |
| Usuario logueado → `/login` | Redirect 307 → `/` |
| No logueado → `/ordenes` | Redirect 307 → `/login` |
| No logueado → `/login` | Pasa, renderiza login |
| Assets (`/lab-logo.jpg`) | No interceptados (matcher los excluye) |

## Sobre `getUser()` vs `getSession()`

- `getSession()` lee la cookie y devuelve la sesión cacheada. NO valida el JWT.
- `getUser()` valida el token con Supabase remoto. Más lento pero seguro.

En middleware usamos `getUser()` porque queremos asegurar que el token sigue válido. Si el token expiró, `getUser()` lo intenta refrescar con el refresh_token.

## Performance

Middleware corre en cada request. El call a Supabase añade ~50-150ms. Optimizaciones futuras:
- Cachear el resultado para requests dentro de la misma sesión (Vercel KV / Upstash).
- Skip middleware en assets (ya hecho con matcher).

## Notas

- El middleware no puede leer del cliente (browser). Solo cookies HTTP.
- Para protección granular por rol (ej. `/admin/*` solo para admin), agregar otro chequeo:

```ts
if (pathname.startsWith('/admin') && user) {
  const role = user.app_metadata?.role;
  if (role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
}
```

Pero esto se duplica con el chequeo en Server Components que ya hacen `if (user.role !== 'admin') redirect('/')`. Está bien tener ambos como defense-in-depth, pero suficiente con el server-side check.
