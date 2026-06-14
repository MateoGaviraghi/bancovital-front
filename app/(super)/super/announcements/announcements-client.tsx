'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Anuncio,
  AnuncioTipo,
  CreateAnuncioDto,
  Laboratorio,
  UpdateAnuncioDto,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertTriangle,
  Info,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TIPO_META: Record<AnuncioTipo, { label: string; Icon: typeof Info; cls: string }> = {
  info: {
    label: 'Info',
    Icon: Info,
    cls: 'border-[var(--color-info)]/20 bg-[var(--color-info-soft)] text-[var(--color-info)]',
  },
  advertencia: {
    label: 'Advertencia',
    Icon: AlertTriangle,
    cls: 'border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    Icon: Wrench,
    cls: 'border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  },
};

// ─── Form ─────────────────────────────────────────────────────

type AnuncioForm = {
  mensaje: string;
  tipo: AnuncioTipo;
  /** '' = global; otherwise lab id as string. */
  labId: string;
  activo: boolean;
  desde: string;
  hasta: string;
};

const EMPTY_FORM: AnuncioForm = {
  mensaje: '',
  tipo: 'info',
  labId: '',
  activo: true,
  desde: '',
  hasta: '',
};

function anuncioToForm(a: Anuncio): AnuncioForm {
  return {
    mensaje: a.mensaje,
    tipo: a.tipo,
    labId: a.labId !== null ? String(a.labId) : '',
    activo: a.activo,
    desde: a.desde ? a.desde.slice(0, 10) : '',
    hasta: a.hasta ? a.hasta.slice(0, 10) : '',
  };
}

function formToDto(f: AnuncioForm): CreateAnuncioDto {
  return {
    mensaje: f.mensaje.trim(),
    tipo: f.tipo,
    labId: f.labId === '' ? null : Number.parseInt(f.labId, 10),
    activo: f.activo,
    desde: f.desde.trim() === '' ? null : f.desde,
    hasta: f.hasta.trim() === '' ? null : f.hasta,
  };
}

const GLOBAL_VALUE = '__global__';

// ─── Dialog ───────────────────────────────────────────────────

function AnuncioDialog({
  open,
  onOpenChange,
  anuncio,
  labs,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncio: Anuncio | null;
  labs: Laboratorio[];
  onSuccess: () => void;
}) {
  const isEdit = anuncio !== null;
  const [form, setForm] = useState<AnuncioForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(anuncio ? anuncioToForm(anuncio) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, anuncio]);

  const createMut = useMutation({
    mutationFn: (dto: CreateAnuncioDto) =>
      apiClient.post<Anuncio>('/super/announcements', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Anuncio creado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear anuncio')),
  });

  const updateMut = useMutation({
    mutationFn: (dto: UpdateAnuncioDto) =>
      apiClient.patch<Anuncio>(`/super/announcements/${anuncio!.id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Anuncio actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar anuncio')),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.mensaje.trim()) errs.mensaje = 'Requerido';
    if (form.desde && form.hasta && form.hasta < form.desde) {
      errs.hasta = 'La fecha de fin no puede ser anterior al inicio';
    }
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar anuncio' : 'Nuevo anuncio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FormField label="Mensaje" htmlFor="anuncio-mensaje" required error={errors.mensaje}>
            <Textarea
              id="anuncio-mensaje"
              value={form.mensaje}
              onChange={(e) => setForm((prev) => ({ ...prev, mensaje: e.target.value }))}
              placeholder="Ej: Mantenimiento programado el sábado de 22 a 24 h."
              disabled={isPending}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tipo" htmlFor="anuncio-tipo">
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((prev) => ({ ...prev, tipo: v as AnuncioTipo }))}
                disabled={isPending}
              >
                <SelectTrigger id="anuncio-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="advertencia">Advertencia</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Alcance"
              htmlFor="anuncio-alcance"
              description="Global o un laboratorio específico"
            >
              <Select
                value={form.labId === '' ? GLOBAL_VALUE : form.labId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, labId: v === GLOBAL_VALUE ? '' : v }))
                }
                disabled={isPending}
              >
                <SelectTrigger id="anuncio-alcance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL_VALUE}>Global (todos los labs)</SelectItem>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={String(lab.id)}>
                      {lab.shortName ?? lab.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Desde (opcional)" htmlFor="anuncio-desde">
              <Input
                id="anuncio-desde"
                type="date"
                value={form.desde}
                onChange={(e) => setForm((prev) => ({ ...prev, desde: e.target.value }))}
                disabled={isPending}
              />
            </FormField>

            <FormField label="Hasta (opcional)" htmlFor="anuncio-hasta" error={errors.hasta}>
              <Input
                id="anuncio-hasta"
                type="date"
                value={form.hasta}
                onChange={(e) => setForm((prev) => ({ ...prev, hasta: e.target.value }))}
                disabled={isPending}
              />
            </FormField>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="anuncio-activo"
              checked={form.activo}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, activo: v === true }))}
              disabled={isPending}
            />
            <Label
              htmlFor="anuncio-activo"
              className="cursor-pointer text-sm leading-snug text-[var(--color-fg)]"
            >
              Activo
              <span className="ml-1 font-normal text-[var(--color-fg-muted)] text-xs">
                — visible para los labs cuando está activo y dentro del rango de fechas.
              </span>
            </Label>
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
              {isEdit ? 'Guardar cambios' : 'Crear anuncio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main client ──────────────────────────────────────────────

export function AnnouncementsClient({
  initialAnnouncements,
  labs,
}: {
  initialAnnouncements: Anuncio[];
  labs: Laboratorio[];
}) {
  const qc = useQueryClient();

  const { data: anuncios = initialAnnouncements } = useQuery({
    queryKey: queries.super.announcements(),
    queryFn: () => apiClient.get<Anuncio[]>('/super/announcements').then((r) => r.data),
    initialData: initialAnnouncements,
  });

  const labsById = new Map(labs.map((l) => [l.id, l]));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anuncio | null>(null);
  const [deleting, setDeleting] = useState<Anuncio | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: queries.super.announcements() });
  }

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiClient.patch(`/super/announcements/${id}`, { activo }),
    onSuccess: (_d, vars) => {
      toast.success(vars.activo ? 'Anuncio activado' : 'Anuncio desactivado');
      refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/super/announcements/${id}`),
    onSuccess: () => {
      toast.success('Anuncio eliminado');
      setDeleting(null);
      refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar anuncio')),
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(a: Anuncio) {
    setEditing(a);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Anuncios"
        description={`${anuncios.length} ${anuncios.length === 1 ? 'anuncio' : 'anuncios'}`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo anuncio
          </Button>
        }
      />

      {anuncios.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Megaphone className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-fg)] text-sm">Sin anuncios</p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-xs">
              Creá un anuncio global o por laboratorio.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo anuncio
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Mensaje</th>
                <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-5 py-2.5 text-left font-medium">Alcance</th>
                <th className="px-5 py-2.5 text-left font-medium">Vigencia</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {anuncios.map((a) => {
                const meta = TIPO_META[a.tipo] ?? TIPO_META.info;
                const { Icon } = meta;
                const lab = a.labId !== null ? labsById.get(a.labId) : null;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      'border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]',
                      !a.activo && 'opacity-60',
                    )}
                  >
                    <td className="max-w-md px-5 py-3 text-[var(--color-fg)]">
                      <span className="line-clamp-2">{a.mensaje}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                          meta.cls,
                        )}
                      >
                        <Icon className="h-3 w-3" strokeWidth={2} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {a.labId === null ? (
                        <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
                          Global
                        </span>
                      ) : (
                        (lab?.shortName ?? lab?.legalName ?? `Lab #${a.labId}`)
                      )}
                    </td>
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                      {fmtDate(a.desde)} → {fmtDate(a.hasta)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                          a.activo
                            ? 'border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]'
                            : 'border-[var(--color-fg-subtle)]/20 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
                        )}
                      >
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => toggleMut.mutate({ id: a.id, activo: !a.activo })}
                          disabled={toggleMut.isPending}
                          className="flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline disabled:opacity-60"
                        >
                          {a.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="flex items-center gap-1 text-[var(--color-primary)] text-xs hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(a)}
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

      <AnuncioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        anuncio={editing}
        labs={labs}
        onSuccess={refresh}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="¿Eliminar este anuncio?"
        description="Esta acción no se puede deshacer. El anuncio dejará de mostrarse a los laboratorios."
        tone="danger"
        confirmLabel="Eliminar"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleting) deleteMut.mutate(deleting.id);
        }}
      />
    </div>
  );
}
