import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Route map (app única bancovital, sin slug):
//   /                    landing pública
//   /login               login único
//   /auth/*              set-password (Supabase invite links)
//   /contratar/*         contratación pública por token
//   /reunion/*           confirmar/cancelar reunión (email)
//   /informe/*           portal del paciente (token + DNI)
//   /super/**            panel super (sesión; rol enforced por layout/API)
//   /inicio, /ordenes, … app del lab (sesión; scope por labId del JWT)
function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname === '/contratar' || pathname.startsWith('/contratar/')) return true;
  if (pathname === '/reunion' || pathname.startsWith('/reunion/')) return true;
  // Portal público del paciente (por token + DNI)
  if (pathname === '/informe' || pathname.startsWith('/informe/')) return true;
  // QA del design system (Fase 8): visible sin login en dev/preview.
  // La page hace notFound() cuando VERCEL_ENV === 'production'.
  if (pathname === '/showcase' || pathname.startsWith('/showcase/')) return true;
  return false;
}

export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Intentionally NOT redirecting authenticated users away from login pages.
  // A stale Supabase session without a usable app role would otherwise be
  // bounced off /login by the middleware yet rejected by the app pages (no
  // role) — trapping the user on a placeholder with no way to re-authenticate.
  // Letting login pages always render lets a fresh sign-in overwrite the bad
  // session. Routing of *valid* sessions to their home is handled by the pages.

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
