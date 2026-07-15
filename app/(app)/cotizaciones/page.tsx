import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { CotizacionEstado, CotizacionSummary } from '@/lib/api/types';
import { ChevronLeft, ChevronRight, Plus, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { CatalogoBtn } from './catalogo-btn';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

const ESTADO_LABEL: Record<CotizacionEstado, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  expirada: 'Expirada',
};

const ESTADO_STYLE: Record<CotizacionEstado, string> = {
  borrador: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] border-[var(--color-border)]',
  enviada: 'bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/15',
  aceptada: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/15',
  rechazada: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/15',
  expirada: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)] border-[var(--color-border)]',
};

const AR_DATE = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const AR_MONEY = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

function fmtDate(d: string) {
  return AR_DATE.format(new Date(d));
}
function fmtMoney(s: string) {
  const n = Number(s);
  return `$ ${AR_MONEY.format(n)}`;
}

type Props = { searchParams: Promise<{ estado?: string; tipo?: string; page?: string }> };

export default async function CotizacionesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? '1') || 1);
  const estado = params.estado ?? '';
  const tipo = params.tipo ?? '';

  const api = await getServerApi();
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(estado && { estado }),
    ...(tipo && { tipo }),
  });

  const { data: rows, total } = await api
    .get<{ data: CotizacionSummary[]; total: number }>(`/cotizaciones?${qs}`)
    .then((r) => r.data)
    .catch(() => ({ data: [] as CotizacionSummary[], total: 0 }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description={`${total} cotización${total !== 1 ? 'es' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <CatalogoBtn />
            <Button asChild size="sm">
              <Link href="/cotizaciones/nueva">
                <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
                Nueva cotización
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filtros rápidos */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['', 'borrador', 'enviada', 'aceptada', 'rechazada', 'expirada'] as const).map((e) => {
          const active = estado === e;
          return (
            <Link
              key={e}
              href={`/cotizaciones?${new URLSearchParams({ ...(e && { estado: e }), ...(tipo && { tipo }) })}`}
              className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {e === '' ? 'Todas' : ESTADO_LABEL[e as CotizacionEstado]}
            </Link>
          );
        })}

        <span className="mx-1 self-center text-[var(--color-border)]">|</span>

        {(['', 'paciente', 'empresa', 'generica'] as const).map((t) => {
          const active = tipo === t;
          return (
            <Link
              key={t}
              href={`/cotizaciones?${new URLSearchParams({ ...(estado && { estado }), ...(t && { tipo: t }) })}`}
              className={`rounded-full border px-3 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {t === '' ? 'Todos' : t === 'paciente' ? 'Paciente' : t === 'empresa' ? 'Empresa' : 'Genérica'}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No hay cotizaciones"
          description="Creá la primera cotización para un paciente o empresa."
          action={
            <Button asChild size="sm">
              <Link href="/cotizaciones/nueva">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva cotización
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-left text-xs text-[var(--color-fg-muted)]">
                  <th className="px-4 py-2.5 font-medium">N°</th>
                  <th className="px-4 py-2.5 font-medium">Receptor</th>
                  <th className="px-4 py-2.5 font-medium">Obra social</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((cot) => {
                  const receptorNombre =
                    cot.tipo === 'paciente' && cot.patientInfo
                      ? `${cot.patientInfo.lastName}, ${cot.patientInfo.firstName}`
                      : cot.tipo === 'generica'
                      ? 'Presupuesto genérico'
                      : cot.empresaNombre ?? '—';
                  return (
                    <tr
                      key={cot.id}
                      className="transition-colors hover:bg-[var(--color-bg-subtle)]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/cotizaciones/${cot.id}`}
                          className="font-mono font-semibold text-[var(--color-primary)] hover:underline"
                        >
                          #{String(cot.id).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-fg)]">{receptorNombre}</div>
                        {cot.patientInfo && (
                          <div className="text-xs text-[var(--color-fg-muted)]">
                            DNI {cot.patientInfo.dni}
                          </div>
                        )}
                        {cot.empresaCuit && (
                          <div className="text-xs text-[var(--color-fg-muted)]">
                            CUIT {cot.empresaCuit}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                        {cot.insurerInfo?.name ?? 'Particular'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-fg)]">
                        {fmtMoney(cot.totalMonto)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[cot.estado]}`}
                        >
                          {ESTADO_LABEL[cot.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-fg-muted)]">
                        {fmtDate(cot.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-fg-muted)]">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-1">
                {page > 1 && (
                  <Link
                    href={`/cotizaciones?${new URLSearchParams({ page: String(page - 1), ...(estado && { estado }), ...(tipo && { tipo }) })}`}
                    className="flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs hover:bg-[var(--color-bg-subtle)]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/cotizaciones?${new URLSearchParams({ page: String(page + 1), ...(estado && { estado }), ...(tipo && { tipo }) })}`}
                    className="flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs hover:bg-[var(--color-bg-subtle)]"
                  >
                    Siguiente <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
