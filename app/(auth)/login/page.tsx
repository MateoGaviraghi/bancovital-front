'use client';

import { getSupabase } from '@/lib/supabase-browser';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
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
      router.replace('/');
      router.refresh();
    } catch {
      toast.error('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile-only brand header */}
      <div className="mb-8 flex flex-col items-center md:hidden">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white mb-3"
          style={{ background: 'linear-gradient(135deg, #0db5b0, #0a9490)' }}
        >
          AV
        </div>
        <span className="font-bold text-[var(--color-fg)] text-xl tracking-tight">Laboratorio AV Diagnóstico</span>
        <span className="mt-0.5 text-[var(--color-fg-muted)] text-xs tracking-widest uppercase">
          Laboratorio de Análisis Clínicos
        </span>
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
            <label
              htmlFor="email"
              className="block font-medium text-[var(--color-fg)] text-xs"
            >
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
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0db5b0 0%, #0a9490 100%)' }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
