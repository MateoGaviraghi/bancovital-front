'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { ReunionEstado, ReunionItem } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ExternalLink, Loader2, RefreshCw, VideoIcon, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dow = DAY_LABELS[d.getDay()];
  const day = d.getDate();
  const month = MONTH_LABELS[d.getMonth()];
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${dow} ${day} ${month} ${year}, ${h}:${m}`;
}

const ESTADO_LABELS: Record<ReunionEstado, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  pendiente: 'Pendiente',
};

const ESTADO_CLASSES: Record<ReunionEstado, string> = {
  confirmada: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  cancelada: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  pendiente: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
};

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  initialReuniones: ReunionItem[];
};

export function ReunionesClient({ initialReuniones }: Props) {
  const queryClient = useQueryClient();

  const [cancelTarget, setCancelTarget] = useState<ReunionItem | null>(null);

  const { data: reuniones, isLoading } = useQuery<ReunionItem[]>({
    queryKey: queries.bookings.superList(),
    queryFn: async () => {
      const { data } = await apiClient.get<ReunionItem[]>('/super/bookings');
      return data;
    },
    initialData: initialReuniones,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/super/bookings/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Reunión cancelada.');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: queries.bookings.superList() });
    },
    onError: () => {
      toast.error('No se pudo cancelar la reunión. Intentá de nuevo.');
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <PageHeader
        title="Reuniones"
        description="Solicitudes de reunión recibidas desde la landing."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: queries.bookings.superList() })
            }
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-subtle)]" />
        </div>
      )}

      {!isLoading && (!reuniones || reuniones.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-20 text-center">
          <Calendar className="h-8 w-8 text-[var(--color-fg-subtle)]" />
          <p className="text-sm text-[var(--color-fg-muted)]">
            No hay reuniones registradas todavía.
          </p>
        </div>
      )}

      {!isLoading && reuniones && reuniones.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Email
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide sm:table-cell">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Fecha y hora
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {reuniones.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'transition-colors hover:bg-[var(--color-bg-subtle)]',
                    r.estado === 'cancelada' && 'opacity-60',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-fg)]">{r.nombre}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                    <a
                      href={`mailto:${r.email}`}
                      className="hover:text-[var(--color-primary)] hover:underline"
                    >
                      {r.email}
                    </a>
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--color-fg-muted)] sm:table-cell">
                    {r.empresa ?? <span className="text-[var(--color-fg-subtle)]">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-fg-muted)] tabular">
                    {formatDateTime(r.slotInicio)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium',
                        ESTADO_CLASSES[r.estado],
                      )}
                    >
                      {ESTADO_LABELS[r.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.meetLink && (
                        <a
                          href={r.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                          aria-label="Abrir enlace de reunión"
                        >
                          <VideoIcon className="h-3.5 w-3.5" />
                          Meet
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {r.estado !== 'cancelada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelTarget(r)}
                          className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                          aria-label={`Cancelar reunión de ${r.nombre}`}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="¿Cancelar reunión?"
        description={
          cancelTarget
            ? `Se cancelará la reunión con ${cancelTarget.nombre} del ${formatDateTime(cancelTarget.slotInicio)}. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Sí, cancelar"
        tone="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id);
        }}
      />
    </div>
  );
}
