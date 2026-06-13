import { getServerApi } from '@/lib/api/server';
import type { MeResponse } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { LandingAnon } from './landing-anon';

// Root page:
// - Authenticated super → /super/labs
// - Authenticated lab user → /{slug}
// - Anonymous → public landing
export default async function RootPage() {
  const user = await getSessionUser();

  if (user) {
    if (user.role === 'super') redirect('/super/labs');

    let labSlug: string | null = null;
    try {
      const api = await getServerApi();
      const { data } = await api.get<MeResponse>('/me');
      labSlug = data.labSlug;
    } catch {
      labSlug = null;
    }
    if (labSlug) redirect(`/${labSlug}`);
  }

  return <LandingAnon />;
}
