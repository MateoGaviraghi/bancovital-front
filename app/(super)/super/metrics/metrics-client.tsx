'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { SuperMetrics } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { Money } from '@/lib/money';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Ban,
  BarChart3,
  Building2,
  CircleSlash,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react';

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "2026-06" → "jun 26". Falls back to the raw period on any parse issue. */
function formatPeriodo(periodo: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!m) return periodo;
  const year = m[1].slice(2);
  const month = MONTH_LABELS[Number.parseInt(m[2], 10) - 1] ?? m[2];
  return `${month} ${year}`;
}

// ─── Stat card ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  tone: 'success' | 'warning' | 'neutral' | 'primary';
}) {
  const toneCls: Record<typeof tone, string> = {
    success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    neutral: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
    primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 shadow-[var(--shadow-xs)]">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
          toneCls[tone],
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          {label}
        </p>
        <p className="tabular font-semibold text-[var(--color-fg)] text-2xl leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Órdenes por mes (mini bar chart, no library) ────────────────────

function OrdenesChart({ data }: { data: SuperMetrics['ordenesPorMes'] }) {
  const last6 = data.slice(-6);
  const max = Math.max(1, ...last6.map((d) => d.total));

  if (last6.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-fg-muted)]">
        Sin datos de órdenes.
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-3 pt-2">
      {last6.map((d) => {
        const h = Math.round((d.total / max) * 100);
        const excH = d.total > 0 ? Math.round((d.excedentes / d.total) * h) : 0;
        return (
          <div key={d.periodo} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="tabular font-mono text-[10px] text-[var(--color-fg-muted)]">
              {d.total.toLocaleString('es-AR')}
            </span>
            <div
              className="flex h-32 w-full max-w-[44px] flex-col justify-end overflow-hidden rounded-md bg-[var(--color-bg-subtle)]"
              role="img"
              aria-label={`${formatPeriodo(d.periodo)}: ${d.total} órdenes, ${d.excedentes} excedentes`}
            >
              {/* base (within-quota) */}
              <div
                className="w-full bg-[var(--color-primary)] transition-[height]"
                style={{ height: `${h - excH}%` }}
              />
              {/* excedentes segment on top */}
              {excH > 0 && (
                <div
                  className="w-full bg-[var(--color-danger)] transition-[height]"
                  style={{ height: `${excH}%` }}
                />
              )}
            </div>
            <span className="text-[10px] text-[var(--color-fg-muted)]">
              {formatPeriodo(d.periodo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top labs por uso ────────────────────────────────────────────────

function TopLabsTable({ rows }: { rows: SuperMetrics['topLabsUso'] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[var(--color-fg-muted)]">
        Sin laboratorios con consumo registrado.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          <th className="px-5 py-2.5 text-left font-medium">Laboratorio</th>
          <th className="px-5 py-2.5 text-right font-medium">Usadas</th>
          <th className="px-5 py-2.5 text-right font-medium">Cupo</th>
          <th className="px-5 py-2.5 text-left font-medium">Uso</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((lab) => {
          const pct = lab.porcentaje ?? 0;
          const barColor =
            pct >= 100
              ? 'bg-[var(--color-danger)]'
              : pct >= 80
                ? 'bg-[var(--color-warning)]'
                : 'bg-[var(--color-primary)]';
          return (
            <tr
              key={lab.labId}
              className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
            >
              <td className="px-5 py-3 text-[var(--color-fg)]">
                {lab.nombre}
                {lab.excedentes > 0 && (
                  <span className="ml-2 rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-1.5 py-px text-[10px] font-medium text-[var(--color-danger)]">
                    +{lab.excedentes} exc.
                  </span>
                )}
              </td>
              <td className="tabular px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-muted)]">
                {lab.usadas.toLocaleString('es-AR')}
              </td>
              <td className="tabular px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-muted)]">
                {lab.cupoEfectivo != null ? lab.cupoEfectivo.toLocaleString('es-AR') : '—'}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[var(--color-bg-subtle)]"
                    role="progressbar"
                    tabIndex={0}
                    aria-valuenow={Math.min(Math.round(pct), 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${lab.usadas} de ${lab.cupoEfectivo ?? '?'} órdenes`}
                  >
                    <div
                      className={cn('h-full rounded-full transition-[width]', barColor)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="tabular w-10 shrink-0 text-right font-mono text-[10px] text-[var(--color-fg-muted)]">
                    {Math.round(pct)}%
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Main client ─────────────────────────────────────────────────────

export function MetricsClient({ initialMetrics }: { initialMetrics: SuperMetrics | null }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queries.super.metrics(),
    queryFn: () => apiClient.get<SuperMetrics>('/super/metrics').then((r) => r.data),
    initialData: initialMetrics ?? undefined,
    staleTime: 30_000,
  });

  return (
    <div>
      <PageHeader
        title="Métricas"
        description="Resumen global de laboratorios, facturación y consumo."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
            )}
            Actualizar
          </Button>
        }
      />

      {isLoading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-subtle)]" strokeWidth={2} />
        </div>
      )}

      {!isLoading && isError && !data && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-6 py-16 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--color-danger)]" strokeWidth={2} />
          <p className="text-sm text-[var(--color-danger)]">No se pudieron cargar las métricas.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Reintentar
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Labs activos"
              value={data.labs.activos.toLocaleString('es-AR')}
              icon={Building2}
              tone="success"
            />
            <StatCard
              label="Suspendidos"
              value={data.labs.suspendidos.toLocaleString('es-AR')}
              icon={Ban}
              tone="warning"
            />
            <StatCard
              label="Inactivos"
              value={data.labs.inactivos.toLocaleString('es-AR')}
              icon={CircleSlash}
              tone="neutral"
            />
            <StatCard
              label="MRR estimado"
              value={Money.toDisplay(data.mrr)}
              icon={Wallet}
              tone="primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Órdenes por mes */}
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
              <div className="mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--color-fg-muted)]" strokeWidth={2} />
                <h2 className="font-semibold text-[var(--color-fg)] text-sm">
                  Órdenes por mes (últimos 6)
                </h2>
              </div>
              <p className="mb-2 flex items-center gap-3 text-[10px] text-[var(--color-fg-muted)]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[var(--color-primary)]" /> En cupo
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[var(--color-danger)]" /> Excedentes
                </span>
              </p>
              <OrdenesChart data={data.ordenesPorMes} />
            </section>

            {/* Top labs por uso */}
            <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 border-[var(--color-border)] border-b px-5 py-3">
                <BarChart3 className="h-4 w-4 text-[var(--color-fg-muted)]" strokeWidth={2} />
                <h2 className="font-semibold text-[var(--color-fg)] text-sm">Top labs por uso</h2>
              </div>
              <div className="overflow-x-auto">
                <TopLabsTable rows={data.topLabsUso} />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
