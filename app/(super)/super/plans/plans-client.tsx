'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { MoneyDisplay } from '@/components/domain/money-display';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { CreatePlanDto, Plan, UpdatePlanDto } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

// ─── Form ─────────────────────────────────────────────────────

type PlanForm = {
  nombre: string;
  cupoOrdenesMes: string;
  precioMensual: string;
  precioOrdenExcedente: string;
};

const EMPTY_FORM: PlanForm = {
  nombre: '',
  cupoOrdenesMes: '',
  precioMensual: '',
  precioOrdenExcedente: '',
};

function planToForm(p: Plan): PlanForm {
  return {
    nombre: p.nombre,
    cupoOrdenesMes: String(p.cupoOrdenesMes),
    precioMensual: p.precioMensual,
    precioOrdenExcedente: p.precioOrdenExcedente,
  };
}

function validateForm(f: PlanForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.nombre.trim()) errors.nombre = 'Requerido';
  const cupo = Number.parseInt(f.cupoOrdenesMes, 10);
  if (!f.cupoOrdenesMes.trim() || Number.isNaN(cupo) || cupo <= 0) {
    errors.cupoOrdenesMes = 'Debe ser un número entero mayor a 0';
  }
  const pm = Number.parseFloat(f.precioMensual);
  if (!f.precioMensual.trim() || Number.isNaN(pm) || pm <= 0) {
    errors.precioMensual = 'Debe ser un valor mayor a 0';
  }
  const pe = Number.parseFloat(f.precioOrdenExcedente);
  if (!f.precioOrdenExcedente.trim() || Number.isNaN(pe) || pe <= 0) {
    errors.precioOrdenExcedente = 'Debe ser un valor mayor a 0';
  }
  return errors;
}

function formToDto(f: PlanForm): CreatePlanDto {
  return {
    nombre: f.nombre.trim(),
    cupoOrdenesMes: Number.parseInt(f.cupoOrdenesMes, 10),
    precioMensual: Number.parseFloat(f.precioMensual).toFixed(2),
    precioOrdenExcedente: Number.parseFloat(f.precioOrdenExcedente).toFixed(2),
  };
}

// ─── Dialog ───────────────────────────────────────────────────

function PlanDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
}) {
  const isEdit = plan !== null;
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(plan ? planToForm(plan) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, plan]);

  const set = (key: keyof PlanForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const createMut = useMutation({
    mutationFn: (dto: CreatePlanDto) =>
      apiClient.post<Plan>('/super/plans', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Plan creado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear plan')),
  });

  const updateMut = useMutation({
    mutationFn: (dto: UpdatePlanDto) =>
      apiClient.patch<Plan>(`/super/plans/${plan!.id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Plan actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar plan')),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const dto = formToDto(form);
    if (isEdit) updateMut.mutate(dto);
    else createMut.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FormField label="Nombre del plan" htmlFor="plan-nombre" required error={errors.nombre}>
            <Input
              id="plan-nombre"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej: Plan Básico"
              disabled={isPending}
              autoFocus
            />
          </FormField>

          <FormField
            label="Cupo de órdenes por mes"
            htmlFor="plan-cupo"
            required
            error={errors.cupoOrdenesMes}
            description="Número entero. Al agotar el cupo, las órdenes adicionales se registran como excedentes."
          >
            <Input
              id="plan-cupo"
              type="number"
              min={1}
              step={1}
              value={form.cupoOrdenesMes}
              onChange={set('cupoOrdenesMes')}
              placeholder="200"
              disabled={isPending}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Precio mensual (ARS)"
              htmlFor="plan-precio"
              required
              error={errors.precioMensual}
            >
              <Input
                id="plan-precio"
                type="number"
                min={0.01}
                step={0.01}
                value={form.precioMensual}
                onChange={set('precioMensual')}
                placeholder="50000.00"
                disabled={isPending}
              />
            </FormField>

            <FormField
              label="Precio por excedente (ARS)"
              htmlFor="plan-excedente"
              required
              error={errors.precioOrdenExcedente}
            >
              <Input
                id="plan-excedente"
                type="number"
                min={0.01}
                step={0.01}
                value={form.precioOrdenExcedente}
                onChange={set('precioOrdenExcedente')}
                placeholder="350.00"
                disabled={isPending}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {isEdit ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main client ──────────────────────────────────────────────

export function PlansClient({ initialPlans }: { initialPlans: Plan[] }) {
  const qc = useQueryClient();

  const { data: plans = initialPlans } = useQuery({
    queryKey: queries.plans.list(),
    queryFn: () => apiClient.get<Plan[]>('/super/plans').then((r) => r.data),
    initialData: initialPlans,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/super/plans/${id}`),
    onSuccess: () => {
      toast.success('Plan eliminado');
      setDeletingPlan(null);
      qc.invalidateQueries({ queryKey: queries.plans.list() });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(
          'El plan tiene laboratorios suscriptos. Reasigná o quitá el plan antes de eliminarlo.',
        );
      } else {
        toast.error(apiError(err, 'Error al eliminar plan'));
      }
    },
  });

  function openCreate() {
    setEditingPlan(null);
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  function handleSuccess() {
    qc.invalidateQueries({ queryKey: queries.plans.list() });
  }

  return (
    <div>
      <PageHeader
        title="Planes"
        description={`${plans.length} ${plans.length === 1 ? 'plan definido' : 'planes definidos'}`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo plan
          </Button>
        }
      />

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Layers className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-fg)] text-sm">Sin planes</p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-xs">
              Creá el primer plan para poder asignarlo a los laboratorios.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear el primer plan
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Nombre</th>
                <th className="px-5 py-2.5 text-right font-medium">Cupo/mes</th>
                <th className="px-5 py-2.5 text-right font-medium">Precio mensual</th>
                <th className="px-5 py-2.5 text-right font-medium">Precio excedente</th>
                <th className="px-5 py-2.5 text-left font-medium">Creado</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                >
                  <td className="px-5 py-3 font-medium text-[var(--color-fg)]">{plan.nombre}</td>
                  <td className="tabular px-5 py-3 text-right font-mono text-[var(--color-fg-muted)]">
                    {plan.cupoOrdenesMes.toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyDisplay value={plan.precioMensual} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyDisplay value={plan.precioOrdenExcedente} />
                  </td>
                  <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                    {fmtDate(plan.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="flex items-center gap-1 text-[var(--color-primary)] text-xs hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPlan(plan)}
                        className="flex items-center gap-1 text-[var(--color-danger)] text-xs hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deletingPlan !== null}
        onOpenChange={(o) => {
          if (!o) setDeletingPlan(null);
        }}
        title={`¿Eliminar "${deletingPlan?.nombre}"?`}
        description="Esta acción no se puede deshacer. Si el plan tiene laboratorios suscriptos, la eliminación será rechazada."
        tone="danger"
        confirmLabel="Eliminar"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deletingPlan) deleteMut.mutate(deletingPlan.id);
        }}
      />
    </div>
  );
}
