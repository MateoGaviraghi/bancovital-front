'use client';

import { getSupabase } from '@/lib/supabase-browser';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

type TokenState = { status: 'checking' } | { status: 'invalid' } | { status: 'ready' };

const inputCls =
  'block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] outline-none transition-colors placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60';

export default function SetPasswordPage() {
  const router = useRouter();
  const [tokenState, setTokenState] = useState<TokenState>({ status: 'checking' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if ((type !== 'invite' && type !== 'recovery') || !accessToken || !refreshToken) {
        setTokenState({ status: 'invalid' });
        return;
      }

      const supabase = getSupabase();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setTokenState({ status: 'invalid' });
        return;
      }

      setTokenState({ status: 'ready' });
    }

    init();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError('');
    setSubmitError('');

    if (password.length < 8) {
      setFieldError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setFieldError('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setSubmitError(error.message);
        return;
      }

      // Tras setear la contraseña, ruteamos por rol (app única bancovital, sin slug).
      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
          },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          router.replace(me.role === 'super' ? '/super' : '/inicio');
          return;
        }
      } catch {
        // API caída — caemos al fallback.
      }

      // Fallback: a /inicio (el layout de la app redirige a /super si es super).
      router.replace('/inicio');
    } catch {
      setSubmitError('No se pudo guardar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-sm)]">
      <header className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
          <span className="text-lg font-bold text-[var(--color-primary)]">+</span>
        </div>
        <h1 className="text-base font-semibold text-[var(--color-fg)]">Crear contraseña</h1>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Establecé tu contraseña para acceder al sistema
        </p>
      </header>

      {tokenState.status === 'checking' && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--color-fg-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          Verificando enlace…
        </div>
      )}

      {tokenState.status === 'invalid' && (
        <div className="flex items-start gap-3 rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft,#fef2f2)] px-4 py-3 text-sm text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span>El enlace es inválido o ya expiró. Pedí una nueva invitación.</span>
        </div>
      )}

      {tokenState.status === 'ready' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[var(--color-fg-muted)]"
            >
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
              className={inputCls}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-xs font-medium text-[var(--color-fg-muted)]"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={saving}
              className={inputCls}
            />
          </div>

          {fieldError && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {fieldError}
            </p>
          )}

          {submitError && (
            <div className="flex items-start gap-3 rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft,#fef2f2)] px-4 py-3 text-sm text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}
