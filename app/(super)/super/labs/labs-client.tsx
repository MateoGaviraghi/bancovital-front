'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
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
  CreateLaboratorioDto,
  EstadoLab,
  InviteUserDto,
  Laboratorio,
  UpdateLaboratorioDto,
  UserRole,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Loader2, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
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
  else if (!/^[a-z0-9-]+$/.test(f.slug.trim()))
    errors.slug = 'Solo minúsculas, números y guiones';
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
            <FormField label="Slug" htmlFor="slug" required error={errors.slug}
              description="Identificador único: minúsculas, números y guiones">
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
              <Input id="shortName" value={form.shortName} onChange={set('shortName')} placeholder="Lab. SF" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="CUIT" htmlFor="cuit">
              <Input id="cuit" value={form.cuit} onChange={set('cuit')} placeholder="30-00000000-0" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Dirección" htmlFor="streetAddress">
              <Input id="streetAddress" value={form.streetAddress} onChange={set('streetAddress')} placeholder="San Martín 123" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Ciudad" htmlFor="city">
              <Input id="city" value={form.city} onChange={set('city')} className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Provincia" htmlFor="province">
              <Input id="province" value={form.province} onChange={set('province')} className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Teléfono" htmlFor="phone">
              <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+54 342 000-0000" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="lab@ejemplo.com" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Bioquímico firmante" htmlFor="signingProfessionalName">
              <Input id="signingProfessionalName" value={form.signingProfessionalName} onChange={set('signingProfessionalName')} placeholder="Dr. Juan Pérez" className={inputCls} disabled={isPending} />
            </FormField>
            <FormField label="Matrícula firmante" htmlFor="signingProfessionalMp">
              <Input id="signingProfessionalMp" value={form.signingProfessionalMp} onChange={set('signingProfessionalMp')} placeholder="12345" className={inputCls} disabled={isPending} />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
    if (open) { setForm(EMPTY_INVITE); setErrors({}); }
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const dto: InviteUserDto = {
      email: form.email.trim(),
      role: form.role,
      displayName: form.displayName.trim() || undefined,
      matricula: form.role === 'bioquimico' && form.matricula.trim() ? form.matricula.trim() : undefined,
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={inviteMut.isPending}>
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratorio | null>(null);
  const [deletingLab, setDeletingLab] = useState<Laboratorio | null>(null);
  const [invitingLab, setInvitingLab] = useState<Laboratorio | null>(null);

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
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => {
                const pill = ESTADO_PILL[lab.estado];
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setInvitingLab(lab)}
                          className="flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                          Invitar usuario
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
        onOpenChange={(o) => { if (!o) setInvitingLab(null); }}
        lab={invitingLab}
      />

      <ConfirmDialog
        open={deletingLab !== null}
        onOpenChange={(o) => { if (!o) setDeletingLab(null); }}
        title={`¿Eliminar "${deletingLab?.legalName}"?`}
        description="Esta acción no se puede deshacer. Se eliminarán todos los datos del laboratorio."
        tone="danger"
        confirmLabel="Eliminar"
        loading={deleteMut.isPending}
        onConfirm={() => { if (deletingLab) deleteMut.mutate(deletingLab.id); }}
      />
    </div>
  );
}
