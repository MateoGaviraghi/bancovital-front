'use client';

import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { OnboardingChecklist as OnboardingChecklistData } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, Loader2 } from 'lucide-react';

/**
 * Full onboarding checklist card for a lab. Fetches GET /super/labs/:id/onboarding.
 * Degrades silently on fetch failure (retry:false).
 */
export function OnboardingChecklist({ labId }: { labId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queries.super.onboarding(labId),
    queryFn: () =>
      apiClient.get<OnboardingChecklistData>(`/super/labs/${labId}/onboarding`).then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-medium text-[var(--color-fg)] text-sm">Onboarding</h2>
        {data && (
          <span className="tabular font-mono text-[var(--color-fg-muted)] text-xs">
            {data.completados}/{data.total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[var(--color-fg-muted)] text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          Cargando…
        </div>
      ) : isError || !data ? (
        <p className="text-[var(--color-fg-muted)] text-xs">No se pudo cargar el checklist.</p>
      ) : (
        <>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
              style={{
                width: `${data.total > 0 ? (data.completados / data.total) * 100 : 0}%`,
              }}
            />
          </div>
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-[var(--color-success)]"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Circle
                    className="h-4 w-4 shrink-0 text-[var(--color-fg-subtle)]"
                    strokeWidth={2}
                  />
                )}
                <span
                  className={cn(
                    item.done
                      ? 'text-[var(--color-fg-muted)] line-through'
                      : 'text-[var(--color-fg)]',
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Compact "Onboarding N/M" indicator for the labs table. Fetches the same endpoint;
 * renders a tiny mini-bar. Hidden entirely while loading or on error (non-intrusive).
 */
export function OnboardingBadge({ labId }: { labId: number }) {
  const { data } = useQuery({
    queryKey: queries.super.onboarding(labId),
    queryFn: () =>
      apiClient.get<OnboardingChecklistData>(`/super/labs/${labId}/onboarding`).then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  if (!data) return null;

  const pct = data.total > 0 ? (data.completados / data.total) * 100 : 0;
  const complete = data.completados >= data.total && data.total > 0;

  return (
    <div className="min-w-[96px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          Onboarding
        </span>
        <span
          className={cn(
            'tabular font-mono text-[10px]',
            complete ? 'text-[var(--color-success)]' : 'text-[var(--color-fg-muted)]',
          )}
        >
          {data.completados}/{data.total}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            complete ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
