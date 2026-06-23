import { DownloadPdfButton } from '@/components/domain/download-pdf-button';
import { EmitPdfButton } from '@/components/domain/emit-pdf-button';
import { MoneyDisplay } from '@/components/domain/money-display';
import { OrderActions } from '@/components/domain/order-actions';
import { ResultsForm } from '@/components/domain/results-form';
import { StatusPill } from '@/components/domain/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getServerApi } from '@/lib/api/server';
import type { OrderDetail, OrderLine, Practice, ResultLine } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import axios from 'axios';
import { FileText, Lock } from 'lucide-react';
import { notFound } from 'next/navigation';
import React from 'react';
import { DescargarFichaButton } from './descargar-ficha-button';

export const dynamic = 'force-dynamic';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

async function fetchOrderBundle(id: number): Promise<{
  order: OrderDetail;
  lines: OrderLine[];
  results: ResultLine[];
  practiceParentMap: Map<number, number | null>;
}> {
  const api = await getServerApi();
  try {
    const [orderRes, linesRes, resultsRes] = await Promise.all([
      api.get<OrderDetail>(`/orders/${id}`),
      api.get<OrderLine[]>(`/orders/${id}/lines`),
      api.get<ResultLine[]>(`/orders/${id}/results`).catch(() => ({ data: [] as ResultLine[] })),
    ]);

    const lines = linesRes.data;
    const results = resultsRes.data;

    // Collect all unique practiceIds from lines + results in one bulk call
    const allPracticeIds = [
      ...new Set([
        ...lines.filter((l) => l.practiceId !== null).map((l) => l.practiceId as number),
        ...results
          .filter((r) => r.orderPractice.practiceId !== null)
          .map((r) => r.orderPractice.practiceId as number),
      ]),
    ];

    const practiceMap = new Map<number, Practice>();
    if (allPracticeIds.length > 0) {
      const { data: practices } = await api.get<Practice[]>(
        `/practices/bulk?ids=${allPracticeIds.join(',')}`,
      );
      for (const p of practices) practiceMap.set(p.id, p);
    }

    const practiceParentMap = new Map<number, number | null>();
    practiceMap.forEach((p, id) => practiceParentMap.set(id, p.parentId ?? null));

    // Inject referenceValue into each ResultLine
    const enrichedResults: ResultLine[] = results.map((r) => ({
      ...r,
      referenceValue: r.orderPractice.practiceId
        ? (practiceMap.get(r.orderPractice.practiceId)?.referenceValue ?? null)
        : null,
    }));

    return { order: orderRes.data, lines, results: enrichedResults, practiceParentMap };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

const ORIGIN_LABEL: Record<OrderDetail['origin'], string> = {
  ambulatorio: 'Ambulatorio',
  internacion: 'Internación',
  urgencia: 'Urgencia',
};

const AUTH_LABEL: Record<OrderLine['authorizationStatus'], string> = {
  no_aplica: 'No aplica',
  pendiente: 'Pendiente',
  autorizada: 'Autorizada',
  rechazada: 'Rechazada',
};

export default async function OrdenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const [user, bundle] = await Promise.all([getSessionUser(), fetchOrderBundle(numId)]);
  const { order, lines, results, practiceParentMap } = bundle;

  // Build parent-child groups for lines tab
  const orderPracticeIds = new Set(
    lines.filter((l) => l.practiceId !== null).map((l) => l.practiceId as number),
  );
  // A line is a child if its practice's parentId is also a practiceId in this order
  function isChild(l: OrderLine): boolean {
    if (l.practiceId === null) return false;
    const parentId = practiceParentMap.get(l.practiceId);
    return parentId !== null && parentId !== undefined && orderPracticeIds.has(parentId);
  }
  const parentLines = lines.filter((l) => !isChild(l));
  const childLinesByParentId = new Map<number, OrderLine[]>();
  for (const l of lines) {
    if (!l.practiceId) continue;
    const parentId = practiceParentMap.get(l.practiceId);
    if (parentId != null && orderPracticeIds.has(parentId)) {
      const arr = childLinesByParentId.get(parentId) ?? [];
      arr.push(l);
      childLinesByParentId.set(parentId, arr);
    }
  }

  const canLoadResults = user?.role === 'admin' || user?.role === 'bioquimico';
  const canEmit = user?.role === 'admin' || user?.role === 'bioquimico';

  const hasPdf = !!order.pdfReportPath;
  const isEmitted = order.status === 'emitida' || order.status === 'entregada';
  const canEmitNow = order.status === 'resultados_cargados';

  return (
    <div>
      <PageHeader
        title={`Orden #${order.protocolNumber}`}
        description={order.patient ? `${order.patient.lastName}, ${order.patient.firstName} · DNI ${order.patient.dni}` : order.animalPatient ? `${order.animalPatient.nombre} · ${order.animalPatient.especie} · ${order.animalPatient.propietario}` : ''}
        actions={
          <div className="flex items-center gap-3">
            <StatusPill status={order.status} />
            {order.isUrgent && (
              <span className="inline-flex items-center rounded-md border border-[var(--color-danger)]/15 bg-[var(--color-danger-soft)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-danger)] uppercase tracking-wide">
                Urgente
              </span>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <OrderActions order={order} userRole={user?.role} />
        {order.status !== 'anulada' && (
          <DescargarFichaButton orderId={order.id} protocolNumber={order.protocolNumber} />
        )}
      </div>

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="lineas">Prácticas ({lines.length})</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="informe">Informe</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
              <h3 className="mb-3 font-semibold text-[var(--color-fg)] text-sm">Datos generales</h3>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-[var(--color-fg-muted)]">Fecha</dt>
                <dd className="tabular text-[var(--color-fg)]">
                  {DATE_FMT.format(new Date(order.orderDate))}
                </dd>
                <dt className="text-[var(--color-fg-muted)]">Origen</dt>
                <dd className="text-[var(--color-fg)]">{ORIGIN_LABEL[order.origin]}</dd>
                <dt className="text-[var(--color-fg-muted)]">Obra social</dt>
                <dd className="text-[var(--color-fg)]">{order.insurer.name}</dd>
                {order.insuranceAffiliateNumber && (
                  <>
                    <dt className="text-[var(--color-fg-muted)]">N° afiliado</dt>
                    <dd className="tabular font-mono text-[var(--color-fg)]">
                      {order.insuranceAffiliateNumber}
                    </dd>
                  </>
                )}
                {(order.referringDoctorName ?? order.referringDoctorId) && (
                  <>
                    <dt className="text-[var(--color-fg-muted)]">Derivante</dt>
                    <dd className="text-[var(--color-fg)]">
                      {order.referringDoctorName ?? `#${order.referringDoctorId}`}
                      {order.referringDoctorMp && (
                        <span className="ml-2 text-[var(--color-fg-subtle)] text-xs">
                          Mat. {order.referringDoctorMp}
                        </span>
                      )}
                    </dd>
                  </>
                )}
                {order.diagnosis && (
                  <>
                    <dt className="text-[var(--color-fg-muted)]">Diagnóstico</dt>
                    <dd className="text-[var(--color-fg)]">{order.diagnosis}</dd>
                  </>
                )}
                {order.notes && (
                  <>
                    <dt className="text-[var(--color-fg-muted)]">Notas</dt>
                    <dd className="whitespace-pre-line text-[var(--color-fg)]">{order.notes}</dd>
                  </>
                )}
                {order.cancellationReason && (
                  <>
                    <dt className="text-[var(--color-fg-muted)]">Anulación</dt>
                    <dd className="text-[var(--color-danger)]">{order.cancellationReason}</dd>
                  </>
                )}
              </dl>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
              <h3 className="mb-3 font-semibold text-[var(--color-fg)] text-sm">Totales</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--color-fg-muted)]">Total obra social</dt>
                  <dd>
                    <MoneyDisplay value={order.totalInsurer} emphasis />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--color-fg-muted)]">Copago paciente</dt>
                  <dd>
                    <MoneyDisplay value={order.totalPatientCopay} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--color-fg-muted)]">Total particular</dt>
                  <dd>
                    <MoneyDisplay value={order.totalParticular} />
                  </dd>
                </div>
                <div className="flex items-center justify-between border-[var(--color-border)] border-t pt-2 text-xs">
                  <dt className="text-[var(--color-fg-subtle)]">UB aplicada</dt>
                  <dd className="tabular font-mono text-[var(--color-fg-muted)]">
                    {order.ubValueUsed}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="lineas">
          {lines.length === 0 ? (
            <p className="text-[var(--color-fg-muted)] text-sm">Sin prácticas cargadas.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                    <th className="px-5 py-2.5 text-left font-medium">NBU</th>
                    <th className="px-5 py-2.5 text-left font-medium">Práctica</th>
                    <th className="px-5 py-2.5 text-right font-medium">UB</th>
                    <th className="px-5 py-2.5 text-right font-medium">Particular</th>
                    <th className="px-5 py-2.5 text-right font-medium">OS</th>
                    <th className="px-5 py-2.5 text-right font-medium">Copago</th>
                    <th className="px-5 py-2.5 text-left font-medium">Autorización</th>
                  </tr>
                </thead>
                <tbody>
                  {parentLines.map((l) => {
                    const children = l.practiceId
                      ? (childLinesByParentId.get(l.practiceId) ?? [])
                      : [];
                    return (
                      <React.Fragment key={l.id}>
                        <tr className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]">
                          <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)]">
                            {l.nbuCodeSnapshot}
                          </td>
                          <td className="px-5 py-3 font-medium text-[var(--color-fg)]">
                            {l.nameSnapshot}
                          </td>
                          <td className="tabular px-5 py-3 text-right font-mono text-[var(--color-fg)]">
                            {l.unitsSnapshot}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <MoneyDisplay value={l.priceParticular} className="text-xs" />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <MoneyDisplay value={l.priceInsurer} className="text-xs" />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <MoneyDisplay value={l.patientCopay} className="text-xs" />
                          </td>
                          <td className="px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                            {AUTH_LABEL[l.authorizationStatus]}
                            {l.authorizationCode && (
                              <span className="ml-2 tabular font-mono text-[var(--color-fg-subtle)] text-[10px]">
                                {l.authorizationCode}
                              </span>
                            )}
                          </td>
                        </tr>
                        {children.map((child) => (
                          <tr
                            key={child.id}
                            className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)]/40 last:border-b-0"
                          >
                            <td className="tabular py-2 pr-5 pl-10 font-mono text-[var(--color-fg-subtle)] text-xs">
                              ↳ {child.nbuCodeSnapshot}
                            </td>
                            <td className="py-2 pr-5 pl-4 text-[var(--color-fg-muted)] text-xs">
                              {child.nameSnapshot}
                            </td>
                            <td className="tabular py-2 pr-5 text-right font-mono text-[var(--color-fg-subtle)] text-xs">
                              {child.unitsSnapshot}
                            </td>
                            <td className="py-2 pr-5 text-right">
                              <MoneyDisplay
                                value={child.priceParticular}
                                className="text-xs text-[var(--color-fg-muted)]"
                              />
                            </td>
                            <td className="py-2 pr-5 text-right">
                              <MoneyDisplay
                                value={child.priceInsurer}
                                className="text-xs text-[var(--color-fg-muted)]"
                              />
                            </td>
                            <td className="py-2 pr-5 text-right">
                              <MoneyDisplay
                                value={child.patientCopay}
                                className="text-xs text-[var(--color-fg-muted)]"
                              />
                            </td>
                            <td className="py-2 pr-5 text-[var(--color-fg-subtle)] text-xs">
                              {AUTH_LABEL[child.authorizationStatus]}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resultados">
          {!canLoadResults ? (
            <EmptyState
              icon={Lock}
              title="Acceso restringido"
              description="Solo bioquímico o admin pueden cargar resultados."
            />
          ) : results.length === 0 ? (
            <p className="text-[var(--color-fg-muted)] text-sm">
              Sin líneas para cargar resultados.
            </p>
          ) : (
            <ResultsForm lines={results} orderId={order.id} orderStatus={order.status} />
          )}
        </TabsContent>

        <TabsContent value="informe">
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <FileText className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--color-fg)] text-base">Informe PDF</h3>
                <p className="text-[var(--color-fg-muted)] text-sm">
                  {isEmitted
                    ? `Emitido el ${order.pdfReportIssuedAt ? DATE_FMT.format(new Date(order.pdfReportIssuedAt)) : '—'}.`
                    : canEmitNow
                      ? 'La orden está lista para emitir el informe.'
                      : 'El informe se puede emitir una vez cerrados los resultados.'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {canEmitNow && canEmit && <EmitPdfButton orderId={order.id} />}
              {(hasPdf || isEmitted) && (
                <DownloadPdfButton
                  orderId={order.id}
                  variant={canEmitNow ? 'outline' : 'default'}
                />
              )}
              {!canEmitNow && !hasPdf && !isEmitted && (
                <span className="text-[var(--color-fg-subtle)] text-xs">
                  Sin acciones disponibles en estado actual.
                </span>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
