'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { MoneyDisplay } from '@/components/domain/money-display';
import { OnboardingChecklist } from '@/components/domain/onboarding-checklist';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  CreateMovimientoDto,
  EstadoCuenta,
  Laboratorio,
  Movimiento,
  MovimientoTipo,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { Money } from '@/lib/money';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TIPO_META: Record<MovimientoTipo, { label: string; cls: string }> = {
  pago: {
    label: 'Pago',
    cls: 'border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]',
  },
  cargo: {
    label: 'Cargo',
    cls: 'border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  },
};

// ─── Movimiento form ──────────────────────────────────────────

type MovForm = {
  tipo: MovimientoTipo;
  monto: string;
  concepto: string;
  notas: string;
  fecha: string;
};

const EMPTY_FORM: MovForm = {
  tipo: 'pago',
  monto: '',
  concepto: '',
  notas: '',
  fecha: '',
};

function MovimientoForm({ labId }: { labId: number }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<MovForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMut = useMutation({
    mutationFn: (dto: CreateMovimientoDto) =>
      apiClient.post<Movimiento>(`/super/labs/${labId}/movimientos`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Movimiento registrado');
      setForm(EMPTY_FORM);
      setErrors({});
      qc.invalidateQueries({ queryKey: queries.super.cuenta(labId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al registrar movimiento')),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const monto = Number.parseFloat(form.monto);
    if (!form.monto.trim() || Number.isNaN(monto) || monto <= 0) {
      errs.monto = 'Debe ser un valor mayor a 0';
    }
    if (!form.concepto.trim()) errs.concepto = 'Requerido';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const dto: CreateMovimientoDto = {
      tipo: form.tipo,
      monto: Money.toWire(Money.of(form.monto)!),
      concepto: form.concepto.trim(),
      notas: form.notas.trim() === '' ? null : form.notas.trim(),
      fecha: form.fecha.trim() === '' ? undefined : form.fecha,
    };
    createMut.mutate(dto);
  }

  const isPending = createMut.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]"
    >
      <h2 className="mb-4 font-medium text-[var(--color-fg)] text-sm">Registrar movimiento</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipo" htmlFor="mov-tipo">
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm((prev) => ({ ...prev, tipo: v as MovimientoTipo }))}
            disabled={isPending}
          >
            <SelectTrigger id="mov-tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pago">Pago (entra)</SelectItem>
              <SelectItem value="cargo">Cargo (debe)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Monto (ARS)" htmlFor="mov-monto" required error={errors.monto}>
          <Input
            id="mov-monto"
            type="number"
            min={0.01}
            step={0.01}
            value={form.monto}
            onChange={(e) => setForm((prev) => ({ ...prev, monto: e.target.value }))}
            placeholder="50000.00"
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="Concepto"
          htmlFor="mov-concepto"
          required
          error={errors.concepto}
          className="sm:col-span-2"
        >
          <Input
            id="mov-concepto"
            value={form.concepto}
            onChange={(e) => setForm((prev) => ({ ...prev, concepto: e.target.value }))}
            placeholder="Ej: Abono mensual junio / Excedentes mayo"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Fecha (opcional)" htmlFor="mov-fecha">
          <Input
            id="mov-fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Notas (opcional)" htmlFor="mov-notas" className="sm:col-span-2">
          <Textarea
            id="mov-notas"
            value={form.notas}
            onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
            placeholder="Detalle interno"
            disabled={isPending}
            className="min-h-16"
          />
        </FormField>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Registrar movimiento
        </Button>
      </div>
    </form>
  );
}

// ─── Main client ──────────────────────────────────────────────

export function CuentaClient({
  lab,
  labId,
  initialEstado,
}: {
  lab: Laboratorio;
  labId: number;
  initialEstado: EstadoCuenta | null;
}) {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<Movimiento | null>(null);

  const { data: estado } = useQuery({
    queryKey: queries.super.cuenta(labId),
    queryFn: () =>
      apiClient.get<EstadoCuenta>(`/super/labs/${labId}/movimientos`).then((r) => r.data),
    initialData: initialEstado ?? undefined,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/super/movimientos/${id}`),
    onSuccess: () => {
      toast.success('Movimiento eliminado');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: queries.super.cuenta(labId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar movimiento')),
  });

  const balance = estado?.balance ?? 0;
  const movimientos = estado?.movimientos ?? [];
  const labName = lab.shortName ?? lab.legalName;

  const balanceColor =
    balance > 0
      ? 'text-[var(--color-success)]'
      : balance < 0
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-fg)]';

  return (
    <div>
      <PageHeader
        title={`Estado de cuenta — ${labName}`}
        description={lab.legalName}
        breadcrumb={
          <Link
            href="/super/labs"
            className="inline-flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Laboratorios
          </Link>
        }
      />

      {/* Balance + totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)] sm:col-span-1">
          <p className="text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            Balance
          </p>
          <p className={cn('mt-1.5 font-semibold text-2xl tabular font-mono', balanceColor)}>
            {Money.toDisplay(String(balance))}
          </p>
          <p className="mt-1 text-[var(--color-fg-muted)] text-xs">
            {balance > 0
              ? 'A favor del laboratorio'
              : balance < 0
                ? 'El laboratorio adeuda'
                : 'Sin saldo pendiente'}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
          <p className="text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            Total pagos
          </p>
          <p className="mt-1.5 font-semibold text-lg text-[var(--color-success)]">
            <MoneyDisplay value={String(estado?.totalPagos ?? 0)} emphasis />
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
          <p className="text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            Total cargos
          </p>
          <p className="mt-1.5 font-semibold text-lg text-[var(--color-danger)]">
            <MoneyDisplay value={String(estado?.totalCargos ?? 0)} emphasis />
          </p>
        </div>
      </div>

      {/* Onboarding + form */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MovimientoForm labId={labId} />
        </div>
        <div>
          <OnboardingChecklist labId={labId} />
        </div>
      </div>

      {/* Movements table */}
      <div className="mt-6">
        <h2 className="mb-3 font-medium text-[var(--color-fg)] text-sm">Movimientos</h2>
        {movimientos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-12 text-center text-[var(--color-fg-muted)] text-sm">
            Sin movimientos registrados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Fecha</th>
                  <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                  <th className="px-5 py-2.5 text-left font-medium">Concepto</th>
                  <th className="px-5 py-2.5 text-right font-medium">Monto</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const meta = TIPO_META[m.tipo] ?? TIPO_META.cargo;
                  return (
                    <tr
                      key={m.id}
                      className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                    >
                      <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                        {fmtDate(m.fecha)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                            meta.cls,
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-fg)]">
                        {m.concepto}
                        {m.notas && (
                          <span className="mt-0.5 block text-[var(--color-fg-subtle)] text-xs">
                            {m.notas}
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          'px-5 py-3 text-right',
                          m.tipo === 'pago'
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-danger)]',
                        )}
                      >
                        <span className="tabular font-mono">
                          {m.tipo === 'pago' ? '+' : '−'} {Money.toDisplay(m.monto)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setDeleting(m)}
                            className="flex items-center gap-1 text-[var(--color-danger)] text-xs hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="¿Borrar este movimiento?"
        description="Usá esto solo para corregir un error de carga. La acción no se puede deshacer y altera el balance."
        tone="danger"
        confirmLabel="Borrar"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleting) deleteMut.mutate(deleting.id);
        }}
      />
    </div>
  );
}
