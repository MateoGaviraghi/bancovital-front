import { getSupabaseServer } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Reads the access token straight from the Supabase auth cookie.
 * getSession() is unreliable in RSC (can return null even with a valid
 * cookie), so this is the source-of-truth fallback for server-side calls.
 */
async function readAccessTokenFromCookie(): Promise<string | null> {
  try {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
    const store = await cookies();
    const base = `sb-${ref}-auth-token`;

    let raw = store.get(base)?.value;
    if (!raw) {
      // Supabase chunks large sessions across .0, .1, ...
      const chunks: string[] = [];
      for (let i = 0; i < 10; i++) {
        const c = store.get(`${base}.${i}`)?.value;
        if (!c) break;
        chunks.push(c);
      }
      raw = chunks.join('');
    }
    if (!raw) return null;

    if (raw.startsWith('base64-')) raw = raw.slice(7);
    const session = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export type AppRole = 'admin' | 'recepcion' | 'bioquimico' | 'super';

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  displayName: string | null;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = (user.app_metadata?.role as AppRole | undefined) ?? null;
  if (!role) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
  };
});

export const getSessionToken = cache(async (): Promise<string | null> => {
  const supabase = await getSupabaseServer();
  await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  // RSC fallback: getSession() returned null but the cookie is valid.
  return readAccessTokenFromCookie();
});

export async function requireRole(allowed: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
