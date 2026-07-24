import { DownloadPdfButton } from '@/components/domain/download-pdf-button';
import { MoneyDisplay } from '@/components/domain/money-display';
import { StatusPill } from '@/components/domain/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { Insurer, OrderListItem, OrderStatus } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { ChevronLeft, ChevronRight, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';
import { OrdersFilters } from './filters';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

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
  searchParams: Promise<{
    status?: string | string[];
    insurer?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
  }>;
};

interface PaginatedOrders {
  data: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchData(sp: Awaited<Props['searchParams']>): Promise<{
  result: PaginatedOrders;
  insurers: Insurer[];
}> {
  try {
    const api = await getServerApi();
    const rawStatuses = sp.status ? (Array.isArray(sp.status) ? sp.status : [sp.status]) : [];
    const validStatuses = rawStatuses.filter((s) => VALID_STATUSES.includes(s as OrderStatus));
    const page = Math.max(Number(sp.page) || 1, 1);

    const [ordersRes, insurersRes] = await Promise.all([
      api.get<PaginatedOrders>('/orders', {
        params: {
          limit: PAGE_SIZE,
          page,
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
    return { result: ordersRes.data, insurers: insurersRes.data };
  } catch {
    return {
      result: { data: [], total: 0, page: 1, pageSize: PAGE_SIZE },
      insurers: [],
    };
  }
}

function buildPageUrl(sp: Awaited<Props['searchParams']>, targetPage: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set('q', sp.q);
  if (sp.from) params.set('from', sp.from);
  if (sp.to) params.set('to', sp.to);
  if (sp.insurer) params.set('insurer', sp.insurer);
  const statuses = sp.status ? (Array.isArray(sp.status) ? sp.status : [sp.status]) : [];
  for (const s of statuses) params.append('status', s);
  if (targetPage > 1) params.set('page', String(targetPage));
  const qs = params.toString();
  return qs ? `/ordenes?${qs}` : '/ordenes';
}

export default async function OrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const canCreate = user?.role === 'admin' || user?.role === 'bioquimico';
  const { result, insurers } = await fetchData(sp);
  const { data: orders, total, page, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <PageHeader
        title="Órdenes"
        description={total > 0 ? `${total} ${total === 1 ? 'orden' : 'órdenes'}` : undefined}
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/ordenes/nueva">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nueva orden
              </Link>
            </Button>
          )
        }
      />

      <OrdersFilters insurers={insurers.map((i) => ({ id: i.id, name: i.name }))} />

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
          <div className="overflow-x-auto">
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
                        href={`/ordenes/${o.id}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        #{String(o.protocolNumber).padStart(5, '0')}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {o.patient ? (
                        <>
                          {o.patient.lastName}, {o.patient.firstName}
                          <span className="ml-2 tabular font-mono text-[10px] text-[var(--color-fg-subtle)]">
                            {o.patient.dni}
                          </span>
                        </>
                      ) : o.animalPatient ? (
                        <>
                          {o.animalPatient.nombre}
                          <span className="ml-2 text-[10px] text-[var(--color-fg-subtle)]">
                            {o.animalPatient.especie}{o.animalPatient.propietario ? ` · ${o.animalPatient.propietario}` : ''}
                          </span>
                        </>
                      ) : o.solicitante ? (
                        <>
                          {o.solicitante.razonSocial ?? o.solicitante.nombreApellido}
                          {o.solicitante.razonSocial && (
                            <span className="ml-2 text-[10px] text-[var(--color-fg-subtle)]">
                              {o.solicitante.nombreApellido}
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-[var(--color-border)] border-t px-5 py-3">
              <p className="text-[var(--color-fg-muted)] text-xs">
                {from}–{to} de {total}
              </p>
              <div className="flex items-center gap-1">
                {page > 1 ? (
                  <Link
                    href={buildPageUrl(sp, page - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </Link>
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-fg-subtle)] opacity-40">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}
                <span className="px-2 text-[var(--color-fg)] text-xs font-medium">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={buildPageUrl(sp, page + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-fg-subtle)] opacity-40">
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
