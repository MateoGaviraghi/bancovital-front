'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { CotizacionDetalle, CotizacionEstado, UpdateCotizacionDto } from '@/lib/api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

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

const AR_MONEY = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});
const AR_DATE = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function fmtMoney(s: string) {
  return `$ ${AR_MONEY.format(Number(s))}`;
}
function fmtDate(d: string) {
  return AR_DATE.format(new Date(d));
}
function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function CotizacionDetailClient({ cot }: { cot: CotizacionDetalle }) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<CotizacionEstado>(cot.estado);
  const [isDownloading, setIsDownloading] = useState(false);

  const updateMut = useMutation({
    mutationFn: (dto: UpdateCotizacionDto) =>
      apiClient.patch(`/cotizaciones/${cot.id}`, dto),
    onSuccess: () => {
      toast.success('Estado actualizado');
      qc.invalidateQueries({ queryKey: queries.cotizaciones.detail(cot.id) });
      qc.invalidateQueries({ queryKey: queries.cotizaciones.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar')),
  });

  function handleEstadoChange(newEstado: CotizacionEstado) {
    setEstado(newEstado);
    updateMut.mutate({ estado: newEstado });
  }

  async function downloadPdf() {
    setIsDownloading(true);
    try {
      const res = await apiClient.get(`/cotizaciones/${cot.id}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${String(cot.id).padStart(4, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar PDF');
    } finally {
      setIsDownloading(false);
    }
  }

  const receptorNombre =
    cot.tipo === 'paciente' && cot.patientInfo
      ? `${cot.patientInfo.lastName}, ${cot.patientInfo.firstName}`
      : cot.empresaNombre ?? '—';

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[estado]}`}>
            {ESTADO_LABEL[estado]}
          </span>
          <span className="text-xs text-[var(--color-fg-muted)]">
            Emitida el {fmtDate(cot.createdAt)} · Válida {cot.validezDias} días
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={estado} onValueChange={(v) => handleEstadoChange(v as CotizacionEstado)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['borrador', 'enviada', 'aceptada', 'rechazada', 'expirada'] as const).map((e) => (
                <SelectItem key={e} value={e} className="text-xs">
                  {ESTADO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/cotizaciones/${cot.id}/editar`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
              Editar
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={downloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Receptor */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            {cot.tipo === 'empresa' ? 'Empresa' : 'Paciente'}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="font-medium text-[var(--color-fg)]">{receptorNombre}</div>
            {cot.patientInfo && (
              <div className="text-xs text-[var(--color-fg-muted)]">DNI {cot.patientInfo.dni}</div>
            )}
            {cot.empresaCuit && (
              <div className="text-xs text-[var(--color-fg-muted)]">CUIT {cot.empresaCuit}</div>
            )}
            {cot.empresaContacto && (
              <div className="text-xs text-[var(--color-fg-muted)]">
                Contacto: {cot.empresaContacto}
              </div>
            )}
            {cot.empresaEmail && (
              <div className="text-xs text-[var(--color-fg-muted)]">{cot.empresaEmail}</div>
            )}
            {cot.empresaTelefono && (
              <div className="text-xs text-[var(--color-fg-muted)]">{cot.empresaTelefono}</div>
            )}
          </div>
        </div>

        {/* Condiciones */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Condiciones
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Obra social</span>
              <span className="font-medium text-[var(--color-fg)]">
                {cot.insurerInfo?.name ?? 'Particular'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Validez</span>
              <span className="font-medium text-[var(--color-fg)]">{cot.validezDias} días</span>
            </div>
            {cot.observaciones && (
              <p className="mt-2 text-xs text-[var(--color-fg-muted)] italic">
                {cot.observaciones}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Prácticas cotizadas
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-fg-muted)]">
              <th className="px-4 py-2 font-medium">Práctica</th>
              <th className="w-28 px-4 py-2 text-center font-medium">Precio unit.</th>
              <th className="w-16 px-4 py-2 text-center font-medium">Cant.</th>
              <th className="w-28 px-4 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {cot.items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--color-bg-subtle)]">
                <td className="px-4 py-2.5 font-medium text-[var(--color-fg)]">
                  {item.practicaNombre}
                </td>
                <td className="px-4 py-2.5 text-center text-[var(--color-fg-muted)]">
                  {fmtMoney(item.precioUnitario)}
                </td>
                <td className="px-4 py-2.5 text-center text-[var(--color-fg-muted)]">
                  {item.cantidad}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-fg)]">
                  {fmtMoney(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-[var(--color-fg)]">
                TOTAL
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-base text-[var(--color-primary)]">
                {fmtMoney(cot.totalMonto)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {updateMut.isPending && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
          <Loader2 className="h-3 w-3 animate-spin" />
          Guardando…
        </div>
      )}
    </div>
  );
}
