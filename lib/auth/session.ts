import { getSupabaseServer } from '@/lib/supabase-server';
import { cache } from 'react';

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
  return session?.access_token ?? null;
});

export async function requireRole(allowed: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
