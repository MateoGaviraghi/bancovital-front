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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  AdminUser,
  ConsumoResumen,
  CreateLaboratorioDto,
  EstadoLab,
  InviteUserDto,
  Laboratorio,
  Plan,
  UpdateLaboratorioDto,
  UserRole,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Layers, Loader2, Mail, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

const ESTADO_PILL: Record<EstadoLab, { label: string; cls: string }> = {
  activo: {
    label: 'Activo',
    cls: 'border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]',
  },
  suspendido: {
    label: 'Suspendido',
    cls: 'border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  },
  inactivo: {
    label: 'Inactivo',
    cls: 'border-[var(--color-fg-subtle)]/20 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
  },
};

// ─── Consumo mini-bar ──────────────────────────────────────────────

function ConsumoCelda({ resumen }: { resumen: ConsumoResumen | undefined }) {
  if (!resumen || resumen.plan === null) {
    return (
      <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
        Sin plan
      </span>
    );
  }

  const pct = resumen.porcentaje ?? 0;
  const barColor =
    pct >= 100
      ? 'bg-[var(--color-danger)]'
      : pct >= 80
        ? 'bg-[var(--color-warning)]'
        : 'bg-[var(--color-primary)]';

  return (
    <div className="min-w-[140px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[var(--color-fg)]">{resumen.plan.nombre}</span>
        {resumen.excedentes > 0 && (
          <span className="shrink-0 rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-1.5 py-px text-[10px] font-medium text-[var(--color-danger)]">
            +{resumen.excedentes} exc.
          </span>
        )}
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]"
        role="progressbar"
        tabIndex={0}
        aria-valuenow={Math.min(pct, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${resumen.usadas} de ${resumen.cupoEfectivo ?? '?'} órdenes`}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', barColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-0.5 tabular font-mono text-[10px] text-[var(--color-fg-muted)]">
        {resumen.usadas} / {resumen.cupoEfectivo ?? '?'}
      </p>
    </div>
  );
}

// ─── Assign plan dialog ────────────────────────────────────────

function AssignPlanDialog({
  open,
  onOpenChange,
  lab,
  currentPlanId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: Laboratorio | null;
  currentPlanId: number | null;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: queries.plans.list(),
    queryFn: () => apiClient.get<Plan[]>('/super/plans').then((r) => r.data),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelectedPlanId(currentPlanId ? String(currentPlanId) : '');
      setConfirmRemove(false);
    }
  }, [open, currentPlanId]);

  const assignMut = useMutation({
    mutationFn: (planId: number) =>
      apiClient.put(`/super/labs/${lab!.id}/subscription`, { planId }),
    onSuccess: () => {
      toast.success('Plan asignado correctamente');
      qc.invalidateQueries({ queryKey: queries.consumo.resumen() });
      qc.invalidateQueries({ queryKey: queries.laboratorios.list() });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al asignar plan')),
  });

  const removeMut = useMutation({
    mutationFn: () => apiClient.delete(`/super/labs/${lab!.id}/subscription`),
    onSuccess: () => {
      toast.success('Plan removido');
      qc.invalidateQueries({ queryKey: queries.consumo.resumen() });
      qc.invalidateQueries({ queryKey: queries.laboratorios.list() });
      setConfirmRemove(false);
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al quitar plan')),
  });

  const selectedPlan = plans.find((p) => String(p.id) === selectedPlanId) ?? null;
  const isPending = assignMut.isPending || removeMut.isPending;

  return (
    <>
      <Dialog open={open && !confirmRemove} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar plan — {lab?.shortName ?? lab?.legalName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <FormField label="Plan" htmlFor="assign-plan">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={isPending}>
                <SelectTrigger id="assign-plan">
                  <SelectValue placeholder="Seleccioná un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {selectedPlan && (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-sm">
                <p className="mb-2 font-medium text-[var(--color-fg)]">{selectedPlan.nombre}</p>
                <ul className="space-y-1 text-[var(--color-fg-muted)] text-xs">
                  <li>
                    Cupo:{' '}
                    <span className="font-medium text-[var(--color-fg)]">
                      {selectedPlan.cupoOrdenesMes.toLocaleString('es-AR')} órdenes/mes
                    </span>
                  </li>
                  <li>
                    Precio mensual:{' '}
                    <span className="font-medium text-[var(--color-fg)]">
                      <MoneyDisplay value={selectedPlan.precioMensual} />
                    </span>
                  </li>
                  <li>
                    Por excedente:{' '}
                    <span className="font-medium text-[var(--color-fg)]">
                      <MoneyDisplay value={selectedPlan.precioOrdenExcedente} /> / orden
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {currentPlanId !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmRemove(true)}
                disabled={isPending}
                className="mr-auto"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Quitar plan
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending || !selectedPlanId}
              onClick={() => {
                if (selectedPlanId) assignMut.mutate(Number.parseInt(selectedPlanId, 10));
              }}
            >
              {assignMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Asignar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={(o) => {
          if (!o) setConfirmRemove(false);
        }}
        title="¿Quitar el plan?"
        description={`El laboratorio "${lab?.shortName ?? lab?.legalName}" quedará sin plan asignado. Las órdenes futuras no se contabilizarán en ningún cupo.`}
        tone="warning"
        confirmLabel="Quitar plan"
        loading={removeMut.isPending}
        onConfirm={() => removeMut.mutate()}
      />
    </>
  );
}

// ─── Form state ────────────────────────────────────────────────────

type FormState = {
  slug: string;
  legalName: string;
  shortName: string;
  cuit: string;
  streetAddress: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  signingProfessionalName: string;
  signingProfessionalMp: string;
  estado: EstadoLab;
};

const EMPTY_FORM: FormState = {
  slug: '',
  legalName: '',
  shortName: '',
  cuit: '',
  streetAddress: '',
  city: 'Santa Fe',
  province: 'Santa Fe',
  phone: '',
  email: '',
  signingProfessionalName: '',
  signingProfessionalMp: '',
  estado: 'activo',
};

function labToForm(lab: Laboratorio): FormState {
  return {
    slug: lab.slug,
    legalName: lab.legalName,
    shortName: lab.shortName ?? '',
    cuit: lab.cuit ?? '',
    streetAddress: lab.streetAddress ?? '',
    city: lab.city ?? 'Santa Fe',
    province: lab.province ?? 'Santa Fe',
    phone: lab.phone ?? '',
    email: lab.email ?? '',
    signingProfessionalName: lab.signingProfessionalName ?? '',
    signingProfessionalMp: lab.signingProfessionalMp ?? '',
    estado: lab.estado,
  };
}

function formToBaseDto(f: FormState): CreateLaboratorioDto {
  const n = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    slug: f.slug.trim(),
    legalName: f.legalName.trim(),
    shortName: n(f.shortName),
    cuit: n(f.cuit),
    streetAddress: n(f.streetAddress),
    city: f.city.trim() || 'Santa Fe',
    province: f.province.trim() || 'Santa Fe',
    phone: n(f.phone),
    email: n(f.email),
    signingProfessionalName: n(f.signingProfessionalName),
    signingProfessionalMp: n(f.signingProfessionalMp),
  };
}

function validateForm(f: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.slug.trim()) errors.slug = 'Requerido';
  else if (!/^[a-z0-9-]+$/.test(f.slug.trim())) errors.slug = 'Solo minúsculas, números y guiones';
  if (!f.legalName.trim()) errors.legalName = 'Requerido';
  return errors;
}

// ─── Laboratorio dialog ────────────────────────────────────────────

function LaboratorioDialog({
  open,
  onOpenChange,
  lab,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: Laboratorio | null;
  onSuccess: () => void;
}) {
  const isEdit = lab !== null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(lab ? labToForm(lab) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, lab]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const createMut = useMutation({
    mutationFn: (dto: CreateLaboratorioDto) =>
      apiClient.post<Laboratorio>('/super/labs', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Laboratorio creado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear laboratorio')),
  });

  const updateMut = useMutation({
    mutationFn: (dto: UpdateLaboratorioDto) =>
      apiClient.patch<Laboratorio>(`/super/labs/${lab!.id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Laboratorio actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar laboratorio')),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const base = formToBaseDto(form);
    if (isEdit) updateMut.mutate({ ...base, estado: form.estado });
    else createMut.mutate(base);
  }

  const inputCls = 'w-full';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar laboratorio' : 'Nuevo laboratorio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Slug"
              htmlFor="slug"
              required
              error={errors.slug}
              description="Identificador único: minúsculas, números y guiones"
            >
              <Input
                id="slug"
                value={form.slug}
                onChange={set('slug')}
                placeholder="lab-santa-fe"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Razón social" htmlFor="legalName" required error={errors.legalName}>
              <Input
                id="legalName"
                value={form.legalName}
                onChange={set('legalName')}
                placeholder="Laboratorio Bioquímico S.R.L."
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Nombre corto" htmlFor="shortName">
              <Input
                id="shortName"
                value={form.shortName}
                onChange={set('shortName')}
                placeholder="Lab. SF"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="CUIT" htmlFor="cuit">
              <Input
                id="cuit"
                value={form.cuit}
                onChange={set('cuit')}
                placeholder="30-00000000-0"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Dirección" htmlFor="streetAddress">
              <Input
                id="streetAddress"
                value={form.streetAddress}
                onChange={set('streetAddress')}
                placeholder="San Martín 123"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Ciudad" htmlFor="city">
              <Input
                id="city"
                value={form.city}
                onChange={set('city')}
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Provincia" htmlFor="province">
              <Input
                id="province"
                value={form.province}
                onChange={set('province')}
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Teléfono" htmlFor="phone">
              <Input
                id="phone"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+54 342 000-0000"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="lab@ejemplo.com"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Bioquímico firmante" htmlFor="signingProfessionalName">
              <Input
                id="signingProfessionalName"
                value={form.signingProfessionalName}
                onChange={set('signingProfessionalName')}
                placeholder="Dr. Juan Pérez"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            <FormField label="Matrícula firmante" htmlFor="signingProfessionalMp">
              <Input
                id="signingProfessionalMp"
                value={form.signingProfessionalMp}
                onChange={set('signingProfessionalMp')}
                placeholder="12345"
                className={inputCls}
                disabled={isPending}
              />
            </FormField>
            {isEdit && (
              <FormField label="Estado" htmlFor="estado">
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, estado: v as EstadoLab }))}
                  disabled={isPending}
                >
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            )}
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
              {isEdit ? 'Guardar cambios' : 'Crear laboratorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite user dialog ────────────────────────────────────────────

type InviteForm = { email: string; role: UserRole; displayName: string; matricula: string };
const EMPTY_INVITE: InviteForm = { email: '', role: 'admin', displayName: '', matricula: '' };

function InviteUserDialog({
  open,
  onOpenChange,
  lab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: Laboratorio | null;
}) {
  const [form, setForm] = useState<InviteForm>(EMPTY_INVITE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY_INVITE);
      setErrors({});
    }
  }, [open]);

  const set = (key: keyof InviteForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inviteMut = useMutation({
    mutationFn: (dto: InviteUserDto) =>
      apiClient.post<AdminUser>(`/super/labs/${lab!.id}/users/invite`, dto).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Invitación enviada a ${data.email}`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al invitar usuario')),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const dto: InviteUserDto = {
      email: form.email.trim(),
      role: form.role,
      displayName: form.displayName.trim() || undefined,
      matricula:
        form.role === 'bioquimico' && form.matricula.trim() ? form.matricula.trim() : undefined,
      redirectTo: `${window.location.origin}/auth/set-password`,
    };
    inviteMut.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario — {lab?.shortName ?? lab?.legalName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FormField label="Email" htmlFor="inv-email" required error={errors.email}>
            <Input
              id="inv-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="usuario@lab.com"
              disabled={inviteMut.isPending}
              autoFocus
            />
          </FormField>
          <FormField label="Rol" htmlFor="inv-role">
            <Select
              value={form.role}
              onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as UserRole }))}
              disabled={inviteMut.isPending}
            >
              <SelectTrigger id="inv-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recepcion">Recepción</SelectItem>
                <SelectItem value="bioquimico">Bioquímico</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Nombre para mostrar" htmlFor="inv-displayName">
            <Input
              id="inv-displayName"
              value={form.displayName}
              onChange={set('displayName')}
              placeholder="Dr. Juan Pérez (opcional)"
              disabled={inviteMut.isPending}
            />
          </FormField>
          {form.role === 'bioquimico' && (
            <FormField label="Matrícula" htmlFor="inv-matricula">
              <Input
                id="inv-matricula"
                value={form.matricula}
                onChange={set('matricula')}
                placeholder="MP 12345"
                disabled={inviteMut.isPending}
              />
            </FormField>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={inviteMut.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={inviteMut.isPending}>
              {inviteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main client component ─────────────────────────────────────────

export function LabsClient({ initialLabs }: { initialLabs: Laboratorio[] }) {
  const qc = useQueryClient();

  const { data: labs = initialLabs } = useQuery({
    queryKey: queries.laboratorios.list(),
    queryFn: () => apiClient.get<Laboratorio[]>('/super/labs').then((r) => r.data),
    initialData: initialLabs,
  });

  // Consumo resumen — single query for all labs; degrades silently on fetch failure
  const { data: consumoList = [] } = useQuery({
    queryKey: queries.consumo.resumen(),
    queryFn: () => apiClient.get<ConsumoResumen[]>('/super/consumo').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  const consumoByLabId = new Map(consumoList.map((c) => [c.labId, c]));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratorio | null>(null);
  const [deletingLab, setDeletingLab] = useState<Laboratorio | null>(null);
  const [invitingLab, setInvitingLab] = useState<Laboratorio | null>(null);
  const [assigningLab, setAssigningLab] = useState<Laboratorio | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/super/labs/${id}`),
    onSuccess: () => {
      toast.success('Laboratorio eliminado');
      setDeletingLab(null);
      qc.invalidateQueries({ queryKey: queries.laboratorios.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar laboratorio')),
  });

  function openCreate() {
    setEditingLab(null);
    setDialogOpen(true);
  }

  function openEdit(lab: Laboratorio) {
    setEditingLab(lab);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    qc.invalidateQueries({ queryKey: queries.laboratorios.list() });
  }

  return (
    <div>
      <PageHeader
        title="Laboratorios"
        description={`${labs.length} ${labs.length === 1 ? 'laboratorio registrado' : 'laboratorios registrados'}`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo laboratorio
          </Button>
        }
      />

      {labs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Building2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-fg)] text-sm">Sin laboratorios</p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-xs">
              Creá el primer laboratorio para empezar.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo laboratorio
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Slug</th>
                <th className="px-5 py-2.5 text-left font-medium">Razón social</th>
                <th className="px-5 py-2.5 text-left font-medium">Ciudad</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-left font-medium">Plan / Consumo</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => {
                const pill = ESTADO_PILL[lab.estado];
                const resumen = consumoByLabId.get(lab.id);
                const currentPlanId = resumen?.plan?.id ?? null;
                return (
                  <tr
                    key={lab.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-xs text-[var(--color-fg-muted)]">
                      {lab.slug}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {lab.legalName}
                      {lab.shortName && (
                        <span className="ml-2 text-[var(--color-fg-subtle)] text-xs">
                          ({lab.shortName})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{lab.city ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                          pill.cls,
                        )}
                      >
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ConsumoCelda resumen={resumen} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAssigningLab(lab)}
                          className="flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline"
                        >
                          <Layers className="h-3.5 w-3.5" strokeWidth={2} />
                          {currentPlanId ? 'Plan' : 'Asignar plan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvitingLab(lab)}
                          className="flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                          Invitar
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(lab)}
                          className="flex items-center gap-1 text-[var(--color-primary)] text-xs hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingLab(lab)}
                          className="flex items-center gap-1 text-[var(--color-danger)] text-xs hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          Eliminar
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

      <LaboratorioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lab={editingLab}
        onSuccess={handleDialogSuccess}
      />

      <InviteUserDialog
        open={invitingLab !== null}
        onOpenChange={(o) => {
          if (!o) setInvitingLab(null);
        }}
        lab={invitingLab}
      />

      <AssignPlanDialog
        open={assigningLab !== null}
        onOpenChange={(o) => {
          if (!o) setAssigningLab(null);
        }}
        lab={assigningLab}
        currentPlanId={
          assigningLab ? (consumoByLabId.get(assigningLab.id)?.plan?.id ?? null) : null
        }
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: queries.consumo.resumen() });
        }}
      />

      <ConfirmDialog
        open={deletingLab !== null}
        onOpenChange={(o) => {
          if (!o) setDeletingLab(null);
        }}
        title={`¿Eliminar "${deletingLab?.legalName}"?`}
        description="Esta acción no se puede deshacer. Se eliminarán todos los datos del laboratorio."
        tone="danger"
        confirmLabel="Eliminar"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deletingLab) deleteMut.mutate(deletingLab.id);
        }}
      />
    </div>
  );
}
