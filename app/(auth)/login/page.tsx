'use client';

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
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (solo desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-primary)] p-12 text-white lg:flex">
        <IsoLogo className="pointer-events-none absolute -right-24 -bottom-20 w-[480px] text-white/[0.05]" />
        <div className="relative flex items-center gap-3">
          <IsoLogo className="w-7 text-white" />
          <span className="font-semibold text-lg tracking-tight">Banco Vital</span>
        </div>
        <div className="relative max-w-md motion-slide-up">
          <div className="mb-6 h-[3px] w-10 rounded-full bg-[var(--color-accent)]" />
          <h2 className="text-balance font-semibold text-[2rem] leading-[1.15] tracking-tight">
            Tu laboratorio, ordenado de punta a punta.
          </h2>
          <p className="mt-4 text-[15px] text-white/70 leading-relaxed">
            Órdenes, pacientes, resultados, informes y facturación en un solo lugar.
          </p>
        </div>
        <p className="relative text-white/45 text-xs">Creado por Nodo</p>
      </aside>

      {/* Panel del formulario */}
      <main className="flex items-center justify-center bg-[var(--color-bg-elevated)] px-6 py-12">
        <div className="motion-fade-in w-full max-w-[360px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <IsoLogo gradient className="w-8" />
            <span className="font-semibold text-[var(--color-fg)] text-lg tracking-tight">
              Banco Vital
            </span>
          </div>

          <div className="mb-7">
            <h1 className="font-semibold text-[var(--color-fg)] text-2xl tracking-tight">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-[var(--color-fg-muted)] text-sm">
              Ingresá con tu cuenta para continuar.
            </p>
          </div>

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
    </div>
  );
}
