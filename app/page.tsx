import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { LandingAnon } from './landing-anon';

// Root:
// - super autenticado → /super
// - usuario de lab autenticado → /inicio
// - anónimo → landing pública
export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === 'super' ? '/super' : '/inicio');
  return <LandingAnon />;
}
