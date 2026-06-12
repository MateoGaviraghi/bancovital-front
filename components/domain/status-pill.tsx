import { cn } from '@/lib/cn';

export type OrderStatus =
  | 'borrador'
  | 'confirmada'
  | 'en_proceso'
  | 'resultados_cargados'
  | 'emitida'
  | 'entregada'
  | 'anulada';

const STATUS_LABEL: Record<OrderStatus, string> = {
  borrador: 'Borrador',
  confirmada: 'Confirmada',
  en_proceso: 'En proceso',
  resultados_cargados: 'Resultados cargados',
  emitida: 'Emitida',
  entregada: 'Entregada',
  anulada: 'Anulada',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  borrador: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] border-[var(--color-border)]',
  confirmada: 'bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/15',
  en_proceso:
    'bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] border-[var(--color-primary)]/15',
  resultados_cargados:
    'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/15',
  emitida:
    'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/15',
  entregada:
    'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/15',
  anulada:
    'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/15',
};

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
