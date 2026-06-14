'use client';

import { apiClient } from '@/lib/api/client';
import { clearImpersonate, getImpersonateLab, getImpersonateName } from '@/lib/impersonate';
import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Permanent warning banner shown while a super is operating as a lab.
 * Reads the impersonation cookies on the client (after mount to avoid an SSR
 * hydration mismatch). Uses warning color — deliberately NOT the tenant
 * primary — so it stays distinct under any lab theme.
 *
 * Mounted in both the tenant app layout and the super layout.
 */
export function ImpersonateBanner() {
  const [name, setName] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (getImpersonateLab()) {
      setName(getImpersonateName() ?? 'laboratorio');
    }
  }, []);

  if (!name) return null;

  async function handleExit() {
    setExiting(true);
    try {
      await apiClient.post('/super/impersonate/exit');
    } catch {
      // Even if the API call fails, drop the local impersonation state so the
      // super isn't stuck — the cookie is the source of truth client-side.
    }
    clearImpersonate();
    // Full navigation so all SSR layouts re-resolve without the cookie.
    window.location.href = '/super/labs';
  }

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-2 text-[var(--color-warning)] sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <ShieldAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
        <p className="min-w-0 text-sm">
          Estás operando como <span className="font-semibold">{name}</span>
          <span className="text-[var(--color-warning)]/80"> — modo soporte (super)</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={exiting}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/10 disabled:opacity-60"
      >
        {exiting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <LogOut className="h-4 w-4" strokeWidth={2} />
        )}
        Salir
      </button>
    </div>
  );
}
