'use client';

import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { ConsumoCiclo } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────

function periodoLegible(periodo: string): string {
  // periodo format: "YYYY-MM"
  const [year, month] = periodo.split('-');
  if (!year || !month) return periodo;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

// ─── Row ──────────────────────────────────────────────────────

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--color-fg-muted)] text-xs">{label}</span>
      <span
        className={cn(
          'tabular font-mono text-xs',
          emphasis ? 'font-semibold text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────

function BigProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const barColor =
    pct >= 100
      ? 'bg-[var(--color-danger)]'
      : pct >= 80
        ? 'bg-[var(--color-warning)]'
        : 'bg-[var(--color-primary)]';

  const textColor =
    pct >= 100
      ? 'text-[var(--color-danger)]'
      : pct >= 80
        ? 'text-[var(--color-warning)]'
        : 'text-[var(--color-primary)]';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[var(--color-fg-muted)] text-xs">Uso del ciclo</span>
        <span className={cn('tabular font-mono text-xs font-semibold', textColor)}>
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]"
        role="progressbar"
        tabIndex={0}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(pct)}% del cupo mensual usado`}
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
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────

export function ConsumoCard() {
  const { data: ciclo, isLoading } = useQuery<ConsumoCiclo>({
    queryKey: queries.consumo.ciclo(),
    queryFn: () => apiClient.get<ConsumoCiclo>('/consumo').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-bg-subtle)]" />
          <div className="h-2 w-full animate-pulse rounded-full bg-[var(--color-bg-subtle)]" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-[var(--color-bg-subtle)]" />
        </div>
      </div>
    );
  }

  // No plan assigned: show discrete informational card
  if (!ciclo || !ciclo.plan) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
        <p className="font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          Consumo del ciclo
        </p>
        <p className="mt-3 text-[var(--color-fg-muted)] text-sm">
          Sin plan asignado. Contactá a tu proveedor para activar un plan.
        </p>
      </div>
    );
  }

  const pct = ciclo.porcentaje ?? 0;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
            Consumo del ciclo
          </p>
          <p className="mt-0.5 font-semibold text-[var(--color-fg)] text-sm capitalize">
            {periodoLegible(ciclo.periodo)}
          </p>
        </div>
        <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
          {ciclo.plan.nombre}
        </span>
      </div>

      <BigProgressBar pct={pct} />

      <div className="mt-4 space-y-1.5">
        <Row
          label="Cupo base"
          value={`${ciclo.cupoBase?.toLocaleString('es-AR') ?? '?'} órdenes`}
        />
        {ciclo.rollover > 0 && (
          <Row label="Rollover" value={`+${ciclo.rollover.toLocaleString('es-AR')}`} />
        )}
        <Row
          label="Cupo efectivo"
          value={`${ciclo.cupoEfectivo?.toLocaleString('es-AR') ?? '?'} órdenes`}
          emphasis
        />
        <div className="my-2 border-t border-[var(--color-border)]" />
        <Row label="Usadas" value={ciclo.usadas.toLocaleString('es-AR')} emphasis />
        <Row
          label="Restantes"
          value={
            ciclo.restantes !== null ? `${ciclo.restantes.toLocaleString('es-AR')} órdenes` : '—'
          }
        />
        {ciclo.excedentes > 0 && (
          <div className="mt-2 flex items-center justify-between gap-4 rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-3 py-1.5">
            <span className="text-[var(--color-danger)] text-xs">Excedentes</span>
            <span className="tabular font-mono text-xs font-semibold text-[var(--color-danger)]">
              {ciclo.excedentes.toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
