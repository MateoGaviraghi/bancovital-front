'use client';

import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { ConsumoCiclo } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';

// ─── Progress bar ──────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const barColor =
    pct >= 100
      ? 'bg-[var(--color-danger)]'
      : pct >= 80
        ? 'bg-[var(--color-warning)]'
        : 'bg-white/85';

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      tabIndex={0}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full',
          barColor,
          '@media (prefers-reduced-motion: no-preference) [transition:width_400ms_cubic-bezier(0.2,0.8,0.2,1)]',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Consumo sidebar widget ────────────────────────────────────

export function ConsumoWidget() {
  const { data: ciclo, isLoading } = useQuery<ConsumoCiclo>({
    queryKey: queries.consumo.ciclo(),
    queryFn: () => apiClient.get<ConsumoCiclo>('/consumo').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  // While loading: render a single-line skeleton so layout doesn't jump
  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-1 w-full animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  // No data, fetch failed, or no plan assigned: render nothing
  if (!ciclo || !ciclo.plan) return null;

  const pct = ciclo.porcentaje ?? 0;

  return (
    <div className="border-white/10 border-t px-4 py-3">
      <p className="mb-1.5 font-medium text-[10px] text-white/40 uppercase tracking-[0.12em]">
        Órdenes del mes
      </p>
      <ProgressBar pct={pct} />
      <p className="tabular mt-1 font-mono text-[10px] text-white/55">
        {ciclo.usadas} de {ciclo.cupoEfectivo ?? '?'}
      </p>
      {ciclo.rollover > 0 && (
        <p className="mt-0.5 text-[10px] text-white/40">incluye +{ciclo.rollover} de rollover</p>
      )}
    </div>
  );
}
