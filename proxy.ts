import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Multi-tenant route map:
//   /                    public product placeholder
//   /login               global login (super admin + fallback)
//   /auth/*              set-password (Supabase invite links, fixed URL)
//   /{slug}/login        tenant-branded login
//   /{slug}/**           tenant app (session required)
//   /super/**            super panel (session required; role enforced by layout/API)
function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login') return true;
  if (pathname.startsWith('/auth/')) return true;
  // Public contracting pages — no session required
  if (pathname === '/contratar' || pathname.startsWith('/contratar/')) return true;
  // Public meeting confirm/cancel pages (from email links) — no session required
  if (pathname === '/reunion' || pathname.startsWith('/reunion/')) return true;
  return /^\/[^/]+\/login$/.test(pathname);
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
    // Keep the visitor inside their lab's login when the path carries a slug
    const seg = pathname.split('/')[1];
    const target = seg && seg !== 'super' ? `/${seg}/login` : '/login';
    return NextResponse.redirect(new URL(target, request.url));
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
