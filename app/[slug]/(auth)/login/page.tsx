'use client';

import { getSupabase } from '@/lib/supabase-browser';
import { useTenant } from '@/lib/tenant/tenant-context';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

export default function TenantLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const { branding } = useTenant();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Bienvenido');
      router.replace(`/${slug}`);
      router.refresh();
    } catch {
      toast.error('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  const displayName = branding.shortName ?? branding.name;
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — visible md+ */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-2/5 flex-col items-center justify-center px-12 py-16 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-hover) 60%, color-mix(in oklab, var(--color-primary) 70%, black) 100%)',
        }}
      >
        {/* Logo or monogram */}
        {branding.logoUrl ? (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <img
              src={branding.logoUrl}
              alt={displayName}
              className="h-full w-full object-contain p-2"
            />
          </div>
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white mb-6"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {initials}
          </div>
        )}

        <h1 className="text-white font-bold text-3xl tracking-tight leading-tight text-center">
          {displayName}
        </h1>

        {branding.tagline && (
          <p
            className="mt-2 text-sm tracking-widest uppercase font-medium text-center"
            style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.18em' }}
          >
            {branding.tagline}
          </p>
        )}

        {/* Decorative rings */}
        <div className="absolute pointer-events-none overflow-hidden inset-0" style={{ zIndex: 0 }}>
          <div
            className="absolute rounded-full"
            style={{
              width: 420,
              height: 420,
              top: '-80px',
              left: '-120px',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 260,
              height: 260,
              bottom: '-60px',
              left: '60px',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        </div>

        <p
          className="absolute bottom-6 text-xs"
          style={{ color: 'rgba(255,255,255,0.4)', zIndex: 1 }}
        >
          Sistema de gestión de laboratorio
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="mb-8 flex flex-col items-center md:hidden">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white mb-3"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
              }}
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={displayName}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                initials
              )}
            </div>
            <span className="font-bold text-[var(--color-fg)] text-xl tracking-tight">
              {displayName}
            </span>
            {branding.tagline && (
              <span className="mt-0.5 text-[var(--color-fg-muted)] text-xs tracking-widest uppercase">
                {branding.tagline}
              </span>
            )}
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-md)]">
            <div className="mb-7">
              <h2 className="font-semibold text-[var(--color-fg)] text-xl">Iniciar sesión</h2>
              <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
                Ingresá con tu cuenta para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block font-medium text-[var(--color-fg)] text-xs">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="usuario@laboratorio.com"
                  className="block w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] outline-none transition-all placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block font-medium text-[var(--color-fg)] text-xs"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] outline-none transition-all placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg font-semibold text-sm text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
