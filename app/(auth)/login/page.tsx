'use client';

import { LoginHero } from '@/components/auth/login-hero';
import { IsoLogo } from '@/components/brand/iso-logo';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getApiClient } from '@/lib/api/client';
import type { MeResponse } from '@/lib/api/types';
import { getSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

// Login ÚNICO de bancovital. Tras el sign-in se rutea por rol:
// super → /super, usuario de lab → /inicio (el back scopea por labId del JWT).
export default function GlobalLoginPage() {
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
      const { data: me } = await getApiClient().get<MeResponse>('/me');
      router.replace(me.role === 'super' ? '/super' : '/inicio');
      router.refresh();
    } catch {
      toast.error('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Formulario */}
      <main className="relative flex items-center justify-center bg-[var(--color-bg-elevated)] px-6 py-12">
        <span className="absolute top-8 left-8 font-semibold text-[var(--color-fg-subtle)] text-sm tracking-tight">
          Banco Vital
        </span>

        <div className="motion-fade-in w-full max-w-[384px]">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary)] shadow-[var(--shadow-button)]">
            <IsoLogo className="w-7 text-white" />
          </div>

          <h1 className="font-semibold text-[var(--color-fg)] text-2xl tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-[var(--color-fg-muted)] text-sm">
            Ingresá a la plataforma de tu laboratorio.
          </p>

          <div className="my-7 h-px bg-[var(--color-border)]" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="usuario@laboratorio.com"
              />
            </FormField>

            <FormField label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </FormField>

            <Button type="submit" size="lg" loading={loading} className="mt-2 h-11 w-full">
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-6 text-[var(--color-fg-subtle)] text-xs">
            ¿Problemas para entrar? Contactá al administrador de tu laboratorio.
          </p>
        </div>
      </main>

      {/* Hero animado */}
      <LoginHero />
    </div>
  );
}
