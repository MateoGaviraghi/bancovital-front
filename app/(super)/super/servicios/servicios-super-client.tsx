'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AVAILABLE_ICONS, DynamicLucideIcon } from '@/components/ui/dynamic-lucide-icon';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { CreateServicioDto, Laboratorio, Servicio, UpdateServicioDto } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { IMPERSONATE_HEADER } from '@/lib/impersonate';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Power,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function labHeaders(labId: number) {
  return { [IMPERSONATE_HEADER]: String(labId) };
}

const FLAG_LABELS: Array<{ key: keyof CreateServicioDto; label: string }> = [
  { key: 'usaPacienteHumano', label: 'Paciente humano' },
  { key: 'usaPacienteAnimal', label: 'Paciente animal' },
  { key: 'usaMedico', label: 'Médico derivante' },
  { key: 'usaVeterinario', label: 'Veterinario' },
  { key: 'usaPropietario', label: 'Propietario' },
];

function IconSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto rounded-md border border-[var(--color-border)] p-2">
      {AVAILABLE_ICONS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={cn(
            'flex items-center justify-center rounded-md p-2 transition-colors',
            value === name
              ? 'bg-[var(--color-primary)] text-[var(--color-fg-inverse)]'
              : 'hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
          )}
        >
          <DynamicLucideIcon name={name} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function ServicioDialog({
  open,
  onOpenChange,
  labId,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  labId: number;
  initial?: Servicio;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [icono, setIcono] = useState(initial?.icono ?? 'stethoscope');
  const [usaPacienteHumano, setUsaPacienteHumano] = useState(initial?.usaPacienteHumano ?? false);
  const [usaPacienteAnimal, setUsaPacienteAnimal] = useState(initial?.usaPacienteAnimal ?? false);
  const [usaMedico, setUsaMedico] = useState(initial?.usaMedico ?? false);
  const [usaVeterinario, setUsaVeterinario] = useState(initial?.usaVeterinario ?? false);
  const [usaPropietario, setUsaPropietario] = useState(initial?.usaPropietario ?? false);

  const mut = useMutation({
    mutationFn: (dto: CreateServicioDto | UpdateServicioDto) =>
      isEdit
        ? apiClient.patch(`/servicios/${initial.id}`, dto, { headers: labHeaders(labId) })
        : apiClient.post('/servicios', dto, { headers: labHeaders(labId) }),
    onSuccess: () => {
      toast.success(isEdit ? 'Servicio actualizado' : 'Servicio creado');
      qc.invalidateQueries({ queryKey: ['super-servicios', labId] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar servicio')),
  });

  function handleSubmit() {
    mut.mutate({
      nombre: nombre.trim(),
      icono,
      usaPacienteHumano,
      usaPacienteAnimal,
      usaMedico,
      usaVeterinario,
      usaPropietario,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá las propiedades del servicio.'
              : 'Definí el nombre, ícono y qué campos muestra el formulario de orden.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="Nombre" htmlFor="svc-nombre" required>
            <Input
              id="svc-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Agua y efluentes"
              maxLength={100}
            />
          </FormField>
          <FormField label="Ícono" htmlFor="svc-icono">
            <IconSelector value={icono} onChange={setIcono} />
          </FormField>
          <div>
            <p className="mb-2 font-medium text-sm text-[var(--color-fg)]">Campos del formulario</p>
            <div className="space-y-2">
              {FLAG_LABELS.map(({ key, label }) => {
                const checked =
                  key === 'usaPacienteHumano'
                    ? usaPacienteHumano
                    : key === 'usaPacienteAnimal'
                      ? usaPacienteAnimal
                      : key === 'usaMedico'
                        ? usaMedico
                        : key === 'usaVeterinario'
                          ? usaVeterinario
                          : usaPropietario;
                const setter =
                  key === 'usaPacienteHumano'
                    ? setUsaPacienteHumano
                    : key === 'usaPacienteAnimal'
                      ? setUsaPacienteAnimal
                      : key === 'usaMedico'
                        ? setUsaMedico
                        : key === 'usaVeterinario'
                          ? setUsaVeterinario
                          : setUsaPropietario;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`svc-${key}`}
                      checked={checked}
                      onCheckedChange={(v) => setter(v === true)}
                    />
                    <label
                      htmlFor={`svc-${key}`}
                      className="cursor-pointer text-sm text-[var(--color-fg)]"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nombre.trim() || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isEdit ? 'Guardar' : 'Crear servicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabServiciosSection({ lab }: { lab: Laboratorio }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Servicio | null>(null);

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['super-servicios', lab.id],
    queryFn: () =>
      apiClient
        .get<Servicio[]>('/servicios', { params: { all: 'true' }, headers: labHeaders(lab.id) })
        .then((r) => r.data),
    enabled: expanded,
  });

  const seedMut = useMutation({
    mutationFn: () =>
      apiClient.post('/servicios/seed-defaults', {}, { headers: labHeaders(lab.id) }),
    onSuccess: () => {
      toast.success(`Servicios default creados para ${lab.shortName || lab.legalName}`);
      qc.invalidateQueries({ queryKey: ['super-servicios', lab.id] });
    },
    onError: (err) => toast.error(apiError(err, 'Error al seedear servicios')),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiClient.patch(`/servicios/${id}/active`, { activo }, { headers: labHeaders(lab.id) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-servicios', lab.id] }),
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/servicios/${id}`, { headers: labHeaders(lab.id) }),
    onSuccess: () => {
      toast.success('Servicio eliminado');
      qc.invalidateQueries({ queryKey: ['super-servicios', lab.id] });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo eliminar (¿tiene órdenes?)')),
  });

  const reorderMut = useMutation({
    mutationFn: ({ id, orden }: { id: number; orden: number }) =>
      apiClient.patch(`/servicios/${id}`, { orden }, { headers: labHeaders(lab.id) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-servicios', lab.id] }),
  });

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const current = servicios[idx];
    const above = servicios[idx - 1];
    reorderMut.mutate({ id: current.id, orden: above.orden });
    reorderMut.mutate({ id: above.id, orden: current.orden });
  }

  function moveDown(idx: number) {
    if (idx >= servicios.length - 1) return;
    const current = servicios[idx];
    const below = servicios[idx + 1];
    reorderMut.mutate({ id: current.id, orden: below.orden });
    reorderMut.mutate({ id: below.id, orden: current.orden });
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <Building2 className="h-5 w-5 shrink-0 text-[var(--color-fg-muted)]" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-[var(--color-fg)] truncate">
            {lab.shortName || lab.legalName}
          </p>
          <p className="text-xs text-[var(--color-fg-muted)]">{lab.slug}</p>
        </div>
        <Badge variant={lab.estado === 'activo' ? 'default' : 'secondary'}>{lab.estado}</Badge>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-fg-muted)] transition-transform',
            expanded && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
            >
              {seedMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Seed defaults
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Crear servicio
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2
                className="h-5 w-5 animate-spin text-[var(--color-fg-muted)]"
                strokeWidth={2}
              />
            </div>
          ) : servicios.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-fg-muted)]">
              Sin servicios. Usá "Seed defaults" para crear Humana y Veterinaria.
            </p>
          ) : (
            <div className="space-y-1.5">
              {servicios.map((s, idx) => (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-2.5',
                    s.activo
                      ? 'border-[var(--color-border)] bg-[var(--color-bg)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] opacity-50',
                  )}
                >
                  <DynamicLucideIcon
                    name={s.icono}
                    className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
                  />
                  <span className="flex-1 truncate text-sm font-medium text-[var(--color-fg)]">
                    {s.nombre}
                  </span>
                  {!s.activo && <Badge variant="secondary">Inactivo</Badge>}
                  <div className="flex items-center gap-0.5">
                    {idx > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveUp(idx)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                      </Button>
                    )}
                    {idx < servicios.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveDown(idx)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditTarget(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7',
                        s.activo ? 'text-[var(--color-success)]' : 'text-[var(--color-fg-muted)]',
                      )}
                      onClick={() => toggleMut.mutate({ id: s.id, activo: !s.activo })}
                    >
                      <Power className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[var(--color-danger)]"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${s.nombre}"?`)) deleteMut.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ServicioDialog open={createOpen} onOpenChange={setCreateOpen} labId={lab.id} />
          {editTarget && (
            <ServicioDialog
              open
              onOpenChange={(v) => {
                if (!v) setEditTarget(null);
              }}
              labId={lab.id}
              initial={editTarget}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ServiciosSuperClient() {
  const { data: labs = [], isLoading } = useQuery({
    queryKey: queries.laboratorios.list(),
    queryFn: () => apiClient.get<Laboratorio[]>('/super/labs').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-muted)]" strokeWidth={2} />
      </div>
    );
  }

  const activeLabs = labs.filter((l) => l.estado === 'activo');
  const otherLabs = labs.filter((l) => l.estado !== 'activo');

  return (
    <div className="mt-6 space-y-3">
      {activeLabs.map((lab) => (
        <LabServiciosSection key={lab.id} lab={lab} />
      ))}
      {otherLabs.length > 0 && (
        <>
          <p className="pt-4 font-medium text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">
            Inactivos / Suspendidos
          </p>
          {otherLabs.map((lab) => (
            <LabServiciosSection key={lab.id} lab={lab} />
          ))}
        </>
      )}
    </div>
  );
}
