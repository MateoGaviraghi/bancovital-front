import { DownloadPdfButton } from '@/components/domain/download-pdf-button';
import { MoneyDisplay } from '@/components/domain/money-display';
import { StatusPill } from '@/components/domain/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { Insurer, OrderListItem, OrderStatus } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { AlertTriangle, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';
import { OrdersFilters } from './filters';

export const dynamic = 'force-dynamic';

const LIMIT = 200;

const VALID_STATUSES: OrderStatus[] = [
  'borrador',
  'confirmada',
  'en_proceso',
  'resultados_cargados',
  'emitida',
  'entregada',
  'anulada',
];

const AR_DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function formatDateTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const parts = AR_DATE_TIME.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    status?: string | string[];
    insurer?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
};

async function fetchData(sp: Awaited<Props['searchParams']>): Promise<{
  orders: OrderListItem[];
  insurers: Insurer[];
}> {
  try {
    const api = await getServerApi();
    const rawStatuses = sp.status ? (Array.isArray(sp.status) ? sp.status : [sp.status]) : [];
    const validStatuses = rawStatuses.filter((s) => VALID_STATUSES.includes(s as OrderStatus));

    const [ordersRes, insurersRes] = await Promise.all([
      api.get<OrderListItem[]>('/orders', {
        params: {
          limit: LIMIT,
          status: validStatuses.length > 0 ? validStatuses : undefined,
          insurerId: sp.insurer ? Number(sp.insurer) : undefined,
          dateFrom: sp.from || undefined,
          dateTo: sp.to || undefined,
          search: sp.q || undefined,
        },
        paramsSerializer: (p) => {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(p)) {
            if (v === undefined || v === null) continue;
            if (Array.isArray(v)) {
              for (const item of v) qs.append(k, String(item));
            } else {
              qs.set(k, String(v));
            }
          }
          return qs.toString();
        },
      }),
      api.get<Insurer[]>('/insurers'),
    ]);
    return { orders: ordersRes.data, insurers: insurersRes.data };
  } catch {
    return { orders: [], insurers: [] };
  }
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  const canCreate = user?.role === 'admin' || user?.role === 'bioquimico';
  const { orders, insurers } = await fetchData(sp);
  const capped = orders.length === LIMIT;

  return (
    <>
      <PageHeader
        title="Órdenes"
        description={`${orders.length}${capped ? '+' : ''} ${orders.length === 1 ? 'orden' : 'órdenes'}`}
        actions={
          canCreate && (
            <Button asChild>
              <Link href={`/${slug}/ordenes/nueva`}>
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nueva orden
              </Link>
            </Button>
          )
        }
      />

      <OrdersFilters insurers={insurers.map((i) => ({ id: i.id, name: i.name }))} />

      {capped && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-[var(--color-warning)] text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Se muestran las últimas {LIMIT} órdenes. Usá los filtros para acotar los resultados.
        </div>
      )}

      {orders.length === 0 ? (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <EmptyState
            icon={ClipboardList}
            title="Sin órdenes"
            description="No hay órdenes que coincidan con los filtros."
          />
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Protocolo</th>
                <th className="px-5 py-2.5 text-left font-medium">Paciente</th>
                <th className="px-5 py-2.5 text-left font-medium">Obra social</th>
                <th className="px-5 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-5 py-2.5 text-right font-medium">$ Particular</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-[var(--color-border)] border-b transition-colors last:border-0 hover:bg-[var(--color-bg-subtle)]"
                >
                  <td className="tabular px-5 py-3 font-mono text-xs">
                    <Link
                      href={`/${slug}/ordenes/${o.id}`}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      #{String(o.protocolNumber).padStart(5, '0')}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-fg)]">
                    {o.patient.lastName}, {o.patient.firstName}
                    <span className="ml-2 tabular font-mono text-[10px] text-[var(--color-fg-subtle)]">
                      {o.patient.dni}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                    {o.insurer.name}
                  </td>
                  <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                    {formatDateTime(o.orderDate)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyDisplay value={o.totalParticular} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {o.status === 'emitida' || o.status === 'entregada' ? (
                      <DownloadPdfButton orderId={o.id} compact />
                    ) : (
                      <span className="text-[var(--color-fg-subtle)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
