import { MoneyDisplay } from '@/components/domain/money-display';
import { StatusPill } from '@/components/domain/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { OrderListItem, OrderStatus } from '@/lib/api/types';
import Decimal from 'decimal.js';
import { Activity, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Tolera respuestas tanto en array directo como paginado ({ data, total, ... }).
function asArray<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown }).data)) {
    return (d as { data: T[] }).data;
  }
  return [];
}

async function fetchRecentOrders(): Promise<OrderListItem[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get('/orders', { params: { limit: 200 } });
    return asArray<OrderListItem>(data);
  } catch {
    return [];
  }
}

function aggregate(orders: OrderListItem[]) {
  const byStatus: Record<OrderStatus, number> = {
    borrador: 0,
    confirmada: 0,
    en_proceso: 0,
    resultados_cargados: 0,
    emitida: 0,
    entregada: 0,
    anulada: 0,
  };
  const byInsurer = new Map<string, { name: string; count: number; total: Decimal }>();
  let totalInsurer = new Decimal(0);
  let totalParticular = new Decimal(0);
  let urgents = 0;

  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    if (o.isUrgent) urgents += 1;
    totalInsurer = totalInsurer.add(o.totalInsurer || '0');
    totalParticular = totalParticular.add(o.totalParticular || '0');

    const k = String(o.insurer.id);
    const prev = byInsurer.get(k);
    if (prev) {
      prev.count += 1;
      prev.total = prev.total.add(o.totalInsurer || '0');
    } else {
      byInsurer.set(k, {
        name: o.insurer.name,
        count: 1,
        total: new Decimal(o.totalInsurer || '0'),
      });
    }
  }

  const insurerRows = Array.from(byInsurer.values()).sort((a, b) => b.count - a.count);
  return {
    byStatus,
    insurerRows,
    totalInsurer: totalInsurer.toFixed(2),
    totalParticular: totalParticular.toFixed(2),
    urgents,
  };
}

type Kpi = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: 'info' | 'warning' | 'success' | 'danger';
};

const TONE_BG: Record<Kpi['tone'], string> = {
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${TONE_BG[kpi.tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]">
          {kpi.label}
        </div>
        <div className="tabular mt-0.5 font-semibold text-[var(--color-fg)] text-xl">
          {kpi.value}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  borrador: 'Borrador',
  confirmada: 'Confirmada',
  en_proceso: 'En proceso',
  resultados_cargados: 'Resultados',
  emitida: 'Emitida',
  entregada: 'Entregada',
  anulada: 'Anulada',
};

export default async function ReportesPage() {
  const orders = await fetchRecentOrders();

  if (orders.length === 0) {
    return (
      <div>
        <PageHeader title="Reportes" description="KPIs y panorámica del trabajo reciente." />
        <EmptyState
          icon={Activity}
          title="Sin datos para reportar"
          description="Una vez que existan órdenes, los KPIs aparecen acá."
        />
      </div>
    );
  }

  const agg = aggregate(orders);
  const pending = agg.byStatus.borrador + agg.byStatus.confirmada + agg.byStatus.en_proceso;
  const done = agg.byStatus.emitida + agg.byStatus.entregada;

  const kpis: Kpi[] = [
    { label: 'Órdenes recientes', value: orders.length, icon: FileText, tone: 'info' },
    { label: 'En curso', value: pending, icon: Activity, tone: 'warning' },
    { label: 'Emitidas / entregadas', value: done, icon: CheckCircle2, tone: 'success' },
    { label: 'Urgentes', value: agg.urgents, icon: AlertTriangle, tone: 'danger' },
  ];

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="KPIs sobre las últimas 200 órdenes del laboratorio."
      />

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <header className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-5 py-2.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
            Distribución por estado
          </header>
          <table className="w-full text-sm">
            <tbody>
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                <tr key={s} className="border-[var(--color-border)] border-b last:border-b-0">
                  <td className="px-5 py-2.5">
                    <StatusPill status={s} />
                  </td>
                  <td className="tabular px-5 py-2.5 text-right font-mono text-[var(--color-fg)]">
                    {agg.byStatus[s]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <header className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-5 py-2.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
            Por obra social
          </header>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2 text-left font-medium">Obra social</th>
                <th className="px-5 py-2 text-right font-medium">Órdenes</th>
                <th className="px-5 py-2 text-right font-medium">Total OS</th>
              </tr>
            </thead>
            <tbody>
              {agg.insurerRows.map((r) => (
                <tr key={r.name} className="border-[var(--color-border)] border-b last:border-b-0">
                  <td className="px-5 py-2.5 text-[var(--color-fg)]">{r.name}</td>
                  <td className="tabular px-5 py-2.5 text-right font-mono text-[var(--color-fg)]">
                    {r.count}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <MoneyDisplay value={r.total.toFixed(2)} className="text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-[var(--color-border)] border-t bg-[var(--color-bg-subtle)]">
                <td className="px-5 py-2.5 font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Total facturado a OS
                </td>
                <td />
                <td className="px-5 py-2.5 text-right">
                  <MoneyDisplay value={agg.totalInsurer} emphasis />
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>
    </div>
  );
}
