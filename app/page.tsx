import { getServerApi } from '@/lib/api/server';
import type { MeResponse } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Root: public product placeholder for anonymous visitors; authenticated users
// are forwarded to their real home so this is never a dead-end.
export default async function RootPage() {
  const user = await getSessionUser();

  if (user) {
    if (user.role === 'super') redirect('/super/labs');

    // Lab user — resolve their slug from /me, then send them home.
    // redirect() must live OUTSIDE the try/catch (it throws NEXT_REDIRECT).
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]">
        <span className="text-2xl font-bold text-[var(--color-fg)]">L</span>
      </div>
      <h1 className="font-bold text-[var(--color-fg)] text-2xl tracking-tight">
        Sistema de gestión de laboratorios
      </h1>
      <p className="mt-3 max-w-sm text-[var(--color-fg-muted)] text-sm leading-relaxed">
        Accedé desde la URL de tu laboratorio para ingresar al sistema.
      </p>
      <p className="mt-6 text-[var(--color-fg-subtle)] text-xs">
        ¿Sos un laboratorio?{' '}
        <span className="text-[var(--color-fg-muted)]">
          Ingresá desde tu URL personalizada (p. ej.,{' '}
          <code className="font-mono">/mi-lab/login</code>)
        </span>
      </p>
      <Link
        href="/login"
        className="mt-8 text-[var(--color-primary)] text-sm font-medium underline-offset-4 hover:underline"
      >
        Ingresar
      </Link>
    </div>
  );
}
